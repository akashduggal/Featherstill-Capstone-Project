#ifndef BLE_OTA_H
#define BLE_OTA_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

void ble_ota_on_disconnect(void);
void ble_ota_on_connect(uint16_t conn_handle);
void ble_ota_on_subscribe(uint16_t attr_handle, uint8_t cur_notify);
void ble_ota_register_service(void);

#ifdef __cplusplus
}
#endif

#endif // BLE_OTA_H
