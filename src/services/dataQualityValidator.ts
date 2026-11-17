import type { TelemetryReading, TelemetryValidationResult } from "../types/iot";

export const PHYSICAL_BOUNDS = {
  soilMoisture: { min: 0, max: 100, unit: "%" },
  soilTemperature: { min: 5, max: 55, unit: "°C" },
  ambientTemperature: { min: 5, max: 50, unit: "°C" },
  relativeHumidity: { min: 5, max: 100, unit: "%" },
  lightLux: { min: 0, max: 150000, unit: "lux" },
  rainfallMm: { min: 0, max: 350, unit: "mm" },
  soilPh: { min: 3.5, max: 9.5, unit: "pH" },
};

// Reading considered stale if older than 45 minutes
const STALE_THRESHOLD_MS = 45 * 60 * 1000;

export function validateTelemetryReading(
  reading: Partial<TelemetryReading>
): TelemetryValidationResult {
  const reasons: string[] = [];

  // Check 1: Missing essential fields
  if (
    reading.soilMoisture === undefined ||
    reading.ambientTemperature === undefined ||
    reading.relativeHumidity === undefined
  ) {
    return {
      isValid: false,
      quality: "MISSING_SENSORS",
      reasons: ["Essential telemetry values (moisture, temperature, or humidity) are missing."],
    };
  }

  // Check 2: Physical impossibility bounds
  if (
    reading.soilMoisture < PHYSICAL_BOUNDS.soilMoisture.min ||
    reading.soilMoisture > PHYSICAL_BOUNDS.soilMoisture.max
  ) {
    reasons.push(
      `Soil moisture ${reading.soilMoisture}% is outside the physical range (0 - 100%). Probe may be disconnected or short-circuited.`
    );
  }

  if (
    reading.ambientTemperature < PHYSICAL_BOUNDS.ambientTemperature.min ||
    reading.ambientTemperature > PHYSICAL_BOUNDS.ambientTemperature.max
  ) {
    reasons.push(
      `Ambient temperature ${reading.ambientTemperature}°C is physically improbable for Uganda conditions (5 - 50°C).`
    );
  }

  if (
    reading.relativeHumidity < PHYSICAL_BOUNDS.relativeHumidity.min ||
    reading.relativeHumidity > PHYSICAL_BOUNDS.relativeHumidity.max
  ) {
    reasons.push(
      `Relative humidity ${reading.relativeHumidity}% is outside physical atmospheric limits (5 - 100%).`
    );
  }

  if (
    reading.soilPh !== undefined &&
    (reading.soilPh < PHYSICAL_BOUNDS.soilPh.min || reading.soilPh > PHYSICAL_BOUNDS.soilPh.max)
  ) {
    reasons.push(`Soil pH ${reading.soilPh} is outside biologically plausible range (3.5 - 9.5).`);
  }

  if (reasons.length > 0) {
    return {
      isValid: false,
      quality: "IMPOSSIBLE_READING",
      reasons,
    };
  }

  // Check 3: Stale timestamp check
  if (reading.timestamp) {
    const readingTime = new Date(reading.timestamp).getTime();
    const now = Date.now();
    if (!isNaN(readingTime) && now - readingTime > STALE_THRESHOLD_MS) {
      return {
        isValid: true, // Still usable for historical reference, but marked stale
        quality: "STALE",
        reasons: [
          `Reading was received ${Math.round(
            (now - readingTime) / (60 * 1000)
          )} minutes ago. Conditions may have changed.`,
        ],
      };
    }
  }

  return {
    isValid: true,
    quality: "VALID",
    reasons: [],
  };
}

/**
 * Check whether telemetry quality is trustworthy enough for AI inference.
 * Prevents hallucinations or dangerous agricultural advice from flawed sensors.
 */
export function isSafeForAiInference(reading: Partial<TelemetryReading>): {
  safe: boolean;
  reason?: string;
} {
  const validation = validateTelemetryReading(reading);
  if (!validation.isValid) {
    return {
      safe: false,
      reason: `Cannot generate recommendation: ${validation.reasons.join(" ")}`,
    };
  }
  return { safe: true };
}

