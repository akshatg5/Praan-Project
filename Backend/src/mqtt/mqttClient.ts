import mqtt from "mqtt";
import Telemetry from "../models/Telemetry";
import DeviceState from "../models/DeviceState";
import Command from "../models/Command";

let client: mqtt.MqttClient;

// initialise the mqtt connection
export const initMqtt = (): void => {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  if (!brokerUrl) {
    console.error("!!!!! MQTT Connection error occured !!!!!");
  }

  client = mqtt.connect(brokerUrl);
  client.on("connect", () => {
    console.log("================================");
    console.log("Connected to MQTT Broker");
    console.log("================================");

    // subscribe to all device topics
    client.subscribe("devices/+/telemetry", (err) => {
      if (err) {
        console.error("Subscription Error", err);
      } else {
        console.log("Subscribed to Telemetry Topics");
      }
    });

    // subscribe to acks
    client.subscribe("devices/+/ack", (err) => {
      if (err) {
        console.error("Acks subscription error", err);
      } else {
        console.log("Subscribed to Acked Topics");
      }
    });

    // handle incoming messages over mqtt
    client.on("message", (topic, message) => {
      console.log("MQTT Message Received:");
      console.log("Topic:", topic);
      console.log("Message:", message.toString());

      handleIncomingMqttMessage(topic, message.toString());
    });

    client.on("error", (err) => {
      console.log("!!!!!!!!!!!!!!!!!!!!!!");
      console.log("MQTT Error:", err);
    });
  });
};

const handleIncomingMqttMessage = async (topic: string, payload: string) => {
  try {
    const data = JSON.parse(payload);
    console.log("Parsed Message:", data);

    // (devices/{deviceId}/telemetry OR devices/{deviceId}/ack) -> [devices,deviceId,ack][1] => deviceId
    const deviceId = topic.split("/")[1];
    if (topic.endsWith("/telemetry")) {
      await handleTelemetryMessage(deviceId, data);
    } else if (topic.endsWith("/ack")) {
      await handleAckMessage(deviceId, data);
    }
  } catch (error: any) {
    console.error("Error handling incoming MQTT message");
  }
};

const handleTelemetryMessage = async (deviceId: string, data: any) => {
  try {
    // store telemetry data into mongodb
    const telemetry = new Telemetry({
      deviceId,
      temperature: data.temperature,
      humidity: data.humidity,
      pm1: data.pm1,
      pm25: data.pm25,
      pm10: data.pm10,
      voc: data.voc,
      soundLevel: data.soundLevel,
      wifiRssi: data.wifiRssi,
      fanSpeed: data.fanSpeed,
      powerState: data.powerState,
      timestamp: new Date(),
    });

    await telemetry.save();
    console.log(`Telemetry data saved for device : ${deviceId}`);

    // update device state ( last seen and online status )
    await DeviceState.findOneAndUpdate(
      { deviceId },
      {
        isOnline: true,
        lastSeen: new Date(),
        wifiSsid: data.wifiSsid,
        fanSpeed: data.fanSpeed,
        powerState: data.powerState,
      },
      {
        upsert: true,
        new: true,
      },
    );

    console.log(`Device State updated for : ${deviceId}`);
  } catch (error: any) {
    console.error("Error Saving Telemetry Data :", error.message);
  }
};

const handleAckMessage = async (deviceId: string, data: any) => {
  try {
    const { commandId, status, message } = data;

    const command = await Command.findByIdAndUpdate(
      commandId,
      {
        status: status === "success" ? "ACKED" : "FAILED",
        ackedAt: new Date(),
        error: status === "success" ? undefined : message,
      },
      {
        new: true,
      },
    );

    if (command) {
      console.log(`Command acked : ${commandId}, Status : ${status}`);

      // update device state after command is successful
      if (status === "success" && command.commandType === "SET_FAN_SPEED") {
        await DeviceState.findOneAndUpdate(
          { deviceId },
          {
            fanSpeed: command.payload.fanSpeed,
            powerState: "ON",
          },
        );
      } else if (status === "success" && command.commandType === "POWER_ON") {
        await DeviceState.findOneAndUpdate({ deviceId }, { powerState: "ON" });
      } else if (status === "success" && command.commandType === "POWER_OFF") {
        await DeviceState.findOneAndUpdate({ deviceId }, { powerState: "OFF" });
      }
    }
  } catch (error: any) {
    console.error("Error handling acks", error.message);
  }
};

export const publishCommand = async (
  deviceId: string,
  commandType: string,
  payload: any,
  source: string,
  sourceId?: string,
): Promise<string | null> => {
  try {
    // create command in db
    const command = new Command({
      deviceId,
      commandType,
      payload,
      source,
      sourceId,
      status: "PENDING",
    });

    await command.save();

    const topic = `devices/${deviceId}/commands`;
    const message = {
      commandId: command._id.toString(),
      commandType,
      payload,
    };

    // publish message over mqtt
    client.publish(topic, JSON.stringify(message), { qos: 1 }, async (err) => {
      if (err) {
        console.error("Publish Failed", err);
        await Command.findByIdAndUpdate(command._id, {
          status: "FAILED",
          error: err.message,
        });
      } else {
        console.log("Command sent to:", deviceId);
        await Command.findByIdAndUpdate(command._id, {
          status: "SENT",
          sentAt: new Date(),
        });
      }
    });

    return command._id.toString();
  } catch (error: any) {
    console.error("Error publishing command : ", error.message);
    return null;
  }
};

export const getMqttClient = () => client;
