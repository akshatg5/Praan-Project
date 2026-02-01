import { setFanSpeed, setPowerState } from "./deviceState";
import { Acknowledgement, Command } from "./types";

export const handleCommand = (command: Command): Acknowledgement => {
  try {
    console.log("=====================");
    console.log("\n Command Received: ");
    console.log(`Type : ${command.commandType}`);
    console.log(`Command ID : ${command.commandId}`);

    // Validate command
    if (!command.commandId || !command.commandType) {
      throw new Error("Invalid command: missing commandId or commandType");
    }

    switch (command.commandType) {
      case "SET_FAN_SPEED":
        handleSetFanSpeed(command);
        break;
      case "POWER_ON":
        handlePowerOn();
        break;
      case "POWER_OFF":
        handlePowerOff();
        break;

      default:
        throw new Error(`Unknown Command type : ${command.commandType}`);
    }

    return {
      commandId: command.commandId,
      status: "success",
      message: "Command executed successfully",
    };
  } catch (error: any) {
    console.error(`!!!!! Command Failed: ${error.message}`);

    return {
      commandId: command.commandId,
      status: "failed",
      message: error.message,
    };
  }
};

const handleSetFanSpeed = (command: Command): void => {
  const { fanSpeed } = command.payload;

  if (fanSpeed === undefined || fanSpeed === null) {
    throw new Error("Invalid Fanspeed");
  }

  if (typeof fanSpeed !== "number") {
    throw new Error("fanSpeed must be a number");
  }

  if (fanSpeed < 0 || fanSpeed > 100) {
    throw new Error("fanSpeed must be between 0 and 100");
  }

  setFanSpeed(fanSpeed);
};

const handlePowerOn = (): void => {
  setPowerState("ON");
};

const handlePowerOff = (): void => {
  setPowerState("OFF");
};
