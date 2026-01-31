import * as cron from "node-cron";
import Schedule, { ISchedule } from "../models/Schedule";
import Command from "../models/Command";
import { publishCommand } from "../mqtt/mqttClient";

// in  memory map for active jobs
// TODO : store the active jobs in the db as well -> not safe in memory
const activeJobs = new Map<string, cron.ScheduledTask[]>();

const dayToCron: { [key: string]: number } = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const scheduleJob = (schedule: ISchedule) => {
  const scheduleId = schedule._id.toString();
  const dayNum = dayToCron[schedule.day];

  // Parse start and end times
  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

  // Create cron expression for start time: "minute hour * * dayOfWeek" ??
  const startCron = `${startMinute} ${startHour} * * ${dayNum}`;
  const endCron = `${endMinute} ${endHour} * * ${dayNum}`;

  // Schedule start job (turn on device with fan speed)
  const startJob = cron.schedule(startCron, async () => {
    console.log(
      `Executing start schedule: ${scheduleId} for device: ${schedule.deviceId}`,
    );

    const commandId = await publishCommand(
      schedule.deviceId,
      "SET_FAN_SPEED",
      { fanSpeed: schedule.fanSpeed },
      "SCHEDULE",
      scheduleId,
    );

    if (commandId) {
      // Start retry mechanism
      scheduleRetry(commandId, schedule.deviceId);
    }
  });

  // Schedule end job (turn off device)
  const endJob = cron.schedule(endCron, async () => {
    console.log(
      `Executing end schedule: ${scheduleId} for device: ${schedule.deviceId}`,
    );

    const commandId = await publishCommand(
      schedule.deviceId,
      "POWER_OFF",
      {},
      "SCHEDULE",
      scheduleId,
    );

    if (commandId) {
      // Start retry mechanism
      scheduleRetry(commandId, schedule.deviceId);
    }
  });

  // Store jobs
  activeJobs.set(scheduleId, [startJob, endJob]);

  console.log(
    `Scheduled jobs for: ${scheduleId} on ${schedule.day} at ${schedule.startTime}-${schedule.endTime}`,
  );
};

export const cancelJob = (scheduleId: string) => {
  const jobs = activeJobs.get(scheduleId);

  if (jobs) {
    jobs.forEach((job) => job.stop());
    activeJobs.delete(scheduleId);
    console.log(`Cancelled schedule : ${scheduleId}`);
  }
};

const scheduleRetry = (commandId: string, deviceId: string) => {
  // check command status after 30 seconds
  setTimeout(async () => {
    const command = await Command.findById(commandId);

    if (!command) return;

    if (
      (command.status === "PENDING" || command.status === "SENT") &&
      command.retryCount < command.maxRetries
    ) {
      console.log(
        `Retrying command ${commandId}, attempt ${command.retryCount + 1}`,
      );

      command.retryCount++;
      await command.save();

      // republish command
      await publishCommand(
        deviceId,
        command.commandType,
        command.payload,
        command.source,
        command.sourceId,
      );

      // schedule next retry check
      scheduleRetry(commandId, deviceId);
    } else if (command.status === "PENDING" || command.status === "SENT") {
      // if max-retries reached, mark the command as failed
      command.status = "FAILED";
      command.error = "Max retires reached";
      await command.save();
      console.log(
        `Command ${commandId} failed after ${command.retryCount} retries`,
      );
    }
  }, 30000);
};

export const initSchedules = async () => {
  try {
    const schedules = await Schedule.find({ isActive: true });

    schedules.forEach((schedule) => {
      scheduleJob(schedule);
    });

    console.log(`Initialized ${schedules.length} schedules`);
  } catch (error: any) {
    console.error("Error initializing schedules", error);
  }
};
