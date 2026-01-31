import { Request, Response } from "express";
import Schedule from "../models/Schedule";
import { cancelJob, scheduleJob } from "../services/schedulerService";

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const { deviceId, day, startTime, endTime, fanSpeed } = req.body;

    if (!deviceId || !day || !startTime || !endTime || fanSpeed === undefined) {
      return res.status(400).json({
        success: false,
        message: "Invalid Inputs",
      });
    }

    if (fanSpeed < 0 || fanSpeed > 100) {
      return res.status(400).json({
        success: false,
        message: "Fan speed must be between 0 and 100",
      });
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:mm (24-hour format)",
      });
    }

    // store schedule details in mongodb
    const schedule = new Schedule({
      deviceId,
      day,
      startTime,
      endTime,
      fanSpeed,
      isActive: true,
    });

    // schedule the job
    scheduleJob(schedule);

    res.status(201).json({
      success: true,
      message: "Schedule created successfully",
      data: schedule,
    });
  } catch (error: any) {
    console.error("Error creating schedule:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create schedule",
      error: error.message,
    });
  }
};

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.query;

    const filter: any = {};
    if (deviceId) {
      filter.deviceId = deviceId;
    }

    const schedules = await Schedule.find(filter).sort({
      day: 1,
      startTime: 1,
    });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error: any) {
    console.error("Error fetching schedules:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedules",
      error: error.message,
    });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    // cancel the schedules job too when deleting a schedule
    cancelJob(schedule._id.toString());

    res.status(200).json({
      success: false,
      message: "Schedule deleted",
    });
  } catch (error: any) {
    console.error("Error deleting schedule:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete schedule",
      error: error.message,
    });
  }
};
