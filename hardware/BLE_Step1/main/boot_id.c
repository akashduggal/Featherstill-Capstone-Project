#include "boot_id.h"

#include "nvs.h"
#include "esp_log.h"
#include "esp_err.h"
#include <inttypes.h>

static const char *TAG = "BOOT_ID";

#define NVS_NS_BOOT "boot"
#define NVS_KEY_BOOT_COUNT "boot_count"

static uint32_t g_boot_id = 0;
static bool g_initialized = false;

esp_err_t boot_id_init(void)
{
    nvs_handle_t h;
    esp_err_t err = nvs_open(NVS_NS_BOOT, NVS_READWRITE, &h);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "nvs_open failed: %d", err);
        return err;
    }

    uint32_t val = 0;
    err = nvs_get_u32(h, NVS_KEY_BOOT_COUNT, &val);
    if (err == ESP_OK) {
        g_boot_id = val;
        ESP_LOGI(TAG, "Loaded boot_count=%" PRIu32, g_boot_id);
    } else if (err == ESP_ERR_NVS_NOT_FOUND) {
        g_boot_id = 0;
        ESP_LOGI(TAG, "boot_count not found, initializing to 0");
        esp_err_t s = nvs_set_u32(h, NVS_KEY_BOOT_COUNT, g_boot_id);
        if (s == ESP_OK) s = nvs_commit(h);
        if (s != ESP_OK) {
            ESP_LOGW(TAG, "Failed to persist initial boot_count: %d", s);
            err = s;
        } else {
            err = ESP_OK;
        }
    } else {
        ESP_LOGW(TAG, "nvs_get_u32 failed: %d", err);
    }

    nvs_close(h);
    if (err == ESP_OK) g_initialized = true;
    return err;
}

esp_err_t boot_id_increment_and_persist(void)
{
    if (!g_initialized) {
        ESP_LOGW(TAG, "boot_id not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    nvs_handle_t h;
    esp_err_t err = nvs_open(NVS_NS_BOOT, NVS_READWRITE, &h);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "nvs_open failed: %d", err);
        return err;
    }

    g_boot_id++;
    err = nvs_set_u32(h, NVS_KEY_BOOT_COUNT, g_boot_id);
    if (err == ESP_OK) err = nvs_commit(h);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "Failed to persist boot_count: %d", err);
    } else {
        ESP_LOGI(TAG, "Incremented and persisted boot_count=%" PRIu32, g_boot_id);
    }

    nvs_close(h);
    return err;
}

uint32_t boot_id_get(void)
{
    return g_boot_id;
}
