#ifndef SEQ_LOCAL_H
#define SEQ_LOCAL_H

#include <stdint.h>
#include "esp_err.h"

/**
 * Initialize seq_local tracking with current boot_id.
 * Call this once per boot after boot_id_increment_and_persist().
 */
esp_err_t seq_local_init(uint32_t boot_id);

/**
 * Get and increment the local sequence counter for this boot.
 * Returns the assigned seq_local value.
 */
uint32_t seq_local_next(void);

/**
 * Get current boot_id associated with this seq_local context.
 */
uint32_t seq_local_get_boot_id(void);

/**
 * Get the highest seq_local issued so far in this boot.
 */
uint32_t seq_local_get_current(void);

#endif // SEQ_LOCAL_H
