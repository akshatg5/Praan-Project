import { Request, Response } from "express";
import DeviceState from "../models/DeviceState";
import { publishCommand } from "../mqtt/mqttClient";

const activePreCleanTimers = new Map<string, NodeJS.Timeout>();

export const triggerPreClean = async (req: Request, res: Response) => {
  try {
    const { deviceId, fanMode, duration } = req.body;

    if (!deviceId || !fanMode || !duration) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (fanMode < 0 || fanMode > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid fan speed entered",
      });
    }

    if (duration < 0) {
      return res.status(400).json({
        success: false,
        message: "Duration Invalid",
      });
    }

    const deviceState = await DeviceState.findOne({ deviceId });
    const oldDeviceState = {
      powerState: deviceState?.powerState || "OFF", // by default, OFF
      fanSpeed: deviceState?.fanSpeed || 0, // by default , 0
    };

    // cancel any already existing timers for this device
    if (activePreCleanTimers.has(deviceId)) {
      clearTimeout(activePreCleanTimers.get(deviceId));
      activePreCleanTimers.delete(deviceId);
    }

    // send command to trigger pre clean
    const commandId = await publishCommand(
      deviceId,
      "SET_FAN_SPEED",
      { fanSpeed: fanMode },
      "PRE_CLEAN",
    );

    if (!commandId) {
      return res.status(500).json({
        success: false,
        message: "Failed to send command to device",
      });
    }

    // schedule restoration of previous state after duration over
    const timer = setTimeout(async () => {
      console.log(`Restoring previous state for device : ${deviceId}`);

      if (oldDeviceState.powerState === "OFF") {
        await publishCommand(deviceId, "POWER_OFF", {}, "PRE_CLEAN");
      } else {
        await publishCommand(
          deviceId,
          "SET_FAN_SPEED",
          { fanSpeed: oldDeviceState.fanSpeed },
          "PRE_CLEAN",
        );
      }

      activePreCleanTimers.delete(deviceId);
    }, duration * 1000);

    activePreCleanTimers.set(deviceId, timer);

    res.status(200).json({
      success: true,
      message: "Pre-Clean mode activated",
      data: {
        deviceId,
        fanMode,
        duration,
        oldDeviceState,
        willRestoreAt: new Date(Date.now() + duration * 1000),
      },
    });
  } catch (error: any) {
    console.error("Error triggering pre-clean:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to trigger pre-clean mode",
      error: error.message,
    });
  }
};
