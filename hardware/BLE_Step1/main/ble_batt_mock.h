#pragma once
#include <stdbool.h>
#include <stdint.h>
#include "battery_log.h"
typedef enum {
    BACKLOG_MODE_FULL = 0,
    BACKLOG_MODE_FROM_SEQ = 1,
} backlog_mode_t;

typedef struct {
    backlog_mode_t mode;
    uint32_t start_seq;
} backlog_request_t;

backlog_request_t ble_backlog_get_request(void);
void ble_batt_mock_register(void);
void ble_batt_mock_on_connect(uint16_t conn_handle);
void ble_batt_mock_on_disconnect(void);
void ble_batt_mock_on_subscribe(uint16_t attr_handle, bool notify_enabled);

bool ble_batt_mock_is_subscribed(void);

/**
 * @brief Check if backlog notification is subscribed (gating condition for sending)
 * @return true if client is subscribed to backlog notifications
 */
bool ble_backlog_is_subscribed(void);

bool ble_backlog_requested(void);
void ble_backlog_clear_request(void);

/**
 * @brief Check if client has requested backlog abort (CMD 0x03)
 * @return true if abort was requested; clears flag on read
 */
bool ble_backlog_abort_requested(void);


int ble_batt_mock_notify_backlog(const battery_log_t *rec);


void ble_batt_set_sending_backlog(bool v);
bool ble_batt_is_sending_backlog(void);


void ble_batt_mock_build_record(battery_log_t *out);


int ble_batt_mock_notify_live(const battery_log_t *rec);