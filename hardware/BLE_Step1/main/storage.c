#include "storage.h"

#include <stdio.h>
#include "esp_littlefs.h"
#include "esp_err.h"
#include "esp_log.h"
#include <unistd.h>

static const char *TAG = "storage";

void storage_init(void)
{
    esp_vfs_littlefs_conf_t conf = {
        .base_path = "/littlefs",
        .partition_label = "littlefs",
        /* don't automatically format - handle corruption explicitly */
        .format_if_mount_failed = false,
        .dont_mount = false
    };

    esp_err_t ret = esp_vfs_littlefs_register(&conf);
    if (ret != ESP_OK) {
        ESP_LOGW(TAG, "Mount failed (%s), formatting partition...",
                 esp_err_to_name(ret));
        esp_err_t fr = esp_littlefs_format(conf.partition_label);
        ESP_LOGI(TAG, "format returned %s", esp_err_to_name(fr));
        ret = esp_vfs_littlefs_register(&conf);
        if (ret != ESP_OK) {
            ESP_LOGE(TAG, "LittleFS register error after format (%s)", esp_err_to_name(ret));
            return;
        }
    }

    size_t total = 0, used = 0;
    ret = esp_littlefs_info(conf.partition_label, &total, &used);
    if (ret == ESP_OK) {
        ESP_LOGI(TAG, "LittleFS mounted at %s", conf.base_path);
        ESP_LOGI(TAG, "Partition size: total=%d, used=%d", (int)total, (int)used);
    }

    // Simple write test: append a single line.  This is sufficient to
    // verify the file grows across resets.  The "used" value reported by
    // esp_littlefs_info may not change for such small writes because the
    // filesystem allocates in larger blocks; it only increases once a new
    // block or metadata structure is actually written to flash.
    FILE *f = fopen("/littlefs/boot_log.txt", "a+");
    if (f) {
        fprintf(f, "boot\n");
        fflush(f);
        int fd = fileno(f);
        if (fd >= 0) fsync(fd);

        // check file size (this will clearly increase each boot)
        fseek(f, 0, SEEK_END);
        long sz = ftell(f);
        ESP_LOGI(TAG, "boot_log.txt size after write: %ld", sz);
        fclose(f);

        // remount just to refresh the used measurement (optional)
        esp_vfs_littlefs_unregister(conf.partition_label);
        ret = esp_vfs_littlefs_register(&conf);
        if (ret != ESP_OK) {
            ESP_LOGE(TAG, "re-mount failed (%s)", esp_err_to_name(ret));
        }
        size_t total_after = 0, used_after = 0;
        if (esp_littlefs_info(conf.partition_label, &total_after, &used_after) == ESP_OK) {
            ESP_LOGI(TAG, "After write (remount): total=%d, used=%d", (int)total_after, (int)used_after);
        }
    } else {
        ESP_LOGW(TAG, "Could not open /littlefs/boot_log.txt for append");
    }

}
