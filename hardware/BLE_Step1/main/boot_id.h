#ifndef BOOT_ID_H
#define BOOT_ID_H

#include <stdint.h>
#include "esp_err.h"

esp_err_t boot_id_init(void);
esp_err_t boot_id_increment_and_persist(void);
uint32_t boot_id_get(void);

#endif // BOOT_ID_H
