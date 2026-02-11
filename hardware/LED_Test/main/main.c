#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"

#define BLINK_GPIO GPIO_NUM_2

void app_main(void)
{
    gpio_reset_pin(BLINK_GPIO);
    gpio_set_direction(BLINK_GPIO, GPIO_MODE_OUTPUT);

    printf("=== BLINK STARTED on GPIO %d ===\n", (int)BLINK_GPIO);
    fflush(stdout);

    int level = 0;
    while (1) {
        level = !level;
        gpio_set_level(BLINK_GPIO, level);
        printf("blink level=%d\n", level);
        fflush(stdout);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}