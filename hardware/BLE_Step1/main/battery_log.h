#pragma once

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/**
 * @brief Battery log record - packed struct for binary storage
 *
 * Keep this struct packed and stable; its binary representation is written/read
 * directly to/from flash. Changing this struct after deployed devices exist
 * will break compatibility.
 */
typedef struct __attribute__((packed)) {
    uint32_t timestamp_s;              // Unix timestamp in seconds
    uint16_t cell_mv[16];              // Individual cell voltages (mV)
    uint16_t pack_total_mv;            // Total pack voltage (mV)
    uint16_t pack_ld_mv;               // Pack load drop voltage (mV)
    uint16_t pack_sum_active_mv;       // Pack sum active voltage (mV)
    int16_t  current_ma;               // Pack current (mA)
    int16_t  temp_ts1_c_x100;          // Temperature sensor 1 (°C * 100)
    int16_t  temp_int_c_x100;          // Internal temp (°C * 100)
    uint8_t  soc;                      // State of charge (0-100)
    uint8_t  _pad[3];                  // padding to align size to multiple of 4 (optional)
} battery_log_t;

#define LOG_RECORD_VERSION 2
#define LOG_RECORD_SIZE_BYTES 52  // set to your exact sizeof(battery_log_t)

_Static_assert(sizeof(battery_log_t) == LOG_RECORD_SIZE_BYTES,
               "battery_log_t size changed! Bump LOG_RECORD_VERSION and migrate/wipe battery.bin");
               
/**
 * @brief Append a battery log record to /littlefs/battery.bin
 *
 * @param log Pointer to battery_log_t record to append
 * @return 0 on success, -1 on failure
 */
int battery_log_append(const battery_log_t *log);

/**
 * @brief Get the number of records in the log file
 *
 * @return Number of records (>=0). Returns 0 if file doesn't exist or is empty.
 *         (We avoid returning -1 so callers can treat 0 as "no records").
 */
int battery_log_count(void);

/**
 * @brief Read record at `index` (0-based) into `out`.
 *
 * @param index  0-based index (0 = oldest record)
 * @param out    pointer to battery_log_t to be filled
 * @return true if the read succeeded and `out` contains a record; false otherwise.
 */
bool battery_log_read(int index, battery_log_t *out);
