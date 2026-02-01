#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include "esp_err.h"
#include <stdbool.h>

// SoftAP Config
#define SOFTAP_SSID "Esp32_setup"
#define SOFTAP_PASS "1234"
#define SOFTAP_CHANNEL 1
#define SOFTAP_MAX_CONN 4

#define WIFI_NAMESPACE "Wifi_storage"
#define WIFI_SSID_KEY "ssid"
#define WIFI_PASS_KEY "pass"

// init wifi and connect
esp_err_t wifi_manager_init(void);

// check if wifi is connected
bool wifi_is_connected(void);

// get wifi RSSI
int wifi_get_rssi(void);

// get Wifi Ssid 
const char* wifi_get_ssid(void);

#endif // WIFI_MANAGER_H