'use client';

import { useState } from 'react';
import { Activity, Settings } from 'lucide-react';
import { DeviceList } from '@/components/device-list';
import { DeviceStatus } from '@/components/device-status';
import { DeviceTelemetry } from '@/components/device-telemetry';
import { ScheduleManager } from '@/components/schedule-manager';
import { PreCleanController } from '@/components/pre-clean-controller';
import { CommandHistory } from '@/components/command-history';
import { DeviceControls } from '@/components/device-controls';

export default function Dashboard() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Device Manager</h1>
                <p className="text-sm text-muted-foreground">
                  Monitor and control your IoT devices
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 rounded-lg border border-border">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">System Running</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Device List */}
          <div className="lg:col-span-1">
            <DeviceList onSelectDevice={setSelectedDevice} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {selectedDevice ? (
              <>
                {/* Selected Device Info */}
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 rounded-lg border border-border">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-sm font-medium">
                    Selected Device: <span className="text-primary">{selectedDevice}</span>
                  </p>
                </div>

                {/* Device Status and Controls Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DeviceStatus deviceId={selectedDevice} />
                  <DeviceControls deviceId={selectedDevice} />
                </div>

                {/* Pre-Clean Controller */}
                <PreCleanController deviceId={selectedDevice} />

                {/* Telemetry Chart */}
                <DeviceTelemetry deviceId={selectedDevice} />

                {/* Schedule and Commands Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ScheduleManager deviceId={selectedDevice} />
                  <CommandHistory deviceId={selectedDevice} />
                </div>
              </>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-border bg-secondary/20 p-12 text-center">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Device Selected</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Select a device from the list on the left to view its status, telemetry data,
                  and manage schedules.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
          <p>Device Manager Dashboard • Real-time IoT Device Monitoring</p>
        </div>
      </footer>
    </div>
  );
}
