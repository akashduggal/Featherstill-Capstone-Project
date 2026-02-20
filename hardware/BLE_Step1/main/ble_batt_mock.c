#include "ble_batt_mock.h"

#include <string.h>
#include "esp_log.h"
#include "esp_timer.h"
#include "esp_random.h"
#include "battery_log.h"


#include "host/ble_hs.h"
#include "host/ble_uuid.h"
#include "host/util/util.h"
#include "os/os_mbuf.h"
#include "host/ble_hs_mbuf.h"


static const char *TAG = "BATT_MOCK";


static uint16_t s_conn = BLE_HS_CONN_HANDLE_NONE;
static uint16_t s_live_val_handle = 0;
static bool s_live_notify = false;

static uint16_t s_cmd_val_handle = 0;
static volatile bool s_backlog_requested = false;

static uint16_t s_backlog_val_handle = 0;
static bool s_backlog_notify = false;
static volatile bool s_is_sending_backlog = false;

bool ble_backlog_requested(void) { return s_backlog_requested; }
void ble_backlog_clear_request(void) { s_backlog_requested = false; }

void ble_batt_set_sending_backlog(bool v)
{
    s_is_sending_backlog = v;
}

bool ble_batt_is_sending_backlog(void)
{
    return s_is_sending_backlog;
}

bool ble_batt_mock_is_subscribed(void)
{
    return s_live_notify && s_conn != BLE_HS_CONN_HANDLE_NONE;
}

static uint16_t rand_u16(uint16_t min, uint16_t max)
{
    if (max <= min) return min;
    return (uint16_t)(min + (esp_random() % (max - min + 1)));
}

static int16_t rand_i16(int16_t min, int16_t max)
{
    if (max <= min) return min;
    return (int16_t)(min + (int32_t)(esp_random() % (uint32_t)(max - min + 1)));
}
static void build_mock(battery_log_t *r)
{
    memset(r, 0, sizeof(*r));

    r->timestamp_s = (uint32_t)(esp_timer_get_time() / 1000000ULL);

    // Random-ish cells around 3600–4200 mV
    uint32_t sum = 0;
    uint16_t base = rand_u16(3600, 4100);

    for (int i = 0; i < 16; i++) {
        int16_t noise = rand_i16(-15, 15);     // small cell-to-cell variation
        uint16_t v = (uint16_t)((int32_t)base + noise);

        // clamp
        if (v < 3300) v = 3300;
        if (v > 4200) v = 4200;

        r->cell_mv[i] = v;
        sum += v;
    }

    r->pack_total_mv = (uint16_t)sum;

    // Load drop 20–150 mV (just a mock)
    uint16_t drop = rand_u16(20, 150);
    r->pack_ld_mv = (r->pack_total_mv > drop) ? (r->pack_total_mv - drop) : r->pack_total_mv;

    r->pack_sum_active_mv = r->pack_total_mv;

    // Current -5000 to +5000 mA
    r->current_ma = rand_i16(-5000, 5000);

    // Temps: 20.00°C–45.00°C
    r->temp_ts1_c_x100 = (int16_t)rand_u16(2000, 4500);
    r->temp_int_c_x100 = (int16_t)rand_u16(2000, 4500);

    // SOC 0–100
    r->soc = (uint8_t)rand_u16(0, 100);
}

static int cmd_access_cb(uint16_t conn_handle, uint16_t attr_handle,
                         struct ble_gatt_access_ctxt *ctxt, void *arg)
{
    (void)conn_handle;
    (void)attr_handle;
    (void)arg;

    if (ctxt->op != BLE_GATT_ACCESS_OP_WRITE_CHR) {
        return BLE_ATT_ERR_UNLIKELY;
    }

    uint8_t cmd = 0;
    int rc = os_mbuf_copydata(ctxt->om, 0, 1, &cmd);
    if (rc != 0) {
        return BLE_ATT_ERR_INVALID_ATTR_VALUE_LEN;
    }

    if (cmd == 0x01) {
        if (s_is_sending_backlog) {
            ESP_LOGI(TAG, "Backlog request ignored: already sending");
        } else {
            s_backlog_requested = true;
            ESP_LOGI(TAG, "Backlog requested (CMD=0x01)");
        }
    } else {
        ESP_LOGW(TAG, "Unknown CMD=0x%02X", cmd);
    }

    return 0;
}

static int live_access_cb(uint16_t conn_handle, uint16_t attr_handle,
                          struct ble_gatt_access_ctxt *ctxt, void *arg)
{
    (void)conn_handle;
    (void)attr_handle;
    (void)arg;

    battery_log_t rec;
    build_mock(&rec);

    int rc = os_mbuf_append(ctxt->om, &rec, sizeof(rec));
    return (rc == 0) ? 0 : BLE_ATT_ERR_INSUFFICIENT_RES;
}

void ble_batt_mock_notify_mock(void)
{
    if (!ble_batt_mock_is_subscribed()) return;

    battery_log_t rec;
    build_mock(&rec);

    struct os_mbuf *om = ble_hs_mbuf_from_flat(&rec, sizeof(rec));
    if (!om) return;

    int rc = ble_gatts_notify_custom(s_conn, s_live_val_handle, om);
    if (rc != 0) {
        ESP_LOGW(TAG, "notify rc=%d", rc);
        os_mbuf_free_chain(om);
    }
}

int ble_batt_mock_notify_backlog(const battery_log_t *rec)
{
    if (s_conn == BLE_HS_CONN_HANDLE_NONE || !s_backlog_notify) {
        return -1;
    }

    struct os_mbuf *om = ble_hs_mbuf_from_flat(rec, sizeof(*rec));
    if (!om) {
        ESP_LOGE(TAG, "ble_hs_mbuf_from_flat failed");
        return -2;
    }

    int rc = ble_gatts_notify_custom(s_conn, s_backlog_val_handle, om);
    if (rc != 0) {
        ESP_LOGW(TAG, "BACKLOG notify failed rc=%d", rc);
        os_mbuf_free_chain(om);   // IMPORTANT: free on error
    }

    return rc;
}


// Service UUID: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee0
// LIVE char UUID: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1
// CMD  char UUID: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2
// BACKLOG char UUID: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3
static const struct ble_gatt_svc_def g_svcs[] = {
    {
        .type = BLE_GATT_SVC_TYPE_PRIMARY,
        .uuid = BLE_UUID128_DECLARE(0xaa,0xaa,0xaa,0xaa,0xbb,0xbb,0xcc,0xcc,0xdd,0xdd,0xee,0xee,0xee,0xee,0xee,0xe0),
        .characteristics = (struct ble_gatt_chr_def[]) {
            {
                .uuid = BLE_UUID128_DECLARE(0xaa,0xaa,0xaa,0xaa,0xbb,0xbb,0xcc,0xcc,0xdd,0xdd,0xee,0xee,0xee,0xee,0xee,0xe1),
                .access_cb = live_access_cb,
                .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY,
                .val_handle = &s_live_val_handle,
            },
            {
                .uuid = BLE_UUID128_DECLARE(0xaa,0xaa,0xaa,0xaa,0xbb,0xbb,0xcc,0xcc,0xdd,0xdd,0xee,0xee,0xee,0xee,0xee,0xe2),
                .access_cb = cmd_access_cb,
                /* Require Write With Response to avoid client-side buffering
                   of Write Without Response (Command) that can be delivered
                   after backlog finishes. This forces the client to use
                   'Request' which is delivered immediately by the stack. */
                .flags = BLE_GATT_CHR_F_WRITE,     // ← Changed from BLE_GATT_CHR_F_WRITE | BLE_GATT_CHR_F_WRITE_NO_RSP
                .val_handle = &s_cmd_val_handle,
            },
            {
                .uuid = BLE_UUID128_DECLARE(0xaa,0xaa,0xaa,0xaa,0xbb,0xbb,0xcc,0xcc,0xdd,0xdd,0xee,0xee,0xee,0xee,0xee,0xe3),
                .access_cb = live_access_cb, 
                .flags = BLE_GATT_CHR_F_NOTIFY,
                .val_handle = &s_backlog_val_handle,
            },
            { 0 }
        }
    },
    { 0 }
};

void ble_batt_mock_register(void)
{
    int rc;

    rc = ble_gatts_count_cfg(g_svcs);
    if (rc != 0) {
        ESP_LOGE(TAG, "ble_gatts_count_cfg failed rc=%d", rc);
        return;
    }

    rc = ble_gatts_add_svcs(g_svcs);
    if (rc != 0) {
        ESP_LOGE(TAG, "ble_gatts_add_svcs failed rc=%d", rc);
        return;
    }

    ESP_LOGI(TAG, "Mock battery service registered");
}

void ble_batt_mock_on_connect(uint16_t conn_handle)
{
    s_conn = conn_handle;
}

void ble_batt_mock_on_disconnect(void)
{
    s_conn = BLE_HS_CONN_HANDLE_NONE;
    s_live_notify = false;
    s_backlog_notify = false;
    s_backlog_requested = false;
    s_is_sending_backlog = false;
}

void ble_batt_mock_on_subscribe(uint16_t attr_handle, bool notify_enabled)
{
    if (attr_handle == s_live_val_handle) {
        s_live_notify = notify_enabled;
        ESP_LOGI(TAG, "LIVE notify %s", notify_enabled ? "ENABLED" : "DISABLED");
    } else if (attr_handle == s_backlog_val_handle) {
        s_backlog_notify = notify_enabled;
        ESP_LOGI(TAG, "BACKLOG notify %s", notify_enabled ? "ENABLED" : "DISABLED");
    }
}