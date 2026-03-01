#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "nvs_flash.h"
#include "esp_err.h"

#include "ble_stack.h"
#include "ble_batt_mock.h"
#include "storage.h"
#include "battery_log.h"

#include <stdio.h>
#include <time.h>
#include <inttypes.h>

#include "battery_log.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <dirent.h>

static const char *TAGT = "APP_MAIN";

static void mock_sender_task(void *arg)
{
    (void)arg;
    const TickType_t backlog_cooldown = pdMS_TO_TICKS(250);

    while (1) {

        if (ble_backlog_requested()) {

            if (ble_batt_is_sending_backlog()) {
                ESP_LOGI(TAGT, "BACKLOG: request ignored - already sending");
                ble_backlog_clear_request();
                continue;
            }

            ble_batt_set_sending_backlog(true);
            ble_backlog_clear_request();

            int count = battery_log_count();
            printf("BACKLOG: start count=%d\n", count);

            for (int i = 0; i < count; i++) {
                battery_log_t rec;
                if (!battery_log_read(i, &rec)) {
                    printf("BACKLOG: read failed i=%d\n", i);
                    continue;
                }

                int rc = ble_batt_mock_notify_backlog(&rec);
                if (rc != 0) {
                    printf("BACKLOG: notify rc=%d i=%d - aborting\n", rc, i);
                    break;
                }

                vTaskDelay(pdMS_TO_TICKS(15));
            }

            printf("BACKLOG: done\n");
            vTaskDelay(backlog_cooldown);
            ble_batt_set_sending_backlog(false);
            continue;
        }

        battery_log_t rec;
        ble_batt_mock_build_record(&rec);
        rec.seq = battery_log_next_seq();
        ESP_LOGI(TAGT, "LIVE rec ts=%u seq=%" PRIu32, rec.timestamp_s, rec.seq);
        if (ble_batt_mock_is_subscribed()) {
            int rc = ble_batt_mock_notify_live(&rec);
            if (rc != 0) {
                int ar = battery_log_append(&rec);
                if (ar != 0) ESP_LOGW(TAGT, "append failed rc=%d", ar);
            }
        } else {
            int ar = battery_log_append(&rec);
            if (ar != 0) ESP_LOGW(TAGT, "append failed rc=%d", ar);
        }

        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

void app_main(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();
        nvs_flash_init();
    }

    storage_init();     // mount first
    log_maybe_wipe_on_format_change();
    ble_stack_start();  // start BLE after FS is ready

    // (Remove test_battery_log_append now — already tested)
    xTaskCreate(mock_sender_task, "mock_sender", 4096, NULL, 5, NULL);
}