#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "nvs_flash.h"
#include "esp_err.h"

#include "ble_stack.h"
#include "ble_batt_mock.h"
#include "storage.h"
#include "battery_log.h"
#include "boot_id.h"
#include "seq_local.h"

#include <stdio.h>
#include <time.h>
#include <inttypes.h>

#include "esp_log.h"
#include <dirent.h>

static const char *TAGT = "APP_MAIN";

const TickType_t mbuf_retry_delay   = pdMS_TO_TICKS(200);


static void mock_sender_task(void *arg)
{
    (void)arg;
    const TickType_t backlog_cooldown = pdMS_TO_TICKS(250);

    while (1) {

        if (ble_backlog_requested()) {

            if (ble_batt_is_sending_backlog()) {
                ESP_LOGI(TAGT, "BACKLOG: request ignored - already sending");
                ble_backlog_clear_request();
                vTaskDelay(pdMS_TO_TICKS(200));
                continue;
            }

            // Gate on backlog subscription
            if (!ble_backlog_is_subscribed()) {
                ESP_LOGI(TAGT, "BACKLOG: request ignored - backlog not subscribed");
                ble_backlog_clear_request();
                vTaskDelay(pdMS_TO_TICKS(200));
                continue;
            }

            ble_batt_set_sending_backlog(true);
            ble_backlog_clear_request();

            int count = battery_log_count();

            backlog_request_t req = ble_backlog_get_request();
            int start_idx = 0;

            if (req.mode == BACKLOG_MODE_FROM_SEQ) {
                start_idx = battery_log_find_start_index_by_seq(req.start_seq);
            } else {
                start_idx = 0;
            }

            printf("BACKLOG: start count=%d start_idx=%d mode=%d start_seq=%u\n",
                count, start_idx, (int)req.mode, (unsigned)req.start_seq);

            if (start_idx >= count) {
                printf("BACKLOG: nothing to send (start_idx=%d count=%d)\n", start_idx, count);
            } else {

                ble_backlog_clear_abort();
                for (int i = start_idx; i < count; i++) {
                    // Check for abort request during sending
                    if (ble_backlog_abort_requested()) {
                        ESP_LOGI(TAGT, "BACKLOG: abort signal received at i=%d", i);
                        break;
                    }

                    battery_log_t rec;
                    if (!battery_log_read(i, &rec)) {
                        printf("BACKLOG: read failed i=%d\n", i);
                        continue;
                    }

                    
                    if (i == start_idx) {
                        printf("BACKLOG: first seq=%u idx=%u\n",
                            (unsigned)rec.seq, (unsigned)i);
                    }

                    int rc = ble_batt_mock_notify_backlog(&rec);

                    
                    if (rc == -2) { // mbuf alloc failed
                        ESP_LOGW(TAGT, "BACKLOG: mbuf alloc failed, cooling down and retry i=%d", i);
                        vTaskDelay(mbuf_retry_delay);
                        i--; // retry same record
                        continue;
                    }

                    if (rc != 0) {
                        printf("BACKLOG: notify rc=%d i=%d - aborting\n", rc, i);
                        break;
                    }

                    vTaskDelay(pdMS_TO_TICKS(20));
                }
            }
            printf("BACKLOG: done\n");
            vTaskDelay(backlog_cooldown);
            ble_batt_set_sending_backlog(false);
            continue;
        }

        battery_log_t rec;
        ble_batt_mock_build_record(&rec);
        rec.boot_id = seq_local_get_boot_id();
        rec.seq_local = seq_local_next();
        ESP_LOGI(TAGT, "LIVE rec ts=%u boot_id=%" PRIu32 " seq_local=%" PRIu32, rec.timestamp_s, rec.boot_id, rec.seq_local);
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
<<<<<<< Updated upstream
    /* Initialize and persist boot counter in NVS */
    if (boot_id_init() == ESP_OK) {
        boot_id_increment_and_persist();
        ESP_LOGI(TAGT, "Current boot_id=%u", boot_id_get());
    } else {
        ESP_LOGW(TAGT, "boot_id init failed");
    }
=======

    /* Initialize boot counter in NVS and increment */
    if (boot_id_init() == ESP_OK) {
        boot_id_increment_and_persist();
        uint32_t bid = boot_id_get();
        ESP_LOGI(TAGT, "Current boot_id=%" PRIu32, bid);
        
        /* Initialize seq_local with current boot_id */
        seq_local_init(bid);
    } else {
        ESP_LOGW(TAGT, "boot_id init failed");
    }

>>>>>>> Stashed changes
    storage_init();     // mount first
    log_maybe_wipe_on_format_change();
    battery_log_seq_init();
    ble_stack_start();  // start BLE after FS is ready
    ESP_LOGW(TAGT, "New version updated");
    // (Remove test_battery_log_append now — already tested)
    xTaskCreate(mock_sender_task, "mock_sender", 4096, NULL, 5, NULL);
}