import { TELEMETRY_INTERVAL } from "./config";
import { getState, loadState } from "./deviceState";
import { connectMqtt, publishTelemetry } from "./mqttClient";

let telemetryInterval: NodeJS.Timeout;

const startSimulator = async (): Promise<void> => {
  console.log("=========================");
  console.log("    Simulator    ");

  try {
    loadState();
    let state = getState();

    console.log("=======================");
    console.log("Device State on Bootup");
    console.log(`Power State : ${state.powerState}`);
    console.log(`Fan Speed : ${state.fanSpeed}`);

    // connect to mqtt broker
    await connectMqtt();
    publishTelemetry(); // initial telemetry data on bootup

    setInterval(() => {
      // Get fresh state on each interval
      const currentState = getState();
      console.log("=======================");
      console.log("Device State");
      console.log(`Power State : ${currentState.powerState}`);
      console.log(`Fan Speed : ${currentState.fanSpeed}`);
      console.log("=======================");
    }, 5000);

    // start periodic telemetry publish
    telemetryInterval = setInterval(() => {
      publishTelemetry();
    }, TELEMETRY_INTERVAL);
  } catch (err: any) {
    console.error("Failed to start simulator", err.message);
    process.exit(1);
  }
};

startSimulator();
