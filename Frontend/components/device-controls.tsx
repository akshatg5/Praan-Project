"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, Power, Gauge } from "lucide-react";
import { baseUrl } from "@/lib/api";

interface DeviceControlsProps {
  deviceId: string;
}

export function DeviceControls({ deviceId }: DeviceControlsProps) {
  const [fanSpeed, setFanSpeed] = useState<number>(50);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sendCommand = async (
    commandType: string,
    payload?: { fanSpeed: number }
  ) => {
    try {
      setLoading(commandType);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${baseUrl}/api/devices/${deviceId}/commands`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            commandType,
            payload,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send command");
      }

      setSuccess(`Command sent successfully: ${commandType}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send command");
    } finally {
      setLoading(null);
    }
  };

  const handlePowerOn = () => sendCommand("POWER_ON");
  const handlePowerOff = () => sendCommand("POWER_OFF");
  const handleSetFanSpeed = () => sendCommand("SET_FAN_SPEED", { fanSpeed });

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Device Controls</CardTitle>
        <CardDescription>Control your device remotely</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Power Controls */}
          <div className="rounded-lg bg-secondary/30 p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Power className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Power Control</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handlePowerOn}
                disabled={loading !== null}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
              >
                {loading === "POWER_ON" ? "Sending..." : "Power ON"}
              </Button>
              <Button
                onClick={handlePowerOff}
                disabled={loading !== null}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
              >
                {loading === "POWER_OFF" ? "Sending..." : "Power OFF"}
              </Button>
            </div>
          </div>

          {/* Fan Speed Control */}
          <div className="rounded-lg bg-secondary/30 p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Fan Speed</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Speed</span>
                <span className="text-lg font-semibold text-primary">
                  {fanSpeed}%
                </span>
              </div>
              <Slider
                value={[fanSpeed]}
                onValueChange={(value: number[]) => setFanSpeed(value[0])}
                max={100}
                min={0}
                step={1}
                className="w-full"
                disabled={loading !== null}
              />
              <Button
                onClick={handleSetFanSpeed}
                disabled={loading !== null}
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50"
              >
                {loading === "SET_FAN_SPEED" ? "Setting..." : "Set Fan Speed"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
