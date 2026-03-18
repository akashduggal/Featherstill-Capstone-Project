#include "ble_ota.h"
#include <stdbool.h>
#include "esp_ota_ops.h"
#include "esp_partition.h"
#include "esp_log.h"
#include "host/ble_hs.h"
#include "host/ble_uuid.h"
#include "os/os_mbuf.h"

static const char *TAG = "BLE_OTA";
#define OTA_CMD_START   0x01
#define OTA_CMD_FINISH  0x02
#define OTA_CMD_ABORT   0x03

typedef enum {
    BLE_OTA_STATE_IDLE = 0,
    BLE_OTA_STATE_READY,
    BLE_OTA_STATE_RECEIVING,
    BLE_OTA_STATE_FINISHED,
    BLE_OTA_STATE_ABORTED,
    BLE_OTA_STATE_ERROR
} ble_ota_state_t;

typedef struct {
    ble_ota_state_t state;
    bool in_progress;
    bool start_received;
    bool finish_received;
    bool abort_requested;
    size_t bytes_received;
    size_t chunk_count;
    size_t expected_size;
    esp_ota_handle_t ota_handle;
    const esp_partition_t *update_partition;
} ble_ota_session_t;


static const ble_uuid128_t ota_service_uuid =
    BLE_UUID128_INIT(0x12, 0x34, 0x56, 0x78,
                     0x12, 0x34,
                     0x56, 0x78,
                     0x12, 0x34,
                     0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0);

static const ble_uuid128_t ota_control_uuid =
    BLE_UUID128_INIT(0x13, 0x34, 0x56, 0x78,
                     0x12, 0x34,
                     0x56, 0x78,
                     0x12, 0x34,
                     0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0);

static const ble_uuid128_t ota_data_uuid =
    BLE_UUID128_INIT(0x14, 0x34, 0x56, 0x78,
                     0x12, 0x34,
                     0x56, 0x78,
                     0x12, 0x34,
                     0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0);

static uint16_t ota_control_val_handle;
static uint16_t ota_data_val_handle;
static const char *ble_ota_state_to_string(ble_ota_state_t state);
static void ble_ota_set_state(ble_ota_state_t new_state);
static void ble_ota_reset_session(void);

static ble_ota_session_t s_ota = {
    .state = BLE_OTA_STATE_IDLE,
    .in_progress = false,
    .start_received = false,
    .finish_received = false,
    .abort_requested = false,
    .bytes_received = 0,
    .chunk_count = 0,
    .expected_size = 0,
    .ota_handle = 0,
    .update_partition = NULL,
};

static void ble_ota_reset_session(void)
{
    s_ota.state = BLE_OTA_STATE_IDLE;
    s_ota.in_progress = false;
    s_ota.start_received = false;
    s_ota.finish_received = false;
    s_ota.abort_requested = false;
    s_ota.bytes_received = 0;
    s_ota.chunk_count = 0;
    s_ota.expected_size = 0;
    s_ota.ota_handle = 0;
    s_ota.update_partition = NULL;

    ESP_LOGI(TAG, "OTA session reset -> state=%s",
             ble_ota_state_to_string(s_ota.state));
}

static void ble_ota_set_state(ble_ota_state_t new_state)
{
    if (s_ota.state != new_state) {
        ESP_LOGI(TAG, "OTA state: %s -> %s",
                 ble_ota_state_to_string(s_ota.state),
                 ble_ota_state_to_string(new_state));
        s_ota.state = new_state;
    }
}


static const char *ble_ota_state_to_string(ble_ota_state_t state)
{
    switch (state) {
        case BLE_OTA_STATE_IDLE:
            return "IDLE";
        case BLE_OTA_STATE_READY:
            return "READY";
        case BLE_OTA_STATE_RECEIVING:
            return "RECEIVING";
        case BLE_OTA_STATE_FINISHED:
            return "FINISHED";
        case BLE_OTA_STATE_ABORTED:
            return "ABORTED";
        case BLE_OTA_STATE_ERROR:
            return "ERROR";
        default:
            return "UNKNOWN";
    }
}

static int ota_control_access_cb(uint16_t conn_handle,
                                 uint16_t attr_handle,
                                 struct ble_gatt_access_ctxt *ctxt,
                                 void *arg)
{
    (void)conn_handle;
    (void)attr_handle;
    (void)arg;

    if (ctxt->op != BLE_GATT_ACCESS_OP_WRITE_CHR) {
        return BLE_ATT_ERR_UNLIKELY;
    }

    uint16_t len = OS_MBUF_PKTLEN(ctxt->om);
    if (len < 1) {
        ESP_LOGW(TAG, "OTA control write too short");
        return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
    }

    uint8_t cmd = 0;
    int rc = os_mbuf_copydata(ctxt->om, 0, 1, &cmd);
    if (rc != 0) {
        ESP_LOGW(TAG, "Failed reading OTA control byte");
        return BLE_ATT_ERR_UNLIKELY;
    }

    switch (cmd) {
        case OTA_CMD_START:
            if (s_ota.in_progress) {
                ESP_LOGW(TAG, "OTA START rejected: session already active");
                return BLE_ATT_ERR_UNLIKELY;
            }

            s_ota.in_progress = true;
            s_ota.start_received = true;
            s_ota.finish_received = false;
            s_ota.abort_requested = false;
            s_ota.bytes_received = 0;
            s_ota.chunk_count = 0;
            s_ota.expected_size = 0;
            s_ota.ota_handle = 0;
            s_ota.update_partition = NULL;

            ble_ota_set_state(BLE_OTA_STATE_READY);
            ESP_LOGI(TAG, "Received OTA START");
            break;

        case OTA_CMD_FINISH:
            if (!s_ota.in_progress || !s_ota.start_received) {
                ESP_LOGW(TAG, "OTA FINISH rejected: no active session");
                return BLE_ATT_ERR_UNLIKELY;
            }

            if (s_ota.abort_requested) {
                ESP_LOGW(TAG, "OTA FINISH rejected: session already aborted");
                return BLE_ATT_ERR_UNLIKELY;
            }

            s_ota.finish_received = true;
            s_ota.in_progress = false;
            ble_ota_set_state(BLE_OTA_STATE_FINISHED);

            ESP_LOGI(TAG, "Received OTA FINISH: bytes=%u chunks=%u",
                    (unsigned)s_ota.bytes_received,
                    (unsigned)s_ota.chunk_count);
            break;

        case OTA_CMD_ABORT:
            if (!s_ota.in_progress && !s_ota.start_received) {
                ESP_LOGW(TAG, "OTA ABORT ignored: no active session");
                ble_ota_set_state(BLE_OTA_STATE_ABORTED);
                return 0;
            }

            s_ota.abort_requested = true;
            s_ota.in_progress = false;
            ble_ota_set_state(BLE_OTA_STATE_ABORTED);

            ESP_LOGI(TAG, "Received OTA ABORT: bytes=%u chunks=%u",
                    (unsigned)s_ota.bytes_received,
                    (unsigned)s_ota.chunk_count);

            ble_ota_reset_session();
            break;

        default:
            ESP_LOGW(TAG, "Unknown OTA control cmd: 0x%02X", cmd);
            return BLE_ATT_ERR_UNLIKELY;
    }

    return 0;
}

static int ota_data_access_cb(uint16_t conn_handle,
                              uint16_t attr_handle,
                              struct ble_gatt_access_ctxt *ctxt,
                              void *arg)
{
    (void)conn_handle;
    (void)attr_handle;
    (void)arg;
    if (ctxt->op != BLE_GATT_ACCESS_OP_WRITE_CHR) {
        return BLE_ATT_ERR_UNLIKELY;
    }

    if (!s_ota.in_progress || !s_ota.start_received) {
        ESP_LOGW(TAG, "OTA data rejected: START not received");
        return BLE_ATT_ERR_UNLIKELY;
    }

    if (s_ota.abort_requested) {
        ESP_LOGW(TAG, "OTA data rejected: session aborted");
        return BLE_ATT_ERR_UNLIKELY;
    }

    if (s_ota.finish_received) {
        ESP_LOGW(TAG, "OTA data rejected: session already finished");
        return BLE_ATT_ERR_UNLIKELY;
    }

    uint16_t len = OS_MBUF_PKTLEN(ctxt->om);
    if (len == 0) {
        ESP_LOGW(TAG, "OTA data write empty");
        return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
    }

    if (s_ota.state == BLE_OTA_STATE_READY) {
        ble_ota_set_state(BLE_OTA_STATE_RECEIVING);
    }

    s_ota.bytes_received += len;
    s_ota.chunk_count += 1;

    ESP_LOGI(TAG, "Received OTA data chunk: len=%u total=%u chunks=%u",
            len,
            (unsigned)s_ota.bytes_received,
            (unsigned)s_ota.chunk_count);

    return 0;
}

static const struct ble_gatt_svc_def ota_gatt_svcs[] = {
    {
        .type = BLE_GATT_SVC_TYPE_PRIMARY,
        .uuid = &ota_service_uuid.u,
        .characteristics = (struct ble_gatt_chr_def[]) {
            {
                .uuid = &ota_control_uuid.u,
                .access_cb = ota_control_access_cb,
                .flags = BLE_GATT_CHR_F_WRITE,
                .val_handle = &ota_control_val_handle,
            },
            {
                .uuid = &ota_data_uuid.u,
                .access_cb = ota_data_access_cb,
                .flags = BLE_GATT_CHR_F_WRITE | BLE_GATT_CHR_F_WRITE_NO_RSP,
                .val_handle = &ota_data_val_handle,
            },
            {0}
        },
    },
    {0}
};

void ble_ota_register_service(void)
{
    ble_ota_reset_session();

    int rc = ble_gatts_count_cfg(ota_gatt_svcs);
    if (rc != 0) {
        ESP_LOGE(TAG, "ble_gatts_count_cfg failed: %d", rc);
        return;
    }

    rc = ble_gatts_add_svcs(ota_gatt_svcs);
    if (rc != 0) {
        ESP_LOGE(TAG, "ble_gatts_add_svcs failed: %d", rc);
        return;
    }

    ESP_LOGI(TAG, "OTA GATT service registered");
}

