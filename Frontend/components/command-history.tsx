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
import { AlertCircle, Clock } from "lucide-react";
import { baseUrl } from "@/lib/api";

interface Command {
  id?: string;
  _id?: string;
  command: string;
  timestamp: string;
  status?: string;
  parameters?: Record<string, unknown>;
}

interface CommandHistoryProps {
  deviceId: string;
}

export function CommandHistory({ deviceId }: CommandHistoryProps) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const response = await fetch(
          `${baseUrl}/api/devices/${deviceId}/commands?limit=20`,
        );
        if (!response.ok) throw new Error("Failed to fetch command history");
        const data = await response.json();
        setCommands(Array.isArray(data) ? data : data.commands || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load commands",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, [deviceId]);

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Command History</CardTitle>
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
        <CardTitle>Command History</CardTitle>
        <CardDescription>Recent commands sent to this device</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {commands.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No command history available</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {commands.map((cmd, idx) => (
              <div
                key={cmd.id || cmd._id || idx}
                className="rounded-lg bg-secondary/30 p-3 border border-border text-sm"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium capitalize text-primary">
                    {cmd.command}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(cmd.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {cmd.status && (
                  <p className="text-xs text-muted-foreground mb-1">
                    Status:{" "}
                    <span className="text-foreground">{cmd.status}</span>
                  </p>
                )}
                {cmd.parameters && Object.keys(cmd.parameters).length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1 p-2 bg-primary/5 rounded">
                    {Object.entries(cmd.parameters).map(([key, value]) => (
                      <div key={key}>
                        {key}:{" "}
                        <span className="text-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
