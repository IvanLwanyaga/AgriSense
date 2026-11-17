import type { FarmAlert, AlertSeverity } from "../types/alert";
import type { BctbRiskResult } from "../types/bctb";
import type { FarmWeatherSummary } from "../types/weather";

const ALERTS_STORAGE_KEY = "agrisense_farm_alerts_v2";
const ALERTS_UPDATED_EVENT = "agrisense-alerts-updated";

function saveAlerts(alerts: FarmAlert[]): void {
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  window.dispatchEvent(new Event(ALERTS_UPDATED_EVENT));
}

export function subscribeToAlerts(callback: () => void): () => void {
  window.addEventListener(ALERTS_UPDATED_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(ALERTS_UPDATED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getAlerts(farmId?: string): FarmAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!raw) return [];
    const alerts: FarmAlert[] = JSON.parse(raw);
    const currentAlerts = alerts.filter((alert) => alert.category !== "HARDWARE_CONNECTIVITY");
    return farmId ? currentAlerts.filter((alert) => alert.farmId === farmId) : currentAlerts;
  } catch {
    return [];
  }
}

export function acknowledgeAlert(alertId: string): void {
  const alerts = getAlerts();
  const alert = alerts.find((item) => item.id === alertId);
  if (alert) {
    alert.status = "ACKNOWLEDGED";
    saveAlerts(alerts);
  }
}

export function resolveAlert(alertId: string): void {
  const alerts = getAlerts();
  const alert = alerts.find((item) => item.id === alertId);
  if (alert) {
    alert.status = "RESOLVED";
    alert.resolvedAt = new Date().toISOString();
    saveAlerts(alerts);
  }
}

export function evaluateWeatherAlerts(farmId: string, weather: FarmWeatherSummary): FarmAlert[] {
  const currentAlerts = getAlerts(farmId);
  const newAlerts: FarmAlert[] = [];
  const addAlert = (category: FarmAlert["category"], severity: AlertSeverity, title: string, description: string, suggestedMitigation: string) => {
    if (currentAlerts.some((alert) => alert.category === category && alert.status !== "RESOLVED")) return;
    newAlerts.push({
      id: `ALT-${category}-${Date.now()}`,
      farmId,
      category,
      severity,
      title,
      description,
      suggestedMitigation,
      detectedAt: new Date().toISOString(),
      status: "ACTIVE",
    });
  };

  if (["HIGH", "SEVERE"].includes(weather.indices.droughtRiskLevel)) {
    const severe = weather.indices.droughtRiskLevel === "SEVERE";
    addAlert("DROUGHT_RISK", severe ? "HIGH" : "MEDIUM", "Dry spell risk",
      `${weather.district} weather data indicates ${weather.indices.droughtRiskLevel.toLowerCase()} drought risk. This is a regional weather estimate, not a soil measurement.`,
      "Check soil and coffee trees in the field. Conserve moisture with suitable mulch and ask an extension officer before making irrigation decisions.");
  }
  if (weather.indices.heatStressRisk === "HIGH") {
    addAlert("HEAT_STRESS", "MEDIUM", "High temperature risk",
      `Local weather conditions indicate elevated heat stress risk in ${weather.district}.`,
      "Scout for wilting and avoid stressful field operations during the hottest part of the day.");
  }
  if (weather.indices.fungalDiseaseRiskWindow) {
    addAlert("DISEASE_PEST_WINDOW", "LOW", "Conditions favour disease scouting",
      `Warm, humid weather in ${weather.district} may favour some fungal diseases. This is a weather warning, not a diagnosis.`,
      "Inspect leaves and twigs for symptoms and ask an extension officer to verify suspected disease before treatment.");
  }

  if (!newAlerts.length) return currentAlerts;
  const merged = [...newAlerts, ...currentAlerts];
  saveAlerts(merged);
  return merged;
}

export function recordBctbScreeningAlert(result: BctbRiskResult): void {
  if (!result.farmId || result.riskLevel === "LOW") return;
  const alerts = getAlerts(result.farmId);
  const sourceId = result.id || result.createdAt;
  if (alerts.some((alert) => alert.sourceId === sourceId)) return;
  const newAlert: FarmAlert = {
    id: `ALT-BCTB-${sourceId}`,
    farmId: result.farmId,
    category: "BCTB_SCREENING",
    severity: result.riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
    title: `${result.riskLevel} BCTB screening result`,
    description: `A farmer screening recorded ${result.riskLevel.toLowerCase()} risk. Screening is not an official diagnosis; an extension officer should verify on the farm.`,
    suggestedMitigation: result.safeAdvisory.join(" ") || result.nextSteps,
    detectedAt: result.createdAt,
    status: "ACTIVE",
    sourceId,
  };
  saveAlerts([newAlert, ...alerts]);
}
