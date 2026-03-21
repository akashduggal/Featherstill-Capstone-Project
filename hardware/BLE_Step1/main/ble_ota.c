#include "ble_ota.h"
#include <stdbool.h>
#include "esp_ota_ops.h"
#include "esp_partition.h"
#include "esp_log.h"
#include "esp_err.h"
#include "host/ble_hs.h"
#include "host/ble_uuid.h"
#include "os/os_mbuf.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include <string.h>
#include <stdio.h>

static const char *TAG = "BLE_OTA";
#define OTA_CMD_START   0x01
#define OTA_CMD_FINISH  0x02
#define OTA_CMD_ABORT   0x03

#define OTA_DATA_MAX_CHUNK 244
#define OTA_STATUS_MAX_LEN 64
#define OTA_SIZE_UNKNOWN ((size_t)0)

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

static const ble_uuid128_t ota_status_uuid =
    BLE_UUID128_INIT(0x15, 0x34, 0x56, 0x78,
                     0x12, 0x34,
                     0x56, 0x78,
                     0x12, 0x34,
                     0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0);

static uint16_t ota_status_val_handle;
static uint16_t s_conn_handle = BLE_HS_CONN_HANDLE_NONE;
static bool s_status_notify_enabled = false;
static char s_last_status[OTA_STATUS_MAX_LEN] = "IDLE";

static uint16_t ota_control_val_handle;
static uint16_t ota_data_val_handle;
static const char *ble_ota_state_to_string(ble_ota_state_t state);
static void ble_ota_set_state(ble_ota_state_t new_state);
static void ble_ota_reset_session(void);

static void ble_ota_update_last_status(const char *msg);
static void ble_ota_send_status(const char *msg);
static int ble_ota_status_access_cb(uint16_t conn_handle,
                                    uint16_t attr_handle,
                                    struct ble_gatt_access_ctxt *ctxt,
                                    void *arg);

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

static void ble_ota_update_last_status(const char *msg)
{
    if (msg == NULL) {
        return;
    }

    snprintf(s_last_status, sizeof(s_last_status), "%s", msg);
}

static void ble_ota_send_status(const char *msg)
{
    if (msg == NULL) {
        return;
    }

    ble_ota_update_last_status(msg);
    ESP_LOGI(TAG, "OTA status -> %s", s_last_status);

    if (s_conn_handle == BLE_HS_CONN_HANDLE_NONE) {
        ESP_LOGW(TAG, "Cannot notify OTA status: no connection");
        return;
    }

    if (!s_status_notify_enabled) {
        ESP_LOGW(TAG, "Cannot notify OTA status: notifications not enabled");
        return;
    }

    struct os_mbuf *om = ble_hs_mbuf_from_flat(
        s_last_status,
        (uint16_t)strlen(s_last_status)
    );
    if (om == NULL) {
        ESP_LOGW(TAG, "Failed to allocate mbuf for OTA status notify");
        return;
    }

    int rc = ble_gatts_notify_custom(s_conn_handle, ota_status_val_handle, om);
    if (rc != 0) {
        ESP_LOGW(TAG, "ble_gatts_notify_custom failed rc=%d", rc);
    }
}

static int ble_ota_status_access_cb(uint16_t conn_handle,
                                    uint16_t attr_handle,
                                    struct ble_gatt_access_ctxt *ctxt,
                                    void *arg)
{
    (void)conn_handle;
    (void)attr_handle;
    (void)arg;

    if (ctxt->op != BLE_GATT_ACCESS_OP_READ_CHR) {
        return BLE_ATT_ERR_UNLIKELY;
    }

    int rc = os_mbuf_append(ctxt->om, s_last_status, strlen(s_last_status));
    if (rc != 0) {
        return BLE_ATT_ERR_INSUFFICIENT_RES;
    }

    return 0;
}

void ble_ota_on_connect(uint16_t conn_handle)
{
    s_conn_handle = conn_handle;
    s_status_notify_enabled = false;
    ESP_LOGI(TAG, "OTA connected: conn_handle=%u", (unsigned)conn_handle);
}

void ble_ota_on_disconnect(void)
{
    ESP_LOGI(TAG, "OTA disconnected");
    s_conn_handle = BLE_HS_CONN_HANDLE_NONE;
    s_status_notify_enabled = false;
}

void ble_ota_on_subscribe(uint16_t attr_handle, uint8_t cur_notify)
{
    if (attr_handle == ota_status_val_handle) {
        s_status_notify_enabled = (cur_notify != 0);
        ESP_LOGI(TAG, "OTA status notifications %s",
                 s_status_notify_enabled ? "ENABLED" : "DISABLED");
    }
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
static uint32_t ble_ota_read_u32_le(const uint8_t *buf)
{
    return ((uint32_t)buf[0]) |
           ((uint32_t)buf[1] << 8) |
           ((uint32_t)buf[2] << 16) |
           ((uint32_t)buf[3] << 24);
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

static int ble_ota_handle_start(const uint8_t *data, uint16_t len)
{
    esp_err_t err;

    if (s_ota.in_progress) {
        ESP_LOGW(TAG, "START rejected: OTA already in progress");
        ble_ota_send_status("ERROR:BUSY");
        return BLE_ATT_ERR_VALUE_NOT_ALLOWED;
    }

    if (!s_status_notify_enabled) {
        ESP_LOGW(TAG, "START rejected: phone did not enable OTA status notifications");
        ble_ota_update_last_status("ERROR:NO_NOTIFY");
        return BLE_ATT_ERR_VALUE_NOT_ALLOWED;
    }

    // Fresh session init
    ble_ota_reset_session();

    s_ota.expected_size = OTA_SIZE_UNKNOWN;

    // Support:
    // len == 1  => only START command
    // len >= 5  => START + 4-byte little-endian expected firmware size
    if (len >= 5) {
        s_ota.expected_size = ble_ota_read_u32_le(&data[1]);
    }

    s_ota.update_partition = esp_ota_get_next_update_partition(NULL);
    if (s_ota.update_partition == NULL) {
        ESP_LOGE(TAG, "No OTA update partition available");
        ble_ota_set_state(BLE_OTA_STATE_ERROR);
        ble_ota_send_status("ERROR:NO_PARTITION");

        return BLE_ATT_ERR_UNLIKELY;
    }

    ESP_LOGI(TAG,
             "Starting OTA on partition '%s' subtype=0x%x offset=0x%lx size=0x%lx expected_size=%u",
             s_ota.update_partition->label,
             s_ota.update_partition->subtype,
             (unsigned long)s_ota.update_partition->address,
             (unsigned long)s_ota.update_partition->size,
             (unsigned int)s_ota.expected_size);

    err = esp_ota_begin(s_ota.update_partition,
                        s_ota.expected_size,
                        &s_ota.ota_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_begin failed: %s", esp_err_to_name(err));
        ble_ota_set_state(BLE_OTA_STATE_ERROR);
        ble_ota_send_status("ERROR:BEGIN_FAIL");
        return BLE_ATT_ERR_UNLIKELY;
    }

    s_ota.in_progress = true;
    s_ota.start_received = true;
    s_ota.finish_received = false;
    s_ota.abort_requested = false;
    s_ota.bytes_received = 0;
    s_ota.chunk_count = 0;

    ble_ota_set_state(BLE_OTA_STATE_READY);
    ble_ota_send_status("READY");
    ESP_LOGI(TAG, "OTA START accepted, session ready");
    return 0;
}
static int ble_ota_data_chr_write(uint16_t conn_handle,
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
        ble_ota_send_status("ERROR:NO_START");
        return BLE_ATT_ERR_UNLIKELY;
    }

    if (s_ota.abort_requested) {
        ESP_LOGW(TAG, "OTA data rejected: session aborted");
        ble_ota_send_status("ERROR:ABORTED");
        return BLE_ATT_ERR_UNLIKELY;
    }

    if (s_ota.finish_received) {
        ESP_LOGW(TAG, "OTA data rejected: session already finished");
        ble_ota_send_status("ERROR:FINISHED");
        return BLE_ATT_ERR_UNLIKELY;
    }

    if (s_ota.ota_handle == 0 || s_ota.update_partition == NULL) {
        ESP_LOGW(TAG, "OTA data rejected: OTA begin not completed");
        ble_ota_set_state(BLE_OTA_STATE_ERROR);
        ble_ota_send_status("ERROR:NO_HANDLE");
        return BLE_ATT_ERR_UNLIKELY;
    }

    uint16_t len = OS_MBUF_PKTLEN(ctxt->om);
    if (len == 0) {
        ESP_LOGW(TAG, "OTA data write empty");
        ble_ota_send_status("ERROR:EMPTY");
        return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
    }

    if (len > OTA_DATA_MAX_CHUNK) {
        ESP_LOGW(TAG, "OTA data chunk too large: %u", len);
        ble_ota_send_status("ERROR:CHUNK_TOO_LARGE");
        return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
    }

    uint8_t buf[OTA_DATA_MAX_CHUNK];
    int rc = os_mbuf_copydata(ctxt->om, 0, len, buf);
    if (rc != 0) {
        ESP_LOGE(TAG, "Failed reading OTA data chunk from mbuf");
        ble_ota_set_state(BLE_OTA_STATE_ERROR);
        ble_ota_send_status("ERROR:READ_FAIL");
        return BLE_ATT_ERR_UNLIKELY;
    }

    if (s_ota.state == BLE_OTA_STATE_READY) {
        ble_ota_set_state(BLE_OTA_STATE_RECEIVING);
    }

    esp_err_t err = esp_ota_write(s_ota.ota_handle, buf, len);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_write failed at chunk=%u bytes=%u err=%s",
                 (unsigned)(s_ota.chunk_count + 1),
                 (unsigned)s_ota.bytes_received,
                 esp_err_to_name(err));
        ble_ota_set_state(BLE_OTA_STATE_ERROR);
        ble_ota_send_status("ERROR:WRITE_FAIL");
        return BLE_ATT_ERR_UNLIKELY;
    }

    s_ota.bytes_received += len;
    s_ota.chunk_count++;

    {
        char msg[OTA_STATUS_MAX_LEN];
        snprintf(msg, sizeof(msg), "ACK:%u:%u",
                 (unsigned)s_ota.chunk_count,
                 (unsigned)s_ota.bytes_received);
        ble_ota_send_status(msg);
    }

    return 0;
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

    uint8_t buf[20];
    if (len > sizeof(buf)) {
        ESP_LOGW(TAG, "OTA control payload too large: %u", len);
        return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
    }

    int rc = os_mbuf_copydata(ctxt->om, 0, len, buf);
    if (rc != 0) {
        ESP_LOGW(TAG, "Failed reading OTA control payload");
        return BLE_ATT_ERR_UNLIKELY;
    }

    uint8_t cmd = buf[0];
    switch (cmd) {
        case OTA_CMD_START:
            if (s_ota.in_progress) {
                ESP_LOGW(TAG, "OTA START rejected: session already active");
                return BLE_ATT_ERR_UNLIKELY;
            }


            ESP_LOGI(TAG, "Received OTA START");
            return ble_ota_handle_start(buf, len);

        case OTA_CMD_FINISH:
            if (!s_ota.in_progress || !s_ota.start_received) {
                ESP_LOGW(TAG, "OTA FINISH rejected: no active session");
                ble_ota_send_status("ERROR:NO_SESSION");
                return BLE_ATT_ERR_UNLIKELY;
            }

            if (s_ota.abort_requested) {
                ESP_LOGW(TAG, "OTA FINISH rejected: session already aborted");
                ble_ota_send_status("ERROR:ABORTED");
                return BLE_ATT_ERR_UNLIKELY;
            }

            if (s_ota.expected_size != OTA_SIZE_UNKNOWN &&
                s_ota.expected_size > 0 &&
                s_ota.bytes_received != s_ota.expected_size) {

                ESP_LOGE(TAG, "OTA size mismatch: expected=%u received=%u",
                        (unsigned)s_ota.expected_size,
                        (unsigned)s_ota.bytes_received);

                if (s_ota.ota_handle != 0) {
                    esp_ota_abort(s_ota.ota_handle);
                }

                ble_ota_set_state(BLE_OTA_STATE_ERROR);
                ble_ota_send_status("ERROR:SIZE_MISMATCH");
                ble_ota_reset_session();
                return BLE_ATT_ERR_UNLIKELY;
            }

            ESP_LOGI(TAG, "Finalizing OTA...");

        
            esp_err_t err = esp_ota_end(s_ota.ota_handle);
            if (err != ESP_OK) {
                ESP_LOGE(TAG, "esp_ota_end failed: %s", esp_err_to_name(err));
                ble_ota_set_state(BLE_OTA_STATE_ERROR);
                ble_ota_send_status("ERROR:END_FAIL");
                ble_ota_reset_session();
                return BLE_ATT_ERR_UNLIKELY;
            }
            s_ota.ota_handle = 0;

            err = esp_ota_set_boot_partition(s_ota.update_partition);
            if (err != ESP_OK) {
                ESP_LOGE(TAG, "esp_ota_set_boot_partition failed: %s", esp_err_to_name(err));
                ble_ota_set_state(BLE_OTA_STATE_ERROR);
                ble_ota_send_status("ERROR:BOOT_SET_FAIL");
                ble_ota_reset_session();
                return BLE_ATT_ERR_UNLIKELY;
            }
            

            s_ota.finish_received = true;
            s_ota.in_progress = false;
            ble_ota_set_state(BLE_OTA_STATE_FINISHED);
            ble_ota_send_status("SUCCESS");

            ESP_LOGI(TAG, "OTA SUCCESS. Rebooting...");
            vTaskDelay(pdMS_TO_TICKS(700));
            esp_restart();

            return 0;

        case OTA_CMD_ABORT:
            ESP_LOGW(TAG, "OTA ABORT not implemented yet");
            return BLE_ATT_ERR_UNLIKELY;

        default:
            ESP_LOGW(TAG, "Unknown OTA control cmd: 0x%02X", cmd);
            return BLE_ATT_ERR_UNLIKELY;
    }

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
                .access_cb = ble_ota_data_chr_write,
                .flags = BLE_GATT_CHR_F_WRITE | BLE_GATT_CHR_F_WRITE_NO_RSP,
                .val_handle = &ota_data_val_handle,
            },
            {
                .uuid = &ota_status_uuid.u,
                .access_cb = ble_ota_status_access_cb,
                .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY,
                .val_handle = &ota_status_val_handle,
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

