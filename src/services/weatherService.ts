import type {
  AgriculturalWeatherIndices,
  CurrentWeather,
  DailyForecastItem,
  FarmWeatherSummary,
  HourlyForecastItem,
} from "../types/weather";

// Standard WMO Weather interpretation codes
function decodeWeatherCode(code: number): string {
  switch (code) {
    case 0:
      return "Clear sky";
    case 1:
      return "Mainly clear";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Foggy / Mist";
    case 51:
    case 53:
    case 55:
      return "Light drizzle";
    case 61:
      return "Slight rain";
    case 63:
      return "Moderate rain";
    case 65:
      return "Heavy rain";
    case 80:
    case 81:
    case 82:
      return "Rain showers";
    case 95:
      return "Thunderstorm";
    default:
      return "Scattered clouds";
  }
}

function computeAgriculturalIndices(
  current: CurrentWeather,
  daily: DailyForecastItem[]
): AgriculturalWeatherIndices {
  // Reference ET0 approximation (Hargreaves or Penman-Monteith daily proxy)
  const todayForecast = daily[0];
  const et0 = todayForecast?.et0EvapotranspirationMm ?? 4.2;
  const rainSum = todayForecast?.precipitationSumMm ?? 0;
  const waterBalance = rainSum - et0;

  // Drought risk calculation
  let droughtRisk: "LOW" | "MODERATE" | "HIGH" | "SEVERE" = "LOW";
  const threeDayRainSum = daily.slice(0, 3).reduce((acc, d) => acc + d.precipitationSumMm, 0);
  if (threeDayRainSum < 1 && current.temperatureCelsius > 29) {
    droughtRisk = "HIGH";
  } else if (threeDayRainSum < 4 && current.temperatureCelsius > 27) {
    droughtRisk = "MODERATE";
  }

  // Fungal disease risk window (warm + continuous high humidity)
  const fungalRisk = current.relativeHumidityPercent > 82 && current.temperatureCelsius >= 20 && current.temperatureCelsius <= 29;

  // Heat stress
  const heatStress = current.temperatureCelsius >= 33 ? "HIGH" : current.temperatureCelsius >= 30 ? "MODERATE" : "NONE";

  return {
    referenceEt0: Number(et0.toFixed(1)),
    waterBalanceEstimatedMm: Number(waterBalance.toFixed(1)),
    droughtRiskLevel: droughtRisk,
    heatStressRisk: heatStress,
    fungalDiseaseRiskWindow: fungalRisk,
  };
}

/**
 * Fetch live weather from Open-Meteo for any latitude/longitude in Uganda.
 * If offline or network errors occur, returns realistic cached fallback data.
 */
export async function fetchFarmWeather(
  latitude: number,
  longitude: number,
  districtName = "Uganda Farm"
): Promise<FarmWeatherSummary> {
  const cacheKey = `agrisense_weather_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration&timezone=Africa%2FKampala&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather service returned ${response.status}`);
    }

    const data = await response.json();

    const current: CurrentWeather = {
      temperatureCelsius: Math.round(data.current.temperature_2m * 10) / 10,
      apparentTemperatureCelsius: Math.round(data.current.apparent_temperature * 10) / 10,
      relativeHumidityPercent: Math.round(data.current.relative_humidity_2m),
      precipitationMm: data.current.precipitation ?? 0,
      rainProbabilityPercent: data.hourly?.precipitation_probability?.[0] ?? 15,
      windSpeedKmh: Math.round(data.current.wind_speed_10m),
      windDirectionDegrees: data.current.wind_direction_10m ?? 90,
      weatherCode: data.current.weather_code,
      weatherDescription: decodeWeatherCode(data.current.weather_code),
      isDay: Boolean(data.current.is_day),
      uvIndex: 7, // Tropical standard
      timestamp: new Date().toISOString(),
    };

    const hourly: HourlyForecastItem[] = (data.hourly?.time || []).slice(0, 24).map((timeStr: string, index: number) => ({
      time: timeStr,
      temperatureCelsius: Math.round(data.hourly.temperature_2m[index] * 10) / 10,
      relativeHumidityPercent: Math.round(data.hourly.relative_humidity_2m[index]),
      precipitationProbabilityPercent: data.hourly.precipitation_probability[index] ?? 0,
      precipitationMm: data.hourly.precipitation[index] ?? 0,
      weatherCode: data.hourly.weather_code[index],
    }));

    const daily: DailyForecastItem[] = (data.daily?.time || []).map((dateStr: string, index: number) => ({
      date: dateStr,
      minTempCelsius: Math.round(data.daily.temperature_2m_min[index]),
      maxTempCelsius: Math.round(data.daily.temperature_2m_max[index]),
      precipitationSumMm: Math.round((data.daily.precipitation_sum[index] ?? 0) * 10) / 10,
      precipitationProbabilityMax: data.daily.precipitation_probability_max[index] ?? 0,
      weatherCode: data.daily.weather_code[index],
      weatherDescription: decodeWeatherCode(data.daily.weather_code[index]),
      et0EvapotranspirationMm: data.daily.et0_fao_evapotranspiration?.[index] ?? 4.1,
    }));

    const indices = computeAgriculturalIndices(current, daily);

    const summary: FarmWeatherSummary = {
      locationName: districtName,
      district: districtName,
      latitude,
      longitude,
      current,
      hourly,
      daily,
      indices,
      lastUpdated: new Date().toISOString(),
      isFallback: false,
    };

    // Cache locally for offline resilience
    localStorage.setItem(cacheKey, JSON.stringify(summary));
    return summary;
  } catch (error) {
    console.warn("Weather API fetch failed, loading cached or fallback weather:", error);
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as FarmWeatherSummary;
        parsed.isFallback = true;
        return parsed;
      }
    } catch (cacheError) {
      console.error("Could not read the saved weather snapshot.", cacheError);
    }
    throw new Error("Live weather is unavailable and no saved weather snapshot exists.", { cause: error });
  }
}

/**
 * Deterministic seasonal climate fallback for Ugandan smallholders when internet is temporarily unavailable.
 */
export function generateSyntheticUgandaWeather(
  latitude: number,
  longitude: number,
  district = "Wakiso"
): FarmWeatherSummary {
  const now = new Date();
  const current: CurrentWeather = {
    temperatureCelsius: 27.5,
    apparentTemperatureCelsius: 28.2,
    relativeHumidityPercent: 64,
    precipitationMm: 0.0,
    rainProbabilityPercent: 35,
    windSpeedKmh: 9,
    windDirectionDegrees: 110,
    weatherCode: 2,
    weatherDescription: "Partly cloudy",
    isDay: true,
    uvIndex: 8,
    timestamp: now.toISOString(),
  };

  const hourly: HourlyForecastItem[] = Array.from({ length: 24 }).map((_, i) => {
    const hTime = new Date(now.getTime() + i * 3600 * 1000);
    const tempHour = 22 + 6 * Math.sin(((i + 8) / 24) * Math.PI * 2);
    return {
      time: hTime.toISOString(),
      temperatureCelsius: Math.round(tempHour * 10) / 10,
      relativeHumidityPercent: Math.round(75 - (tempHour - 22) * 3),
      precipitationProbabilityPercent: i > 12 && i < 18 ? 55 : 20,
      precipitationMm: i === 15 ? 3.2 : 0,
      weatherCode: i === 15 ? 61 : 2,
    };
  });

  const daily: DailyForecastItem[] = Array.from({ length: 7 }).map((_, i) => {
    const dDate = new Date(now.getTime() + i * 86400 * 1000);
    return {
      date: dDate.toISOString().split("T")[0],
      minTempCelsius: 18,
      maxTempCelsius: 28,
      precipitationSumMm: i === 1 ? 8.4 : i === 4 ? 12.0 : 0.4,
      precipitationProbabilityMax: i === 1 ? 65 : i === 4 ? 75 : 25,
      weatherCode: i === 1 ? 61 : 2,
      weatherDescription: i === 1 ? "Rain showers" : "Partly cloudy",
      et0EvapotranspirationMm: 4.2,
    };
  });

  const indices = computeAgriculturalIndices(current, daily);

  return {
    locationName: district,
    district,
    latitude,
    longitude,
    current,
    hourly,
    daily,
    indices,
    lastUpdated: now.toISOString(),
    isFallback: true,
  };
}

/**
 * Retrieves BCTB-specific historical & forecast weather metrics (7d/14d/30d rain and dry-spell days).
 * Complies with Section 25.6 Weather Acceptance Criteria.
 */
export async function fetchBctbWeatherMetrics(
  latitude: number,
  longitude: number,
  district = "Wakiso",
  _subCounty?: string
): Promise<import("../types/bctb").WeatherMetrics> {
  const cacheKey = `agrisense_bctb_wx_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&past_days=30&forecast_days=0&daily=precipitation_sum,temperature_2m_mean&timezone=Africa%2FKampala`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather service returned HTTP ${response.status}.`);
    const payload = await response.json() as {
      daily?: { precipitation_sum?: Array<number | null>; temperature_2m_mean?: Array<number | null> };
    };
    const rain = (payload.daily?.precipitation_sum || []).slice(-30).map((value) => value ?? 0);
    const recentTemperatureValues = (payload.daily?.temperature_2m_mean || []).slice(-30);
    const temperatures = recentTemperatureValues.filter((value): value is number => typeof value === "number");
    const temperatures7 = recentTemperatureValues.slice(-7).filter((value): value is number => typeof value === "number");
    if (rain.length === 0 || temperatures.length === 0) throw new Error("No recent weather data was returned for this farm location.");
    const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
    let drySpellDays = 0;
    for (let index = rain.length - 1; index >= 0 && rain[index] < 1; index -= 1) drySpellDays += 1;
    const snapshot: import("../types/bctb").WeatherMetrics = {
      cumulativeRainfall7dMm: Math.round(sum(rain.slice(-7)) * 10) / 10,
      cumulativeRainfall14dMm: Math.round(sum(rain.slice(-14)) * 10) / 10,
      cumulativeRainfall30dMm: Math.round(sum(rain) * 10) / 10,
      tempAvg7dC: Number((sum(temperatures7) / Math.max(temperatures7.length, 1)).toFixed(1)),
      tempAvg30dC: Number((sum(temperatures) / Math.max(temperatures.length, 1)).toFixed(1)),
      consecutiveDrySpellDays: drySpellDays,
      provider: `Open-Meteo - ${district}`,
      retrievedAt: new Date().toISOString(),
      granularity: "EXACT_COORDINATES",
    };
    localStorage.setItem(cacheKey, JSON.stringify(snapshot));
    return snapshot;
  } catch (err) {
    console.warn("BCTB live weather request failed; checking for a saved snapshot.", err);
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const saved = JSON.parse(cached) as import("../types/bctb").WeatherMetrics;
        return {
          ...saved,
          provider: `${saved.provider} (saved; not current)`,
          granularity: "UNAVAILABLE",
        };
      }
    } catch (cacheError) {
      console.error("Could not read saved BCTB weather.", cacheError);
    }
    throw new Error("Live weather is unavailable and no saved snapshot exists.", { cause: err });
  }
}
