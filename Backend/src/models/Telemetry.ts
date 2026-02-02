import mongoose, { Schema, Document } from "mongoose";

export interface ITelemetry extends Document {
  deviceId: string;
  temperature: number;
  humidity: number;
  pm1: number;
  pm25: number;
  pm10: number;
  voc: number;
  soundLevel: number;
  wifiRssi: number;
  fanSpeed: number;
  powerState: "ON" | "OFF";
  timestamp: Date;
}

const TelemetrySchema: Schema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    temperature: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    humidity: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    pm1: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    pm25: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    pm10: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    voc: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    soundLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    wifiRssi: {
      type: Number,
      required: true,
    },
    fanSpeed: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    powerState: {
      type: String,
      enum: ["ON", "OFF"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<ITelemetry>("Telemetry", TelemetrySchema);
