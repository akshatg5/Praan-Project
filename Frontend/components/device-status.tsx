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
  status: string;
  fanMode?: number;
  power?: boolean;
  temperature?: number;
  humidity?: number;
  lastUpdated?: string;
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
        const data = await response.json();
        setStatus(data);
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
                  status.power
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }
              >
                {status.power ? "On" : "Off"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-secondary/30 p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Fan Mode</p>
                <p className="text-lg font-semibold text-primary">
                  {status.fanMode || 0}%
                </p>
              </div>
              <div className="rounded-lg bg-secondary/30 p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className="text-sm font-medium capitalize">
                  {status.status}
                </p>
              </div>
            </div>

            {status.temperature !== undefined && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-secondary/30 p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Temperature
                  </p>
                  <p className="text-lg font-semibold">
                    {status.temperature.toFixed(1)}°C
                  </p>
                </div>
                {status.humidity !== undefined && (
                  <div className="rounded-lg bg-secondary/30 p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">
                      Humidity
                    </p>
                    <p className="text-lg font-semibold">
                      {status.humidity.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {status.lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last updated:{" "}
                {new Date(status.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
