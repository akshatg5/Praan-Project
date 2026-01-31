import fs from "fs";
import path from "path";
import { DeviceState, SensorData } from "./types";
import { DEVICE_ID } from "./config";
import { getSensors } from "./sensors";

const STATE_FILE = path.join(__dirname, "../device_state.json");

let deviceState: DeviceState = {
  deviceId: DEVICE_ID,
  powerState: "OFF",
  fanSpeed: 0,
  sensors: getSensors(),
  lastUpdated: Date.now(),
};

// mock load state from NVS
export const loadState = (): void => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, "utf-8");
      const savedState = JSON.parse(data);

      deviceState = {
        ...savedState,
        sensors: getSensors(),
        lastUpdated: Date.now(),
      };

      console.log("============================");
      console.log("Device state loaded from storage");
      console.log(`Power State : ${deviceState.powerState}`);
      console.log(`Fan Speed : ${deviceState.fanSpeed}`);
      console.log(deviceState.sensors);
      console.log("============================");
    } else {
      console.log("!!!!! No saved data available, using default data values");
    }
  } catch (error: any) {
    console.error("Error", error.message);
  }
};

// save state to storage
export const saveFile = (): void => {
  try {
    deviceState.lastUpdated = Date.now();
    fs.writeFileSync(STATE_FILE, JSON.stringify(deviceState, null, 2));
  } catch (error: any) {
    console.error("Error saving the state to storage", error.mesage);
  }
};

export const getState = (): DeviceState => {
  return { ...deviceState };
};

export const setPowerState = (state: "ON" | "OFF"): void => {
  deviceState.powerState = state;
  if (state === "OFF") {
    deviceState.fanSpeed = 0;
  }
  saveFile();
};

export const setFanSpeed = (speed: number): void => {
  if (speed < 0 || speed > 100) {
    throw new Error("Fan speed must be between 0 and 100");
  }
  deviceState.fanSpeed = speed;
  deviceState.powerState = "ON";
  saveFile();
};

export const updateSensorsData = (sensors: SensorData) => {
  deviceState.sensors = sensors;
};
