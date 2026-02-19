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

static void test_battery_log_append(void)
{
    printf("\n========== BATTERY LOG TEST ==========\n");
    printf("Testing: Append 5 battery records to /littlefs/battery.bin\n");
    printf("Expected: File size = 5 * %u bytes = %u bytes\n\n", 
           (unsigned)sizeof(battery_log_t), (unsigned)(5 * sizeof(battery_log_t)));

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
    
    if (count == 5) {
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
        // Sends only if connected + notifications enabled
        ble_batt_mock_notify_mock();
        vTaskDelay(pdMS_TO_TICKS(5000));  // 1 sample/sec
    }
}

void app_main(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();
        nvs_flash_init();
    }

    ble_stack_start();

    /* Initialize and mount LittleFS */
    storage_init();

    // Run battery log append test
    test_battery_log_append();

    // Start mock sender
    xTaskCreate(mock_sender_task, "mock_sender", 4096, NULL, 5, NULL);
}
