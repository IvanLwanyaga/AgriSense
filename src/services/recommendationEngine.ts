import type { AgriculturalRecommendation } from "../types/recommendation";
import type { TelemetryReading } from "../types/iot";
import type { FarmWeatherSummary } from "../types/weather";
import type { Field } from "../types/farm";
import { UGANDAN_CROPS } from "./agronomyData";
import { computeExplainabilityForDecision } from "./xaiService";
import { isSafeForAiInference } from "./dataQualityValidator";
import { logInferenceEvent } from "./governanceService";

const MODEL_VERSION_IRRIGATION = "AgriSense-Irrigation-Heuristic-v1";
const MODEL_VERSION_DISEASE = "AgriSense-Weather-Rule-Heuristic-v1";
const MODEL_VERSION_CROPS = "AgriSense-Crop-Rule-Heuristic-v1";

export function generateRecommendations(
  farmId: string,
  field: Field | undefined,
  telemetry: TelemetryReading,
  weather: FarmWeatherSummary
): AgriculturalRecommendation[] {
  const recommendations: AgriculturalRecommendation[] = [];

  // Data Quality Guard: Section 11 of Master Prompt
  const qualityCheck = isSafeForAiInference(telemetry);
  if (!qualityCheck.safe) {
    recommendations.push({
      id: `REC-ERR-${Date.now()}`,
      farmId,
      fieldId: field?.id,
      fieldName: field?.name,
      type: "SOIL_MANAGEMENT",
      priority: "CRITICAL",
      title: "Data Reliability Notice — Sensor Requires Inspection",
      whatIsHappening: "The system detected an anomaly or missing data in current field sensor telemetry.",
      whyItIsHappening: qualityCheck.reason || "Sensor readings failed physical boundary validation.",
      suggestedAction:
        "Inspect the physical sensor node in the field, check cable connections, battery voltage, or re-calibrate the probe before executing major farming operations.",
      relevantConditionsSummary: [
        `Soil moisture reading: ${telemetry.soilMoisture}%`,
        `Quality flag: ${telemetry.quality}`,
      ],
      confidenceScore: 0.99,
      explainability: computeExplainabilityForDecision(
        "IRRIGATION",
        {
          soilMoisture: telemetry.soilMoisture,
          targetMoistureMin: 30,
          targetMoistureOptimal: 55,
          rainForecastMm: 0,
          rainProbabilityPercent: 0,
          ambientTemperature: telemetry.ambientTemperature,
          relativeHumidity: telemetry.relativeHumidity,
          et0Evapotranspiration: 4.0,
        },
        0.05
      ),
      modelVersion: "AgriSense-DataGuard-v1.0",
      dataQualityStatus: telemetry.quality,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      status: "ACTIVE",
    });

    return recommendations;
  }

  const cropProfile = field?.cropId ? UGANDAN_CROPS[field.cropId] : UGANDAN_CROPS.MAIZE_LONGE;
  const targetMinMoisture = field?.moistureThreshold?.minimum ?? cropProfile.optimalSoilMoisture.minimumPercentage;
  const targetOptimalMoisture = field?.moistureThreshold?.optimal ?? cropProfile.optimalSoilMoisture.optimalPercentage;

  // 1. IRRIGATION TIMING INFERENCE
  const next24hRainProb = weather.hourly.slice(0, 24).reduce((max, h) => Math.max(max, h.precipitationProbabilityPercent), 0);
  const next24hRainMm = weather.daily[0]?.precipitationSumMm ?? 0;
  const et0 = weather.indices.referenceEt0;

  // Decision score based on moisture deficit weighted against rain forecast
  const moistureDeficit = Math.max(0, targetMinMoisture - telemetry.soilMoisture);
  let irrigationScore = 0.2;

  if (telemetry.soilMoisture < targetMinMoisture) {
    irrigationScore += (moistureDeficit / 25) * 0.5;
  }

  if (next24hRainProb > 55 || next24hRainMm > 6.0) {
    irrigationScore -= 0.35; // Hold irrigation because rain is coming
  } else if (next24hRainProb < 20) {
    irrigationScore += 0.2;
  }

  if (et0 > 4.5) {
    irrigationScore += 0.1;
  }

  irrigationScore = Math.max(0.05, Math.min(0.95, irrigationScore));

  const irrigationExplainability = computeExplainabilityForDecision(
    "IRRIGATION",
    {
      soilMoisture: telemetry.soilMoisture,
      targetMoistureMin: targetMinMoisture,
      targetMoistureOptimal: targetOptimalMoisture,
      rainForecastMm: next24hRainMm,
      rainProbabilityPercent: next24hRainProb,
      ambientTemperature: telemetry.ambientTemperature,
      relativeHumidity: telemetry.relativeHumidity,
      et0Evapotranspiration: et0,
    },
    irrigationScore
  );

  if (irrigationScore > 0.55) {
    recommendations.push({
      id: `REC-IRR-${Date.now()}`,
      farmId,
      fieldId: field?.id,
      fieldName: field?.name ?? "North Field",
      cropName: cropProfile.commonName,
      type: "IRRIGATION_TIMING",
      priority: irrigationScore > 0.75 ? "HIGH" : "MEDIUM",
      title: "Supplemental Irrigation Advised",
      whatIsHappening: `Soil moisture (${telemetry.soilMoisture}%) has fallen below the optimal threshold (${targetMinMoisture}%) for ${cropProfile.commonName}.`,
      whyItIsHappening: `Evaporative demand is ${et0} mm/day under warm conditions (${telemetry.ambientTemperature}°C) with only a ${next24hRainProb}% chance of rain in the forecast.`,
      suggestedAction: `Conditions suggest applying light to moderate irrigation (approximately 15–20 mm) in the late afternoon or early morning to minimize evaporation loss.`,
      relevantConditionsSummary: [
        `Soil Moisture: ${telemetry.soilMoisture}% (Target: ${targetOptimalMoisture}%)`,
        `Rain Forecast: ${next24hRainProb}% chance (${next24hRainMm} mm)`,
        `Evaporative Demand: ${et0} mm/day`,
      ],
      confidenceScore: irrigationExplainability.confidenceScore,
      explainability: irrigationExplainability,
      modelVersion: MODEL_VERSION_IRRIGATION,
      dataQualityStatus: telemetry.quality,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      status: "ACTIVE",
    });
  } else {
    recommendations.push({
      id: `REC-IRR-HOLD-${Date.now()}`,
      farmId,
      fieldId: field?.id,
      fieldName: field?.name ?? "North Field",
      cropName: cropProfile.commonName,
      type: "IRRIGATION_TIMING",
      priority: "LOW",
      title: "Hold Irrigation for Now",
      whatIsHappening:
        next24hRainProb > 50
          ? `Rain is expected (${next24hRainProb}% probability, ~${next24hRainMm} mm forecast within 24 hours).`
          : `Current soil moisture (${telemetry.soilMoisture}%) remains adequate for ${cropProfile.commonName}.`,
      whyItIsHappening: `Root-zone water reserves are sufficient or natural precipitation will replenish moisture without incurring pumping costs.`,
      suggestedAction: `Save irrigation water and pump fuel. Continue monitoring soil moisture levels after the anticipated rain event.`,
      relevantConditionsSummary: [
        `Soil Moisture: ${telemetry.soilMoisture}% (Above critical ${targetMinMoisture}%)`,
        `Rain Forecast: ${next24hRainProb}% probability`,
      ],
      confidenceScore: irrigationExplainability.confidenceScore,
      explainability: irrigationExplainability,
      modelVersion: MODEL_VERSION_IRRIGATION,
      dataQualityStatus: telemetry.quality,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      status: "ACTIVE",
    });
  }

  // 2. FUNGAL / PEST DISEASE RISK INFERENCE
  const diseaseRiskWindow = weather.indices.fungalDiseaseRiskWindow || telemetry.relativeHumidity > 80;
  if (diseaseRiskWindow && cropProfile.diseaseRisks.length > 0) {
    const primaryRisk = cropProfile.diseaseRisks[0];
    const diseaseExplainability = computeExplainabilityForDecision(
      "DISEASE_RISK",
      {
        soilMoisture: telemetry.soilMoisture,
        targetMoistureMin: targetMinMoisture,
        targetMoistureOptimal: targetOptimalMoisture,
        rainForecastMm: next24hRainMm,
        rainProbabilityPercent: next24hRainProb,
        ambientTemperature: telemetry.ambientTemperature,
        relativeHumidity: telemetry.relativeHumidity,
        et0Evapotranspiration: et0,
      },
      0.78
    );

    recommendations.push({
      id: `REC-DIS-${Date.now()}`,
      farmId,
      fieldId: field?.id,
      fieldName: field?.name,
      cropName: cropProfile.commonName,
      type: "DISEASE_PEST_RISK",
      priority: "MEDIUM",
      title: `Pathogen Risk Window: ${primaryRisk.name}`,
      whatIsHappening: `Sustained high canopy humidity (${telemetry.relativeHumidity}%) and warm temperatures (${telemetry.ambientTemperature}°C) create favorable incubation conditions for ${primaryRisk.name}.`,
      whyItIsHappening: `Microclimate leaf wetness triggers fungal spore germination according to ${MODEL_VERSION_DISEASE}.`,
      suggestedAction: `Scout field corners and lower canopy leaves. ${primaryRisk.preventionAdvice}`,
      relevantConditionsSummary: [
        `Relative Humidity: ${telemetry.relativeHumidity}% (danger threshold > 80%)`,
        `Canopy Temperature: ${telemetry.ambientTemperature}°C`,
      ],
      confidenceScore: diseaseExplainability.confidenceScore,
      explainability: diseaseExplainability,
      modelVersion: MODEL_VERSION_DISEASE,
      dataQualityStatus: telemetry.quality,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: "ACTIVE",
    });
  }

  // 3. SEASONAL SUITABILITY / SOIL MANAGEMENT
  if (telemetry.soilPh && (telemetry.soilPh < 5.4 || telemetry.soilPh > 7.5)) {
    recommendations.push({
      id: `REC-SOIL-${Date.now()}`,
      farmId,
      fieldId: field?.id,
      fieldName: field?.name,
      type: "SOIL_MANAGEMENT",
      priority: "MEDIUM",
      title: "Soil Acidity Management Recommended",
      whatIsHappening: `Soil pH reading is currently ${telemetry.soilPh}, which is moderately acidic for optimal phosphorus and nitrogen uptake.`,
      whyItIsHappening: `Tropical ferrosol leaching in high-rainfall zones commonly reduces soil base saturation over time.`,
      suggestedAction: `Consider incorporating agricultural lime (calcium carbonate) or well-cured livestock manure/compost during land preparation to buffer soil pH.`,
      relevantConditionsSummary: [
        `Current Soil pH: ${telemetry.soilPh}`,
        `Crop Target Range: ${cropProfile.soilPhRange.optimalMin} - ${cropProfile.soilPhRange.optimalMax} pH`,
      ],
      confidenceScore: 0.88,
      explainability: computeExplainabilityForDecision(
        "CROP_SUITABILITY",
        {
          soilMoisture: telemetry.soilMoisture,
          targetMoistureMin: targetMinMoisture,
          targetMoistureOptimal: targetOptimalMoisture,
          rainForecastMm: 0,
          rainProbabilityPercent: 0,
          ambientTemperature: telemetry.ambientTemperature,
          relativeHumidity: telemetry.relativeHumidity,
          et0Evapotranspiration: et0,
          soilPh: telemetry.soilPh,
        },
        0.7
      ),
      modelVersion: MODEL_VERSION_CROPS,
      dataQualityStatus: telemetry.quality,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
      status: "ACTIVE",
    });
  }

  // Log inference events for audit & model governance (Section 21)
  recommendations.forEach((rec) => {
    logInferenceEvent({
      modelId: rec.modelVersion,
      modelVersion: rec.modelVersion,
      farmId,
      fieldId: field?.id,
      inputTelemetrySnapshot: {
        soilMoisture: telemetry.soilMoisture,
        soilTemp: telemetry.soilTemperature,
        airTemp: telemetry.ambientTemperature,
        humidity: telemetry.relativeHumidity,
        rainProb: next24hRainProb,
        quality: telemetry.quality,
      },
      outputPrediction: rec.title,
      confidenceScore: rec.confidenceScore,
      topShapFeatures: rec.explainability.topDrivers.map((d) => ({
        feature: d.featureName,
        shapValue: d.shapValue,
      })),
      limeFidelityR2: rec.explainability.limeSummary.localR2Score,
      advisoryTextGenerated: rec.suggestedAction,
    });
  });

  return recommendations;
}
