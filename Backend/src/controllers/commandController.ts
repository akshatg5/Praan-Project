import { Request, Response } from "express";
import { publishCommand } from "../mqtt/mqttClient";

export const sendDeviceCommand = async (req: Request, res: Response) => {
  try {
    const deviceId = Array.isArray(req.params.deviceId) 
      ? req.params.deviceId[0] 
      : req.params.deviceId;
    const { commandType, payload } = req.body;

    // Validate required fields
    if (!commandType) {
      return res.status(400).json({
        success: false,
        message: "commandType is required",
      });
    }

    // Validate command type
    const validCommands = ["POWER_ON", "POWER_OFF", "SET_FAN_SPEED"];
    if (!validCommands.includes(commandType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid command type. Must be one of: ${validCommands.join(", ")}`,
      });
    }

    // Validate payload for SET_FAN_SPEED
    if (commandType === "SET_FAN_SPEED") {
      if (!payload || typeof payload.fanSpeed !== "number") {
        return res.status(400).json({
          success: false,
          message: "fanSpeed is required in payload for SET_FAN_SPEED command",
        });
      }

      if (payload.fanSpeed < 0 || payload.fanSpeed > 100) {
        return res.status(400).json({
          success: false,
          message: "fanSpeed must be between 0 and 100",
        });
      }
    }

    // Publish command via MQTT
    const commandId = await publishCommand(
      deviceId,
      commandType,
      payload || {},
      "MANUAL",
    );

    if (!commandId) {
      return res.status(500).json({
        success: false,
        message: "Failed to send command to device",
      });
    }

    res.status(200).json({
      success: true,
      message: "Command sent successfully",
      data: {
        commandId,
        deviceId,
        commandType,
        payload,
      },
    });
  } catch (error: any) {
    console.error("Error sending device command:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send command",
      error: error.message,
    });
  }
};
