import type { TelemetryQuality, TelemetrySource } from "../types/iot";

interface DataQualityBadgeProps {
  source?: TelemetrySource;
  quality?: TelemetryQuality;
  isFallback?: boolean;
}

export default function DataQualityBadge({
  source = "SIMULATED",
  quality = "VALID",
  isFallback = false,
}: DataQualityBadgeProps) {
  if (isFallback) {
    return (
      <span className="telemetry-badge fallback" title="Operating with cached regional climate averages due to connectivity">
        <span className="dot amber" /> Offline / Cached Data
      </span>
    );
  }

  if (quality === "IMPOSSIBLE_READING") {
    return (
      <span className="telemetry-badge danger" title="Sensor reading outside physical boundary limits">
        <span className="dot red" /> Invalid Sensor Telemetry
      </span>
    );
  }

  if (quality === "STALE") {
    return (
      <span className="telemetry-badge warning" title="Reading received over 45 minutes ago">
        <span className="dot amber" /> Stale Telemetry
      </span>
    );
  }

  if (source === "REAL_SENSOR") {
    return (
      <span className="telemetry-badge live" title="Direct telemetry stream from hardware node">
        <span className="dot green pulse" /> Live Hardware Sensor
      </span>
    );
  }

  return (
    <span className="telemetry-badge simulated" title="Deterministic development testbench simulation">
      <span className="dot amber" /> Simulated Telemetry
    </span>
  );
}

