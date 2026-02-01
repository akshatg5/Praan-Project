import mqtt from "mqtt";
import { DEVICE_ID, MQTT_BROKER_URL, WIFI_SSID } from "./config";
import { handleCommand } from "./commandHandler";
import { Acknowledgement, Command } from "./types";
import { updateSensors } from "./sensors";
import { getState } from "./deviceState";

let client: mqtt.MqttClient;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const connectMqtt = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log("============================");
    console.log(`Connection to Mqtt Broker : ${MQTT_BROKER_URL}`);

    client = mqtt.connect(MQTT_BROKER_URL, {
      clientId: `${DEVICE_ID}_${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    client.on("connect", () => {
      console.log("========================");
      console.log("Device connected over MQTT");

      reconnectAttempts = 0;

      // subscribe to command topic
      const commandTopic = `devices/${DEVICE_ID}/commands`;
      client.subscribe(commandTopic, (err) => {
        if (err) {
          console.error("Subscription failed", err);
        } else {
          console.log(`Device Subscribed to topic : ${commandTopic}`);
        }
      });

      resolve();
    });

    client.on("message", (topic, message) => {
      handleIncomingMessage(topic, message.toString());
    });

    client.on("error", (err) => {
      console.error("MQTT Error : ", err);
    });

    client.on("offline", () => {
      console.log("MQTT Client is offline");
    });

    client.on("reconnect", () => {
      reconnectAttempts++;
      console.log(
        `Reconnecting - Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`,
      );

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error("Maximum reconnection attempts reached");
        client.end();
        reject(new Error("Failed to connect with MQTT Broker"));
      }
    });

    client.on("close", () => {
      console.log("!!!!!!!!!!");
      console.log("MQTT Connection is closed");
    });
  });
};

const handleIncomingMessage = (topic: string, payload: string): void => {
  try {
    console.log(`----------------------------`);
    console.log(`Message Received on topic : ${topic}`);

    const command: Command = JSON.parse(payload);
    // handle command
    const ack = handleCommand(command);

    // send ack
    sendAck(ack);
  } catch (error: any) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log(`Message Received on topic : ${topic}`);
    console.error(`Message Received : ${payload}`);
    console.error("Error handling the message", error.message);
  }
};

const sendAck = (ack: Acknowledgement): void => {
  const ackTopic = `devices/${DEVICE_ID}/ack`;

  client.publish(ackTopic, JSON.stringify(ack), { qos: 1 }, (err) => {
    if (err) {
      console.error("Failed to send ack", err.message);
    } else {
      console.log(`Ack Sent : ${ack.status}`);
    }
  });
};

export const publishTelemetry = (): void => {
  const telemetryTopic = `devices/${DEVICE_ID}/telemetry`;

  // update sensors with changes
  const sensors = updateSensors();
  const state = getState();

  const telemetryData = {
    deviceId: DEVICE_ID,
    ...sensors,
    wifiSsid: WIFI_SSID,
    timestamp: new Date().toISOString(),
  };

  client.publish(
    telemetryTopic,
    JSON.stringify(telemetryData),
    { qos: 1 },
    (err) => {
      if (err) {
        console.error("Failed to publish telemetry : ", err.message);
      } else {
        console.log("================");
        console.log(`Telemetry published`);
      }
    },
  );
};

export const disconnectMqtt = (): void => {
  if (client) {
    client.end();
    console.log("!!!!! DISCONNECTED MQTT !!!!!");
  }
};
