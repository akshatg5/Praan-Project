#include "device_state.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "DEVICE_STATE";
static const char *NVS_NAMESPACE = "device_state";
static device_state_t device_state;

esp_err_t device_state_init(void) {
    // init NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // load saved state from NVS
    nvs_handle_t nvs_handle;
    ret = nvs_open(NVS_NAMESPACE,NVS_READWRITE,&nvs_handle);
    if (ret == ESP_OK) {
        uint8_t power_state = 0;
        uint8_t fan_speed = 0;

        nvs_get_u8(nvs_handle,"power_state",&power_state);
        nvs_get_u8(nvs_handle,"fan_speed",&fan_speed);

        device_state.power_state = (power_state == 1);
        device_state.fan_speed = fan_speed;

        ESP_LOGI(TAG,"State loaded from NVS");
        ESP_LOGI(TAG,"Power : %s",device_state.power_state ? "ON" : "OFF");
        ESP_LOGI(TAG,"FAN SPEED : %d",device_state.fan_speed);

        nvs_close(nvs_handle);
    } else {
        ESP_LOGI(TAG,"No Saved State found, using defaults");
    }

    return ESP_OK;
}

device_state_t* device_state_get(void) {
    return &device_state;
}

esp_err_t device_state_set_fan_speed(uint8_t speed) {
    if (speed > 100) {
        ESP_LOGE(TAG,"Invalid Fan Speed");
        return ESP_ERR_INVALID_ARG;
    }

    device_state.fan_speed = speed;
    device_state.power_state = true;
    
    return device_state_save();
}

esp_err_t device_state_set_power(bool power_on) {
    device_state.power_state = power_on;
    return device_state_save();
}

void device_state_update_sensors(sensor_data_t* sensors) {
    if (sensors) {
        memcpy(&device_state.sensors, sensors, sizeof(sensor_data_t));
    }
}

esp_err_t device_state_save(void) {
    nvs_handle_t nvs_handle;
    esp_err_t ret = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs_handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open NVS");
        return ret;
    }

    nvs_set_u8(nvs_handle, "power_state", device_state.power_state ? 1 : 0);
    nvs_set_u8(nvs_handle, "fan_speed", device_state.fan_speed);

    ret = nvs_commit(nvs_handle);
    nvs_close(nvs_handle);

    ESP_LOGI(TAG,"State saved to NVS");
    return ret;
}