# Simulator Setup

## Prerequisites
- Node.js (v16+)
- MQTT Broker running on `mqtt://localhost:1883`

## Running Locally

1. **Install dependencies**
```bash
npm install
```

2. **Start simulator**
```bash
npm start
```

The simulator will:
- Connect to MQTT broker at `mqtt://localhost:1883`
- Publish telemetry data periodically
- Listen for control commands on MQTT topics
- Maintain device state in `device_state.json`

## Device State

Device state is persisted in `device_state.json` and includes:
- Power state (ON/OFF)
- Fan speed (LOW/MEDIUM/HIGH)
