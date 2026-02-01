#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "config.h"
#include "wifi_manager.h"
#include "app_mqtt.h"
#include "device_state.h"
#include "sensor_manager.h"

static const char *TAG = "MAIN";

#define TELEMETRY_INTERVAL (120 * 1000) // 2 MINUTES

// telemetry task
void telemetry_task(void *pvParameters) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(TELEMETRY_INTERVAL);

    while (1) {
        // update sensors w the changes
        sensor_data_t sensors;
        sensor_manager_update(&sensors);
        device_state_update_sensors(&sensors);

        // publish telemetry
        esp_err_t ret = mqtt_publish_telemetry();
        if (ret != ESP_OK) {
            ESP_LOGE(TAG,"Failed to publish telemetry");
        }

        // wait for next interval
        vTaskDelayUntil(&xLastWakeTime,xFrequency);
    }
}

void app_main(void) {
    ESP_LOGI(TAG, "========================================");
    ESP_LOGI(TAG, "IoT Air Purifier - Praan Assignment - Akshat Girdhar");
    ESP_LOGI(TAG, "Device ID: %s", DEVICE_ID);
    ESP_LOGI(TAG, "========================================");

    // init device state and NVS
    ESP_ERROR_CHECK(device_state_init());

    device_state_t *state = device_state_get();
    ESP_LOGI(TAG, "========================================");
    ESP_LOGI(TAG,"Initial State : Power : [ %s ]  Fan : [ %d ]", state->power_state ? "ON" : "OFF", state->fan_speed);

    // init sensor manager
    sensor_manager_init();

    // init wifi
    esp_err_t wifi_ret = wifi_manager_init();
    if (wifi_ret != ESP_OK) {
        ESP_LOGE(TAG,"Wifi Initialization Failed!");
        return;
    }
    ESP_LOGI(TAG,"=========================================");
    ESP_LOGI(TAG,"WIFI CONNECTED");

    // init mqtt
    esp_err_t mqtt_ret = mqtt_client_init();
    if (mqtt_ret != ESP_OK) {
        ESP_LOGE(TAG,"Mqtt Initialization Failed");
        return;
    }

    // wait for mqtt connection
    vTaskDelay(pdMS_TO_TICKS(2000));

    // start telemetry tasl
    xTaskCreate(telemetry_task,"telemetry_task",4096,NULL,5,NULL);
    ESP_LOGI(TAG,"Telemetry Task Stated");

    ESP_LOGI(TAG, "========================================");
    ESP_LOGI(TAG, "            INIT COMPLETE               ");
    ESP_LOGI(TAG, "========================================");

}