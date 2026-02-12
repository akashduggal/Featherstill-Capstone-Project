#include "ble_stack.h"

#include <string.h>
#include "esp_log.h"

#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"

#include "host/ble_hs.h"
#include "services/gap/ble_svc_gap.h"
#include "services/gatt/ble_svc_gatt.h"

#include "store/config/ble_store_config.h"
extern void ble_store_config_init(void);

static const char *TAG = "BLE";

static void start_advertising(void);

static void on_reset(int reason)
{
    ESP_LOGE(TAG, "NimBLE reset; reason=%d", reason);
}

static void on_sync(void)
{

    ble_hs_id_infer_auto(0, NULL);

    start_advertising();
}

static int gap_event_cb(struct ble_gap_event *event, void *arg)
{
    (void)arg;

    switch (event->type) {
        case BLE_GAP_EVENT_CONNECT:
            ESP_LOGI(TAG, "GAP connect status=%d", event->connect.status);
            return 0;

        case BLE_GAP_EVENT_DISCONNECT:
            ESP_LOGI(TAG, "GAP disconnect reason=%d", event->disconnect.reason);
            return 0;

        case BLE_GAP_EVENT_ENC_CHANGE:
            ESP_LOGI(TAG, "GAP enc change status=%d", event->enc_change.status);
            return 0;

        default:
            return 0;
    }
}

static void start_advertising(void)
{
    struct ble_hs_adv_fields fields;
    struct ble_gap_adv_params adv_params;

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


    ble_hs_cfg.sm_bonding = 1;
    ble_hs_cfg.sm_sc = 1;
    ble_hs_cfg.sm_mitm = 0;
    ble_hs_cfg.sm_io_cap = BLE_HS_IO_NO_INPUT_OUTPUT;

    ble_store_config_init();

    ble_hs_cfg.reset_cb = on_reset;
    ble_hs_cfg.sync_cb = on_sync;

    nimble_port_freertos_init(host_task);

    ESP_LOGI(TAG, "BLE stack started (minimal)");
}
