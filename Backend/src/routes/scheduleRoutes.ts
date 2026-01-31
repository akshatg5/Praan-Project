import express from "express";
import {
  createSchedule,
  deleteSchedule,
  getSchedules,
} from "../controllers/scheduleController";

const router = express.Router();

router.post("/", createSchedule);
router.get("/", getSchedules);
router.delete("/:id", deleteSchedule);

export default router;