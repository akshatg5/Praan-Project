import { Request, Response } from "express";
import DeviceState from "../models/DeviceState";
import Telemetry from "../models/Telemetry";
import Command from "../models/Command";

// Get device status
export const getDeviceStatus = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const deviceState = await DeviceState.findOne({ deviceId });

    if (!deviceState) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    res.status(200).json({
      success: true,
      data: deviceState,
    });
  } catch (error: any) {
    console.error("Error fetching device status:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch device status",
      error: error.message,
    });
  }
};

// Get all devices
export const getAllDevices = async (req: Request, res: Response) => {
  try {
    const devices = await DeviceState.find();

    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (error: any) {
    console.error("Error fetching devices:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch devices",
      error: error.message,
    });
  }
};

// Get device telemetry history
export const getDeviceTelemetry = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50, startDate, endDate } = req.query;

    const filter: any = { deviceId };

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    const telemetry = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: telemetry.length,
      data: telemetry,
    });
  } catch (error: any) {
    console.error("Error fetching telemetry:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch telemetry",
      error: error.message,
    });
  }
};

// Get command history
export const getCommandHistory = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { limit = 20 } = req.query;

    const commands = await Command.find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: commands.length,
      data: commands,
    });
  } catch (error: any) {
    console.error("Error fetching command history:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch command history",
      error: error.message,
    });
  }
};