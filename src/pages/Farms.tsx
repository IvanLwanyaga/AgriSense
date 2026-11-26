import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import GooglePlacesLocationPicker, { type SelectedGoogleLocation } from "../components/GooglePlacesLocationPicker";
import {
  createFarm,
  createField,
  getFarms,
  getFields,
  deleteFarm,
} from "../services/firestoreService";
import type { Farm, Field } from "../types/farm";
import { UGANDA_DISTRICTS, UGANDAN_CROPS } from "../services/agronomyData";
import type { SoilType, UgandanCropId } from "../types/agronomy";
import { canAddFarm } from "../services/subscriptionService";

export default function Farms() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal / Form states
  const [showFarmModal, setShowFarmModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState("");

  // New Farm form state
  const [farmName, setFarmName] = useState("");
  const [farmDesc, setFarmDesc] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState(UGANDA_DISTRICTS[0].name);
  const [subCounty, setSubCounty] = useState("");
  const [village, setVillage] = useState("");
  const [parish, setParish] = useState("");
  const [latitude, setLatitude] = useState(UGANDA_DISTRICTS[0].latitude.toString());
  const [longitude, setLongitude] = useState(UGANDA_DISTRICTS[0].longitude.toString());
  const [farmArea, setFarmArea] = useState("2.5");
  const [coffeeAcreage, setCoffeeAcreage] = useState("2.0");
  const [treeCount, setTreeCount] = useState("900");
  const [coffeeVariety, setCoffeeVariety] = useState<"ROBUSTA_CWDr_CLONAL" | "ROBUSTA_TRADITIONAL" | "ROBUSTA_MIXED" | "ARABICA">("ROBUSTA_CWDr_CLONAL");
  const [coffeeAge, setCoffeeAge] = useState<"YOUNG_UNDER_3" | "MATURE_3_TO_15" | "OLD_OVER_15">("MATURE_3_TO_15");
  const [shadePercentage, setShadePercentage] = useState<"NONE" | "LOW_UNDER_20" | "MEDIUM_20_TO_40" | "HEAVY_OVER_40">("MEDIUM_20_TO_40");
  const [topography, setTopography] = useState<"FLAT" | "HILLSIDE" | "VALLEY">("FLAT");
  const [isStandalone, setIsStandalone] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");

  function handleCaptureGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsMessage("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    setGpsMessage("Acquiring high-accuracy satellite fix...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGpsMessage(`✓ Captured GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (±${Math.round(pos.coords.accuracy)}m)`);
        setGpsLoading(false);
      },
      (err) => {
        console.warn("GPS capture failed", err);
        setGpsMessage("Could not acquire GPS. Using district fallback coordinate.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  // New Field form state
  const [fieldName, setFieldName] = useState("");
  const [fieldArea, setFieldArea] = useState("1.0");
  const [fieldCrop, setFieldCrop] = useState<UgandanCropId>("MAIZE_LONGE");
  const [fieldSoil, setFieldSoil] = useState<SoilType>("FERROSOL_RED_CLAY");
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split("T")[0]);
  const [irrigationMethod, setIrrigationMethod] = useState<
    "DRIP" | "SPRINKLER" | "RAIN_FED" | "MANUAL_BUCKET" | "FURROW"
  >("DRIP");

  useEffect(() => {
    let active = true;
    getFarms(user?.uid, profile?.organizationId)
      .then((data) => {
        if (!active) return;
        setFarms(data);
        setSelectedFarm((current) => current || data[0] || null);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (active) setError("Failed to load farms from database.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.uid, profile?.organizationId]);

  useEffect(() => {
    if (selectedFarm) {
      getFields(selectedFarm.id).then(setFields);
    }
  }, [selectedFarm]);

  function handleDistrictChange(distName: string) {
    setSelectedDistrict(distName);
    setSubCounty("");
    setVillage("");
    setParish("");
    const matched = UGANDA_DISTRICTS.find((d) => d.name === distName);
    if (matched) {
      setLatitude(matched.latitude.toString());
      setLongitude(matched.longitude.toString());
    }
  }

  const handleSubCountySelect = useCallback((location: SelectedGoogleLocation) => {
    setSubCounty(location.name);
    if (location.latitude !== undefined && location.longitude !== undefined) {
      setLatitude(location.latitude.toFixed(6));
      setLongitude(location.longitude.toFixed(6));
    }
  }, []);

  const handleVillageSelect = useCallback((location: SelectedGoogleLocation) => {
    setVillage(location.name);
    if (location.latitude !== undefined && location.longitude !== undefined) {
      setLatitude(location.latitude.toFixed(6));
      setLongitude(location.longitude.toFixed(6));
    }
  }, []);

  const handleParishSelect = useCallback((location: SelectedGoogleLocation) => {
    setParish(location.name);
  }, []);

  const clearSubCountySelection = useCallback(() => setSubCounty(""), []);
  const clearVillageSelection = useCallback(() => setVillage(""), []);
  const clearParishSelection = useCallback(() => setParish(""), []);

  async function handleCreateFarm(e: React.FormEvent) {
    e.preventDefault();
    if (!subCounty) {
      setError("Choose the farm's sub-county from the Google Maps suggestions.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const created = await createFarm(
        user?.uid || "standalone_farmer",
        isStandalone ? null : profile?.organizationId || null,
        farmName,
        farmDesc,
        parseFloat(latitude) || 0.34,
        parseFloat(longitude) || 32.58,
        selectedDistrict,
        parseFloat(farmArea) || undefined,
        "ROBUSTA_COFFEE",
        subCounty || undefined,
        coffeeVariety,
        coffeeAge,
        shadePercentage === "HEAVY_OVER_40" ? "DENSE" : shadePercentage === "NONE" ? "OPEN_FULL_SUN" : "MODERATE",
        false,
        {
          parish: parish || undefined,
          village: village || undefined,
          coffeeAcreage: parseFloat(coffeeAcreage) || undefined,
          treeCount: parseInt(treeCount, 10) || undefined,
          shadePercentage,
          topography,
        }
      );

      setFarms((prev) => [created, ...prev]);
      setSelectedFarm(created);
      setShowFarmModal(false);
      setFarmName("");
      setFarmDesc("");
      setSubCounty("");
      setParish("");
      setVillage("");
    } catch (err) {
      console.error(err);
      setError("Unable to save farm. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateField(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFarm) return;
    setSaving(true);

    try {
      const cropInfo = UGANDAN_CROPS[fieldCrop];
      const newField = await createField(
        selectedFarm.id,
        user?.uid || "standalone_farmer",
        selectedFarm.organizationId,
        fieldName,
        parseFloat(fieldArea) || 1.0,
        fieldSoil,
        fieldCrop,
        cropInfo.variety,
        plantingDate,
        irrigationMethod
      );

      setFields((prev) => [newField, ...prev]);
      setShowFieldModal(false);
      setFieldName("");
    } catch (err) {
      console.error(err);
      setError("Failed to create field.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteFarm(farmId: string) {
    if (!window.confirm("Are you sure you want to remove this farm record?")) return;
    await deleteFarm(farmId);
    const updated = farms.filter((f) => f.id !== farmId);
    setFarms(updated);
    setSelectedFarm(updated[0] || null);
  }

  const handleOpenFarmModal = () => {
    const farmCheck = canAddFarm(farms.length, profile);
    if (!farmCheck.allowed) {
      setUpgradeModalMessage(farmCheck.reason || "Farm limit reached.");
      setShowUpgradePrompt(true);
      return;
    }
    setShowFarmModal(true);
  };

  const filteredFarms = farms.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="workspace-page farms-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">{t.farmerHubKicker}</p>
          <h2>{t.myFarms}</h2>
          <p>
            {t.farmsAndFields}
          </p>
        </div>
        <button className="primary-button" onClick={handleOpenFarmModal}>
          + {t.registerFarm}
        </button>
      </div>

      {error && <div className="form-error workspace-error">{error}</div>}

      {/* Top statistics & search toolbar */}
      <div className="farms-toolbar">
        <div className="farm-stat-chips">
          <div className="farm-stat">
            <strong>{farms.length}</strong>
            <span>{t.totalFarms}</span>
          </div>
          <div className="farm-stat">
            <strong>
              {farms.reduce((sum, f) => sum + (f.area || 0), 0).toFixed(1)} ha
            </strong>
            <span>{t.totalArea}</span>
          </div>
          <div className="farm-stat">
            <strong>{fields.length}</strong>
            <span>{t.activeFarmFields}</span>
          </div>
        </div>
        <input
          type="text"
          className="farm-search"
          placeholder={t.searchFarm}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Farm Cards Grid */}
      {loading ? (
        <div className="empty-workspace">
          <h3>{t.loadingFarms}</h3>
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="empty-workspace">
          <div className="empty-icon">⌂</div>
          <h3>{t.noFarms}</h3>
          <p>
            {t.noFarmsHelp}
          </p>
          <button className="primary-button" onClick={handleOpenFarmModal}>
            Register First Farm <span>→</span>
          </button>
        </div>
      ) : (
        <div className="farms-layout-grid">
          {/* Farm selector list */}
          <div className="farm-selection-column">
            <h3 className="section-title">{t.yourFarms} ({filteredFarms.length})</h3>
            <div className="farms-list-vertical">
              {filteredFarms.map((farm) => {
                const isSelected = selectedFarm?.id === farm.id;
                return (
                  <article
                    key={farm.id}
                    className={`farm-card-item ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedFarm(farm)}
                  >
                    <div className="farm-card-head">
                      <div>
                        <h4>{farm.name}</h4>
                        <span className="farm-district-tag">
                          📍 {farm.district}, Uganda
                        </span>
                      </div>
                      <span className={`farm-type-pill ${farm.organizationId ? "org" : "indie"}`}>
                        {farm.organizationId ? t.cooperative : t.standalone}
                      </span>
                    </div>
                    <p className="farm-item-desc">{farm.description}</p>
                    <div className="farm-item-footer">
                      <span>{t.areaLabel}: {farm.area ? `${farm.area} ha` : t.unspecified}</span>
                      <button
                        className="delete-farm-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFarm(farm.id);
                        }}
                        title={t.deleteFarm}
                      >
                        🗑️
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Selected Farm Field Inspector */}
          {selectedFarm && (
            <div className="farm-detail-column">
              <div className="panel farm-inspector-panel">
                <div className="panel-header">
                  <div>
                    <span className="section-kicker">{t.activeGrowingSite}</span>
                    <h3>{selectedFarm.name}</h3>
                    <p className="farm-coords">
                      GPS: {selectedFarm.location.latitude.toFixed(4)}° N,{" "}
                      {selectedFarm.location.longitude.toFixed(4)}° E · District:{" "}
                      <strong>{selectedFarm.district}</strong>
                    </p>
                  </div>
                  <button
                    className="primary-button outline"
                    onClick={() => setShowFieldModal(true)}
                  >
                    + {t.addFieldPlot}
                  </button>
                </div>

                {/* Fields Table / Grid */}
                <div className="fields-container">
                  <h4>{t.registeredPlotsFields} ({fields.length})</h4>
                  {fields.length === 0 ? (
                    <div className="empty-fields-box">
                      <p>{t.noFarmFields}</p>
                      <button
                        className="select-button"
                        onClick={() => setShowFieldModal(true)}
                      >
                        {t.addFirstField}
                      </button>
                    </div>
                  ) : (
                    <div className="fields-grid">
                      {fields.map((field) => {
                        const cropProfile = field.cropId ? UGANDAN_CROPS[field.cropId] : null;
                        return (
                          <div className="field-card" key={field.id}>
                            <div className="field-head">
                              <div>
                                <strong>{field.name}</strong>
                                <span className="field-crop-name">
                                  {cropProfile ? cropProfile.commonName : "Unassigned Crop"}
                                  {cropProfile?.localName ? ` (${cropProfile.localName})` : ""}
                                </span>
                              </div>
                              <span className="field-area-badge">{field.area} ha</span>
                            </div>

                            <div className="field-attributes">
                              <div className="attr-item">
                                <small>{t.soilClassification}</small>
                                <span>{field.soilType.replace(/_/g, " ")}</span>
                              </div>
                              <div className="attr-item">
                                <small>{t.irrigationSystem}</small>
                                <span>{field.irrigationMethod || "RAIN_FED"}</span>
                              </div>
                              <div className="attr-item">
                                <small>{t.moistureTarget}</small>
                                <span>
                                  {field.moistureThreshold?.minimum ?? 28}% -{" "}
                                  {field.moistureThreshold?.optimal ?? 55}%
                                </span>
                              </div>
                              <div className="attr-item">
                                <small>{t.plantingDate}</small>
                                <span>{field.plantingDate || "N/A"}</span>
                              </div>
                            </div>

                            <div className="field-status-bar">
                              <span className="growth-stage-tag">
                                🌱 {field.growthStage?.replace(/_/g, " ") || "VEGETATIVE"}
                              </span>
                              <span className="field-active-indicator">● Monitored</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Register New Farm */}
      {showFarmModal && (
        <div className="modal-backdrop" onClick={() => setShowFarmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{t.registerNewFarm}</h2>
              <p className="modal-subtitle">
                {t.addFarmDescription}
              </p>
              <button
                className="modal-close-btn"
                onClick={() => setShowFarmModal(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleCreateFarm} className="modal-form">
              <label>
                {t.farmName}
                <input
                  type="text"
                  placeholder="e.g. Kasangati Agroforestry Plot"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                />
              </label>

              <label>
                {t.ugandanDistrict}
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                >
                  {UGANDA_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.region} Uganda)
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-row-2">
                <label>
                  {t.subCounty}
                  <GooglePlacesLocationPicker
                    district={selectedDistrict}
                    label="sub-county"
                    selectedLocation={subCounty}
                    onSelect={handleSubCountySelect}
                    onClear={clearSubCountySelection}
                  />
                </label>
                <label>
                  {t.parishWard}
                  <GooglePlacesLocationPicker
                    district={selectedDistrict}
                    label="parish or ward"
                    selectedLocation={parish}
                    onSelect={handleParishSelect}
                    onClear={clearParishSelection}
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  {t.villageCell}
                  <GooglePlacesLocationPicker
                    district={selectedDistrict}
                    label="village"
                    selectedLocation={village}
                    onSelect={handleVillageSelect}
                    onClear={clearVillageSelection}
                  />
                </label>
                <label>
                  {t.topography}
                  <select
                    value={topography}
                    onChange={(e) => setTopography(e.target.value as typeof topography)}
                  >
                    <option value="FLAT">{t.flatTerrain}</option>
                    <option value="HILLSIDE">{t.hillsideSlope}</option>
                    <option value="VALLEY">{t.valleyBottom}</option>
                  </select>
                </label>
              </div>

              <div style={{ margin: "10px 0 16px 0", padding: "10px 14px", background: "#f8f9fa", borderRadius: 8, border: "1px solid #e0e0e0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#333" }}>{t.gpsCoordinates}</span>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={gpsLoading}
                    style={{
                      background: "#2e7d32",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {gpsLoading ? "Acquiring GPS..." : "📍 Capture My Current GPS"}
                  </button>
                </div>
                {gpsMessage && (
                  <p style={{ margin: "0 0 8px 0", fontSize: "0.78rem", color: gpsMessage.startsWith("✓") ? "#2e7d32" : "#c62828" }}>
                    {gpsMessage}
                  </p>
                )}
                <div className="form-row-2">
                  <label>
                    {t.latitude}
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    {t.longitude}
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="form-row-2">
                <label>
                  {t.totalFarmArea}
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 2.5"
                    value={farmArea}
                    onChange={(e) => setFarmArea(e.target.value)}
                  />
                </label>
                <label>
                  {t.robustaAcreage}
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 2.0"
                    value={coffeeAcreage}
                    onChange={(e) => setCoffeeAcreage(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  {t.approxCoffeeTrees}
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 900"
                    value={treeCount}
                    onChange={(e) => setTreeCount(e.target.value)}
                  />
                </label>
                <label>
                  {t.coffeeVariety}
                  <select
                    value={coffeeVariety}
                    onChange={(e) => setCoffeeVariety(e.target.value as typeof coffeeVariety)}
                  >
                    <option value="ROBUSTA_CWDr_CLONAL">Robusta CWDr (KR1-KR10 Clonal)</option>
                    <option value="ROBUSTA_TRADITIONAL">Robusta Traditional Seedling</option>
                    <option value="ROBUSTA_MIXED">Robusta Mixed Stand</option>
                    <option value="ARABICA">Arabica Coffee</option>
                  </select>
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  {t.coffeeStandAge}
                  <select
                    value={coffeeAge}
                    onChange={(e) => setCoffeeAge(e.target.value as typeof coffeeAge)}
                  >
                    <option value="YOUNG_UNDER_3">Young (&lt; 3 years)</option>
                    <option value="MATURE_3_TO_15">Mature Bearing (3–15 years)</option>
                    <option value="OLD_OVER_15">Old Stand (&gt; 15 years)</option>
                  </select>
                </label>
                <label>
                  {t.canopyShadeCover}
                  <select
                    value={shadePercentage}
                    onChange={(e) => setShadePercentage(e.target.value as typeof shadePercentage)}
                  >
                    <option value="NONE">None (Full Open Sun)</option>
                    <option value="LOW_UNDER_20">Low Shade (&lt; 20% canopy)</option>
                    <option value="MEDIUM_20_TO_40">Medium Shade (20–40% - Recommended)</option>
                    <option value="HEAVY_OVER_40">Heavy Shade (&gt; 40% - BCTB risk)</option>
                  </select>
                </label>
              </div>

              <div className="form-row-2">
                <label className="checkbox-center">
                  <input
                    type="checkbox"
                    checked={isStandalone}
                    onChange={(e) => setIsStandalone(e.target.checked)}
                  />
                  <span>{t.standaloneSmallholder}</span>
                </label>
              </div>

              <label>
                {t.descriptionAgronomicNotes}
                <textarea
                  rows={3}
                  placeholder="Notes on shade trees (Albizia, Ficus, Cordia), soil, slope, water access..."
                  value={farmDesc}
                  onChange={(e) => setFarmDesc(e.target.value)}
                />
              </label>

              <div className="modal-footer">
                <button
                  type="button"
                  className="select-button"
                  onClick={() => setShowFarmModal(false)}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? t.registering : t.saveFarmRecord}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Field */}
      {showFieldModal && selectedFarm && (
        <div className="modal-backdrop" onClick={() => setShowFieldModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{t.addFieldPlot} {selectedFarm.name}</h2>
              <p className="modal-subtitle">
                Demarcate a crop zone to enable targeted AI irrigation and disease models.
              </p>
              <button
                className="modal-close-btn"
                onClick={() => setShowFieldModal(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleCreateField} className="modal-form">
              <label>
                Field / Plot Name
                <input
                  type="text"
                  placeholder="e.g. Block A (Lower Terrace)"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  required
                />
              </label>

              <div className="form-row-2">
                <label>
                  Crop Selection
                  <select
                    value={fieldCrop}
                    onChange={(e) => setFieldCrop(e.target.value as UgandanCropId)}
                  >
                    {Object.values(UGANDAN_CROPS).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.commonName} {c.localName ? `(${c.localName})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Area in Hectares
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={fieldArea}
                    onChange={(e) => setFieldArea(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  Soil Classification
                  <select
                    value={fieldSoil}
                    onChange={(e) => setFieldSoil(e.target.value as SoilType)}
                  >
                    <option value="FERROSOL_RED_CLAY">Ferrosol (Red Clay Loam)</option>
                    <option value="SANDY_LOAM">Sandy Loam</option>
                    <option value="VERTISOL_BLACK_COTTON">Vertisol (Black Cotton Soil)</option>
                    <option value="ALLUVIAL_LOAM">Alluvial Loam (Valley Bottom)</option>
                    <option value="VOLCANIC_LOAM">Volcanic Ash Loam</option>
                  </select>
                </label>
                <label>
                  Irrigation Method
                  <select
                    value={irrigationMethod}
                    onChange={(e) =>
                      setIrrigationMethod(
                        e.target.value as "DRIP" | "SPRINKLER" | "RAIN_FED" | "MANUAL_BUCKET" | "FURROW"
                      )
                    }
                  >
                    <option value="DRIP">Drip Irrigation</option>
                    <option value="SPRINKLER">Sprinkler</option>
                    <option value="RAIN_FED">Rain Fed</option>
                    <option value="MANUAL_BUCKET">Manual Watering Can / Bucket</option>
                    <option value="FURROW">Furrow / Basin</option>
                  </select>
                </label>
              </div>

              <label>
                Planting / Sowing Date
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                />
              </label>

              <div className="modal-footer">
                <button
                  type="button"
                  className="select-button"
                  onClick={() => setShowFieldModal(false)}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Adding Plot..." : "Save Field Block"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Tier Upgrade Modal */}
      {showUpgradePrompt && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowUpgradePrompt(false); }}>
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span className="eyebrow" style={{ color: "#2d6a4f" }}>AgriSense Subscription Tier</span>
              <h3>Multiple Farm Management</h3>
            </div>
            <p style={{ fontSize: 14, color: "#4b5563", margin: "12px 0 16px 0", lineHeight: 1.5 }}>
              {upgradeModalMessage}
            </p>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, marginBottom: 20 }}>
              <strong style={{ display: "block", color: "#166534", fontSize: 13, marginBottom: 4 }}>
                Farmer Plus Plan Unlocks:
              </strong>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                <li>Up to 20 farms and outgrower plots</li>
                <li>Satellite boundary area calculation & GPS mapping</li>
                <li>IoT microclimate sensor telemetry integration</li>
                <li>Exportable Coffee Passport & EUDR certificates</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="select-button"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setShowUpgradePrompt(false);
                  // Trigger navigate to subscription if window event or user opens plans
                  window.location.hash = "#subscription";
                }}
              >
                View Plans & Upgrade →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
