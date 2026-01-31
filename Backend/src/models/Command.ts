import mongoose, { Schema } from "mongoose";

export interface ICommand extends Document {
  deviceId: string;
  commandType: "SET_FAN_SPEED" | "POWER_ON" | "POWER_OFF";
  payload: {
    fanSpeed?: number;
    [key: string]: any;
  };
  status: "PENDING" | "SENT" | "ACKED" | "FAILED";
  retryCount: number;
  maxRetries: number;
  sentAt?: Date;
  ackedAt?: Date;
  error?: string;
  source: "SCHEDULED" | "PRE_CLEAN" | "MANUAL";
  sourceId?: string; // reference to schedule/pre-clean request
}

const CommandSchema: Schema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    commandType: {
      type: String,
      enum: ["SET_FAN_SPEED", "POWER_ON", "POWER_OFF"],
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "ACKED", "FAILED"],
      default: "PENDING",
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    sentAt: {
      type: Date,
    },
    ackedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    source: {
      type: String,
      enum: ["SCHEDULED", "PRE_CLEAN", "MANUAL"],
      required: true,
    },
    sourceId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

CommandSchema.index({ status: 1, retryCount: 1 });

export default mongoose.model<ICommand>("Command", CommandSchema);
