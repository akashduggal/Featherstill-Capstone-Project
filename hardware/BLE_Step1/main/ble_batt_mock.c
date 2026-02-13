#include "ble_batt_mock.h"

#include <string.h>
#include "esp_log.h"
#include "esp_timer.h"

#include "host/ble_hs.h"
#include "host/ble_uuid.h"
#include "host/util/util.h"

static const char *TAG = "BATT_MOCK";

typedef struct __attribute__((packed)) {
    uint32_t timestamp_s;
    uint16_t cell_mv[16];
    uint16_t pack_total_mv;
    uint16_t pack_ld_mv;
    uint16_t pack_sum_active_mv;
    int16_t  current_ma;
    int16_t  temp_ts1_c_x100;
    int16_t  temp_int_c_x100;
    uint8_t  soc;
} battery_log_t;

static uint16_t s_conn = BLE_HS_CONN_HANDLE_NONE;
static uint16_t s_live_val_handle = 0;
static bool s_live_notify = false;

bool ble_batt_mock_is_subscribed(void) { return s_live_notify && s_conn != BLE_HS_CONN_HANDLE_NONE; }

static void build_mock(battery_log_t *r)
{
    memset(r, 0, sizeof(*r));

    r->timestamp_s = (uint32_t)(esp_timer_get_time() / 1000000ULL);

    // Example mock values
    // cells around 3.65V
    for (int i = 0; i < 16; i++) {
        r->cell_mv[i] = (uint16_t)(3650 + (i % 4) * 3); // small variation
    }

    // pack total: sum of cells (rough mock)
    uint32_t sum = 0;
    for (int i = 0; i < 16; i++) sum += r->cell_mv[i];
    r->pack_total_mv = (uint16_t)sum;

    r->pack_ld_mv = r->pack_total_mv - 50;          // pretend load drop
    r->pack_sum_active_mv = r->pack_total_mv;       // same for mock
    r->current_ma = -1200;                          // -1.2A (discharging)
    r->temp_ts1_c_x100 = 2550;                      // 25.50 C
    r->temp_int_c_x100 = 2800;                      // 28.00 C
    r->soc = 76;                                    // 76%
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
    }
}

// Service UUID: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee0
// LIVE char UUID: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1
static const struct ble_gatt_svc_def g_svcs[] = {
    {
        .type = BLE_GATT_SVC_TYPE_PRIMARY,
        .uuid = BLE_UUID128_DECLARE(0xaa,0xaa,0xaa,0xaa,0xbb,0xbb,0xcc,0xcc,0xdd,0xdd,0xee,0xee,0xee,0xee,0xee,0xe0),
        .characteristics = (struct ble_gatt_chr_def[]) {
            {
                .uuid = BLE_UUID128_DECLARE(0xaa,0xaa,0xaa,0xaa,0xbb,0xbb,0xcc,0xcc,0xdd,0xdd,0xee,0xee,0xee,0xee,0xee,0xe1),
                .access_cb = NULL,
                .flags = BLE_GATT_CHR_F_NOTIFY,
                .val_handle = &s_live_val_handle,
            },
            { 0 }
        }
    },
    { 0 }
};

void ble_batt_mock_register(void)
{
    // Called from ble_stack_start() before nimble_port_freertos_init()
    ble_gatts_count_cfg(g_svcs);
    ble_gatts_add_svcs(g_svcs);
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
}

void ble_batt_mock_on_subscribe(uint16_t attr_handle, bool notify_enabled)
{
    if (attr_handle == s_live_val_handle) {
        s_live_notify = notify_enabled;
        ESP_LOGI(TAG, "LIVE notify=%d", (int)notify_enabled);
    }
}
