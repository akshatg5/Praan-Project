#ifndef DEVICE_STATE_H
#define DEVICE_STATE_H

#include "config.h"
#include "esp_err.h"

// init NVS and load device state
esp_err_t device_state_init(void);

// get current device state
device_state_t* device_state_get(void);

// update device states
esp_err_t device_state_set_power(bool power_on);
esp_err_t device_state_set_fan_speed(uint8_t speed);

// update sensor data
void device_state_update_sensors(sensor_data_t* sensors);

// save state to NVS
esp_err_t device_state_save(void);

#endif // DEVICE_STATE_H