export type TelemetryQuality =
  | "VALID"
  | "STALE"
  | "MISSING_SENSORS"
  | "IMPOSSIBLE_READING";

export type TelemetrySource = "REAL_SENSOR" | "SIMULATED";

export type IoTDeviceType =
  | "COMBINED_AGRI_PROBE"
  | "SOIL_NODE"
  | "WEATHER_STATION";

export type IoTSensorType =
  | "SOIL_MOISTURE"
  | "SOIL_TEMP"
  | "AIR_TEMP"
  | "HUMIDITY"
  | "LIGHT"
  | "RAINFALL"
  | "SOIL_PH";

export type IoTDeviceStatus = "ONLINE" | "DEGRADED" | "OFFLINE";

export interface IoTDevice {
  id: string;
  name: string;
  farmId: string;
  fieldId: string | null;
  deviceType: IoTDeviceType;
  hardwareModel: string;
  firmwareVersion: string;
  batteryPercentage: number;
  signalRssi: number;
  lastHeartbeat: string;
  status: IoTDeviceStatus;
  isSimulated: boolean;
  macAddress?: string;
  sensorsInstalled: IoTSensorType[];
  createdAt: string;
}

export interface TelemetryReading {
  id: string;
  deviceId: string;
  farmId: string;
  fieldId?: string;
  timestamp: string;
  source: TelemetrySource;
  quality: TelemetryQuality;
  qualityReason?: string;
  soilMoisture: number;
  soilTemperature: number;
  ambientTemperature: number;
  relativeHumidity: number;
  lightLux: number;
  rainfallMm: number;
  soilPh: number;
  batteryVoltage: number;
  signalDbm: number;
}

export interface TelemetryValidationResult {
  isValid: boolean;
  quality: TelemetryQuality;
  reasons: string[];
}
