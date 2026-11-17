import { useEffect, useState, type FormEvent } from "react";
import {
  COFFEE_PRICE_PRODUCTS,
  publishDailyCoffeePrices,
  refreshUcdaCoffeePrices,
  restoreAutomaticCoffeePrices,
  subscribeToDailyCoffeePrices,
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

export default function CoffeePriceTicker({ canEdit }: { canEdit: boolean }) {
  const [prices, setPrices] = useState<DailyCoffeePriceSnapshot | null>(null);
  const [automaticPrices, setAutomaticPrices] = useState<DailyCoffeePriceSnapshot | null>(null);
  const [adminOverride, setAdminOverride] = useState<DailyCoffeePriceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshError, setRefreshError] = useState("");
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
    const refresh = async () => {
      try {
        await refreshUcdaCoffeePrices();
        if (active) setRefreshError("");
      } catch (error) {
        if (active) setRefreshError(error instanceof Error ? error.message : "UCDA prices could not be refreshed.");
      }
    };
    void refresh();
    const refreshTimer = window.setInterval(() => void refresh(), 60 * 60 * 1000);
    return () => {
      active = false;
      unsubscribe();
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
          </div>
        </>
      ) : (
        <p className="coffee-price-message">
          UCDA prices are not available yet. An authorized administrator can publish a dated price override.
        </p>
      )}
      {refreshError && (
        <p className="coffee-price-message coffee-price-error" role="status">
          Automatic UCDA refresh failed: {refreshError}
          <button
            className="outline-button-sm"
            type="button"
            onClick={() => {
              setIsLoading(true);
              setLoadError("");
              setRetryCount((count) => count + 1);
            }}
          >
            Retry feed
          </button>
        </p>
      )}

      <div className="coffee-price-footer">
        <small>
          UCDA figures come from its daily market report. Confirm the local buyer offer; admin-published prices override the automatic feed.
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
