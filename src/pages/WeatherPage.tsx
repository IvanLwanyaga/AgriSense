import { useEffect, useState } from "react";
import { fetchFarmWeather } from "../services/weatherService";
import { UGANDA_DISTRICTS } from "../services/agronomyData";
import type { FarmWeatherSummary } from "../types/weather";

export default function WeatherPage() {
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
          <p className="eyebrow">Agrometeorological Intelligence</p>
          <h2>Weather Intelligence</h2>
          <p>
            Local weather observations, evapotranspiration indices, and agricultural advisories for Uganda.
          </p>
        </div>

        {/* District Selector */}
        <div className="district-picker">
          <label>District Focus:</label>
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
          <h3>Fetching the latest forecast...</h3>
        </div>
      ) : (
        <>
          <p className="settings-info-card" role="status">
            {weather.isFallback
              ? `Showing cached or estimated weather because the live provider could not be reached. Last available update: ${new Date(weather.lastUpdated).toLocaleString()}.`
              : `Live forecast from Open-Meteo, updated ${new Date(weather.lastUpdated).toLocaleString()}.`}
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
                <small>🌧️ 24h Rain Probability</small>
                <strong>{weather.current.rainProbabilityPercent}%</strong>
              </div>
              <div className="w-metric-box">
                <small>💧 Relative Humidity</small>
                <strong>{weather.current.relativeHumidityPercent}%</strong>
              </div>
              <div className="w-metric-box">
                <small>💨 Wind Speed</small>
                <strong>{weather.current.windSpeedKmh} km/h</strong>
              </div>
              <div className="w-metric-box">
                <small>☀️ Evapotranspiration (ET0)</small>
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
                <span className="advisory-type">Field Water Balance & Drought Monitor</span>
                <h4>
                  Estimated Daily Moisture Balance: {weather.indices.waterBalanceEstimatedMm} mm
                </h4>
                <div className="advisory-quad">
                  <div>
                    <strong>Reason:</strong>
                    <p>
                      Atmospheric demand (ET0 = {weather.indices.referenceEt0} mm) vs incoming rainfall. Drought risk: <strong>{weather.indices.droughtRiskLevel}</strong>.
                    </p>
                  </div>
                  <div>
                    <strong>Relevant Conditions:</strong>
                    <p>
                      Max 7-day temp: {Math.max(...weather.daily.map((d) => d.maxTempCelsius))}°C · Accumulated 7-day rain: {weather.daily.reduce((sum, d) => sum + d.precipitationSumMm, 0).toFixed(1)} mm.
                    </p>
                  </div>
                  <div>
                    <strong>Suggested Action:</strong>
                    <p>
                      {weather.indices.droughtRiskLevel === "HIGH"
                        ? "Prepare supplemental irrigation cycles and check root mulch to conserve moisture."
                        : "Moisture balance is stable. Rain-fed crops have adequate transpiration reserve."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Agricultural Forecast Grid */}
          <div className="panel forecast-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker">Extended Planning Horizon</span>
                <h3>7-Day Agricultural Forecast</h3>
              </div>
              <span className="panel-hint">Updated hourly from regional meteorological models</span>
            </div>

            <div className="daily-forecast-grid">
              {weather.daily.map((day, idx) => {
                const dayName =
                  idx === 0
                    ? "Today"
                    : idx === 1
                    ? "Tomorrow"
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
