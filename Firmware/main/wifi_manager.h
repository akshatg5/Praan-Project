#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include "esp_err.h"
#include <stdbool.h>

#define WIFI_SSID CONFIG_WIFI_SSID
#define WIFI_PASS CONFIG_WIFI_PASSWORD

// init wifi and connect
esp_err_t wifi_manager_init(void);

// check if wifi is connected
bool wifi_is_connected(void);

// get wifi RSSI
int wifi_get_rssi(void);

#endif // WIFI_MANAGER_H