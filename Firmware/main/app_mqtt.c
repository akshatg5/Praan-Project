#include "mqtt_client.h"
#include "app_mqtt.h"
#include "device_state.h"
#include "sensor_manager.h"
#include "command_handler.h"
#include "wifi_manager.h"
#include "esp_log.h"
#include "cJSON.h"
#include <string.h>

static const char *TAG = "MQTT_CLIENT";
static esp_mqtt_client_handle_t mqtt_client = NULL;
static bool mqtt_connected = false;

// topic definitions
#define TELEMETRY_TOPIC "devices/" DEVICE_ID "/telemetry"
#define COMMAND_TOPIC   "devices/" DEVICE_ID "/commands"
#define ACK_TOPIC       "devices/" DEVICE_ID "/ack"

static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = event_data;

    switch((esp_mqtt_event_id_t)event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT CONNECTED");
            mqtt_connected = true;

            // subscribe to command topic
            int msg_id = esp_mqtt_client_subscribe(mqtt_client,COMMAND_TOPIC,1);
            ESP_LOGI(TAG,"Subscribed to %s, msg_id= %d", COMMAND_TOPIC, msg_id);
            break;

        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGI(TAG,"MQTT DISCONNECTED");
            mqtt_connected = false;
            break;

        case MQTT_EVENT_SUBSCRIBED:
            ESP_LOGI(TAG,"MQTT SUBSCRIBED, msg_id=%d",event->msg_id);
            break;
        
        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG,"MQTT_EVENT_DATA");
            ESP_LOGI(TAG,"TOPIC=%.*s",event->topic_len, event->topic);
            ESP_LOGI(TAG,"DATA=%.*s", event->data_len,event->data);

            // hndle incoming commands
            char data_buf[512];
            int len = event->data_len < sizeof(data_buf) - 1 ? event->data_len : sizeof(data_buf) - 1;
            memcpy(data_buf, event->data, len);
            data_buf[len] = '\0';

            // parse and execute command
            command_t cmd;
            esp_err_t ret = command_handler_parse(data_buf,&cmd);

            char ack_json[256];
            if (ret == ESP_OK) {
                ret = command_handler_execute(&cmd);
                if (ret == ESP_OK) {
                    command_handler_build_ack(cmd.command_id, true, NULL, ack_json,sizeof(ack_json));
                    ESP_LOGI(TAG,"Command executed successfully");
                } else {
                    command_handler_build_ack(cmd.command_id,false,"Execution Failed",ack_json,sizeof(ack_json));
                }
            } else {
                command_handler_build_ack("unknown",false,"Parse error",ack_json,sizeof(ack_json));
                ESP_LOGE(TAG,"Command parsing Failed");
            }

            // send ack
            mqtt_publish_ack(ack_json);
            break;
        
        case MQTT_EVENT_ERROR:
            ESP_LOGE(TAG,"MQTT ERROR");
            break;
        
        default:
            break;
    }
}

esp_err_t mqtt_client_init(void) {
    esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = MQTT_BROKER_URL
    };

    mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    if (mqtt_client == NULL) {
        ESP_LOGE(TAG,"Failed to initialize MQTT client");
        return ESP_FAIL;
    }

    esp_mqtt_client_register_event(mqtt_client,ESP_EVENT_ANY_ID,mqtt_event_handler, NULL);
    esp_err_t ret = esp_mqtt_client_start(mqtt_client);

    if (ret == ESP_OK) {
        ESP_LOGI(TAG,"MQTT Event started");
    } else {
        ESP_LOGE(TAG,"Failed to start MQTT client");
    }

    return ret;
}

esp_err_t mqtt_publish_telemetry(void) {
    if (!mqtt_connected) {
        ESP_LOGW(TAG,"MQTT Not connected, Skipping Telemetry");
        return ESP_FAIL;
    }

    device_state_t *state = device_state_get();

    cJSON *root = cJSON_CreateObject();
    cJSON_AddStringToObject(root, "deviceId", DEVICE_ID);
    cJSON_AddNumberToObject(root, "temperature", state->sensors.temperature);
    cJSON_AddNumberToObject(root, "humidity", state->sensors.humidity);
    cJSON_AddNumberToObject(root, "pm1", state->sensors.pm1);
    cJSON_AddNumberToObject(root, "pm25", state->sensors.pm25);
    cJSON_AddNumberToObject(root, "pm10", state->sensors.pm10);
    cJSON_AddNumberToObject(root, "voc", state->sensors.voc);
    cJSON_AddNumberToObject(root, "soundLevel", state->sensors.sound_level);
    cJSON_AddNumberToObject(root, "wifiRssi", wifi_get_rssi());

    char *json_str = cJSON_PrintUnformatted(root);

    int msg_id = esp_mqtt_client_publish(mqtt_client,TELEMETRY_TOPIC,json_str,0,1,0);
    ESP_LOGI(TAG,"Telemetry published, msg_id= %d",msg_id);
    ESP_LOGI(TAG,"Temp : %.2f , Humidity : %.2f, PM2.5: %.2f",state->sensors.temperature, state->sensors.humidity,state->sensors.pm25);

    free(json_str);
    cJSON_Delete(root);

    return msg_id >=0 ? ESP_OK : ESP_FAIL;
}

esp_err_t mqtt_publish_ack(const char* ack_json) {
    if (!mqtt_connected) {
        ESP_LOGW(TAG,"MQTT not connected, cannot send ACK");
        return ESP_FAIL;
    }

    int msg_id = esp_mqtt_client_publish(mqtt_client,ACK_TOPIC,ack_json,0,1,0);
    ESP_LOGI(TAG,"ACK Published, msg_id= %d",msg_id);

    return msg_id >= 0 ? ESP_OK : ESP_FAIL;
}

bool mqtt_is_connected(void) {
    return mqtt_connected;
}