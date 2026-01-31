import mongoose, { Schema, Document } from "mongoose";

export interface IDeviceState extends Document {
  deviceId: string;
  powerState: "ON" | "OFF";
  fanSpeed: number;
  isOnline: boolean;
  lastSeen: Date;
  wifiSsid?: string;
  firmwareVersion?: string;
}

const DeviceStateSchema: Schema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    powerState: {
      type: String,
      enum: ["ON", "OFF"],
      default: "OFF",
    },
    fanSpeed: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now(),
    },
    wifiSsid: {
      type: String,
    },
    firmwareVersion: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IDeviceState>("DeviceState", DeviceStateSchema);
