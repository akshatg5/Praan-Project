#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include "esp_err.h"
#include "config.h"

#define MQTT_BROKER_URL CONFIG_MQTT_BROKER_URL

// init mqtt client and connect
esp_err_t mqtt_client_init(void);

// publish telemetry data
esp_err_t mqtt_publish_telemetry(void);

// publish ack
esp_err_t mqtt_publish_ack(const char* ack_json);

// check if mqtt is connected
bool mqtt_is_connected(void);

#endif // MQTT_CLIENT_H