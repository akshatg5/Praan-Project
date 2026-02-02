# Firmware Setup

## Prerequisites
- ESP-IDF framework installed and configured
- ESP32 development board
- MQTT Broker running and accessible

## Running Locally

1. **Configure WiFi and MQTT**
   
   Edit `main/app_mqtt.c` to set your WiFi credentials and MQTT broker details

2. **Build the project**
```bash
idf.py build
```

3. **Flash to ESP32**
```bash
idf.py flash
```
4. **Monitor output**
```bash
idf.py monitor
```