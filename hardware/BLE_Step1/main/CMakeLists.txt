idf_component_register(
    SRCS app_main.c ble_stack.c ble_batt_mock.c storage.c battery_log.c ble_ota.c boot_id.c
    INCLUDE_DIRS "."
)