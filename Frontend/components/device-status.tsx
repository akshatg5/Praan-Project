"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Zap } from "lucide-react";
import { baseUrl } from "@/lib/api";

interface DeviceStatusData {
  deviceId: string;
  powerState: "ON" | "OFF";
  fanSpeed: number;
  isOnline: boolean;
  wifiSsid?: string;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DeviceStatusProps {
  deviceId: string;
}

export function DeviceStatus({ deviceId }: DeviceStatusProps) {
  const [status, setStatus] = useState<DeviceStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `${baseUrl}/api/devices/${deviceId}/status`,
        );
        if (!response.ok) throw new Error("Failed to fetch device status");
        const result = await response.json();
        // Extract the actual device data from the nested response
        setStatus(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [deviceId]);

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Device Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Device Status</CardTitle>
        <CardDescription>Real-time device information</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {status && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3 border border-border">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-medium">Power Status</span>
              </div>
              <Badge
                className={
                  status.powerState === "ON"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }
              >
                {status.powerState}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div 
                className={`rounded-lg p-3 border ${
                  status.fanSpeed >= 75
                    ? "bg-red-500 border-red-600"
                    : status.fanSpeed >= 50
                    ? "bg-secondary/30 border-border"
                    : status.fanSpeed >= 25
                    ? "bg-yellow-500/30 border-yellow-500/50"
                    : "bg-white border-gray-300"
                }`}
              >
                <p className={`text-xs mb-1 ${
                  status.fanSpeed >= 75
                    ? "text-white/80"
                    : status.fanSpeed >= 25
                    ? "text-muted-foreground"
                    : "text-gray-600"
                }`}>
                  Fan Speed
                </p>
                <p className={`text-lg font-semibold ${
                  status.fanSpeed >= 75
                    ? "text-white"
                    : status.fanSpeed >= 50
                    ? "text-primary"
                    : status.fanSpeed >= 25
                    ? "text-yellow-600"
                    : "text-black"
                }`}>
                  {status.fanSpeed}%
                </p>
              </div>
              <div className="rounded-lg bg-secondary/30 p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Connection</p>
                <p className="text-sm font-medium capitalize">
                  {status.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {status.wifiSsid && (
              <div className="rounded-lg bg-secondary/30 p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">WiFi Network</p>
                <p className="text-sm font-medium">{status.wifiSsid}</p>
              </div>
            )}

            {status.lastSeen && (
              <p className="text-xs text-muted-foreground">
                Last seen:{" "}
                {new Date(status.lastSeen).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
