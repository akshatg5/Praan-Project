#ifndef COMMAND_HANDLER_H
#define COMMAND_HANDLER_H

#include "config.h"
#include "esp_err.h"
#include <stdbool.h>

// parse incoming command from JSON string
esp_err_t command_handler_parse(const char* json_str , command_t* cmd);

// execute parsed commnad
esp_err_t command_handler_execute(command_t* cmd);

// basic ack in json
void command_handler_build_ack(const char* command_id, bool success, const char* error_msg, char* ack_json,size_t max_len);

#endif // COMMAND_HANDLER_H
