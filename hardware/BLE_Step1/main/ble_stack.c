#include "ble_stack.h"

#include <string.h>
#include "esp_log.h"

#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"

#include "host/ble_hs.h"

#include "host/util/util.h"

#include "services/gap/ble_svc_gap.h"
#include "services/gatt/ble_svc_gatt.h"

// These two headers fix ble_store_config_init() declaration:
#include "store/config/ble_store_config.h"
extern void ble_store_config_init(void);

static const char *TAG = "BLE";
static uint16_t s_conn_handle = BLE_HS_CONN_HANDLE_NONE;

static void start_advertising(void);

static void on_reset(int reason)
{
    ESP_LOGE(TAG, "Resetting state; reason=%d", reason);
}

static void on_sync(void)
{
    start_advertising();
}

static int gap_event_cb(struct ble_gap_event *event, void *arg)
{
    (void)arg;

    switch (event->type) {

    case BLE_GAP_EVENT_CONNECT:
        if (event->connect.status == 0) {
            s_conn_handle = event->connect.conn_handle;
            ESP_LOGI(TAG, "Connected (handle=%d)", s_conn_handle);
        } else {
            ESP_LOGW(TAG, "Connect failed; status=%d", event->connect.status);
            start_advertising();
        }
        return 0;

    case BLE_GAP_EVENT_DISCONNECT:
        ESP_LOGI(TAG, "Disconnected; reason=%d", event->disconnect.reason);
        s_conn_handle = BLE_HS_CONN_HANDLE_NONE;
        start_advertising();   // accept more connections
        return 0;

    case BLE_GAP_EVENT_ENC_CHANGE:
        // This usually indicates pairing/encryption completed successfully
        if (event->enc_change.status == 0) {
            ESP_LOGI(TAG, "ENC_CHANGE: link encrypted (pairing likely complete)");
        } else {
            ESP_LOGW(TAG, "ENC_CHANGE failed; status=%d", event->enc_change.status);
        }
        // Do nothing else for now (as you requested)
        return 0;

    case BLE_GAP_EVENT_REPEAT_PAIRING:
        // Different ESP-IDF/NimBLE versions have different fields here.
        // For Step-1: just allow retry and don’t delete bonds yet.
        ESP_LOGW(TAG, "Repeat pairing requested; allowing retry");
        return BLE_GAP_REPEAT_PAIRING_RETRY;

    default:
        return 0;
    }
}

static void start_advertising(void)
{
    struct ble_gap_adv_params adv_params;
    struct ble_hs_adv_fields fields;

    memset(&fields, 0, sizeof(fields));
    fields.flags = BLE_HS_ADV_F_DISC_GEN | BLE_HS_ADV_F_BREDR_UNSUP;

    const char *name = ble_svc_gap_device_name();
    fields.name = (uint8_t *)name;
    fields.name_len = (uint8_t)strlen(name);
    fields.name_is_complete = 1;

    int rc = ble_gap_adv_set_fields(&fields);
    if (rc != 0) {
        ESP_LOGE(TAG, "ble_gap_adv_set_fields rc=%d", rc);
        return;
    }

    memset(&adv_params, 0, sizeof(adv_params));
    adv_params.conn_mode = BLE_GAP_CONN_MODE_UND;
    adv_params.disc_mode = BLE_GAP_DISC_MODE_GEN;

    rc = ble_gap_adv_start(BLE_OWN_ADDR_PUBLIC, NULL, BLE_HS_FOREVER,
                           &adv_params, gap_event_cb, NULL);
    if (rc != 0) {
        ESP_LOGE(TAG, "ble_gap_adv_start rc=%d", rc);
        return;
    }

    ESP_LOGI(TAG, "Advertising as %s", name);
}

static void host_task(void *param)
{
    (void)param;
    nimble_port_run();
    nimble_port_freertos_deinit();
}

void ble_stack_start(void)
{
    nimble_port_init();

    ble_svc_gap_init();
    ble_svc_gatt_init();

    ble_svc_gap_device_name_set("ESP32_STEP1");

    // Pairing/bonding config:
    ble_hs_cfg.sm_bonding = 1;
    ble_hs_cfg.sm_sc = 1;
    ble_hs_cfg.sm_mitm = 0;
    ble_hs_cfg.sm_io_cap = BLE_HS_IO_NO_INPUT_OUTPUT;

    // Persist bonds/keys in flash
    ble_store_config_init();

    ble_hs_cfg.reset_cb = on_reset;
    ble_hs_cfg.sync_cb = on_sync;

    nimble_port_freertos_init(host_task);

    ESP_LOGI(TAG, "BLE stack started");
}

