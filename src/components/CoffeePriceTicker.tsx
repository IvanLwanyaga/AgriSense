import { useEffect, useState, type FormEvent } from "react";
import {
  COFFEE_PRICE_PRODUCTS,
  publishDailyCoffeePrices,
  refreshUcdaCoffeePrices,
  restoreAutomaticCoffeePrices,
  subscribeToDailyCoffeePrices,
  subscribeToCoffeePriceHistory,
  type CoffeePriceHistoryPoint,
  type CoffeePriceProductId,
  type DailyCoffeePriceInput,
  type DailyCoffeePriceSnapshot,
} from "../services/coffeePriceService";

type PriceDraft = {
  effectiveDate: string;
  source: string;
  rates: Record<CoffeePriceProductId, { minimum: string; maximum: string }>;
};

function todayAsDateInput(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function createDraft(prices: DailyCoffeePriceSnapshot | null): PriceDraft {
  return {
    effectiveDate: prices?.effectiveDate || todayAsDateInput(),
    source: prices?.source || "",
    rates: {
      robustaKiboko: {
        minimum: prices ? String(prices.rates.robustaKiboko.minimum) : "",
        maximum: prices ? String(prices.rates.robustaKiboko.maximum) : "",
      },
      robustaFaq: {
        minimum: prices ? String(prices.rates.robustaFaq.minimum) : "",
        maximum: prices ? String(prices.rates.robustaFaq.maximum) : "",
      },
      arabicaParchment: {
        minimum: prices ? String(prices.rates.arabicaParchment.minimum) : "",
        maximum: prices ? String(prices.rates.arabicaParchment.maximum) : "",
      },
    },
  };
}

const ugxFormatter = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });

function formatPriceRange(minimum: number, maximum: number): string {
  return `${ugxFormatter.format(minimum)}–${ugxFormatter.format(maximum)} UGX/kg`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function CoffeePriceTrend({
  history,
  error,
  productId,
}: {
  history: CoffeePriceHistoryPoint[];
  error: string;
  productId: CoffeePriceProductId;
}) {
  if (error) return <p className="coffee-price-message coffee-price-error" role="status">Price trend unavailable: {error}</p>;
  const values = history.map((point) => ({
    date: point.effectiveDate,
    ...point.rates[productId],
    midpoint: (point.rates[productId].minimum + point.rates[productId].maximum) / 2,
  }));
  if (values.length < 2) {
    return <p className="coffee-price-message">Trend history starts with the first UCDA snapshot and builds as new daily reports arrive.</p>;
  }

  const width = 720;
  const height = 220;
  const padX = 44;
  const padY = 24;
  const allPrices = values.flatMap((point) => [point.minimum, point.maximum]);
  const minimum = Math.min(...allPrices);
  const maximum = Math.max(...allPrices);
  const spread = Math.max(maximum - minimum, 1);
  const x = (index: number) => padX + (index / (values.length - 1)) * (width - padX * 2);
  const y = (price: number) => height - padY - ((price - minimum) / spread) * (height - padY * 2);
  const midpointLine = values.map((point, index) => `${x(index)},${y(point.midpoint)}`).join(" ");
  const priceBand = [
    ...values.map((point, index) => `${x(index)},${y(point.maximum)}`),
    ...values.slice().reverse().map((point, reverseIndex) => {
      const index = values.length - 1 - reverseIndex;
      return `${x(index)},${y(point.minimum)}`;
    }),
  ].join(" ");
  const first = values[0];
  const last = values[values.length - 1];
  const change = last.midpoint - first.midpoint;
  const changePercent = first.midpoint ? (change / first.midpoint) * 100 : 0;

  return <div className="coffee-price-trend">
    <div className="coffee-price-trend-summary">
      <span>{values.length} UCDA daily reports</span>
      <strong className={change > 0 ? "trend-up" : change < 0 ? "trend-down" : ""}>
        {change > 0 ? "+" : ""}{ugxFormatter.format(Math.round(change))} UGX/kg ({changePercent > 0 ? "+" : ""}{changePercent.toFixed(1)}%)
      </strong>
    </div>
    <svg className="coffee-price-trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`UCDA daily coffee price trend from ${formatDate(first.date)} to ${formatDate(last.date)}`}>
      <line x1={padX} x2={width - padX} y1={height - padY} y2={height - padY} className="trend-axis" />
      <text x={padX - 6} y={padY + 4} textAnchor="end" className="trend-label">{ugxFormatter.format(maximum)}</text>
      <text x={padX - 6} y={height - padY + 4} textAnchor="end" className="trend-label">{ugxFormatter.format(minimum)}</text>
      <polygon points={priceBand} className="trend-range-band" />
      <polyline points={midpointLine} className="trend-midline" />
      <circle cx={x(values.length - 1)} cy={y(last.midpoint)} r="4" className="trend-current-point" />
      <text x={padX} y={height - 4} className="trend-label">{formatDate(first.date)}</text>
      <text x={width - padX} y={height - 4} textAnchor="end" className="trend-label">{formatDate(last.date)}</text>
    </svg>
    <small>Line shows the midpoint of UCDA's quoted range; shaded area shows its minimum-to-maximum range.</small>
  </div>;
}

export default function CoffeePriceTicker({ canEdit }: { canEdit: boolean }) {
  const [prices, setPrices] = useState<DailyCoffeePriceSnapshot | null>(null);
  const [automaticPrices, setAutomaticPrices] = useState<DailyCoffeePriceSnapshot | null>(null);
  const [priceHistory, setPriceHistory] = useState<CoffeePriceHistoryPoint[]>([]);
  const [priceHistoryError, setPriceHistoryError] = useState("");
  const [trendProduct, setTrendProduct] = useState<CoffeePriceProductId>("robustaFaq");
  const [adminOverride, setAdminOverride] = useState<DailyCoffeePriceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<PriceDraft>(() => createDraft(null));
  const [formError, setFormError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToDailyCoffeePrices(
      (feed) => {
        setPrices(feed.active);
        setAutomaticPrices(feed.automatic);
        setAdminOverride(feed.adminOverride);
        setIsLoading(false);
        setLoadError("");
      },
      (error) => {
        setIsLoading(false);
        setLoadError(error.message);
      }
    );
    const unsubscribeHistory = subscribeToCoffeePriceHistory(
      (history) => {
        setPriceHistory(history);
        setPriceHistoryError("");
      },
      (error) => {
        console.warn("UCDA price trend could not be loaded.", error);
        setPriceHistoryError(error.message);
      },
    );
    const refresh = async () => {
      try {
        await refreshUcdaCoffeePrices();
      } catch (error) {
        if (active) console.warn("UCDA price refresh is unavailable.", error);
      }
    };
    void refresh();
    const refreshTimer = window.setInterval(() => void refresh(), 60 * 60 * 1000);
    return () => {
      active = false;
      unsubscribe();
      unsubscribeHistory();
      window.clearInterval(refreshTimer);
    };
  }, [retryCount]);

  function beginEditing() {
    setDraft(createDraft(prices));
    setFormError("");
    setIsEditing(true);
  }

  function updateRate(
    productId: CoffeePriceProductId,
    bound: "minimum" | "maximum",
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      rates: {
        ...current.rates,
        [productId]: {
          ...current.rates[productId],
          [bound]: value,
        },
      },
    }));
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const input: DailyCoffeePriceInput = {
      effectiveDate: draft.effectiveDate,
      source: draft.source,
      rates: {
        robustaKiboko: {
          minimum: Number(draft.rates.robustaKiboko.minimum),
          maximum: Number(draft.rates.robustaKiboko.maximum),
        },
        robustaFaq: {
          minimum: Number(draft.rates.robustaFaq.minimum),
          maximum: Number(draft.rates.robustaFaq.maximum),
        },
        arabicaParchment: {
          minimum: Number(draft.rates.arabicaParchment.minimum),
          maximum: Number(draft.rates.arabicaParchment.maximum),
        },
      },
    };

    if (Object.values(draft.rates).some((range) => !range.minimum || !range.maximum)) {
      setFormError("Enter both the minimum and maximum price for each coffee type.");
      return;
    }

    setIsSaving(true);
    try {
      await publishDailyCoffeePrices(input);
      setIsEditing(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Coffee prices could not be published.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRestoreAutomaticPrices() {
    setFormError("");
    setIsSaving(true);
    try {
      await restoreAutomaticCoffeePrices();
      setIsEditing(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Automatic coffee prices could not be restored.");
    } finally {
      setIsSaving(false);
    }
  }

  // Keep an unavailable feed from surfacing an empty panel or backend error to farmers.
  // Administrators still need the editor so they can publish a dated bulletin.
  if (!isLoading && !prices && !canEdit) return null;

  return (
    <section className="panel coffee-price-ticker" aria-label="Coffee farmgate price ticker">
      <div className="coffee-price-header">
        <div>
          <span className="section-kicker">Uganda coffee market</span>
          <h2>Daily farmgate prices</h2>
        </div>
        <span className="coffee-price-feed-badge">
          {adminOverride ? "Admin price override" : automaticPrices ? "UCDA daily market feed" : "UCDA feed loading"}
        </span>
      </div>

      {isLoading ? (
        <p className="coffee-price-message" role="status">Loading the latest price bulletin…</p>
      ) : loadError ? (
        <div className="coffee-price-message coffee-price-error" role="alert">
          <span>{loadError}</span>
          <button
            className="outline-button-sm"
            type="button"
            onClick={() => {
              setIsLoading(true);
              setLoadError("");
              setRetryCount((count) => count + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : prices ? (
        <>
          <div className="coffee-price-grid" aria-live="polite">
            {COFFEE_PRICE_PRODUCTS.map((product) => {
              const rate = prices.rates[product.id];
              return (
                <div className="coffee-price-item" key={product.id}>
                  <span>{product.label}</span>
                  <strong>{formatPriceRange(rate.minimum, rate.maximum)}</strong>
                </div>
              );
            })}
          </div>
          <div className="coffee-price-meta">
            <span>Effective {formatDate(prices.effectiveDate)}</span>
            <span>Source: {prices.source}</span>
            <span>Feed checked {new Date(prices.updatedAt).toLocaleString()}</span>
          </div>
          <div className="coffee-price-trend-heading">
            <div><h3>Daily price trend</h3><p>Official UCDA market reports</p></div>
            <label>Product <select value={trendProduct} onChange={(event) => setTrendProduct(event.target.value as CoffeePriceProductId)}>
              {COFFEE_PRICE_PRODUCTS.map((product) => <option key={product.id} value={product.id}>{product.label}</option>)}
            </select></label>
          </div>
          <CoffeePriceTrend history={priceHistory} error={priceHistoryError} productId={trendProduct} />
        </>
      ) : (
        <p className="coffee-price-message">
          UCDA prices are not available yet. An authorized administrator can publish a dated price override.
        </p>
      )}
      <div className="coffee-price-footer">
        <small>
          UCDA figures are daily market-report benchmarks, not intraday quotes. Confirm the local buyer offer; admin-published prices override the automatic feed. <a href="https://new.ugandacoffee.go.ug/node/202" target="_blank" rel="noreferrer">Open UCDA report</a>.
        </small>
        {canEdit && !isEditing && !isLoading && !loadError && (
          <div className="coffee-price-admin-actions">
            <button className="outline-button-sm" type="button" onClick={beginEditing}>
              {adminOverride ? "Update admin prices" : "Publish admin override"}
            </button>
            {adminOverride && automaticPrices && (
              <button
                className="text-button"
                type="button"
                disabled={isSaving}
                onClick={() => void handleRestoreAutomaticPrices()}
              >
                Use automatic UCDA prices
              </button>
            )}
          </div>
        )}
      </div>

      {canEdit && isEditing && (
        <form className="coffee-price-editor" onSubmit={(event) => void handlePublish(event)}>
          <div className="coffee-price-editor-heading">
            <h3>{prices ? "Update price bulletin" : "Publish price bulletin"}</h3>
            <button className="text-button" type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
          <div className="coffee-price-editor-meta">
            <label>
              Effective date
              <input
                type="date"
                required
                value={draft.effectiveDate}
                onChange={(event) => setDraft((current) => ({ ...current, effectiveDate: event.target.value }))}
              />
            </label>
            <label>
              Source / reference
              <input
                type="text"
                required
                maxLength={300}
                placeholder="e.g. UCDA bulletin URL or market report"
                value={draft.source}
                onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))}
              />
            </label>
          </div>
          <div className="coffee-price-editor-grid">
            {COFFEE_PRICE_PRODUCTS.map((product) => (
              <fieldset key={product.id}>
                <legend>{product.label} (UGX/kg)</legend>
                <label>
                  Minimum
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={draft.rates[product.id].minimum}
                    onChange={(event) => updateRate(product.id, "minimum", event.target.value)}
                  />
                </label>
                <label>
                  Maximum
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={draft.rates[product.id].maximum}
                    onChange={(event) => updateRate(product.id, "maximum", event.target.value)}
                  />
                </label>
              </fieldset>
            ))}
          </div>
          {formError && <p className="coffee-price-error" role="alert">{formError}</p>}
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Publishing…" : "Publish prices"}
          </button>
        </form>
      )}
    </section>
  );
}
