import { useEffect, useState } from "react";
import {
  COFFEE_PRICE_PRODUCTS,
  subscribeToDailyCoffeePrices,
  type CoffeePriceProductId,
  type DailyCoffeePriceSnapshot,
} from "../services/coffeePriceService";
import type { BctbRiskResult } from "../types/bctb";
import type { Farm } from "../types/farm";

const riskLossDefaults = { LOW: 5, MODERATE: 15, HIGH: 25 } as const;
const ugxFormatter = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });

export default function FarmImpactCalculator({
  farms,
  latestRisk,
}: {
  farms: Farm[];
  latestRisk: BctbRiskResult | null;
}) {
  const [farmId, setFarmId] = useState("");
  const [prices, setPrices] = useState<DailyCoffeePriceSnapshot | null>(null);
  const [priceError, setPriceError] = useState("");
  const [priceType, setPriceType] = useState<CoffeePriceProductId>("robustaKiboko");
  const [yieldPerAcre, setYieldPerAcre] = useState("350");
  const [lossPercent, setLossPercent] = useState<string | null>(null);
  const [laborHours, setLaborHours] = useState("4");
  const [hourlyLaborCost, setHourlyLaborCost] = useState("0");
  const [otherCost, setOtherCost] = useState("0");

  useEffect(() => subscribeToDailyCoffeePrices(
    (feed) => setPrices(feed.active),
    (error) => setPriceError(error.message)
  ), []);

  const farm = farms.find((item) => item.id === farmId) || farms[0];
  const coffeeAcres = farm?.coffeeAcreage ?? farm?.area ?? 0;
  const harvestEstimate = coffeeAcres * (Number(yieldPerAcre) || 0);
  const selectedLossPercent = lossPercent ?? String(latestRisk ? riskLossDefaults[latestRisk.riskLevel] : 15);
  const lossKg = harvestEstimate * (Number(selectedLossPercent) || 0) / 100;
  const currentPrice = prices?.rates[priceType];
  const estimatedRevenueSaved = currentPrice ? lossKg * ((currentPrice.minimum + currentPrice.maximum) / 2) : null;
  const laborCost = (Number(laborHours) || 0) * (Number(hourlyLaborCost) || 0);
  const netBenefit = estimatedRevenueSaved === null ? null : estimatedRevenueSaved - laborCost - (Number(otherCost) || 0);
  const returnPerHour = netBenefit !== null && Number(laborHours) > 0 ? netBenefit / Number(laborHours) : null;

  const activeRisk = latestRisk?.riskLevel || "MODERATE";

  if (!farms.length) return null;

  return (
    <section className="panel farm-impact-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">Pest-to-Pocket estimate</span>
          <h3>Potential harvest and UGX at risk</h3>
        </div>
        <span className={`risk-badge-sm ${activeRisk.toLowerCase()}`}>{latestRisk ? `${activeRisk} screening` : "Scenario estimate"}</span>
      </div>
      <p className="farm-impact-explainer">Planning estimate only. Adjust yield, loss, local price, and labor assumptions to match your farm; screening risk is not a forecast of actual harvest loss.</p>

      <div className="farm-impact-inputs">
        <label>Farm
          <select value={farm?.id || ""} onChange={(event) => setFarmId(event.target.value)}>
            {farms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>Assumed yield (kg/acre)
          <input type="number" min="0" step="1" value={yieldPerAcre} onChange={(event) => setYieldPerAcre(event.target.value)} />
        </label>
        <label>Scenario harvest loss (%)
          <input type="number" min="0" max="100" step="1" value={selectedLossPercent} onChange={(event) => setLossPercent(event.target.value)} />
        </label>
        <label>Price basis
          <select value={priceType} onChange={(event) => setPriceType(event.target.value as CoffeePriceProductId)}>
            {COFFEE_PRICE_PRODUCTS.map((product) => <option key={product.id} value={product.id}>{product.label}</option>)}
          </select>
        </label>
        <label>Sanitation labor (hours)
          <input type="number" min="0" step="0.5" value={laborHours} onChange={(event) => setLaborHours(event.target.value)} />
        </label>
        <label>Labor cost (UGX/hour)
          <input type="number" min="0" step="100" value={hourlyLaborCost} onChange={(event) => setHourlyLaborCost(event.target.value)} />
        </label>
        <label>Other intervention cost (UGX)
          <input type="number" min="0" step="100" value={otherCost} onChange={(event) => setOtherCost(event.target.value)} />
        </label>
      </div>

      <div className="farm-impact-results" aria-live="polite">
        <div><small>Estimated harvest basis</small><strong>{harvestEstimate.toFixed(0)} kg</strong><small>{coffeeAcres || "No"} coffee acres × {Number(yieldPerAcre) || 0} kg/acre</small></div>
        <div><small>Scenario harvest at risk</small><strong>{lossKg.toFixed(0)} kg</strong><small>{Number(selectedLossPercent) || 0}% planning assumption</small></div>
        <div><small>Potential gross value preserved</small><strong>{estimatedRevenueSaved === null ? "Price unavailable" : `${ugxFormatter.format(estimatedRevenueSaved)} UGX`}</strong><small>{currentPrice ? `Midpoint of ${ugxFormatter.format(currentPrice.minimum)}–${ugxFormatter.format(currentPrice.maximum)} UGX/kg` : "An admin-published price bulletin is required"}</small></div>
        <div><small>Estimated net benefit</small><strong>{netBenefit === null ? "—" : `${ugxFormatter.format(netBenefit)} UGX`}</strong><small>After entered labor and other costs</small></div>
      </div>
      {returnPerHour !== null && <p className="farm-impact-return">Estimated net benefit per labor hour: <strong>{ugxFormatter.format(returnPerHour)} UGX/hour</strong></p>}
      {priceError && <p className="form-error" role="alert">{priceError}</p>}
      {prices && <small className="farm-impact-source">Price source: {prices.source}, effective {prices.effectiveDate}. This calculation is not an agronomic yield forecast.</small>}
    </section>
  );
}
