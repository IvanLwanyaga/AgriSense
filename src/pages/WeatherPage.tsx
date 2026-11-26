import { useEffect, useState } from "react";
import { fetchFarmWeather } from "../services/weatherService";
import { UGANDA_DISTRICTS } from "../services/agronomyData";
import type { FarmWeatherSummary } from "../types/weather";
import { useLanguage } from "../context/LanguageContext";

export default function WeatherPage() {
  const { t } = useLanguage();
  const [selectedDistrict, setSelectedDistrict] = useState(UGANDA_DISTRICTS[0]);
  const [weather, setWeather] = useState<FarmWeatherSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFarmWeather(selectedDistrict.latitude, selectedDistrict.longitude, selectedDistrict.name)
      .then((data) => {
        if (active) {
          setWeather(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDistrict]);

  return (
    <section className="workspace-page weather-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">{t.recEyebrow}</p>
          <h2>{t.farmWeather}</h2>
          <p>
            {t.weatherIntel}
          </p>
        </div>

        {/* District Selector */}
        <div className="district-picker">
          <label>{t.districtWord}:</label>
          <select
            value={selectedDistrict.name}
            onChange={(e) => {
              const d = UGANDA_DISTRICTS.find((item) => item.name === e.target.value);
              if (d) setSelectedDistrict(d);
            }}
          >
            {UGANDA_DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                📍 {d.name} ({d.region} Uganda)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !weather ? (
        <div className="empty-workspace">
          <h3>{t.latestForecastLoading}</h3>
        </div>
      ) : (
        <>
          <p className="settings-info-card" role="status">
            {weather.isFallback
              ? `${t.liveWeatherFallback} ${t.lastAvailableUpdate}: ${new Date(weather.lastUpdated).toLocaleString()}.`
              : `${t.liveForecast} ${new Date(weather.lastUpdated).toLocaleString()}.`}
          </p>
          {/* Main Weather Hero */}
          <div className="weather-hero-banner">
            <div className="hero-left">
              <span className="location-badge">
                📍 {weather.locationName}, Uganda · {weather.latitude.toFixed(2)}°N, {weather.longitude.toFixed(2)}°E
              </span>
              <div className="current-temp-block">
                <span className="weather-big-icon">
                  {weather.current.weatherCode > 60 ? "🌧️" : weather.current.weatherCode > 2 ? "⛅" : "☀️"}
                </span>
                <div>
                  <span className="temp-number">{weather.current.temperatureCelsius}°C</span>
                  <p className="weather-desc">
                    {weather.current.weatherDescription} · Feels like {weather.current.apparentTemperatureCelsius}°C
                  </p>
                </div>
              </div>
            </div>

            <div className="hero-metrics-grid">
              <div className="w-metric-box">
                <small>🌧️ {t.rainProbability24h}</small>
                <strong>{weather.current.rainProbabilityPercent}%</strong>
              </div>
              <div className="w-metric-box">
                <small>💧 {t.relativeHumidityLabel}</small>
                <strong>{weather.current.relativeHumidityPercent}%</strong>
              </div>
              <div className="w-metric-box">
                <small>💨 {t.windSpeed}</small>
                <strong>{weather.current.windSpeedKmh} km/h</strong>
              </div>
              <div className="w-metric-box">
                <small>☀️ {t.evapotranspiration} (ET0)</small>
                <strong>{weather.indices.referenceEt0} mm/day</strong>
              </div>
            </div>
          </div>

          <div className="agri-advisory-cards">
            <div className={`advisory-card ${weather.indices.droughtRiskLevel.toLowerCase()}`}>
              <div className="advisory-icon">
                {weather.indices.droughtRiskLevel === "LOW" ? "💧" : "☀️"}
              </div>
              <div className="advisory-body">
                <span className="advisory-type">{t.fieldWaterBalance}</span>
                <h4>
                  {t.estimatedDailyMoisture}: {weather.indices.waterBalanceEstimatedMm} mm
                </h4>
                <div className="advisory-quad">
                  <div>
                    <strong>{t.reason}:</strong>
                    <p>
                      Atmospheric demand (ET0 = {weather.indices.referenceEt0} mm) vs incoming rainfall. Drought risk: <strong>{weather.indices.droughtRiskLevel}</strong>.
                    </p>
                  </div>
                  <div>
                    <strong>{t.relevantConditions}:</strong>
                    <p>
                      Max 7-day temp: {Math.max(...weather.daily.map((d) => d.maxTempCelsius))}°C · Accumulated 7-day rain: {weather.daily.reduce((sum, d) => sum + d.precipitationSumMm, 0).toFixed(1)} mm.
                    </p>
                  </div>
                  <div>
                    <strong>{t.suggestedAction}:</strong>
                    <p>
                      {weather.indices.droughtRiskLevel === "HIGH"
                        ? t.supplementalIrrigation
                        : t.stableMoisture}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* {t.sevenDayForecast} Grid */}
          <div className="panel forecast-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">{t.extendedPlanning}</span>
                <h3>{t.sevenDayForecast}</h3>
              </div>
              <span className="panel-hint">{t.hourlyForecast}</span>
            </div>

            <div className="daily-forecast-grid">
              {weather.daily.map((day, idx) => {
                const dayName =
                  idx === 0
                    ? t.today
                    : idx === 1
                    ? t.tomorrow
                    : new Date(day.date).toLocaleDateString("en-UG", { weekday: "short" });

                return (
                  <div className="daily-card" key={day.date}>
                    <span className="day-name">{dayName}</span>
                    <small className="day-date">{day.date.substring(5)}</small>
                    <span className="day-icon">
                      {day.precipitationSumMm > 4 ? "🌧️" : day.maxTempCelsius > 29 ? "☀️" : "⛅"}
                    </span>
                    <div className="day-temps">
                      <span className="day-max">{day.maxTempCelsius}°</span>
                      <span className="day-min">{day.minTempCelsius}°</span>
                    </div>
                    <div className="day-rain-meta">
                      <span className="rain-prob">💧 {day.precipitationProbabilityMax}%</span>
                      <small className="rain-amount">{day.precipitationSumMm} mm</small>
                    </div>
                    <div className="day-et0">
                      <small>ET0: {day.et0EvapotranspirationMm} mm</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
