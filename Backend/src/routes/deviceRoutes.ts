import express from "express";
import {
  getDeviceStatus,
  getAllDevices,
  getDeviceTelemetry,
  getCommandHistory,
} from "../controllers/deviceController";

const router = express.Router();

router.get("/", getAllDevices);
router.get("/:deviceId/status", getDeviceStatus);
router.get("/:deviceId/telemetry", getDeviceTelemetry);
router.get("/:deviceId/commands", getCommandHistory);

export default router;
