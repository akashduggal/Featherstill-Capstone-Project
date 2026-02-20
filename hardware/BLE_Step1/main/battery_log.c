#include "battery_log.h"

#include <stdio.h>
#include <sys/stat.h>
#include <errno.h>
#include <string.h>
#include <stdbool.h>
#include <inttypes.h>   // <-- IMPORTANT for PRIiMAX
#include "esp_log.h"

static const char *TAG = "BATTERY_LOG";
static const char *LOG_FILE = "/littlefs/battery.bin";

int battery_log_append(const battery_log_t *log)
{
    if (!log) {
        ESP_LOGE(TAG, "Invalid log pointer");
        return -1;
    }

    FILE *f = fopen(LOG_FILE, "ab");
    if (!f) {
        ESP_LOGE(TAG, "Failed to open %s for append: errno=%d (%s)",
                 LOG_FILE, errno, strerror(errno));
        return -1;
    }

    size_t wrote = fwrite(log, 1, sizeof(battery_log_t), f);
    if (wrote != sizeof(battery_log_t)) {
        ESP_LOGE(TAG, "Partial/failed write: wrote=%u expected=%u errno=%d (%s)",
                 (unsigned)wrote, (unsigned)sizeof(battery_log_t), errno, strerror(errno));
        fclose(f);
        return -1;
    }

    fflush(f); // ensure data written to LITTLEFS
    fclose(f);

    // Optional: quick sanity stat/log
    struct stat st;
    if (stat(LOG_FILE, &st) == 0) {
        int count = (int)(st.st_size / (off_t)sizeof(battery_log_t));
        ESP_LOGI(TAG, "APPEND ok: file=%s size=%" PRIiMAX " bytes, count=%d",
                 LOG_FILE, (intmax_t)st.st_size, count);
    } else {
        ESP_LOGW(TAG, "APPEND: stat failed after write (errno=%d %s)",
                 errno, strerror(errno));
    }

    return 0;
}

int battery_log_count(void)
{
    struct stat st;
    int ret = stat(LOG_FILE, &st);
    if (ret != 0) {
        // File doesn't exist yet or stat failed - treat as 0 records
        if (errno == ENOENT) {
            ESP_LOGD(TAG, "Log file does not exist yet: %s", LOG_FILE);
            return 0;
        } else {
            ESP_LOGW(TAG, "stat(%s) failed: errno=%d (%s)", LOG_FILE, errno, strerror(errno));
            return 0;
        }
    }

    if (st.st_size < (off_t)sizeof(battery_log_t)) {
        // File present but too small to contain a full record -> treat as 0
        ESP_LOGW(TAG, "Log file too small: size=%" PRIiMAX, (intmax_t)st.st_size);
        return 0;
    }

    int count = (int)(st.st_size / (off_t)sizeof(battery_log_t));
    ESP_LOGI(TAG, "Log file size: %" PRIiMAX " bytes, record count: %d",
             (intmax_t)st.st_size, count);
    return count;
}

bool battery_log_read(int index, battery_log_t *out)
{
    if (!out) {
        ESP_LOGE(TAG, "NULL out pointer");
        return false;
    }

    if (index < 0) {
        ESP_LOGE(TAG, "Invalid index: %d", index);
        return false;
    }

    int count = battery_log_count();
    if (count <= 0) {
        ESP_LOGW(TAG, "No records to read (count=%d)", count);
        return false;
    }

    if (index >= count) {
        ESP_LOGW(TAG, "Index out of range: index=%d count=%d", index, count);
        return false;
    }

    FILE *f = fopen(LOG_FILE, "rb");
    if (!f) {
        ESP_LOGE(TAG, "Failed to open %s for read: errno=%d (%s)",
                 LOG_FILE, errno, strerror(errno));
        return false;
    }

    // compute offset and seek
    off_t offset = (off_t)index * (off_t)sizeof(battery_log_t);
    if (fseeko(f, offset, SEEK_SET) != 0) {
        ESP_LOGE(TAG, "fseeko failed offset=%" PRIiMAX " errno=%d (%s)",
                 (intmax_t)offset, errno, strerror(errno));
        fclose(f);
        return false;
    }

    size_t nr = fread(out, 1, sizeof(battery_log_t), f);
    fclose(f);

    if (nr != sizeof(battery_log_t)) {
        ESP_LOGE(TAG, "fread failed or partial read: got=%u want=%u errno=%d (%s)",
                 (unsigned)nr, (unsigned)sizeof(battery_log_t), errno, strerror(errno));
        return false;
    }

    return true;
}
