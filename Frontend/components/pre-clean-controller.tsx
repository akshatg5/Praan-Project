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
import { AlertCircle, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { baseUrl } from "@/lib/api";

interface PreCleanControllerProps {
  deviceId: string;
}

export function PreCleanController({ deviceId }: PreCleanControllerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fanMode: 80,
    duration: 120,
  });

  const handleTriggerPreClean = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${baseUrl}/api/pre-clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          ...formData,
        }),
      });
      if (!response.ok) throw new Error("Failed to trigger pre-clean");
      setSuccess(`Pre-clean started for ${formData.duration} seconds`);
      setIsOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to trigger pre-clean",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Pre-Clean Operation</CardTitle>
        <CardDescription>Trigger device cleaning cycle</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/20 p-3 text-green-400">
            <Play className="h-4 w-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Play className="h-4 w-4" />
              Start Pre-Clean
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border">
            <DialogHeader>
              <DialogTitle>Start Pre-Clean Cycle</DialogTitle>
              <DialogDescription>
                Configure and start a pre-cleaning operation on your device
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Fan Mode: {formData.fanMode}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.fanMode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fanMode: Number(e.target.value),
                    })
                  }
                  className="w-full mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: Number(e.target.value),
                    })
                  }
                  className="w-full mt-1 rounded-md bg-input px-3 py-2 text-foreground border border-border"
                >
                  <option value={60}>1 minute (60 seconds)</option>
                  <option value={120}>2 minutes (120 seconds)</option>
                  <option value={180}>3 minutes (180 seconds)</option>
                  <option value={300}>5 minutes (300 seconds)</option>
                  <option value={600}>10 minutes (600 seconds)</option>
                </select>
              </div>
              <div className="rounded-lg bg-secondary/30 p-3 border border-border">
                <p className="text-sm text-muted-foreground">
                  This will run the fan at{" "}
                  <span className="font-semibold text-foreground">
                    {formData.fanMode}%
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold text-foreground">
                    {formData.duration}
                  </span>{" "}
                  seconds
                </p>
              </div>
              <Button
                onClick={handleTriggerPreClean}
                disabled={isSubmitting}
                className="w-full gap-2"
              >
                <Play className="h-4 w-4" />
                {isSubmitting ? "Starting..." : "Start Pre-Clean"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
