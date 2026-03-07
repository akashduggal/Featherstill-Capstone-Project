#include "battery_log.h"

#include <stdio.h>
#include <sys/stat.h>
#include <errno.h>
#include <string.h>
#include <stdbool.h>
#include <inttypes.h>   // <-- IMPORTANT for PRIiMAX
#include "esp_log.h"
#include <unistd.h>   
#include "nvs.h"
#include <fcntl.h>

#define NVS_NS_LOG            "blog"
#define NVS_KEY_LOG_VER       "log_ver"
#define NVS_KEY_LOG_SIZE      "log_sz"

#define SEQ_CHECKPOINT_FILE      "/littlefs/seq_checkpoint.bin"
#define SEQ_CHECKPOINT_TMP_FILE  "/littlefs/seq_checkpoint.tmp"
#define SEQ_CHECKPOINT_MAGIC     0x53455131u   // 'SEQ1'
#define SEQ_CHECKPOINT_EVERY_N   12

typedef struct __attribute__((packed)) {
    uint32_t magic;     // SEQ_CHECKPOINT_MAGIC
    uint32_t seq_next;  // next sequence to allocate
} seq_checkpoint_t;


static const char *TAG = "BATTERY_LOG";
static const char *LOG_FILE = "/littlefs/battery.bin";
static uint32_t g_seq_next = 0;


static esp_err_t seq_checkpoint_load(void)
{
    int fd = open(SEQ_CHECKPOINT_FILE, O_RDONLY);
    if (fd < 0) {
        if (errno == ENOENT) {
            ESP_LOGI(TAG, "SEQ checkpoint not found, starting at 0");
            g_seq_next = 0;
            return ESP_OK;
        }
        ESP_LOGW(TAG, "SEQ checkpoint open failed errno=%d (%s)", errno, strerror(errno));
        g_seq_next = 0;
        return ESP_OK; // don't brick boot because of checkpoint
    }

    seq_checkpoint_t ck = {0};
    ssize_t nr = read(fd, &ck, sizeof(ck));
    close(fd);

    if (nr != sizeof(ck) || ck.magic != SEQ_CHECKPOINT_MAGIC) {
        ESP_LOGW(TAG, "SEQ checkpoint invalid (nr=%d magic=0x%08" PRIx32 "), starting at 0",
                 (int)nr, ck.magic);
        g_seq_next = 0;
        return ESP_OK;
    }

    g_seq_next = ck.seq_next;
    ESP_LOGI(TAG, "Loaded seq_next=%" PRIu32 " from checkpoint", g_seq_next);
    return ESP_OK;
}

static esp_err_t seq_checkpoint_save(uint32_t seq_next_to_save)
{
    seq_checkpoint_t ck = {
        .magic = SEQ_CHECKPOINT_MAGIC,
        .seq_next = seq_next_to_save,
    };

    // Write temp file
    int fd = open(SEQ_CHECKPOINT_TMP_FILE, O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) {
        ESP_LOGW(TAG, "SEQ checkpoint tmp open failed errno=%d (%s)", errno, strerror(errno));
        return ESP_FAIL;
    }

    ssize_t nw = write(fd, &ck, sizeof(ck));
    if (nw != sizeof(ck)) {
        ESP_LOGW(TAG, "SEQ checkpoint tmp write failed nw=%d errno=%d (%s)",
                 (int)nw, errno, strerror(errno));
        close(fd);
        unlink(SEQ_CHECKPOINT_TMP_FILE);
        return ESP_FAIL;
    }

    // Ensure written to flash
    if (fsync(fd) != 0) {
        ESP_LOGW(TAG, "SEQ checkpoint fsync failed errno=%d (%s)", errno, strerror(errno));
        // continue anyway; fsync not always meaningful on all FS layers
    }

    close(fd);

    // Atomic replace: rename tmp -> final
    // On LittleFS this should be power-safe at the file level.
    if (rename(SEQ_CHECKPOINT_TMP_FILE, SEQ_CHECKPOINT_FILE) != 0) {
        ESP_LOGW(TAG, "SEQ checkpoint rename failed errno=%d (%s)", errno, strerror(errno));
        unlink(SEQ_CHECKPOINT_TMP_FILE);
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Saved seq_next=%" PRIu32 " to checkpoint", seq_next_to_save);
    return ESP_OK;
}

static void seq_checkpoint_delete(void)
{
    unlink(SEQ_CHECKPOINT_FILE);
    unlink(SEQ_CHECKPOINT_TMP_FILE);
    ESP_LOGI(TAG, "SEQ checkpoint deleted");
}

uint32_t battery_log_next_seq(void)
{
    uint32_t assigned = g_seq_next++;
    
    ESP_LOGI(TAG, "Assigned seq = %" PRIu32, assigned);

    if ((g_seq_next % SEQ_CHECKPOINT_EVERY_N) == 0) {
        seq_checkpoint_save(g_seq_next);
    }

    return assigned;
}

esp_err_t battery_log_seq_init(void)
{
    esp_err_t err = seq_checkpoint_load();
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "Loaded seq_next = %" PRIu32, g_seq_next);
        if (g_seq_next == 0) {
            ESP_LOGI(TAG, "Loaded seq_next = 0 (first boot or no checkpoint)");
        }
    }
    return err;
}

static esp_err_t nvs_get_u32_safe(nvs_handle_t h, const char *key, uint32_t *out, bool *found)
{
    esp_err_t err = nvs_get_u32(h, key, out);
    if (err == ESP_OK) { *found = true; return ESP_OK; }
    if (err == ESP_ERR_NVS_NOT_FOUND) { *found = false; return ESP_OK; }
    return err;
}
esp_err_t log_maybe_wipe_on_format_change(void)
{
    nvs_handle_t h;
    esp_err_t err = nvs_open(NVS_NS_LOG, NVS_READWRITE, &h);
    if (err != ESP_OK) return err;

    uint32_t stored_ver = 0, stored_sz = 0;
    bool ver_found = false, sz_found = false;

    err = nvs_get_u32_safe(h, NVS_KEY_LOG_VER, &stored_ver, &ver_found);
    if (err != ESP_OK) { nvs_close(h); return err; }

    err = nvs_get_u32_safe(h, NVS_KEY_LOG_SIZE, &stored_sz, &sz_found);
    if (err != ESP_OK) { nvs_close(h); return err; }

    const uint32_t cur_ver = LOG_RECORD_VERSION;
    const uint32_t cur_sz  = (uint32_t)sizeof(battery_log_t);

    if (!ver_found || !sz_found) {
        ESP_LOGI(TAG, "LOG META init ver=%u size=%u", (unsigned)cur_ver, (unsigned)cur_sz);
        ESP_ERROR_CHECK(nvs_set_u32(h, NVS_KEY_LOG_VER, cur_ver));
        ESP_ERROR_CHECK(nvs_set_u32(h, NVS_KEY_LOG_SIZE, cur_sz));
        err = nvs_commit(h);
        nvs_close(h);
        return err;
    }

    if (stored_ver == cur_ver && stored_sz == cur_sz) {
        ESP_LOGI(TAG, "LOG META ok ver=%u size=%u", (unsigned)stored_ver, (unsigned)stored_sz);
        nvs_close(h);
        return ESP_OK;
    }

    ESP_LOGW(TAG,
             "LOG META mismatch old(ver=%u sz=%u) new(ver=%u sz=%u) -> WIPE %s",
             (unsigned)stored_ver, (unsigned)stored_sz,
             (unsigned)cur_ver, (unsigned)cur_sz,
             LOG_FILE);

    unlink(LOG_FILE);
    seq_checkpoint_delete();

    ESP_ERROR_CHECK(nvs_set_u32(h, NVS_KEY_LOG_VER, cur_ver));
    ESP_ERROR_CHECK(nvs_set_u32(h, NVS_KEY_LOG_SIZE, cur_sz));
    err = nvs_commit(h);

    nvs_close(h);
    return err;
}

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
int battery_log_find_start_index_by_seq(uint32_t start_seq)
{
    int count = battery_log_count();
    if (count <= 0) return 0;

    FILE *f = fopen(LOG_FILE, "rb");
    if (!f) {
        ESP_LOGE(TAG, "Failed to open %s for seq search: errno=%d (%s)",
                 LOG_FILE, errno, strerror(errno));
        return 0; 
    }

    int lo = 0;
    int hi = count;  

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;

        off_t offset = (off_t)mid * (off_t)sizeof(battery_log_t);
        if (fseeko(f, offset, SEEK_SET) != 0) {
            ESP_LOGE(TAG, "fseeko failed mid=%d offset=%" PRIiMAX " errno=%d (%s)",
                     mid, (intmax_t)offset, errno, strerror(errno));
            fclose(f);
            return 0;
        }

        battery_log_t rec;
        size_t nr = fread(&rec, 1, sizeof(rec), f);
        if (nr != sizeof(rec)) {
            ESP_LOGE(TAG, "fread failed mid=%d got=%u want=%u errno=%d (%s)",
                     mid, (unsigned)nr, (unsigned)sizeof(rec), errno, strerror(errno));
            fclose(f);
            return 0;
        }

        if (rec.seq < start_seq) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }

    fclose(f);
    return lo; 
}