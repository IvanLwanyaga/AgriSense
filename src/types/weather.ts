export interface CurrentWeather {
  temperatureCelsius: number;
  apparentTemperatureCelsius: number;
  relativeHumidityPercent: number;
  precipitationMm: number;
  rainProbabilityPercent: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  uvIndex: number;
  timestamp: string;
}

export interface HourlyForecastItem {
  time: string; // ISO string
  temperatureCelsius: number;
  relativeHumidityPercent: number;
  precipitationProbabilityPercent: number;
  precipitationMm: number;
  weatherCode: number;
}

export interface DailyForecastItem {
  date: string; // YYYY-MM-DD
  minTempCelsius: number;
  maxTempCelsius: number;
  precipitationSumMm: number;
  precipitationProbabilityMax: number;
  weatherCode: number;
  weatherDescription: string;
  et0EvapotranspirationMm: number; // Reference crop evapotranspiration
}

export interface AgriculturalWeatherIndices {
  referenceEt0: number; // mm/day
  waterBalanceEstimatedMm: number; // Rain - ET0
  droughtRiskLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  heatStressRisk: "NONE" | "MODERATE" | "HIGH";
  fungalDiseaseRiskWindow: boolean; // Warm + sustained humidity > 85%
}

export interface FarmWeatherSummary {
  locationName: string;
  district: string;
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  indices: AgriculturalWeatherIndices;
  lastUpdated: string;
  isFallback: boolean;
}
