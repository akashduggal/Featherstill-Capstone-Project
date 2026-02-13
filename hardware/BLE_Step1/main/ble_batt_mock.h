#pragma once
#include <stdbool.h>
#include <stdint.h>

void ble_batt_mock_register(void);     // registers the GATT service
void ble_batt_mock_on_connect(uint16_t conn_handle);
void ble_batt_mock_on_disconnect(void);
void ble_batt_mock_on_subscribe(uint16_t attr_handle, bool notify_enabled);

bool ble_batt_mock_is_subscribed(void);
void ble_batt_mock_notify_mock(void);
