#include "battery_log.h"

#include <stdio.h>
#include <sys/stat.h>
#include "esp_log.h"

static const char *TAG = "BATTERY_LOG";
static const char *LOG_FILE = "/littlefs/battery.bin";

int battery_log_append(const battery_log_t *log)
{
    if (!log) {
        ESP_LOGE(TAG, "Invalid log pointer");
        return -1;
    }

    // Open file in append binary mode
    FILE *f = fopen(LOG_FILE, "ab");
    if (!f) {
        ESP_LOGE(TAG, "Failed to open %s for append", LOG_FILE);
        return -1;
    }

    // Write exactly sizeof(battery_log_t) bytes
    size_t written = fwrite(log, sizeof(battery_log_t), 1, f);
    
    fclose(f);

    if (written != 1) {
        ESP_LOGE(TAG, "Failed to write battery log record");
        return -1;
    }

    ESP_LOGI(TAG, "Appended record (size=%zu bytes)", sizeof(battery_log_t));
    return 0;
}

int battery_log_count(void)
{
    struct stat st;
    int ret = stat(LOG_FILE, &st);

    if (ret != 0) {
        ESP_LOGW(TAG, "Log file does not exist yet");
        return 0;
    }

    int count = (int)(st.st_size / sizeof(battery_log_t));
    ESP_LOGI(TAG, "Log file size: %lld bytes, record count: %d", st.st_size, count);

    return count;
}
