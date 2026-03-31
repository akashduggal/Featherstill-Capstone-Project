#include "seq_local.h"

#include "esp_log.h"
#include <inttypes.h>

static const char *TAG = "SEQ_LOCAL";

static uint32_t g_boot_id = 0;
static uint32_t g_seq_local = 0;
static bool g_initialized = false;

esp_err_t seq_local_init(uint32_t boot_id)
{
    g_boot_id = boot_id;
    g_seq_local = 0;
    g_initialized = true;
    ESP_LOGI(TAG, "Initialized seq_local for boot_id=%" PRIu32, g_boot_id);
    return ESP_OK;
}

uint32_t seq_local_next(void)
{
    if (!g_initialized) {
        ESP_LOGW(TAG, "seq_local not initialized, returning 0");
        return 0;
    }

    uint32_t assigned = g_seq_local++;
    ESP_LOGI(TAG, "Assigned seq_local=%" PRIu32 " (boot_id=%" PRIu32 ")", assigned, g_boot_id);
    return assigned;
}

uint32_t seq_local_get_boot_id(void)
{
    return g_boot_id;
}

uint32_t seq_local_get_current(void)
{
    return g_seq_local;
}
