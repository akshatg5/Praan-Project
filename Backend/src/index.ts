import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { connectMongo } from "./database/db";
import { initMqtt } from "./mqtt/mqttClient";

import scheduleRoutes from "./routes/scheduleRoutes";
import preCleanRoutes from "./routes/preCleanRoutes";
import deviceRoutes from "./routes/deviceRoutes";
import { initSchedules } from "./services/schedulerService";

const PORT = 3000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Praan Assignemnt - Akshat Girdhar",
  });
});

app.use("/api/schedules", scheduleRoutes);
app.use("/api/preClean", preCleanRoutes);
app.use("/api/devices", deviceRoutes);

const startServer = async (): Promise<void> => {
  try {
    await connectMongo();
    initMqtt();
    await initSchedules();

    app.listen(PORT, () => {
      console.log("============================");
      console.log(`Server is running on ${PORT}`);
      console.log("============================");
    });
  } catch (error: any) {
    console.error("!! Failed to Start the Server", error);
    process.exit(1);
  }
};

startServer();
