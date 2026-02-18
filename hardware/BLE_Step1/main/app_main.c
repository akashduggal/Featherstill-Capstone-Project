#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "nvs_flash.h"
#include "esp_err.h"

#include "ble_stack.h"
#include "ble_batt_mock.h"
#include "storage.h"

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

    // Start mock sender
    xTaskCreate(mock_sender_task, "mock_sender", 4096, NULL, 5, NULL);
}
