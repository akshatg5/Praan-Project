idf_component_register(
    SRCS 
        "main.c"
        "wifi_manager.c"
        "app_mqtt.c"
        "sensor_manager.c"
        "device_state.c"
        "command_handler.c"
    INCLUDE_DIRS "."
    REQUIRES
        nvs_flash
        esp_wifi
        esp_netif
        mqtt
        cjson
    )
