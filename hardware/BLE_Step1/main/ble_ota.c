#include "ble_ota.h"

#include "esp_log.h"
#include "host/ble_hs.h"
#include "host/ble_uuid.h"
#include "os/os_mbuf.h"

static const char *TAG = "BLE_OTA";

#define OTA_CMD_START   0x01
#define OTA_CMD_FINISH  0x02
#define OTA_CMD_ABORT   0x03

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
            ESP_LOGI(TAG, "Received OTA START");
            break;
        case OTA_CMD_FINISH:
            ESP_LOGI(TAG, "Received OTA FINISH");
            break;
        case OTA_CMD_ABORT:
            ESP_LOGI(TAG, "Received OTA ABORT");
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

    uint16_t len = OS_MBUF_PKTLEN(ctxt->om);
    if (len == 0) {
        ESP_LOGW(TAG, "OTA data write empty");
        return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
    }

    ESP_LOGI(TAG, "Received OTA data chunk: %u bytes", len);
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