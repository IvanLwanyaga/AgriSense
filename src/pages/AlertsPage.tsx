import { useState, useEffect, useCallback } from "react";
import { getAlerts, acknowledgeAlert, resolveAlert, subscribeToAlerts } from "../services/alertService";
import { getFarms } from "../services/firestoreService";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import type { FarmAlert } from "../types/alert";

export default function AlertsPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [farmIds, setFarmIds] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");

  const refreshAlerts = useCallback(() => {
    setAlerts(farmIds.flatMap((farmId) => getAlerts(farmId)));
  }, [farmIds]);

  useEffect(() => {
    let active = true;
    getFarms(user?.uid, profile?.organizationId).then((farms) => {
      if (active) setFarmIds(farms.map((farm) => farm.id));
    });
    return () => { active = false; };
  }, [user?.uid, profile?.organizationId]);

  useEffect(() => {
    refreshAlerts();
    return subscribeToAlerts(refreshAlerts);
  }, [refreshAlerts]);

  function handleAcknowledge(id: string) {
    acknowledgeAlert(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a))
    );
  }

  function handleResolve(id: string) {
    resolveAlert(id);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "RESOLVED", resolvedAt: new Date().toISOString() } : a
      )
    );
  }

  const filteredAlerts = alerts.filter((a) => {
    if (selectedSeverity !== "ALL" && a.severity !== selectedSeverity) return false;
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;

  return (
    <section className="workspace-page alerts-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">{t.recEyebrow}</p>
          <h2>{t.alerts}</h2>
          <p>
            {t.screeningWarningText}
          </p>
        </div>
      </div>

      {/* Severity Filter Bar */}
      <div className="rec-filters-bar">
        <div className="filter-group">
          <label>Filter Severity:</label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="rec-count-badge">
          Active Hazards Requiring Attention: <strong>{activeCount}</strong>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="empty-workspace">
          <div className="empty-icon">✓</div>
          <h3>{farmIds.length ? "No active alerts" : "Add a farm to start monitoring"}</h3>
          <p>{farmIds.length
            ? "Weather alerts are checked when you open the workspace. Higher-risk BCTB screening results are added when you submit a screening."
            : "Add a farm with a saved location so AgriSense can check local weather conditions."}</p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map((alert) => {
            const isResolved = alert.status === "RESOLVED";
            const isAck = alert.status === "ACKNOWLEDGED";

            return (
              <article
                key={alert.id}
                className={`alert-card-item ${alert.severity.toLowerCase()} ${
                  isResolved ? "resolved" : ""
                }`}
              >
                <div className="alert-card-header">
                  <div className="alert-tags">
                    <span className={`severity-tag ${alert.severity.toLowerCase()}`}>
                      {alert.severity}
                    </span>
                    <span className="category-tag">
                      {alert.category.replace(/_/g, " ")}
                    </span>
                    {alert.fieldName && (
                      <span className="field-tag">📍 {alert.fieldName}</span>
                    )}
                  </div>

                  <span className={`status-badge ${alert.status.toLowerCase()}`}>
                    {alert.status}
                  </span>
                </div>

                <h3 className="alert-title">{alert.title}</h3>
                <p className="alert-desc">{alert.description}</p>

                <div className="mitigation-box">
                  <strong>Suggested Mitigation Action:</strong>
                  <p>{alert.suggestedMitigation}</p>
                </div>

                <div className="alert-card-footer">
                  <small className="alert-time">
                    Detected: {new Date(alert.detectedAt).toLocaleString()}
                    {alert.resolvedAt && ` · Resolved: ${new Date(alert.resolvedAt).toLocaleTimeString()}`}
                  </small>

                  <div className="alert-actions">
                    {!isResolved && (
                      <>
                        {!isAck && (
                          <button
                            className="secondary-button"
                            onClick={() => handleAcknowledge(alert.id)}
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          className="primary-button small"
                          onClick={() => handleResolve(alert.id)}
                        >
                          Mark as Resolved
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

