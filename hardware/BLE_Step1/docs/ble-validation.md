
BLE Validation Report — Task #40
Project: ESP32 Mock Battery Telemetry over BLE
Device Name: ESP32_STEP1
Properties: Notify

## 1. Objective
Validate that the ESP32 successfully streams structured mock battery telemetry data via BLE notifications and that the transmitted payload matches the embedded C struct layout.

## 2. Transmission Method
The ESP32 uses NimBLE and sends telemetry using:

ble_gatts_notify_custom(s_conn, s_live_val_handle, om);
The notification payload is the raw binary memory representation of a packed C struct:

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
No JSON or string encoding is used.
The BLE client must parse the raw byte array.

3. Packet Size & Format
    Total Payload Size: 49 bytes
    Offset	Size	Field	Type	Units
    0	4	timestamp_s	uint32	seconds
    4	32	cell_mv[16]	uint16 ×16	millivolts
    36	2	pack_total_mv	uint16	millivolts
    38	2	pack_ld_mv	uint16	millivolts
    40	2	pack_sum_active_mv	uint16	millivolts
    42	2	current_ma	int16	milliamps
    44	2	temp_ts1_c_x100	int16	°C ×100
    46	2	temp_int_c_x100	int16	°C ×100
    48	1	soc	uint8	percent
    Endianness
    All multi-byte fields are little-endian (ESP32 architecture).

4. Mock Data Logic (From Firmware)
    Generated in build_mock():

    Cell voltages: ~3650–3659 mV (slight variation)

    pack_total_mv: Sum of 16 cell voltages

    pack_ld_mv: pack_total_mv − 50 mV

    pack_sum_active_mv: Same as pack_total_mv

    current_ma: −1200 mA (discharging)

    temp_ts1_c_x100: 2550 (25.50 °C)

    temp_int_c_x100: 2800 (28.00 °C)

    soc: 76%

## 5. Sample Decoded Payload (Example Notification)
Below is an example decoded notification (values derived from current mock logic):


    timestamp_s: 1245 seconds
    Cell Voltages (mV → V)
    Cell	mV	V
    C1	3650	3.650
    C2	3653	3.653
    C3	3656	3.656
    C4	3659	3.659
    C5	3650	3.650
    C6	3653	3.653
    C7	3656	3.656
    C8	3659	3.659
    C9	3650	3.650
    C10	3653	3.653
    C11	3656	3.656
    C12	3659	3.659
    C13	3650	3.650
    C14	3653	3.653
    C15	3656	3.656
    C16	3659	3.659
    Pack Summary
    pack_total_mv: 58472 mV (58.472 V)

    pack_ld_mv: 58422 mV

    pack_sum_active_mv: 58472 mV

    Current
    current_ma: −1200 mA

    current: −1.2 A

    Temperatures
    temp_ts1_c_x100: 2550 → 25.50 °C

    temp_int_c_x100: 2800 → 28.00 °C

    State of Charge
    soc: 76%

## 6. Validation Checklist
Device advertises as ESP32_STEP1

Client can discover custom 128-bit service

Client enables notifications successfully

49-byte payload received

Decoded values match firmware mock generation

Reconnect resumes notifications

No packet corruption observed

## 7. Test Results
BLE connection established successfully.

Notifications received consistently while subscribed.

Payload size verified as 49 bytes.

Decoded values matched expected mock logic.

Reconnection test successful (advertising restarts automatically).

## 8. Conclusion
The ESP32 BLE mock telemetry service successfully streams structured battery data using a packed binary format.
The transport layer, notification mechanism, and data structure integrity have been validated.

This confirms readiness for integration with real battery telemetry sources.