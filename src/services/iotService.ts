import type { IoTDevice, TelemetryReading } from "../types/iot";
import { validateTelemetryReading } from "./dataQualityValidator";

const DEVICES_STORAGE_KEY = "agrisense_iot_devices";
const TELEMETRY_STORAGE_KEY = "agrisense_iot_telemetry";

// Default pre-provisioned devices for demonstration / hardware testing
const INITIAL_DEVICES: IoTDevice[] = [
  {
    id: "NODE-UG-01",
    name: "North Block Soil Probe",
    farmId: "farm_default",
    fieldId: "field_01",
    deviceType: "COMBINED_AGRI_PROBE",
    hardwareModel: "AgriNode ESP32-S3 LoRa",
    firmwareVersion: "v1.4.2",
    batteryPercentage: 92,
    signalRssi: -72,
    lastHeartbeat: new Date().toISOString(),
    status: "ONLINE",
    isSimulated: true,
    macAddress: "24:6F:28:B1:A9:01",
    sensorsInstalled: ["SOIL_MOISTURE", "SOIL_TEMP", "AIR_TEMP", "HUMIDITY", "LIGHT", "SOIL_PH"],
    createdAt: "2026-08-01T08:00:00Z",
  },
  {
    id: "NODE-UG-02",
    name: "Valley Block Soil Probe",
    farmId: "farm_default",
    fieldId: "field_02",
    deviceType: "SOIL_NODE",
    hardwareModel: "AgriNode Mini BLE",
    firmwareVersion: "v1.2.0",
    batteryPercentage: 74,
    signalRssi: -84,
    lastHeartbeat: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "ONLINE",
    isSimulated: true,
    macAddress: "24:6F:28:B1:C3:44",
    sensorsInstalled: ["SOIL_MOISTURE", "SOIL_TEMP", "AIR_TEMP", "HUMIDITY"],
    createdAt: "2026-08-15T10:00:00Z",
  },
  {
    id: "STATION-WAKISO-01",
    name: "District Micro-Weather Station",
    farmId: "farm_default",
    fieldId: null,
    deviceType: "WEATHER_STATION",
    hardwareModel: "AgriSense WeatherMast Solar",
    firmwareVersion: "v2.0.1",
    batteryPercentage: 98,
    signalRssi: -65,
    lastHeartbeat: new Date().toISOString(),
    status: "ONLINE",
    isSimulated: true,
    sensorsInstalled: ["AIR_TEMP", "HUMIDITY", "RAINFALL", "LIGHT"],
    createdAt: "2026-07-20T12:00:00Z",
  },
];

export function getDevices(): IoTDevice[] {
  try {
    const raw = localStorage.getItem(DEVICES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(INITIAL_DEVICES));
      return INITIAL_DEVICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEVICES;
  }
}

export function registerDevice(device: Omit<IoTDevice, "id" | "lastHeartbeat" | "createdAt">): IoTDevice {
  const devices = getDevices();
  const newDevice: IoTDevice = {
    ...device,
    id: `NODE-UG-${Math.floor(1000 + Math.random() * 9000)}`,
    lastHeartbeat: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  devices.push(newDevice);
  localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices));
  return newDevice;
}

/**
 * Ingestion handler for live hardware sensor payload.
 * Validates range sanity and flags anomalies before persisting.
 */
export function ingestHardwareTelemetry(payload: Partial<TelemetryReading> & { deviceId: string; farmId: string }): TelemetryReading {
  const validation = validateTelemetryReading(payload);

  const reading: TelemetryReading = {
    id: `READ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    deviceId: payload.deviceId,
    farmId: payload.farmId,
    fieldId: payload.fieldId,
    timestamp: payload.timestamp || new Date().toISOString(),
    source: payload.source || "REAL_SENSOR",
    quality: validation.quality,
    qualityReason: validation.reasons.join("; ") || undefined,
    soilMoisture: payload.soilMoisture ?? 0,
    soilTemperature: payload.soilTemperature ?? 24,
    ambientTemperature: payload.ambientTemperature ?? 26,
    relativeHumidity: payload.relativeHumidity ?? 60,
    lightLux: payload.lightLux ?? 500,
    rainfallMm: payload.rainfallMm ?? 0,
    soilPh: payload.soilPh ?? 6.2,
    batteryVoltage: payload.batteryVoltage ?? 4.0,
    signalDbm: payload.signalDbm ?? -70,
  };

  // Save to telemetry log
  saveTelemetryReading(reading);

  // Update device heartbeat
  const devices = getDevices();
  const devIndex = devices.findIndex((d) => d.id === payload.deviceId);
  if (devIndex >= 0) {
    devices[devIndex].lastHeartbeat = reading.timestamp;
    devices[devIndex].status = validation.quality === "IMPOSSIBLE_READING" ? "DEGRADED" : "ONLINE";
    localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices));
  }

  return reading;
}

export function saveTelemetryReading(reading: TelemetryReading): void {
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    const existing: TelemetryReading[] = raw ? JSON.parse(raw) : [];
    existing.unshift(reading);
    // Keep most recent 200 readings in local storage
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch (err) {
    console.error("Error saving telemetry reading:", err);
  }
}

export function getLatestTelemetry(farmId?: string, fieldId?: string): TelemetryReading {
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (raw) {
      const readings: TelemetryReading[] = JSON.parse(raw);
      const matched = readings.find((r) => {
        if (farmId && r.farmId !== farmId) return false;
        if (fieldId && r.fieldId !== fieldId) return false;
        return true;
      });
      if (matched) return matched;
    }
  } catch (err) {
    console.error("Error reading telemetry:", err);
  }

  // Fallback default reading
  return generateSimulatedTelemetry("NODE-UG-01", farmId || "farm_default", fieldId || "field_01");
}

export function getTelemetryHistory(
  deviceId: string,
  count = 24
): Array<{ time: string; moisture: number; temp: number; humidity: number }> {
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (raw) {
      const readings: TelemetryReading[] = JSON.parse(raw);
      const filtered = readings.filter((r) => r.deviceId === deviceId).slice(0, count);
      if (filtered.length >= 6) {
        return filtered.map((r) => ({
          time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          moisture: r.soilMoisture,
          temp: r.ambientTemperature,
          humidity: r.relativeHumidity,
        })).reverse();
      }
    }
  } catch {
    // fallback to realistic trend
  }

  // Realistic diurnal trend for smallholder farm
  const trendPoints: Array<{ time: string; moisture: number; temp: number; humidity: number }> = [];
  const baseMoisture = 34.0;
  for (let i = 11; i >= 0; i--) {
    const hour = (24 + new Date().getHours() - i * 2) % 24;
    const timeStr = `${hour.toString().padStart(2, "0")}:00`;
    // Slight drying trend
    const moisture = Math.max(15, baseMoisture + (i * 1.1) - (11 - i) * 0.4);
    const temp = 22 + 7 * Math.sin(((hour - 6) / 24) * Math.PI * 2);
    const humidity = 85 - (temp - 20) * 3;
    trendPoints.push({
      time: timeStr,
      moisture: Number(moisture.toFixed(1)),
      temp: Number(temp.toFixed(1)),
      humidity: Number(humidity.toFixed(0)),
    });
  }
  return trendPoints;
}

/**
 * Deterministic telemetry generator for development testbenches.
 * Supports testing edge cases like drought, excessive rainfall, or faulty sensor probes.
 */
export function generateSimulatedTelemetry(
  deviceId: string,
  farmId: string,
  fieldId?: string,
  scenario: "NORMAL" | "DROUGHT" | "WATERLOGGED" | "PROBE_FAULT" = "NORMAL"
): TelemetryReading {
  let moisture = 38;
  let soilTemp = 24.5;
  let ambientTemp = 27.8;
  let humidity = 62;
  let rain = 0;
  let ph = 6.4;

  if (scenario === "DROUGHT") {
    moisture = 16.5; // Critical dry
    ambientTemp = 33.2;
    humidity = 38;
  } else if (scenario === "WATERLOGGED") {
    moisture = 94.0; // Waterlogged
    rain = 38.5;
    humidity = 92;
  } else if (scenario === "PROBE_FAULT") {
    moisture = 185.0; // Impossible reading test
  }

  const reading: Partial<TelemetryReading> = {
    id: `SIM-${Date.now()}`,
    deviceId,
    farmId,
    fieldId,
    timestamp: new Date().toISOString(),
    source: "SIMULATED",
    soilMoisture: moisture,
    soilTemperature: soilTemp,
    ambientTemperature: ambientTemp,
    relativeHumidity: humidity,
    lightLux: 780,
    rainfallMm: rain,
    soilPh: ph,
    batteryVoltage: 3.95,
    signalDbm: -74,
  };

  const validation = validateTelemetryReading(reading);
  const fullReading: TelemetryReading = {
    ...(reading as TelemetryReading),
    quality: validation.quality,
    qualityReason: validation.reasons.join("; ") || undefined,
  };

  saveTelemetryReading(fullReading);
  return fullReading;
}

