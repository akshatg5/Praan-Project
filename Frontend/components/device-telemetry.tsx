"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { baseUrl } from "@/lib/api";

interface TelemetryData {
  timestamp: string;
  temperature?: number;
  humidity?: number;
  fanSpeed?: number;
  power?: number;
}

interface DeviceTelemetryProps {
  deviceId: string;
}

export function DeviceTelemetry({ deviceId }: DeviceTelemetryProps) {
  const [data, setData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch(
          `${baseUrl}/api/devices/${deviceId}/telemetry?limit=50`,
        );
        if (!response.ok) throw new Error("Failed to fetch telemetry");
        const result = await response.json();
        setData(Array.isArray(result) ? result : result.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load telemetry",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, [deviceId]);

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Telemetry Data</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border col-span-full">
      <CardHeader>
        <CardTitle>Telemetry Data</CardTitle>
        <CardDescription>Historical sensor readings over time</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No telemetry data available yet</p>
          </div>
        ) : (
          <div className="w-full h-80 -mx-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: "oklch(0.65 0 0)" }}
                  tickFormatter={(val) => {
                    try {
                      return new Date(val).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return val;
                    }
                  }}
                />
                <YAxis tick={{ fill: "oklch(0.65 0 0)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.16 0 0)",
                    border: "1px solid oklch(0.22 0 0)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "oklch(0.95 0 0)" }}
                  formatter={(value) => (
                    <span className="text-foreground">
                      {typeof value === "number" ? value.toFixed(2) : value}
                    </span>
                  )}
                />
                <Legend wrapperStyle={{ color: "oklch(0.95 0 0)" }} />
                {data.some((d) => d.temperature !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="oklch(0.55 0.18 35)"
                    dot={false}
                    isAnimationActive={false}
                    name="Temperature (°C)"
                  />
                )}
                {data.some((d) => d.humidity !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="oklch(0.6 0.18 195)"
                    dot={false}
                    isAnimationActive={false}
                    name="Humidity (%)"
                  />
                )}
                {data.some((d) => d.fanSpeed !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="fanSpeed"
                    stroke="oklch(0.65 0.15 85)"
                    dot={false}
                    isAnimationActive={false}
                    name="Fan Speed (%)"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
