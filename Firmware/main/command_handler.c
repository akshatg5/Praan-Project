#include "command_handler.h"
#include "device_state.h"
#include "cJSON.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "CMD_HANDLER";

esp_err_t command_handler_parse(const char* json_str, command_t* cmd) {
    if (!json_str || !cmd) {
        return ESP_ERR_INVALID_ARG;
    }

    cJSON *root = cJSON_Parse(json_str);
    if (!root) {
        ESP_LOGE(TAG, "Failed to parse JSON");
        return ESP_FAIL;
    }

    // extract commandID
    cJSON *cmd_id = cJSON_GetObjectItem(root, "commandId");
    if (!cmd_id || !cJSON_IsString(cmd_id)) {
        ESP_LOGE(TAG,"Missing CommandId");
        cJSON_Delete(root);
        return ESP_FAIL;
    }
    strncpy(cmd->command_id, cmd_id->valuestring, sizeof(cmd->command_id) - 1);

    // extract commandType
    cJSON *cmd_type = cJSON_GetObjectItem(root,"commandType");
    if (!cmd_type || !cJSON_IsString(cmd_type)) {
        ESP_LOGE(TAG,"Missing commandType");
        cJSON_Delete(root);
        return ESP_FAIL;
    }

    // parse command type
    if (strcmp(cmd_type->valuestring, "SET_FAN_SPEED") == 0) {
        cmd->command_type = CMD_SET_FAN_SPEED;

        // extract fan speed from payload
        cJSON *payload = cJSON_GetObjectItem(root,"payload");
        if (payload) {
            cJSON *fan_speed = cJSON_GetObjectItem(payload,"fanSpeed");
            if (fan_speed && cJSON_IsNumber(fan_speed)) {
                cmd->fan_speed = (uint8_t)fan_speed->valueint;
            } else {
                ESP_LOGE(TAG,"Invalid FanSpeed");
                cJSON_Delete(root);
                return ESP_FAIL;
            }
        }
    } else if (strcmp(cmd_type->valuestring,"POWER_ON") == 0) {
        cmd->command_type = CMD_POWER_ON;
    } else if (strcmp(cmd_type->valuestring,"POWER_OFF") == 0) {
        cmd->command_type = CMD_POWER_OFF;
    } else {
        esp_loge(TAG,"Unknown Command type : %s",cmd_type->valuestring);
        cmd->command_type = CMD_UNKNOWN;
        cJSON_Delete(root);
        return ESP_FAIL;
    }

    cJSON_Delete(root);
    return ESP_OK;
}

esp_err_t command_handler_execute(command_t* cmd) {
    if (!cmd) {
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG,"Executing Command: %d", cmd->command_type);

    switch ( cmd->command_type ) {
        case CMD_SET_FAN_SPEED:
            if (cmd->fan_speed > 100) {
                    ESP_LOGE(TAG,"Invalid fan Speed : %d", cmd->fan_speed);
                    return ESP_ERR_INVALID_ARG;
            }
            ESP_LOGI(TAG,"Setting fan speed to : %d", cmd->fan_speed);
            return device_state_set_fan_speed(cmd->fan_speed);
        
        case CMD_POWER_ON:
            ESP_LOGI(TAG,"Power ON");
            return device_state_set_power(true);

        case CMD_POWER_OFF:
            ESP_LOGI(TAG,"Power OFF");
            return device_state_set_power(false);

        default :
            ESP_LOGE(TAG,"Unknown Command");
            return ESP_FAIL;
    }
}

void command_handler_build_ack(const char* command_id, bool success, const char* error_msg, char* ack_json,size_t max_len) {
    cJSON *root = cJSON_CreateObject();

    cJSON_AddStringToObject(root,"commandId", command_id);
    cJSON_AddStringToObject(root,"status", success ? "success" : "failed");

    if (!success && error_msg) {
        cJSON_AddStringToObject(root,"message",error_msg);
    }

    char *json_str = cJSON_PrintUnformatter(root);
    if (json_str) {
        strncpy(ack_json, json_str, max_len - 1);
        ack_json[max_len - 1] = '\0';
        free(json_str);
    }

    cJSON_Delete(root);
}