#pragma once
#include <stdbool.h>
#include <stdint.h>
#include "battery_log.h"

void ble_batt_mock_register(void);
void ble_batt_mock_on_connect(uint16_t conn_handle);
void ble_batt_mock_on_disconnect(void);
void ble_batt_mock_on_subscribe(uint16_t attr_handle, bool notify_enabled);

bool ble_batt_mock_is_subscribed(void);
void ble_batt_mock_notify_mock(void);


bool ble_backlog_requested(void);
void ble_backlog_clear_request(void);


int ble_batt_mock_notify_backlog(const battery_log_t *rec);

/* Backlog sending session state helpers */
void ble_batt_set_sending_backlog(bool v);
bool ble_batt_is_sending_backlog(void);