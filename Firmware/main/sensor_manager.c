#include "sensor_manager.h"
#include "esp_random.h"
#include <math.h>

#define MAX_CHANGE 5.0f

static sensor_data_t current_sensors;

static float random_float(float min, float max) {
    uint32_t random_val = esp_random();
    float normalized = (float)random_val / (float)UINT32_MAX;
    return min + normalized * ( max - min );
}

static float gradual_change(float current_val, float min, float max) {
    float change = (random_float(0,1) - 0.5f) * 2.0f * MAX_CHANGE;
    float new_val = current_val + change;

    // make sure it's within bounds
    if (new_val < min) new_val = min;
    if (new_val > max) new_val = max;

    return new_val;
}

void sensor_manager_init(void) {
    // init with random values
    current_sensors.temperature = random_float(20, 30);
    current_sensors.humidity = random_float(40, 60);
    current_sensors.pm1 = random_float(10, 30);
    current_sensors.pm25 = random_float(15, 35);
    current_sensors.pm10 = random_float(20, 40);
    current_sensors.voc = random_float(5, 25);
    current_sensors.sound_level = random_float(30, 50);
    current_sensors.wifi_rssi = (int)random_float(-80, -40);
}

void sensor_manager_update(sensor_data_t* sensors) {
    // update all sensor readings with gradual changes
    current_sensors.temperature = gradual_change(current_sensors.temperature, 1, 100);
    current_sensors.humidity = gradual_change(current_sensors.humidity, 1, 100);
    current_sensors.pm1 = gradual_change(current_sensors.pm1, 1, 100);
    current_sensors.pm25 = gradual_change(current_sensors.pm25, 1, 100);
    current_sensors.pm10 = gradual_change(current_sensors.pm10, 1, 100);
    current_sensors.voc = gradual_change(current_sensors.voc, 1, 100);
    current_sensors.sound_level = gradual_change(current_sensors.sound_level, 1, 100);
    current_sensors.wifi_rssi = (int)gradual_change(current_sensors.wifi_rssi, -90, -30);

    if (sensors) {
        *sensors = current_sensors;
    }
}

void sensor_manager_get_readings(sensor_data_t* sensors) {
    if (sensors) {
        *sensors = current_sensors;
    }
}