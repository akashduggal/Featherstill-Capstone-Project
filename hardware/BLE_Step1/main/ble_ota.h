#pragma once
#include <stdint.h>

void ble_ota_register_service(void);
void ble_ota_on_connect(uint16_t conn_handle);
void ble_ota_on_disconnect(void);
void ble_ota_on_subscribe(uint16_t attr_handle, uint8_t cur_notify);