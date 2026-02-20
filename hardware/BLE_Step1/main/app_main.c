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

static void list_littlefs_dir(void)
{
    DIR *d = opendir("/littlefs");
    if (!d) {
        ESP_LOGE("FS", "opendir /littlefs failed");
        return;
    }
    struct dirent *e;
    while ((e = readdir(d)) != NULL) {
        ESP_LOGI("FS", "found: %s", e->d_name);
    }
    closedir(d);
}
static const char *TAGT = "LOG_TEST";

static void battery_log_test_13(void)
{
    // 1) Count before
    int before = battery_log_count();
    ESP_LOGI(TAGT, "Count BEFORE append = %d", before);

    // 2) Append 10 records
    battery_log_t rec = {0};
    rec.timestamp_s = 1000;
    rec.soc = 10;

    for (int i = 0; i < 10; i++) {
        rec.timestamp_s = 1000 + i;
        rec.soc = 10 + i;

        int ok = battery_log_append(&rec);
        ESP_LOGI(TAGT, "append i=%d -> %s", i, ok == 0 ? "OK" : "FAIL");
        vTaskDelay(pdMS_TO_TICKS(50));
    }

    // 3) Count after
    int after = battery_log_count();
    ESP_LOGI(TAGT, "Count AFTER append = %d (expected >= BEFORE+10)", after);

    // 4) Read index 0 and last index (after-1)
    battery_log_t out0 = {0};
    if (battery_log_read(0, &out0)) {
        ESP_LOGI(TAGT, "READ[0] ok ts=%u soc=%u", out0.timestamp_s, out0.soc);
    } else {
        ESP_LOGE(TAGT, "READ[0] failed");
    }

    battery_log_t outLast = {0};
    if (after > 0 && battery_log_read(after - 1, &outLast)) {
        ESP_LOGI(TAGT, "READ[last=%d] ok ts=%u soc=%u", after - 1, outLast.timestamp_s, outLast.soc);
    } else {
        ESP_LOGE(TAGT, "READ[last] failed (after=%d)", after);
    }

    // 5) Read out-of-range index (must fail cleanly)
    battery_log_t outBad = {0};
    bool bad = battery_log_read(after, &outBad);
    ESP_LOGI(TAGT, "READ[out_of_range index=%d] -> %s (expected false)", after, bad ? "true" : "false");
}

static void test_battery_log_append(void)
{
    printf("\n========== BATTERY LOG TEST ==========\n");
    printf("Testing: Append 5 battery records to /littlefs/battery.bin\n");
    printf("Expected: File size = 5 * %u bytes = %u bytes\n\n", 
           (unsigned)sizeof(battery_log_t), (unsigned)(5 * sizeof(battery_log_t)));
    int before = battery_log_count();
    // Test: Append 5 records
    for (int i = 0; i < 5; i++) {
        battery_log_t rec = {0};
        rec.timestamp_s = 1000 + i;
        rec.soc = 50 + (i * 10);
        rec.current_ma = 100 * i;
        rec.pack_total_mv = 3800 + (i * 50);

        printf("Appending record #%d...\n", i + 1);
        int ret = battery_log_append(&rec);
        if (ret != 0) {
            printf("ERROR: Failed to append record #%d\n", i + 1);
            return;
        }
    }

    printf("\nAll 5 records appended successfully!\n");
    printf("Checking file size...\n\n");

    // Check file size
    int count = battery_log_count();
    printf("========== TEST RESULT ==========\n");
    printf("Records in file: %d\n", count);
    printf("Expected: 5\n");
    
    // append 5
    
    if (count == before + 5) {
        printf("✓ TEST PASSED: File size is correct!\n");
    } else {
        printf("✗ TEST FAILED: Expected 5 records, got %d\n", count);
    }
    printf("==================================\n\n");
}

static void mock_sender_task(void *arg)
{
    (void)arg;

    while (1) {

        // ---- Task 2.2: if backlog requested, send all stored records ----
        if (ble_backlog_requested()) {
            ble_backlog_clear_request();

            int count = battery_log_count();
            printf("BACKLOG: start count=%d\n", count);

            for (int i = 0; i < count; i++) {
                battery_log_t rec;
                if (!battery_log_read(i, &rec)) {
                    printf("BACKLOG: read failed i=%d\n", i);
                    continue;
                }

                // Will only notify if BACKLOG notify is enabled
                int rc = ble_batt_mock_notify_backlog(&rec);
                if (rc != 0) {
                    printf("BACKLOG: notify rc=%d i=%d\n", rc, i);
                }

                vTaskDelay(pdMS_TO_TICKS(15)); // 10–20ms recommended
            }

            printf("BACKLOG: done\n");
        }

        // Normal live behavior
        ble_batt_mock_notify_mock();
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
    ble_stack_start();  // start BLE after FS is ready

    // (Remove test_battery_log_append now — already tested)
    xTaskCreate(mock_sender_task, "mock_sender", 4096, NULL, 5, NULL);
}