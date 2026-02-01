#include "wifi_manager.h"
#include "config.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "nvs_flash.h"
#include "esp_http_server.h"
#include <string.h>

static const char *TAG = "WIFI_MANAGER";

static EventGroupHandle_t s_wifi_event_group;
static int s_retry_num = 0;
static bool s_is_connected = false;
static bool s_is_provisioned = false;
static httpd_handle_t s_server = NULL;

static char saved_ssid[32] = {0};
static char saved_password[64] = {0};

#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT BIT1

// HTML page for WiFi credentials input
static const char *html_page = 
    "<!DOCTYPE html>"
    "<html>"
    "<head><title>ESP32 WiFi Setup</title></head>"
    "<body>"
    "<h1>ESP32 WiFi Configuration</h1>"
    "<form action='/submit' method='POST'>"
    "SSID: <input type='text' name='ssid' required><br><br>"
    "Password: <input type='password' name='password' required><br><br>"
    "<input type='submit' value='Connect'>"
    "</form>"
    "</body>"
    "</html>";

// save wifi creds to NVS
static esp_err_t save_wifi_creds(const char *ssid, const char *pass) {
    nvs_handle_t handle;
    esp_err_t ret;

    ret = nvs_open(WIFI_NAMESPACE,NVS_READWRITE,&handle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to Open NVS");
        return ret;
    }

    ret = nvs_set_str(handle,WIFI_SSID_KEY,ssid);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG,"Failed to save ssid key");
        nvs_close(handle);
        return ret;
    }

    ret = nvs_set_str(handle,WIFI_PASS_KEY,pass);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG,"Failed to save pass key");
        nvs_close(handle);
        return ret;
    }

    ret = nvs_commit(handle);
    nvs_close(handle);
    
    ESP_LOGI(TAG,"Wifi Creds saved to NVS");
    return ret;
}

static esp_err_t load_wifi_creds(char *ssid,size_t ssid_len,char *pass, size_t pass_len) {
    nvs_handle_t handle;
    esp_err_t ret;

    ret = nvs_open(WIFI_NAMESPACE, NVS_READONLY, &handle);
    if (ret != ESP_OK) {
        ESP_LOGI(TAG, "No saved WiFi credentials found");
        return ret;
    }

    size_t required_size = ssid_len;
    ret = nvs_get_str(handle,WIFI_SSID_KEY,ssid,&required_size);
    if (ret != ESP_OK) {
        nvs_close(handle);
        return ret;
    }

    required_size = pass_len;
    ret = nvs_get_str(handle,WIFI_PASS_KEY,pass,&required_size);
    if (ret != ESP_OK) {
        nvs_close(handle);
        return ret;
    }

    if (ret == ESP_OK) {
        ESP_LOGI(TAG,"Wifi Creds loaded from NVS");
        s_is_provisioned = true;
    }

    nvs_close(handle);
    return ret;
}

// http get handler - server config page
static esp_err_t root_get_handler(httpd_req_t *req) {
    httpd_resp_send(req,html_page,strlen(html_page));
    return ESP_OK;
}

// http post handler - receives WiFi Creds
static esp_err_t submit_post_handler(httpd_req_t *req) {
    char buf[200];
    int ret, remaining = req->content_len;

    if (remaining >= sizeof(buf)) {
        httpd_resp_send_500(req);
        return ESP_FAIL;
    }

    ret = httpd_req_recv(req,buf,remaining);
    if (ret <= 0) {
        httpd_resp_send_500(req);
        return ESP_FAIL;
    }
    buf[ret] = '\0';

    // parse ssid and password from POST data
    char ssid[32] = {0};
    char password[64] = {0};

    // Simple parsing of form data: "ssid=XXX&password=YYY"
    char *ssid_start = strstr(buf, "ssid=");
    char *pass_start = strstr(buf, "password=");

    if (ssid_start && pass_start) {
        ssid_start += 5; // skip "ssid="
        char *ssid_end = strchr(ssid_start,'&');
        if (ssid_end) {
            int len = ssid_end - ssid_start;
            if (len < sizeof(ssid)) {
                strncpy(ssid,ssid_start,len);
                ssid[len] = '\0';
            }
        }

        pass_start += 9; // skip "password="
        char *pass_end = strchr(pass_start,'&');
        int len = pass_end ? (pass_end - pass_start) : strlen(pass_start);
        if (len < sizeof(password)) {
            strncpy(password,pass_start,len);
            password[len] = '\0';
        }
    }

    // save creds
    save_wifi_creds(ssid,password);
    strncpy(saved_ssid,ssid,sizeof(saved_ssid) - 1);
    strncpy(saved_password,password,sizeof(saved_password) - 1);
    s_is_provisioned = true;

    // send success response
    const char *resp = "<html><body><h1>Credentials Saved!</h1><p>Restarting...</p></body></html>";
    httpd_resp_send(req, resp, strlen(resp));

    // Stop SoftAP and restart in STA mode
    vTaskDelay(pdMS_TO_TICKS(2000));
    esp_restart();

    return ESP_OK;
}

// Start HTTP server for provisioning
static httpd_handle_t start_webserver(void) {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    httpd_handle_t server = NULL;

    if (httpd_start(&server, &config) == ESP_OK) {
        httpd_uri_t root_uri = {
            .uri = "/",
            .method = HTTP_GET,
            .handler = root_get_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server, &root_uri);

        httpd_uri_t submit_uri = {
            .uri = "/submit",
            .method = HTTP_POST,
            .handler = submit_post_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server, &submit_uri);

        ESP_LOGI(TAG, "HTTP server started");
    }
    return server;
}

// start softAP mode for provisioning
static void start_softap(void) {
    ESP_LOGI(TAG,"Starting SoftAP mode for provisioning");

    esp_netif_create_default_wifi_ap(); // softap mode

    wifi_config_t ap_config = {
        .ap = {
            .ssid = SOFTAP_SSID,
            .ssid_len = strlen(SOFTAP_SSID),
            .password = SOFTAP_PASS,
            .max_connection = SOFTAP_MAX_CONN,
            .authmode = WIFI_AUTH_WPA2_PSK,
            .channel = SOFTAP_CHANNEL
        }
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP,&ap_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "SoftAP started: SSID=%s, Password=%s", SOFTAP_SSID, SOFTAP_PASS);
    s_server = start_webserver();
}
 
static void wifi_event_handler(void *arg, esp_event_base_t event_base,int32_t event_id,void* event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        s_is_connected = false;
        if ( s_retry_num < WIFI_MAX_RETRY ) {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGI(TAG,"Rretry to connect to AP (attempt %d / %d)", s_retry_num, WIFI_MAX_RETRY);
        } else {
            xEventGroupSetBits(s_wifi_event_group,WIFI_FAIL_BIT);
        }
        ESP_LOGI(TAG,"Connection to the AP Failed");
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG,"Got IP:" IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_num = 0;
        s_is_connected = true;
        xEventGroupSetBits(s_wifi_event_group,WIFI_CONNECTED_BIT);
    }
}

esp_err_t wifi_manager_init(void) {
    s_wifi_event_group = xEventGroupCreate();

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;

    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,ESP_EVENT_ANY_ID,&wifi_event_handler,NULL,&instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,IP_EVENT_STA_GOT_IP,&wifi_event_handler,NULL,&instance_got_ip));

    // load save creds
    esp_err_t ret = load_wifi_creds(saved_ssid,sizeof(saved_ssid),saved_password,sizeof(saved_password));
    if (ret != ESP_OK || !s_is_provisioned) {
        ESP_LOGI(TAG, "No WiFi credentials found :::: Starting provisioning Mode");
        start_softap();
        return ESP_OK;
    }

    // Credentials found - connect to WiFi
    ESP_LOGI(TAG, "Found saved credentials. Connecting to: %s", saved_ssid);
    
    esp_netif_create_default_wifi_sta(); // Wifi in Sta Mode

    wifi_config_t wifi_config = {0};
    strncpy((char *)wifi_config.sta.ssid,saved_ssid,sizeof(wifi_config.sta.ssid));
    strncpy((char *)wifi_config.sta.password,saved_password,sizeof(wifi_config.sta.password));
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
    WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
    pdFALSE,
    pdFALSE,
    pdMS_TO_TICKS(10000)
    );

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "Connected to AP: %s", saved_ssid);
        return ESP_OK;
    } else {
        ESP_LOGE(TAG, "Failed to connect to: %s", saved_ssid);
        ESP_LOGI(TAG, "Starting provisioning mode...");
        start_softap();
        return ESP_FAIL;
    }

    return ESP_FAIL;
}

bool wifi_is_connected(void) {
    return s_is_connected;
}

int wifi_get_rssi(void) {
    wifi_ap_record_t ap_info;
    esp_err_t ret = esp_wifi_sta_get_ap_info(&ap_info);
    if (ret == ESP_OK) {
        return ap_info.rssi;
    }
    return -100; // default
}

const char* wifi_get_ssid(void) {
    return s_is_provisioned ? saved_ssid : "Not Connected";
}