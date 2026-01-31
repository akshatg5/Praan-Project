import { SensorData } from "./types";

const MAX_CHANGE = 5; // max point change per update

let currentSensors: SensorData = {
  temperature: randomInRange(20, 30),
  humidity: randomInRange(40, 60),
  pm1: randomInRange(10, 30),
  pm25: randomInRange(15, 35),
  pm10: randomInRange(20, 40),
  voc: randomInRange(5, 25),
  soundLevel: randomInRange(30, 50),
  wifiRssi: randomInRange(-80, -40),
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function gradualChange(currentValue: number, min: number, max: number): number {
  const change = (Math.random() - 0.5) * 2 * MAX_CHANGE;
  let newValue = currentValue + change;

  newValue = Math.max(min, Math.min(max, newValue));
  return Math.round(newValue * 100) / 100;
}

export const updateSensors = (): SensorData => {
  currentSensors.temperature = gradualChange(
    currentSensors.temperature,
    1,
    100,
  );
  currentSensors.humidity = gradualChange(currentSensors.humidity, 1, 100);
  currentSensors.pm1 = gradualChange(currentSensors.pm1, 1, 100);
  currentSensors.pm25 = gradualChange(currentSensors.pm25, 1, 100);
  currentSensors.pm10 = gradualChange(currentSensors.pm10, 1, 100);
  currentSensors.voc = gradualChange(currentSensors.voc, 1, 100);
  currentSensors.soundLevel = gradualChange(currentSensors.soundLevel, 1, 100);
  currentSensors.wifiRssi = gradualChange(currentSensors.wifiRssi, -90, -30);

  return { ...currentSensors };
};

export const getSensors = (): SensorData => {
  return { ...currentSensors };
};
