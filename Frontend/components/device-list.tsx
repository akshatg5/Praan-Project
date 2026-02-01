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
import { AlertCircle, Wifi, WifiOff, ChevronRight } from "lucide-react";
import { baseUrl } from "@/lib/api";

interface Device {
  deviceId: string;
  name?: string;
  status?: string;
  lastSeen?: string;
}

interface DeviceListProps {
  onSelectDevice: (deviceId: string) => void;
}

export function DeviceList({ onSelectDevice }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/devices`);
        if (!response.ok) throw new Error("Failed to fetch devices");
        const data = await response.json();
        setDevices(data.devices || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load devices");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>Loading your connected devices...</CardDescription>
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
        <CardTitle>Connected Devices</CardTitle>
        <CardDescription>
          {devices.length} device{devices.length !== 1 ? "s" : ""} available
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No devices found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => onSelectDevice(device.deviceId)}
                className="w-full rounded-lg border border-border bg-secondary/30 p-3 text-left transition-all hover:border-primary hover:bg-secondary/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {device.name || device.deviceId}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {device.deviceId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {device.status || "active"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
