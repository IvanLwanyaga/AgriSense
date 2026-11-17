import { useState, useEffect } from "react";
import { getActivities, logActivity } from "../services/activityService";
import { getFarms, getFields } from "../services/firestoreService";
import type { FarmActivity, FarmActivityType } from "../types/activity";
import type { Farm, Field } from "../types/farm";
import { useAuth } from "../context/useAuth";
import type { AppPage } from "../types/navigation";

export default function ActivitiesPage({ onNavigate }: { onNavigate?: (page: AppPage) => void }) {
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [journalFieldNames, setJournalFieldNames] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [activityType, setActivityType] = useState<FarmActivityType>("WEEDING");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [inputName, setInputName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [costUgx, setCostUgx] = useState("");
  const [labour, setLabour] = useState("1");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    getFarms(user?.uid, profile?.organizationId).then((fList) => {
      setFarms(fList);
      if (fList.length > 0) {
        setSelectedFarmId(fList[0].id);
        setActivities(getActivities(fList[0].id));
        getFields(fList[0].id).then((fldList) => {
          const activeFields = fldList.filter((field) => field.status === "ACTIVE");
          setFields(activeFields);
          setJournalFieldNames(Object.fromEntries(activeFields.map((field) => [field.id, field.name])));
          setSelectedFieldId(activeFields[0]?.id || "");
        });
      }
    });
  }, [user?.uid, profile?.organizationId]);

  function handleFarmChange(farmId: string) {
    setSelectedFarmId(farmId);
    setSelectedFieldId("");
    setActivities(getActivities(farmId));
    getFields(farmId).then((fldList) => {
      const activeFields = fldList.filter((field) => field.status === "ACTIVE");
      setFields(activeFields);
      setJournalFieldNames(Object.fromEntries(activeFields.map((field) => [field.id, field.name])));
      setSelectedFieldId(activeFields[0]?.id || "");
    });
  }

  function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedFarmId) return;
    const created = logActivity({
      farmId: selectedFarmId,
      fieldId: selectedFieldId || undefined,
      farmerId: user.uid,
      activityType,
      title,
      date,
      inputName: inputName || undefined,
      quantityApplied: quantity ? parseFloat(quantity) : undefined,
      quantityUnit: inputName ? unit : undefined,
      costUgx: costUgx ? parseInt(costUgx, 10) : undefined,
      labourCount: labour ? parseInt(labour, 10) : undefined,
      notes: notes || undefined,
    });

    setActivities([created, ...activities]);
    setShowModal(false);
    setTitle("");
    setInputName("");
    setQuantity("");
    setCostUgx("");
    setNotes("");
  }

  return (
    <section className="workspace-page activities-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">Farm Operations Journal</p>
          <h2>Field Activities & Input Log</h2>
          <p>
            Track planting dates, fertilizer applications, weeding, pest treatments, and harvesting costs.
          </p>
        </div>
        <button className="primary-button" onClick={() => setShowModal(true)} disabled={!farms.length}>
          + Record Farm Activity
        </button>
      </div>
      {farms.length > 0 && (
        <label className="filter-group" style={{ maxWidth: 360, marginBottom: 16 }}>
          Show journal for
          <select value={selectedFarmId} onChange={(event) => handleFarmChange(event.target.value)}>
            {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
          </select>
        </label>
      )}
      {!farms.length && (
        <div className="empty-workspace">
          <div className="empty-icon" aria-hidden="true">+</div>
          <h3>Your farm journal is ready</h3>
          <p>Add a farm first, then create fields or plots and record pruning, scouting, inputs, labour, and harvests here.</p>
          {onNavigate && <button className="primary-button" type="button" onClick={() => onNavigate("farms")}>Set up a farm</button>}
        </div>
      )}
      <p className="settings-info-card">Journal entries are saved on this device and are not synchronized to other devices.</p>

      {/* Summary statistics */}
      <div className="workspace-summary-grid">
        <article className="workspace-summary-card">
          <span className="summary-icon">📝</span>
          <div>
            <strong>{activities.length} Operations Logged</strong>
            <small>Active season tracking</small>
          </div>
        </article>

        <article className="workspace-summary-card">
          <span className="summary-icon">💰</span>
          <div>
            <strong>
              UGX{" "}
              {activities
                .reduce((sum, a) => sum + (a.costUgx || 0), 0)
                .toLocaleString()}
            </strong>
            <small>Total Input & Labour Investment</small>
          </div>
        </article>

        <article className="workspace-summary-card">
          <span className="summary-icon">🌱</span>
          <div>
            <strong>
              {activities.filter((a) => a.activityType === "PLANTING").length} Sowing / Planting Runs
            </strong>
            <small>Crop phenology references</small>
          </div>
        </article>
      </div>

      {/* Timeline List */}
      <div className="panel timeline-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">Chronological Operations</span>
            <h3>Field Log Timeline</h3>
          </div>
        </div>

        <div className="activities-timeline">
          {farms.length > 0 && activities.length === 0 && (
            <div className="empty-workspace">
              <h3>No activities recorded for this farm yet</h3>
              <p>Record your first field task to build a seasonal history for your selected farm.</p>
              <button className="primary-button" type="button" onClick={() => setShowModal(true)}>Record the first activity</button>
            </div>
          )}
          {activities.map((act) => (
            <div className="activity-timeline-item" key={act.id}>
              <div className="act-date-badge">
                <strong>{new Date(act.date).toLocaleDateString("en-UG", { day: "2-digit", month: "short" })}</strong>
                <small>{new Date(act.date).getFullYear()}</small>
              </div>

              <div className="act-content-card">
                <div className="act-header">
                  <div>
                    <h4>{act.title}</h4>
                    <span className="act-type-tag">{act.activityType.replace(/_/g, " ")}</span>
                  </div>
                  {act.costUgx ? (
                    <span className="act-cost-pill">UGX {act.costUgx.toLocaleString()}</span>
                  ) : null}
                </div>

                {act.notes && <p className="act-notes">{act.notes}</p>}
                {act.fieldId && journalFieldNames[act.fieldId] && <small>Field: {journalFieldNames[act.fieldId]}</small>}

                <div className="act-meta-row">
                  {act.inputName && (
                    <span>
                      📦 Applied: <strong>{act.quantityApplied} {act.quantityUnit} of {act.inputName}</strong>
                    </span>
                  )}
                  {act.labourCount && (
                    <span>👥 Labour: {act.labourCount} persons</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Record Activity */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Record Farm Activity</h2>
              <p className="modal-subtitle">
                Log a field management action to keep historical agronomic context.
              </p>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </header>

            <form onSubmit={handleLogActivity} className="modal-form">
              <label>
                Activity Title
                <input
                  type="text"
                  placeholder="e.g. Side-dressing NPK on maize block"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <div className="form-row-2">
                <label>
                  Operation Type
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as FarmActivityType)}
                  >
                    <option value="WEEDING">Weeding</option>
                    <option value="FERTILIZER_APPLICATION">Fertilizer Application</option>
                    <option value="PEST_DISEASE_SPRAYING">Pest / Disease Spraying</option>
                    <option value="IRRIGATION">Supplemental Irrigation</option>
                    <option value="PLANTING">Planting / Sowing</option>
                    <option value="PRUNING">Pruning / De-suckering</option>
                    <option value="FIELD_SCOUTING">Field Scouting</option>
                    <option value="HARVESTING">Harvesting</option>
                  </select>
                </label>

                <label>
                  Date of Operation
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  Farm Site
                  <select
                    value={selectedFarmId}
                    onChange={(e) => handleFarmChange(e.target.value)}
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Field / Plot
                  <select
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                  >
                    <option value="">Farm-wide / no specific field</option>
                    {fields.map((fld) => (
                      <option key={fld.id} value={fld.id}>
                        {fld.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  Input Used (Optional)
                  <input
                    type="text"
                    placeholder="e.g. Urea, NPK, Dithane M-45"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                  />
                </label>
                <div className="input-with-unit">
                  <label>
                    Quantity
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 50"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </label>
                  <label>
                    Unit
                    <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                      <option value="kg">kg</option>
                      <option value="litres">litres</option>
                      <option value="bags">bags</option>
                      <option value="grams">grams</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-row-2">
                <label>
                  Total Cost (Ugandan Shillings - UGX)
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={costUgx}
                    onChange={(e) => setCostUgx(e.target.value)}
                  />
                </label>
                <label>
                  Labourers Involved
                  <input
                    type="number"
                    min="0"
                    value={labour}
                    onChange={(e) => setLabour(e.target.value)}
                  />
                </label>
              </div>

              <label>
                Operational Notes / Observations
                <textarea
                  rows={2}
                  placeholder="Note weather conditions, weed density, or equipment used..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>

              <div className="modal-footer">
                <button
                  type="button"
                  className="select-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={!selectedFarmId || !title.trim()}>
                  Save Activity Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

