#ifndef CONFIG_H
#define CONFIG_H

#include <stdint.h>
#include <stdbool.h>

#define DEVICE_ID "device_esp32_001"

// sensors data struct
typedef struct {
    float temperature;
    float humidity;
    float pm1;
    float pm25;
    float pm10;
    float voc;
    float sound_level;
    int wifi_rssi;
} sensor_data_t;

// Device data struct
typedef struct {
    char device_id[32];
    bool power_state; // 0 -> OFF, 1 -> ON
    uint8_t fan_speed; // 0 - 100
    sensor_data_t sensors;
} device_state_t;

// Command types
typedef enum {
    CMD_SET_FAN_SPEED,
    CMD_POWER_ON,
    CMD_POWER_OFF,
    CMD_UNKNOWN
} command_type_t;

// command struct
typedef struct {
    char command_id[64];
    command_type_t cmd_type;
    uint8_t fan_speed;
} command_t;

#endif CONFIG_H