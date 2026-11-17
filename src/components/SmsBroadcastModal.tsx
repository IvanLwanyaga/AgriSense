import { useState, useEffect } from "react";
import { getSmsDispatchLogs, sendSmsAlert, type SmsMessage } from "../services/smsService";
import { useLanguage } from "../context/LanguageContext";

interface SmsBroadcastModalProps {
  onClose: () => void;
  defaultFarmName?: string;
  defaultAdvice?: string;
}

export default function SmsBroadcastModal({
  onClose,
  defaultFarmName = "Kato Family Mixed Farm",
  defaultAdvice = "Soil moisture is low (18%). Supplemental irrigation recommended today.",
}: SmsBroadcastModalProps) {
  const { language, t } = useLanguage();
  const [logs, setLogs] = useState<SmsMessage[]>([]);
  const [phone, setPhone] = useState("+256 772 ");
  const [farmerName, setFarmerName] = useState("Kato Joseph");
  const [farmName, setFarmName] = useState(defaultFarmName);
  const [adviceText, setAdviceText] = useState(defaultAdvice);
  const [category, setCategory] = useState<"DROUGHT_RISK" | "IRRIGATION" | "DISEASE_ALERT" | "WEATHER_WARNING">("IRRIGATION");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLogs(getSmsDispatchLogs());
  }, []);

  function handleSendSms(e: React.FormEvent) {
    e.preventDefault();
    const sent = sendSmsAlert(phone, farmerName, farmName, category, adviceText, language);
    setLogs([sent, ...logs]);
    setSuccessMsg(t.smsSentSuccessfully);
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content sms-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-badge-row">
            <span className="priority-tag critical">GSM Gateway</span>
            <span className="model-tag">MTN / Airtel Uganda</span>
          </div>
          <h2>{t.smsAlerts}</h2>
          <p className="modal-subtitle">
            Dispatch concise, actionable hazard notifications to farmers with basic non-smartphone feature phones.
          </p>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="modal-body">
          {successMsg && <div className="form-success">{successMsg}</div>}

          <form onSubmit={handleSendSms} className="sms-form">
            <div className="form-row-2">
              <label>
                Farmer Phone Number
                <input
                  type="text"
                  placeholder="+256 772 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              <label>
                Farmer Name
                <input
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-row-2">
              <label>
                Target Farm
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                />
              </label>
              <label>
                Alert Hazard Type
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="IRRIGATION">Irrigation Deficit</option>
                  <option value="DROUGHT_RISK">Drought Warning</option>
                  <option value="DISEASE_ALERT">Foliar Pathogen Risk</option>
                  <option value="WEATHER_WARNING">Severe Weather / Wind</option>
                </select>
              </label>
            </div>

            <label>
              SMS Advisory Message (Max 160 chars)
              <textarea
                rows={2}
                maxLength={140}
                value={adviceText}
                onChange={(e) => setAdviceText(e.target.value)}
                required
              />
              <small className="char-count">
                {adviceText.length} / 140 characters (Standard GSM-7 1-part SMS)
              </small>
            </label>

            <button type="submit" className="primary-button">
              📡 {t.sendSmsToFarmer} (50 UGX)
            </button>
          </form>

          {/* Dispatched SMS History */}
          <div className="sms-history-section">
            <h4>Recent Cellular Dispatches ({logs.length})</h4>
            <div className="sms-logs-list">
              {logs.map((log) => (
                <div className="sms-log-item" key={log.id}>
                  <div className="sms-log-header">
                    <div>
                      <strong>{log.farmerName} ({log.recipientPhone})</strong>
                      <span className="carrier-badge">{log.networkCarrier}</span>
                    </div>
                    <span className="delivery-status">✓ {log.status}</span>
                  </div>
                  <p className="sms-log-text">"{log.messageText}"</p>
                  <div className="sms-log-foot">
                    <span>{log.characterCount} chars · Cost: {log.costUgx} UGX</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="select-button" onClick={onClose}>
            Close SMS Gateway
          </button>
        </footer>
      </div>
    </div>
  );
}

