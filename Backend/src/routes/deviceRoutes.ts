import express from "express";
import {
  getDeviceStatus,
  getAllDevices,
  getDeviceTelemetry,
  getCommandHistory,
} from "../controllers/deviceController";
import { sendDeviceCommand } from "../controllers/commandController";

const router = express.Router();

router.get("/", getAllDevices);
router.get("/:deviceId/status", getDeviceStatus);
router.get("/:deviceId/telemetry", getDeviceTelemetry);
router.get("/:deviceId/commands", getCommandHistory);
router.post("/:deviceId/commands", sendDeviceCommand);

export default router;
