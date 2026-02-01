"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { baseUrl } from "@/lib/api";

interface Schedule {
  scheduleId?: string;
  _id?: string;
  deviceId: string;
  day: string;
  startTime: string;
  endTime: string;
  fanSpeed: number;
}

interface ScheduleManagerProps {
  deviceId: string;
}

export function ScheduleManager({ deviceId }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    day: "Monday",
    startTime: "09:00",
    endTime: "17:00",
    fanSpeed: 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/api/schedules?deviceId=${deviceId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch schedules");
      const data = await response.json();
      setSchedules(Array.isArray(data) ? data : data.schedules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [deviceId]);

  const handleCreateSchedule = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${baseUrl}/api/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          ...formData,
        }),
      });
      if (!response.ok) throw new Error("Failed to create schedule");
      await fetchSchedules();
      setFormData({
        day: "Monday",
        startTime: "09:00",
        endTime: "17:00",
        fanSpeed: 50,
      });
      setIsOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create schedule",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete schedule");
      await fetchSchedules();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete schedule",
      );
    }
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Schedules</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Schedules</CardTitle>
          <CardDescription>Manage device operation schedules</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border">
            <DialogHeader>
              <DialogTitle>Create Schedule</DialogTitle>
              <DialogDescription>
                Set up an automated schedule for this device
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Day</label>
                <select
                  value={formData.day}
                  onChange={(e) =>
                    setFormData({ ...formData, day: e.target.value })
                  }
                  className="w-full mt-1 rounded-md bg-input px-3 py-2 text-foreground border border-border"
                >
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full mt-1 rounded-md bg-input px-3 py-2 text-foreground border border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full mt-1 rounded-md bg-input px-3 py-2 text-foreground border border-border"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Fan Speed: {formData.fanSpeed}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.fanSpeed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fanSpeed: Number(e.target.value),
                    })
                  }
                  className="w-full mt-1"
                />
              </div>
              <Button
                onClick={handleCreateSchedule}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Creating..." : "Create Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {schedules.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No schedules configured yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.scheduleId || schedule._id}
                className="flex items-center justify-between rounded-lg bg-secondary/30 p-3 border border-border"
              >
                <div>
                  <p className="font-medium">{schedule.day}</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.startTime} - {schedule.endTime} at{" "}
                    {schedule.fanSpeed}% fan speed
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleDeleteSchedule(
                      schedule.scheduleId || schedule._id || "",
                    )
                  }
                  className="p-2 hover:bg-destructive/20 rounded-md transition-colors text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
