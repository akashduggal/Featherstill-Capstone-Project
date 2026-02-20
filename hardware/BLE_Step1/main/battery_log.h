#pragma once

#include <stdint.h>
#include <stddef.h>

/**
 * @brief Battery log record - packed struct for binary storage
 */
typedef struct __attribute__((packed)) {
    uint32_t timestamp_s;              // Unix timestamp in seconds
    uint16_t cell_mv[16];              // Individual cell voltages (mV)
    uint16_t pack_total_mv;            // Total pack voltage (mV)
    uint16_t pack_ld_mv;               // Pack load drop voltage (mV)
    uint16_t pack_sum_active_mv;       // Pack sum active voltage (mV)
    int16_t  current_ma;               // Pack current (mA)
    int16_t  temp_ts1_c_x100;          // Temperature sensor 1 (°C * 100)
    int16_t  temp_int_c_x100;          // Internal temperature (°C * 100)
    uint8_t  soc;                      // State of charge (0-100%)
} battery_log_t;

/**
 * @brief Append a battery log record to /fs/battery.bin
 * 
 * @param log Pointer to battery_log_t record to append
 * @return 0 on success, -1 on failure
 */
int battery_log_append(const battery_log_t *log);

/**
 * @brief Get the number of records in the log file
 * 
 * @return Number of records, or -1 if file doesn't exist
 */
int battery_log_count(void);
