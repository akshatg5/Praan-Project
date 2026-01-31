export interface SensorData {
  temperature: number;
  humidity: number;
  pm1: number;
  pm25: number;
  pm10: number;
  voc: number;
  soundLevel: number;
  wifiRssi: number;
}

export interface DeviceState {
  deviceId: string;
  powerState: "ON" | "OFF";
  fanSpeed: number;
  sensors: SensorData;
  lastUpdated: number;
}

export interface Command {
  commandId: string;
  commandType: "SET_FAN_SPEED" | "POWER_ON" | "POWER_OFF";
  payload: {
    fanSpeed?: number;
    [key: string]: any;
  };
}

export interface Acknowledgement {
  commandId: string;
  status: "success" | "failed";
  message?: string;
}
