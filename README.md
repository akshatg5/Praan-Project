## Praan Assignment - Akshat Girdhar

ESP based IoT Air Purifier With Node.js Backend

## Tech Stack

1. Firmware : 
- ESP32 - Hardware considered as ESP32-S3
- ESP-IDF - Framework used for ESP32 Development
- MQTT Stack - For communication between device and backend
- WiFi Setup - For networking
- NVS Storage - For storing device config and credentials
- Sensor Data - Mocked for testing purposes, Actual integration will involve hardware setup, sensors may be connected using I2C or UART

2. Backend : 
- Node.js, Express.js - For API and Server
- MongoDB - For Database
- MQTT - For communication between device and backend
- Docker - For locally setting up MongoDB and MQTT Broker

3. Simulator : 
- Due to unaivalability of actual ESP32 Hardware, Using Simulator for testing purposes
- Node.js, Typescript, MQTT for communication with backend
- Used FS operations to mock NVS Storage
- Sensor Data - Randomly generated for testing purposes

4. Frontend : 
- Next.js, Typescript, Tailwind, Shadcn UI
- Used to create a Dashboard to manage devices, device state, control commands, schedule commands

## Architecture
![Architecture](https://www.akshatgirdhar.com/Architecture.png)

1. Separate services for Backend, Frontend, Simulator, Firmware
2. Clear typesafety using TypeScript, defined structs in firmware too for better type safety
3. MQTT QoS = 1 -> At least once delivery gurantee for MQTT messages.
4. Cron-Job based scheduling in Nodejs, for scheduled commands.
5. MongoDB for storing device state, telemetry, commands, schedules.
6. Docker for locally setting up MongoDB and MQTT Broker.

### Assumptions
1. All Telemetry data assumed to be in float format, same units assumed across Backend, Simulator, Firmware.
2. All systems currently assumed to be used locally on the machine, no cloud deployments.

### Trade-Offs 
1. Frontend uses polling for real-time updates. Better approach would be to use WebSockets.
2. No Authentication for Frontend, Backend.
3. Synchronous execution of commands - simple and provides quick feedback.
4. Using a Node.js Simulator for testing purposes, actual implementation will involve actual ESP32 Hardware.

### Future Improvements
1. Complete cloud deployment of Backend, Frontend.
2. User based authentication for Backend, Frontend - user -> device mapping.
3. Retry mechanisms for disconnections.
4. Actual implementation of Firmware with actual ESP32 Hardware and Sensors.
5. Asynchronous execution of commands - a queue for commands.

#### Setup
- Backend, Frontend, Simulator, Firmware folders each contain a README.md with setup instructions.
- 