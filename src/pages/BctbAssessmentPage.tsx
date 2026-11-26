import { useEffect, useRef, useState } from "react";
import {
  saveAssessmentDraft,
  loadAssessmentDraft,
  clearAssessmentDraft,
  getLocalAssessmentHistory,
} from "../services/bctbAssessmentService";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/useAuth";
import { predictResearchBctbRisk } from "../services/researchBctbModelService";
import { queueResearchPrediction } from "../services/offlineSyncService";
import { sendRealSmsAlert } from "../services/smsService";
import { getResearchPredictionQueue } from "../services/storage/indexedDbService";
import WhatIfRiskExplorer from "../components/WhatIfRiskExplorer";
import { completeQueuedResearchScreening, getResearchScreeningJournal, saveResearchScreeningEntry, updateLatestResearchScreeningPrediction, type ResearchScreeningJournalEntry } from "../services/researchScreeningJournal";
import type {
  BctbAssessmentInput,
  BctbFieldReadings,
  ResearchBctbModelInputs,
  ResearchBctbPrediction,
} from "../types/bctb";

/* ------------------------------------------------------------------ */
/* Guided and expert modes share required screening answers; expert mode adds model factors. */
/* ------------------------------------------------------------------ */

type Mode = "GUIDED" | "EXPERT";
const MODE_KEY = "agrisense_bctb_form_mode";

function getLocalizedCopy(_mode: Mode, t: ReturnType<typeof useLanguage>["t"]) {
  return {
    dieback: {
      q: t.guidedDiebackQ,
      help: t.guidedDiebackHelp,
    },
    holes: {
      q: t.guidedHolesQ,
      help: t.guidedHolesHelp,
    },
    count: {
      q: t.guidedCountQ,
      help: t.guidedCountHelp,
    },
    history: {
      q: t.guidedHistoryQ,
      help: t.guidedHistoryHelp,
    },
    pruningFreq: {
      q: t.guidedPruningQ,
      options: [
        { value: "regular", label: t.guidedPruningRegular.split(" (")[0], hint: t.guidedPruningRegular.includes("(") ? t.guidedPruningRegular.split("(")[1].replace(")", "") : "" },
        { value: "occasional", label: t.guidedPruningOccasional.split(" (")[0], hint: t.guidedPruningOccasional.includes("(") ? t.guidedPruningOccasional.split("(")[1].replace(")", "") : "" },
        { value: "rare", label: t.guidedPruningRare.split(" (")[0], hint: t.guidedPruningRare.includes("(") ? t.guidedPruningRare.split("(")[1].replace(")", "") : "" },
      ],
    },
    sanitation: {
      q: t.guidedSanitationQ,
      options: [
        { value: "GOOD", label: t.guidedSanitationGood.split(" (")[0], hint: t.guidedSanitationGood.includes("(") ? t.guidedSanitationGood.split("(")[1].replace(")", "") : "" },
        { value: "FAIR", label: t.guidedSanitationFair.split(" (")[0], hint: t.guidedSanitationFair.includes("(") ? t.guidedSanitationFair.split("(")[1].replace(")", "") : "" },
        { value: "POOR", label: t.guidedSanitationPoor.split(" (")[0], hint: t.guidedSanitationPoor.includes("(") ? t.guidedSanitationPoor.split("(")[1].replace(")", "") : "" },
      ],
    },
    recentPruning: {
      q: t.guidedRecentPruningQ,
      help: "",
    },
  };
}

function getRiskPlain(t: ReturnType<typeof useLanguage>["t"]): Record<"LOW" | "MODERATE" | "HIGH", { title: string; line: string }> {
  return {
    LOW: {
      title: t.riskLowHeading,
      line: t.riskLowBody,
    },
    MODERATE: {
      title: t.riskModerateHeading,
      line: t.riskModerateBody,
    },
    HIGH: {
      title: t.riskHighHeading,
      line: t.riskHighBody,
    },
  };
}

function localDateInputValue(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const initialAssessment: BctbAssessmentInput = {
  previousBctbHistory: null,
  increasingTwigDamage: null,
  twigDiebackObserved: null,
  affectedTwigCount: null,
  yellowing: null,
  pinSizedHoles: null,
  blackening: null,
  wilting: null,
  drying: null,
  hasAlternativeHosts: null,
  unmanagedSuckersPresent: null,
  recentPruning: null,
  pruningFrequency: null,
  recentDeSuckering: null,
  affectedTwigRemoval: null,
  farmSanitation: null,
  shadeCanopy: null,
  coffeeAge: null,
  coffeeVariety: null,
  locationConsent: true,
  followUpConsent: false,
  farmerNotes: "",
  fieldReadings: {
    inspectionDate: localDateInputValue(),
    plotAreaHa: null,
    coffeeTreesInspected: null,
    treesWithPossibleSigns: null,
    affectedTwigDiameterMm: null,
    rainfall30dMm: null,
    meanTemperature30dC: null,
    meanRelativeHumidity30dPct: null,
    canopyCoverPct: null,
    shadeTreeCount: null,
    distanceToWoodlandM: null,
    nearbyHostVegetation: null,
    droughtStressObserved: null,
    recentlyTransplanted: null,
    infestedTwigsRemoved: null,
    shadeTreeSpecies: "",
    measurementNotes: "",
  },
};

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

type Option<T> = { value: T; label: string; hint?: string };

/** Accessible single-choice group. A fieldset replaces the old <label> wrapper,
 *  which sent every click on the question text to the first button. */
function OptionGroup<T extends string | boolean>({
  legend,
  help,
  value,
  options,
  onChange,
  error,
  idPrefix,
}: {
  legend: string;
  help?: string;
  value: T | null;
  options: Option<T>[];
  onChange: (value: T) => void;
  error?: boolean;
  idPrefix: string;
}) {
  const helpId = help ? `${idPrefix}-help` : undefined;
  return (
    <fieldset
      className={`form-question${error ? " has-error" : ""}`}
      aria-describedby={helpId}
      id={idPrefix}
    >
      <legend>{legend}</legend>
      {help && <small id={helpId} className="help-text">{help}</small>}
      <div className="choice-row choice-row-large">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={String(option.value)}
              id={`${idPrefix}_${String(option.value)}`}
              type="button"
              className={selected ? "choice selected" : "choice"}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
            >
              <span className="choice-label">{option.label}</span>
              {option.hint && <small className="choice-hint">{option.hint}</small>}
            </button>
          );
        })}
      </div>
      {error && <p className="field-error" role="alert">Choose one answer to continue.</p>}
    </fieldset>
  );
}

function YesNo({
  legend,
  help,
  value,
  onChange,
  error,
  idPrefix,
  yesLabel,
  noLabel,
}: {
  legend: string;
  help?: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  error?: boolean;
  idPrefix: string;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <OptionGroup<boolean>
      legend={legend}
      help={help}
      value={value}
      onChange={onChange}
      error={error}
      idPrefix={idPrefix}
      options={[
        { value: true, label: yesLabel },
        { value: false, label: noLabel },
      ]}
    />
  );
}

function TwigCounter({
  value,
  onChange,
  legend,
  help,
  error,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  legend: string;
  help: string;
  error: boolean;
}) {
  const set = (next: number) => onChange(Math.min(10000, Math.max(0, next)));
  return (
    <fieldset className={`form-question${error ? " has-error" : ""}`} aria-describedby="twig-count-help">
      <legend>{legend}</legend>
      <small id="twig-count-help" className="help-text">{help}</small>
      <div className="counter-row">
        <button type="button" className="counter-button" aria-label="Decrease twig count" onClick={() => set((value ?? 0) - 1)}>
          −
        </button>
        <input
          id="twig-count"
          className="counter-input"
          type="number"
          inputMode="numeric"
          min={0}
          max={10000}
          step={1}
          placeholder="0"
          aria-label="Affected twig count"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        />
        <button type="button" className="counter-button" aria-label="Increase twig count" onClick={() => set((value ?? 0) + 1)}>
          +
        </button>
      </div>
      {error && (
        <p className="field-error" role="alert">
          Enter a whole number from 0 to 10,000. Use 0 if you saw no damaged twigs.
        </p>
      )}
    </fieldset>
  );
}

function ReadingNumber({
  id, label, value, unit, help, min, max, step = 1, onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  help?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number | null) => void;
}) {
  const invalid = value !== null && (!Number.isFinite(value) || value < min || value > max);
  return <label className="reading-field" htmlFor={id}>
    <span className="reading-label">{label} <small>({unit})</small></span>
    {help && <small className="help-text">{help}</small>}
    <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step}
      value={value ?? ""} placeholder="Not measured" aria-invalid={invalid}
      onChange={(event) =>
        onChange(event.target.value === "" ? null : Number(event.target.value))} />
    {invalid && <small className="reading-warning">Enter a value from {min} to {max} {unit}.</small>}
  </label>;
}

function ReadingYesNo({
  id, label, value, onChange,
}: {
  id: string;
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return <label className="reading-field" htmlFor={id}>
    <span className="reading-label">{label}</span>
    <select id={id} value={value === null ? "" : String(value)}
      onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "true")}>
      <option value="">Unknown / not recorded</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  </label>;
}

/* ------------------------------------------------------------------ */
/* Model input mapping and validation                                  */
/* ------------------------------------------------------------------ */

function isValidCount(n: number | null): n is number {
  return n !== null && Number.isInteger(n) && n >= 0 && n <= 10000;
}

function toResearchModelInputs(a: BctbAssessmentInput): ResearchBctbModelInputs | null {
  if (
    a.twigDiebackObserved == null ||
    a.pinSizedHoles == null ||
    !isValidCount(a.affectedTwigCount) ||
    a.previousBctbHistory == null ||
    a.farmSanitation == null ||
    a.pruningFrequency == null ||
    a.recentPruning == null
  ) {
    return null;
  }
  const readings = { ...initialAssessment.fieldReadings!, ...a.fieldReadings };
  const asBit = (value: boolean | null | undefined): 0 | 1 | null => value == null ? null : value ? 1 : 0;
  const age = a.coffeeAge?.toLowerCase() as ResearchBctbModelInputs["coffee_age"];
  const variety = a.coffeeVariety?.toLowerCase() as ResearchBctbModelInputs["coffee_variety"];
  const shade = a.shadeCanopy?.toLowerCase() as ResearchBctbModelInputs["shade_canopy"];
  const removal = a.affectedTwigRemoval?.toLowerCase() as ResearchBctbModelInputs["affected_twig_removal"];
  const inspectionDate = readings.inspectionDate ? new Date(`${readings.inspectionDate}T00:00:00`) : null;
  return {
    twig_dieback_observed: a.twigDiebackObserved ? 1 : 0,
    suspected_entry_holes_observed: a.pinSizedHoles ? 1 : 0,
    affected_twig_count_reported: a.affectedTwigCount,
    previous_bctb_report: a.previousBctbHistory ? 1 : 0,
    farm_sanitation:
      a.farmSanitation === "FAIR" ? "moderate" : (a.farmSanitation.toLowerCase() as "good" | "poor"),
    pruning_frequency: a.pruningFrequency,
    recent_pruning_done: a.recentPruning ? 1 : 0,
    increasing_twig_damage: asBit(a.increasingTwigDamage),
    yellowing_observed: asBit(a.yellowing),
    blackening_observed: asBit(a.blackening),
    wilting_observed: asBit(a.wilting),
    drying_observed: asBit(a.drying),
    nearby_host_vegetation: asBit(readings.nearbyHostVegetation ?? a.hasAlternativeHosts),
    unmanaged_suckers_present: asBit(a.unmanagedSuckersPresent),
    recent_desuckering_done: asBit(a.recentDeSuckering),
    affected_twig_removal: removal,
    coffee_age: age,
    shade_canopy: shade,
    coffee_variety: variety,
    affected_twig_diameter_mm: readings.affectedTwigDiameterMm,
    rainfall_30d_mm: readings.rainfall30dMm,
    mean_temperature_30d_c: readings.meanTemperature30dC,
    mean_relative_humidity_30d_pct: readings.meanRelativeHumidity30dPct,
    canopy_cover_pct: readings.canopyCoverPct,
    shade_tree_count: readings.shadeTreeCount,
    distance_to_woodland_m: readings.distanceToWoodlandM,
    drought_stress_observed: asBit(readings.droughtStressObserved),
    recently_transplanted: asBit(readings.recentlyTransplanted),
    infested_twigs_removed: readings.infestedTwigsRemoved == null
      ? a.affectedTwigRemoval == null ? null : a.affectedTwigRemoval === "CONSISTENT" ? 1 : 0
      : readings.infestedTwigsRemoved ? 1 : 0,
    coffee_trees_inspected: readings.coffeeTreesInspected,
    trees_with_possible_signs: readings.treesWithPossibleSigns,
    plot_area_ha: readings.plotAreaHa,
    shade_tree_species: readings.shadeTreeSpecies.trim() || null,
    inspection_month: inspectionDate && !Number.isNaN(inspectionDate.valueOf()) ? inspectionDate.getMonth() + 1 : null,
  };
}

type FieldKey =
  | "dieback" | "holes" | "count" | "history" | "sanitation" | "pruningFreq" | "recentPruning";

function missingFields(a: BctbAssessmentInput): { key: FieldKey; step: number }[] {
  const out: { key: FieldKey; step: number }[] = [];
  if (a.twigDiebackObserved == null) out.push({ key: "dieback", step: 1 });
  if (a.pinSizedHoles == null) out.push({ key: "holes", step: 1 });
  if (!isValidCount(a.affectedTwigCount)) out.push({ key: "count", step: 1 });
  if (a.previousBctbHistory == null) out.push({ key: "history", step: 2 });
  if (a.pruningFrequency == null) out.push({ key: "pruningFreq", step: 3 });
  if (a.farmSanitation == null) out.push({ key: "sanitation", step: 3 });
  if (a.recentPruning == null) out.push({ key: "recentPruning", step: 3 });
  return out;
}

export default function BctbAssessmentPage({
  onResult,
}: {
  onResult?: (result: ResearchBctbPrediction) => void;
}) {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();

  const [mode, setMode] = useState<Mode>(() => {
    try {
      return localStorage.getItem(MODE_KEY) === "EXPERT" ? "EXPERT" : "GUIDED";
    } catch {
      return "GUIDED";
    }
  });
  const copy = getLocalizedCopy(mode, t);
  const riskPlain = getRiskPlain(t);
  const stepLabels = [t.stepTwigSigns, t.stepFarmHistory, t.stepFarmCare, t.stepFarmReadings, t.stepReview];

  const [assessment, setAssessment] = useState<BctbAssessmentInput>(initialAssessment);
  const [result, setResult] = useState<ResearchBctbPrediction | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [modelError, setModelError] = useState("");
  const [offlineQueued, setOfflineQueued] = useState("");
  const [modelHealth, setModelHealth] = useState<"checking" | "online" | "offline">("checking");
  const [modelHealthDetail, setModelHealthDetail] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [activeTab, setActiveTab] = useState<"NEW_ASSESSMENT" | "HISTORY">("NEW_ASSESSMENT");
  const [historyList] = useState(() => getLocalAssessmentHistory());
  const [visitJournal, setVisitJournal] = useState<ResearchScreeningJournalEntry[]>(() => user?.uid ? getResearchScreeningJournal(user.uid) : []);

  const initialDraft = useRef(loadAssessmentDraft());
  const [hasDraft, setHasDraft] = useState(Boolean(initialDraft.current));
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(
    initialDraft.current ? new Date(initialDraft.current.savedAt).toLocaleTimeString() : null
  );
  const dirty = useRef(false);

  useEffect(() => {
    if (!user?.uid) return;
    setVisitJournal(getResearchScreeningJournal(user.uid));
    void getResearchPredictionQueue(user.uid).then((queue) => {
      const completed = queue.filter((item) => item.synced && item.result)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (completed?.result) setResult(completed.result);
      let journal = getResearchScreeningJournal(user.uid);
      for (const item of queue) {
        if (item.synced && item.result) journal = completeQueuedResearchScreening(user.uid, item.id, item.result);
      }
      setVisitJournal(journal);
    });
    const handleSynced = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; id: string; result: ResearchBctbPrediction }>).detail;
      if (detail?.userId !== user.uid) return;
      setResult(detail.result);
      setVisitJournal(completeQueuedResearchScreening(user.uid, detail.id, detail.result));
      setOfflineQueued("");
      onResult?.(detail.result);
    };
    window.addEventListener("agrisense:research-prediction-synced", handleSynced);
    return () => window.removeEventListener("agrisense:research-prediction-synced", handleSynced);
  }, [user?.uid, onResult]);

  const lastFocusedStep = useRef(1);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    const wakeDeadline = Date.now() + 90_000;
    async function wakeFreeModel() {
      while (active) {
        try {
          const response = await fetch("/api/modelHealth", { cache: "no-store" });
          const data = await response.json() as { ok?: boolean; status?: number };
          if (!active) return;
          setModelHealthDetail(typeof data.status === "number" ? String(data.status) : "");
          if (response.ok && data.ok === true) {
            setModelHealth("online");
            return;
          }
        } catch {
          if (!active) return;
        }
        if (Date.now() >= wakeDeadline) {
          setModelHealth("offline");
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 8_000));
      }
    }
    void wakeFreeModel();
    return () => {
      active = false;
    };
  }, []);

  const missing = missingFields(assessment);
  const missingKeys = new Set(missing.map((m) => m.key));
  const stepMissing = (step: number) => missing.filter((m) => m.step === step);

  /* Save the draft in an effect, not inside a state updater (updaters must stay pure). */
  useEffect(() => {
    if (!dirty.current) return;
    saveAssessmentDraft(assessment);
    setHasDraft(true);
    setDraftSavedTime(new Date().toLocaleTimeString());
  }, [assessment]);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* storage can be unavailable; the mode just won't persist */
    }
  }, [mode]);

  useEffect(() => {
    if (lastFocusedStep.current === currentStep) return;
    lastFocusedStep.current = currentStep;
    const heading = document.querySelector<HTMLElement>(".screening-step-active h3");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentStep]);

  useEffect(() => {
    if (!modelError) return;
    errorRef.current?.focus({ preventScroll: true });
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [modelError]);

  useEffect(() => {
    if (!result) return;
    resultRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  function update<K extends keyof BctbAssessmentInput>(key: K, value: BctbAssessmentInput[K]) {
    dirty.current = true;
    setAssessment((current) => ({ ...current, [key]: value }));
    setResult(null);
    setModelError("");
  }

  function updateReading<K extends keyof BctbFieldReadings>(key: K, value: BctbFieldReadings[K]) {
    dirty.current = true;
    setAssessment((current) => ({
      ...current,
      fieldReadings: { ...initialAssessment.fieldReadings!, ...current.fieldReadings, [key]: value },
    }));
  }

  function continueToReview() {
    if (inconsistentTreeSample) {
      document.getElementById("reading-signed-tree-count")?.focus();
      return;
    }
    const invalid = document.querySelector<HTMLInputElement>('.readings-panel input[aria-invalid="true"]');
    if (invalid) {
      invalid.focus();
      return;
    }
    setCurrentStep(5);
  }

  function goNext(fromStep: number) {
    if (stepMissing(fromStep).length > 0) {
      setShowErrors(true);
      const first = stepMissing(fromStep)[0].key;
      const target = document.getElementById(first === "count" ? "twig-count" : first);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (first === "count") target?.focus({ preventScroll: true });
      return;
    }
    setShowErrors(false);
    setCurrentStep(fromStep + 1);
  }

  function goBack(toStep: number) {
    setShowErrors(false);
    setCurrentStep(toStep);
  }

  function exportVisitJournal() {
    if (visitJournal.length === 0) return;
    const columns = [
      "visit_date", "farm_id", "sync_status", "model_class_synthetic_only",
      "dieback_observed", "entry_holes_observed", "affected_twig_count", "previous_report",
      "sanitation", "pruning_frequency", "recent_pruning", "plot_area_ha",
      "trees_inspected", "trees_with_possible_signs", "rainfall_30d_mm", "temperature_30d_c",
      "relative_humidity_30d_pct", "twig_diameter_mm", "canopy_cover_pct", "shade_tree_count",
      "distance_to_woodland_m", "nearby_host_vegetation", "drought_stress", "recently_transplanted",
      "infested_twigs_removed", "field_notes",
    ];
    const csvCell = (value: unknown) => {
      let text = value == null ? "" : String(value);
      if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = visitJournal.map((entry) => {
      const readings = entry.assessment.fieldReadings;
      return [
        entry.createdAt, entry.assessment.farmId, entry.status, entry.prediction?.predicted_risk,
        entry.modelInputs.twig_dieback_observed, entry.modelInputs.suspected_entry_holes_observed,
        entry.modelInputs.affected_twig_count_reported, entry.modelInputs.previous_bctb_report,
        entry.modelInputs.farm_sanitation, entry.modelInputs.pruning_frequency, entry.modelInputs.recent_pruning_done,
        readings?.plotAreaHa, readings?.coffeeTreesInspected, readings?.treesWithPossibleSigns,
        readings?.rainfall30dMm, readings?.meanTemperature30dC, readings?.meanRelativeHumidity30dPct,
        readings?.affectedTwigDiameterMm, readings?.canopyCoverPct, readings?.shadeTreeCount,
        readings?.distanceToWoodlandM, readings?.nearbyHostVegetation, readings?.droughtStressObserved,
        readings?.recentlyTransplanted, readings?.infestedTwigsRemoved, readings?.measurementNotes,
      ].map(csvCell).join(",");
    });
    const blob = new Blob(["\uFEFF", [columns.join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agrisense-field-visits-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleResumeDraft() {
    const saved = loadAssessmentDraft();
    if (saved) {
      setAssessment((prev) => ({ ...prev, ...saved.draft }));
      setHasDraft(false);
    }
  }

  function handleDiscardDraft() {
    clearAssessmentDraft();
    dirty.current = false;
    setAssessment(initialAssessment);
    setHasDraft(false);
    setResult(null);
    setModelError("");
    setCurrentStep(1);
    setShowErrors(false);
  }

  async function submitAssessment(event: React.FormEvent) {
    event.preventDefault();
    const modelInputs = toResearchModelInputs(assessment);
    if (!modelInputs) {
      setShowErrors(true);
      setModelError("Some answers are missing or invalid. Use the Edit buttons below to complete them.");
      return;
    }
    setCalculating(true);
    setModelError("");
    setOfflineQueued("");
    async function saveForSync() {
      if (!user?.uid) throw new Error("Sign in before saving a screening for later synchronization.");
      const item = await queueResearchPrediction(user.uid, modelInputs!);
      saveResearchScreeningEntry(user.uid, assessment, modelInputs!, undefined, item.id);
      setVisitJournal(getResearchScreeningJournal(user.uid));
      setResult(null);
      setOfflineQueued(`Screening saved on this device. It will be sent automatically when the network returns (queue ${item.id}).`);
    }
    try {
      if (!navigator.onLine) {
        await saveForSync();
        return;
      }
      const prediction: ResearchBctbPrediction = await predictResearchBctbRisk(modelInputs);
      saveResearchScreeningEntry(user?.uid || "", assessment, modelInputs, prediction);
      if (user?.uid) setVisitJournal(getResearchScreeningJournal(user.uid));
      setResult(prediction);
      onResult?.(prediction);
      if (prediction.predicted_risk === "HIGH" && profile?.smsConsent && profile.phone) {
        void sendRealSmsAlert({
          recipientPhone: profile.phone,
          farmerName: profile.fullName || "Farmer",
          farmName: "your coffee farm",
          category: "BCTB_EARLY_WARNING",
          shortAdvice: "High BCTB risk screening. Prune and burn affected twigs, then ask your extension officer to verify.",
          lang: language,
          farmerId: user?.uid,
        }).catch((smsError: unknown) => {
          console.warn("Could not send the BCTB SMS alert", smsError);
        });
      }
    } catch (error) {
      if (!navigator.onLine && (error instanceof TypeError || error instanceof DOMException)) {
        try { await saveForSync(); return; }
        catch (queueError) {
          setModelError(queueError instanceof Error ? queueError.message : "The offline screening could not be saved.");
          return;
        }
      }
      console.error("Research BCTB model prediction failed.", error);
      setModelError(
        error instanceof Error
          ? error.message
          : "The research model could not return a prediction. Check your connection and try again."
      );
    } finally {
      setCalculating(false);
    }
  }

  async function retryModelPrediction() {
    const retryInputs = toResearchModelInputs(assessment);
    if (!retryInputs || !user?.uid) return;
    setCalculating(true);
    setModelError("");
    setOfflineQueued("");
    try {
      const prediction = await predictResearchBctbRisk(retryInputs);
      updateLatestResearchScreeningPrediction(user.uid, prediction);
      setVisitJournal(getResearchScreeningJournal(user.uid));
      setResult(prediction);
      onResult?.(prediction);
    } catch (error) {
      setModelError(
        error instanceof Error
          ? error.message
          : "The trained model is still unavailable. Please try again later.",
      );
    } finally {
      setCalculating(false);
    }
  }

  const yes = t.yesChoice;
  const no = t.noChoice;

  const answerText = (v: boolean | null) => (v === true ? "Yes" : v === false ? "No" : "Not answered");
  const sanitationLabel = copy.sanitation.options.find((o) => o.value === assessment.farmSanitation)?.label;
  const pruningLabel = copy.pruningFreq.options.find((o) => o.value === assessment.pruningFrequency)?.label;
  const readings = { ...initialAssessment.fieldReadings!, ...assessment.fieldReadings };
  const modelInputs = toResearchModelInputs(assessment);
  const inconsistentTreeSample = readings.treesWithPossibleSigns !== null
    && readings.coffeeTreesInspected !== null
    && readings.treesWithPossibleSigns > readings.coffeeTreesInspected;

  const reviewRows: { label: string; value: string; step: number; ok: boolean }[] = [
    { label: copy.dieback.q, value: answerText(assessment.twigDiebackObserved ?? null), step: 1, ok: !missingKeys.has("dieback") },
    { label: copy.holes.q, value: answerText(assessment.pinSizedHoles), step: 1, ok: !missingKeys.has("holes") },
    { label: copy.count.q, value: isValidCount(assessment.affectedTwigCount) ? String(assessment.affectedTwigCount) : "Not answered", step: 1, ok: !missingKeys.has("count") },
    { label: copy.history.q, value: answerText(assessment.previousBctbHistory), step: 2, ok: !missingKeys.has("history") },
    { label: copy.pruningFreq.q, value: pruningLabel ?? "Not answered", step: 3, ok: !missingKeys.has("pruningFreq") },
    { label: copy.sanitation.q, value: sanitationLabel ?? "Not answered", step: 3, ok: !missingKeys.has("sanitation") },
    { label: copy.recentPruning.q, value: answerText(assessment.recentPruning), step: 3, ok: !missingKeys.has("recentPruning") },
  ];

  return (
    <section className="workspace-page bctb-page">
      <div className="workspace-page-header bctb-page-header">
        <div>
          <span className="section-kicker">Coffee field screening</span>
          <h2>{t.screeningTitle}</h2>
          <p>{t.screeningSubtitle} Record one sampled block at a time; use the same block and method when you repeat an inspection.</p>
          <span className={`model-status model-status--${modelHealth}`}>
            {modelHealth === "checking"
              ? "Waking trained model (free service)…"
              : modelHealth === "online"
                ? "Trained model online"
                : modelHealthDetail === "429"
                  ? "Trained model rate-limited (429)"
                  : "Trained model sleeping or unavailable — predictions will retry"}
          </span>
        </div>
        <div className="mode-toggle" role="group" aria-label="Form style">
          <button
            type="button"
            className={mode === "GUIDED" ? "mode-option active" : "mode-option"}
            aria-pressed={mode === "GUIDED"}
            onClick={() => setMode("GUIDED")}
          >
            Guided
            <small>Standard screening</small>
          </button>
          <button
            type="button"
            className={mode === "EXPERT" ? "mode-option active" : "mode-option"}
            aria-pressed={mode === "EXPERT"}
            onClick={() => setMode("EXPERT")}
          >
            Farm readings
            <small>Optional detailed measurements</small>
          </button>
        </div>
      </div>

      <div className="screening-disclaimer" role="note">
        <strong>Research demonstration only.</strong> This model was trained on synthetic labels, not verified
        farm outcomes. It accepts reported symptoms, management, weather, farm context, and sample readings;
        optional missing values are imputed. It is a screening aid, not a diagnosis,
        and must not decide treatment. A completed screening can be queued on this device and sent when internet returns.
      </div>

      <details className="bctb-factor-guide">
        <summary>What can influence BCTB pressure?</summary>
        <div className="bctb-factor-content">
          <p><strong>BCTB is caused by the insect</strong> <em>Xylosandrus compactus</em>. Farm and weather conditions can influence exposure or infestation, but they do not prove the beetle is present.</p>
          <div className="bctb-factor-grid">
            <article><strong>Insect access and carry-over</strong><span>Nearby woodland or other host plants, past infestation, and infested twigs left in the garden can be relevant to exposure and spread.</span></article>
            <article><strong>Susceptible branches and plant stress</strong><span>The beetle commonly attacks small lateral twigs. Drought, pruning, or recent transplanting may stress plants; attacks can also occur on healthy plants.</span></article>
            <article><strong>Weather and farm structure</strong><span>Rainfall, temperature, humidity, and shade-system characteristics are associated with seasonal or farm-level differences in studies. Their effects vary by place and season.</span></article>
            <article><strong>Signs of possible infestation</strong><span>Entry holes, twig dieback, and affected-tree counts are observations to inspect. They are evidence to verify, not underlying causes.</span></article>
          </div>
          <p className="bctb-factor-boundary">The expanded demo model receives all answered factors and actual readings entered in Farm readings. Unknown optional values are imputed from synthetic training data. Field notes stay on this device. The model still learns only from simulated labels.</p>
          <div className="bctb-factor-sources">
            <a href="https://doi.org/10.1093/jipm/pmv007" target="_blank" rel="noreferrer">Black twig borer biology and management review</a>
            <a href="https://doi.org/10.1111/afe.12265" target="_blank" rel="noreferrer">Uganda study of Robusta shade systems and rainfall zones</a>
            <a href="https://gssrr.org/JournalOfBasicAndApplied/article/view/11360" target="_blank" rel="noreferrer">Uganda study of forest edges and alternate host plants</a>
            <a href="https://irbackend.naro.go.ug/server/api/core/bitstreams/68c82e57-ff92-48df-8454-e3ea6807ae6c/content" target="_blank" rel="noreferrer">NARO study of seasonal population dynamics</a>
          </div>
        </div>
      </details>

      {hasDraft && (
        <div className="draft-banner" role="status">
          <span>
            {t.resumeDraft}
            {draftSavedTime ? ` (saved ${draftSavedTime})` : ""}
          </span>
          <div className="draft-actions">
            <button className="outline-button-sm" type="button" onClick={handleResumeDraft}>
              {t.resumeDraft}
            </button>
            <button className="text-button-sm" type="button" onClick={handleDiscardDraft}>
              {t.discardDraft}
            </button>
          </div>
        </div>
      )}

      {offlineQueued && <div className="screening-disclaimer" role="status">{offlineQueued}</div>}

      <div className="bctb-tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "NEW_ASSESSMENT"}
          className={`bctb-tab ${activeTab === "NEW_ASSESSMENT" ? "active" : ""}`}
          onClick={() => setActiveTab("NEW_ASSESSMENT")}
        >
          {t.newAssessmentTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "HISTORY"}
          className={`bctb-tab ${activeTab === "HISTORY" ? "active" : ""}`}
          onClick={() => setActiveTab("HISTORY")}
        >
          {t.historyTab} ({visitJournal.length + historyList.length})
        </button>
      </div>

      {activeTab === "HISTORY" ? (
        <>
        <section className="panel research-journal-panel">
          <div className="panel-header">
            <div>
              <h3>My field visit journal</h3>
              <p>Keep observations together across visits. Entries stay on this signed-in profile's device; model output is synthetic research only.</p>
            </div>
            <div className="journal-actions">
              <span className="journal-count">{visitJournal.length} visits</span>
              <button type="button" className="outline-button-sm" onClick={exportVisitJournal} disabled={!visitJournal.length}>Export CSV</button>
            </div>
          </div>
          {visitJournal.length === 0 ? (
            <p className="empty-state">No visits recorded yet. Complete a screening to start a field history.</p>
          ) : (
            <div className="research-journal-list">
              {visitJournal.map((entry) => {
                const fieldReadings = entry.assessment.fieldReadings;
                const signsCount = fieldReadings?.treesWithPossibleSigns;
                const treesChecked = fieldReadings?.coffeeTreesInspected;
                return <article className="research-journal-entry" key={entry.id}>
                  <div className="research-journal-entry-head">
                    <div><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time><small>{entry.assessment.farmId ? `Farm record ${entry.assessment.farmId}` : "Farm not selected"}</small></div>
                    <span className={`journal-status ${entry.status.toLowerCase()}`}>{entry.status === "COMPLETE" ? entry.prediction?.predicted_risk || "Complete" : "Waiting for internet"}</span>
                  </div>
                  <div className="research-journal-facts">
                    <span>Entry holes: <strong>{entry.modelInputs.suspected_entry_holes_observed ? "Reported" : "Not reported"}</strong></span>
                    <span>Dieback: <strong>{entry.modelInputs.twig_dieback_observed ? "Reported" : "Not reported"}</strong></span>
                    <span>Affected twigs: <strong>{entry.modelInputs.affected_twig_count_reported}</strong></span>
                    {signsCount !== null && signsCount !== undefined && treesChecked !== null && treesChecked !== undefined && <span>Sample trees: <strong>{signsCount}/{treesChecked} with possible signs</strong></span>}
                    {fieldReadings?.rainfall30dMm !== null && fieldReadings?.rainfall30dMm !== undefined && <span>Rainfall, 30 days: <strong>{fieldReadings.rainfall30dMm} mm</strong></span>}
                    {fieldReadings?.plotAreaHa !== null && fieldReadings?.plotAreaHa !== undefined && <span>Plot area: <strong>{fieldReadings.plotAreaHa} ha</strong></span>}
                  </div>
                  {fieldReadings?.measurementNotes && <p className="research-journal-note">Field note: {fieldReadings.measurementNotes}</p>}
                  {entry.prediction && <small className="research-journal-model-note">Synthetic model result: {entry.prediction.predicted_risk}; class output {(entry.prediction.class_probabilities[entry.prediction.predicted_risk] * 100).toFixed(1)}%. Not a diagnosis or field likelihood.</small>}
                </article>;
              })}
            </div>
          )}
        </section>

        <section className="panel history-panel">
          <div className="panel-header">
            <div>
              <h3>Earlier screening records</h3>
              <p>
                These records come from earlier versions of the app. New research-model predictions are not
                added here.
              </p>
            </div>
          </div>
          {historyList.length === 0 ? (
            <p className="empty-state">
              No earlier records on this device. Start a new assessment to check your trees.
            </p>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Risk level</th>
                    <th>Score</th>
                    <th>Main signs</th>
                    <th>Advice category</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`risk-badge-sm ${h.riskLevel.toLowerCase()}`}>
                          {h.riskLevel === "HIGH" ? "!" : h.riskLevel === "MODERATE" ? "~" : "✓"} {h.riskLevel}
                        </span>
                      </td>
                      <td>{h.internalScore}/100</td>
                      <td>
                        <small>{h.triggeredFactors.slice(0, 2).join("; ") || "No critical signs"}</small>
                      </td>
                      <td>{h.advisoryCategory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>
      ) : (
        <>
          <nav className="screening-stepper" aria-label={`Step ${currentStep} of 5`}>
            <ol>
              {stepLabels.map((label, index) => {
                const n = index + 1;
                const state = n === currentStep ? "current" : n < currentStep ? "complete" : "";
                return (
                  <li key={label} className={state}>
                    <button
                      type="button"
                      onClick={() => goBack(n)}
                      disabled={n > currentStep}
                      aria-current={n === currentStep ? "step" : undefined}
                    >
                      <span className="step-number">{n < currentStep ? "✓" : n}</span>
                      <span className="step-label">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <form className="screening-form screening-wizard" onSubmit={submitAssessment} noValidate>
            {currentStep === 1 && (
              <section className="panel screening-panel screening-step-active">
                <div className="panel-header">
                  <div>
                    <h3 tabIndex={-1}>What do you see on the twigs?</h3>
                    <p className="step-intro">
                      {mode === "GUIDED"
                        ? "Walk through a few trees and look closely at the young twigs. Answer all three questions."
                        : "Sample several trees and record all three observations."}
                    </p>
                  </div>
                </div>

                <YesNo
                  idPrefix="dieback"
                  legend={copy.dieback.q}
                  help={copy.dieback.help}
                  value={assessment.twigDiebackObserved ?? null}
                  onChange={(v) => update("twigDiebackObserved", v)}
                  error={showErrors && missingKeys.has("dieback")}
                  yesLabel={yes}
                  noLabel={no}
                />
                <YesNo
                  idPrefix="holes"
                  legend={copy.holes.q}
                  help={copy.holes.help}
                  value={assessment.pinSizedHoles}
                  onChange={(v) => update("pinSizedHoles", v)}
                  error={showErrors && missingKeys.has("holes")}
                  yesLabel={yes}
                  noLabel={no}
                />
                <TwigCounter
                  legend={copy.count.q}
                  help={copy.count.help}
                  value={assessment.affectedTwigCount}
                  onChange={(v) => update("affectedTwigCount", v)}
                  error={showErrors && missingKeys.has("count")}
                />

                {mode === "EXPERT" && <details className="advanced-screening-factors">
                  <summary>Record other symptoms seen in the same sample</summary>
                  <div className="advanced-factor-grid">
                    <YesNo idPrefix="increasing-damage" legend="Has twig damage increased since your last check?" value={assessment.increasingTwigDamage ?? null} onChange={(v) => update("increasingTwigDamage", v)} yesLabel={yes} noLabel={no} />
                    <YesNo idPrefix="yellowing" legend="Leaf yellowing observed?" value={assessment.yellowing ?? null} onChange={(v) => update("yellowing", v)} yesLabel={yes} noLabel={no} />
                    <YesNo idPrefix="blackening" legend="Twig blackening observed?" value={assessment.blackening ?? null} onChange={(v) => update("blackening", v)} yesLabel={yes} noLabel={no} />
                    <YesNo idPrefix="wilting" legend="Wilting observed?" value={assessment.wilting ?? null} onChange={(v) => update("wilting", v)} yesLabel={yes} noLabel={no} />
                    <YesNo idPrefix="drying" legend="Drying observed?" value={assessment.drying ?? null} onChange={(v) => update("drying", v)} yesLabel={yes} noLabel={no} />
                  </div>
                </details>}

                <div className="screening-step-actions">
                  <span>Your answers are saved on this device as you go.</span>
                  <button className="primary-button" type="button" onClick={() => goNext(1)}>
                    Next: farm history
                  </button>
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="panel screening-panel screening-step-active">
                <div className="panel-header">
                  <div>
                    <h3 tabIndex={-1}>Farm history</h3>
                    <p className="step-intro">One question about what has happened on this farm before.</p>
                  </div>
                </div>

                <YesNo
                  idPrefix="history"
                  legend={copy.history.q}
                  help={copy.history.help}
                  value={assessment.previousBctbHistory}
                  onChange={(v) => update("previousBctbHistory", v)}
                  error={showErrors && missingKeys.has("history")}
                  yesLabel={yes}
                  noLabel={no}
                />
                {mode === "EXPERT" && <YesNo idPrefix="known-hosts" legend="Known or suspected BCTB host plants near this farm?" value={assessment.hasAlternativeHosts ?? null} onChange={(v) => update("hasAlternativeHosts", v)} yesLabel={yes} noLabel={no} />}

                <div className="screening-step-actions">
                  <button className="outline-button" type="button" onClick={() => goBack(1)}>
                    Back
                  </button>
                  <button className="primary-button" type="button" onClick={() => goNext(2)}>
                    Next: farm care
                  </button>
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <section className="panel screening-panel screening-step-active">
                <div className="panel-header">
                  <div>
                    <h3 tabIndex={-1}>How do you look after the farm?</h3>
                    <p className="step-intro">
                      Answer honestly. Nobody is graded, and these answers help the screening fit your farm.
                    </p>
                  </div>
                </div>

                <OptionGroup
                  idPrefix="pruningFreq"
                  legend={copy.pruningFreq.q}
                  value={assessment.pruningFrequency ?? null}
                  options={copy.pruningFreq.options.map((o) => ({ ...o }))}
                  onChange={(v) =>
                    update("pruningFrequency", v as BctbAssessmentInput["pruningFrequency"])
                  }
                  error={showErrors && missingKeys.has("pruningFreq")}
                />
                <OptionGroup
                  idPrefix="sanitation"
                  legend={copy.sanitation.q}
                  value={assessment.farmSanitation ?? null}
                  options={copy.sanitation.options.map((o) => ({ ...o }))}
                  onChange={(v) =>
                    update("farmSanitation", v as BctbAssessmentInput["farmSanitation"])
                  }
                  error={showErrors && missingKeys.has("sanitation")}
                />
                <YesNo
                  idPrefix="recentPruning"
                  legend={copy.recentPruning.q}
                  help={copy.recentPruning.help || undefined}
                  value={assessment.recentPruning}
                  onChange={(v) => update("recentPruning", v)}
                  error={showErrors && missingKeys.has("recentPruning")}
                  yesLabel={yes}
                  noLabel={no}
                />
                {mode === "EXPERT" && <div className="advanced-factor-grid">
                  <YesNo idPrefix="suckers" legend="Unmanaged coffee suckers present?" value={assessment.unmanagedSuckersPresent ?? null} onChange={(v) => update("unmanagedSuckersPresent", v)} yesLabel={yes} noLabel={no} />
                  <YesNo idPrefix="desuckering" legend="Coffee recently de-suckered?" value={assessment.recentDeSuckering ?? null} onChange={(v) => update("recentDeSuckering", v)} yesLabel={yes} noLabel={no} />
                  <OptionGroup idPrefix="twig-removal" legend="How are affected or pruned twigs usually handled?" value={assessment.affectedTwigRemoval ?? null} options={[
                    { value: "CONSISTENT", label: "Collected consistently" },
                    { value: "INCONSISTENT", label: "Sometimes collected" },
                    { value: "NONE", label: "Usually left in the plot" },
                  ]} onChange={(v) => update("affectedTwigRemoval", v as BctbAssessmentInput["affectedTwigRemoval"])} />
                </div>}

                <div className="screening-step-actions">
                  <button className="outline-button" type="button" onClick={() => goBack(2)}>
                    Back
                  </button>
                  <button className="primary-button" type="button" onClick={() => goNext(3)}>
                    Next: farm readings
                  </button>
                </div>
              </section>
            )}

            {currentStep === 4 && (
              <section className="panel screening-panel screening-step-active readings-panel">
                <div className="panel-header">
                  <div>
                    <span className="section-kicker">Optional measurements · metric units</span>
                    <h3 tabIndex={-1}>Farm context and actual readings</h3>
                    <p className="step-intro">Use your own records or measuring tools. Leave a field blank if you do not know it. Use the same plot and 30-day period on later visits so records can be compared.</p>
                  </div>
                </div>

                <div className="reading-section">
                  <div><h4>Standard sample record</h4><p>These simple counts help describe how much of the farm you checked.</p></div>
                  <div className="reading-grid">
                    <label className="reading-field" htmlFor="reading-inspection-date"><span className="reading-label">Inspection date</span><input id="reading-inspection-date" type="date" max={localDateInputValue()} value={readings.inspectionDate} onChange={(event) => updateReading("inspectionDate", event.target.value)} /></label>
                    <ReadingNumber id="reading-plot-area" label="Sampled plot area" unit="ha" min={0.01} max={10000} step={0.01} value={readings.plotAreaHa} onChange={(v) => updateReading("plotAreaHa", v)} help="Area where you counted trees, not the entire farm unless fully inspected." />
                    <ReadingNumber id="reading-tree-count" label="Coffee trees inspected" unit="trees" min={1} max={100000} value={readings.coffeeTreesInspected} onChange={(v) => updateReading("coffeeTreesInspected", v === null ? null : Math.round(v))} help="Count the coffee trees you actually checked." />
                    <ReadingNumber id="reading-signed-tree-count" label="Trees with possible signs" unit="trees" min={0} max={100000} value={readings.treesWithPossibleSigns} onChange={(v) => updateReading("treesWithPossibleSigns", v === null ? null : Math.round(v))} help="Trees with at least one possible sign; this is separate from the damaged-twig count." />
                  </div>
                  {inconsistentTreeSample && <p className="reading-warning" role="alert">Trees with signs cannot exceed the number of trees inspected. Check these two counts.</p>}
                  {!inconsistentTreeSample && readings.coffeeTreesInspected !== null && readings.coffeeTreesInspected > 0 && readings.treesWithPossibleSigns !== null && (
                    <p className="reading-rate">Observed sample: {readings.treesWithPossibleSigns} of {readings.coffeeTreesInspected} trees ({(readings.treesWithPossibleSigns / readings.coffeeTreesInspected * 100).toFixed(1)}%) had possible signs. This describes the inspected sample; it is not a farm-wide estimate or model risk.</p>
                  )}
                </div>

                {mode === "EXPERT" && (
                  <>
                    <div className="reading-section">
                      <div><h4>Weather and branch measurements</h4><p>Enter instrument readings when available. Weather fields refer to the 30 days before this inspection.</p></div>
                      <div className="reading-grid">
                        <ReadingNumber id="reading-rainfall" label="Rainfall total" unit="mm / previous 30 days" min={0} max={2000} step={0.1} value={readings.rainfall30dMm} onChange={(v) => updateReading("rainfall30dMm", v)} />
                        <ReadingNumber id="reading-temp" label="Mean air temperature" unit="°C / previous 30 days" min={-10} max={60} step={0.1} value={readings.meanTemperature30dC} onChange={(v) => updateReading("meanTemperature30dC", v)} />
                        <ReadingNumber id="reading-humidity" label="Mean relative humidity" unit="% / previous 30 days" min={0} max={100} step={0.1} value={readings.meanRelativeHumidity30dPct} onChange={(v) => updateReading("meanRelativeHumidity30dPct", v)} />
                        <ReadingNumber id="reading-twig-diameter" label="Typical affected twig diameter" unit="mm" min={0.1} max={100} step={0.1} value={readings.affectedTwigDiameterMm} onChange={(v) => updateReading("affectedTwigDiameterMm", v)} help="Measure across an affected lateral twig with a ruler or caliper, if available." />
                      </div>
                    </div>
                    <div className="reading-section">
                      <div><h4>Shade, nearby vegetation, and plant stress</h4><p>These are contextual factors. Their relationship with infestation can vary by farm and season.</p></div>
                      <div className="reading-grid">
                        <label className="reading-field" htmlFor="reading-coffee-age"><span className="reading-label">Coffee age group</span><select id="reading-coffee-age" value={assessment.coffeeAge ?? ""} onChange={(event) => update("coffeeAge", (event.target.value || null) as BctbAssessmentInput["coffeeAge"])}><option value="">Not recorded</option><option value="YOUNG_UNDER_3">Under 3 years</option><option value="MATURE_3_TO_15">3–15 years</option><option value="OLD_OVER_15">Over 15 years</option></select></label>
                        <label className="reading-field" htmlFor="reading-coffee-variety"><span className="reading-label">Coffee variety</span><select id="reading-coffee-variety" value={assessment.coffeeVariety ?? ""} onChange={(event) => update("coffeeVariety", (event.target.value || null) as BctbAssessmentInput["coffeeVariety"])}><option value="">Not recorded</option><option value="ROBUSTA_TRADITIONAL">Robusta, traditional</option><option value="ROBUSTA_CWDr_CLONAL">Robusta, CWDr clonal</option><option value="ROBUSTA_MIXED">Mixed Robusta</option></select></label>
                        <label className="reading-field" htmlFor="reading-shade-canopy"><span className="reading-label">Shade canopy</span><select id="reading-shade-canopy" value={assessment.shadeCanopy ?? ""} onChange={(event) => update("shadeCanopy", (event.target.value || null) as BctbAssessmentInput["shadeCanopy"])}><option value="">Not recorded</option><option value="DENSE">Dense</option><option value="MODERATE">Moderate</option><option value="OPEN_FULL_SUN">Open or full sun</option></select></label>
                        <ReadingNumber id="reading-canopy" label="Estimated canopy cover" unit="%" min={0} max={100} step={1} value={readings.canopyCoverPct} onChange={(v) => updateReading("canopyCoverPct", v === null ? null : Math.round(v))} />
                        <ReadingNumber id="reading-shade-trees" label="Shade trees in sampled plot" unit="trees" min={0} max={100000} value={readings.shadeTreeCount} onChange={(v) => updateReading("shadeTreeCount", v === null ? null : Math.round(v))} />
                        <ReadingNumber id="reading-forest-distance" label="Distance to nearby woodland" unit="m" min={0} max={10000} step={1} value={readings.distanceToWoodlandM} onChange={(v) => updateReading("distanceToWoodlandM", v === null ? null : Math.round(v))} />
                        <label className="reading-field" htmlFor="reading-shade-species"><span className="reading-label">Common shade or nearby tree species</span><input id="reading-shade-species" type="text" maxLength={160} placeholder="Names if known; otherwise leave blank" value={readings.shadeTreeSpecies} onChange={(event) => updateReading("shadeTreeSpecies", event.target.value)} /></label>
                        <ReadingYesNo id="reading-hosts" label="Known or suspected alternate host plants nearby?" value={readings.nearbyHostVegetation} onChange={(v) => updateReading("nearbyHostVegetation", v)} />
                        <ReadingYesNo id="reading-drought" label="Visible water-stress symptoms in the last 30 days?" value={readings.droughtStressObserved} onChange={(v) => updateReading("droughtStressObserved", v)} />
                        <ReadingYesNo id="reading-transplant" label="Coffee plants recently transplanted?" value={readings.recentlyTransplanted} onChange={(v) => updateReading("recentlyTransplanted", v)} />
                        <ReadingYesNo id="reading-residue" label="Were infested/pruned twigs removed from the plot?" value={readings.infestedTwigsRemoved} onChange={(v) => updateReading("infestedTwigsRemoved", v)} />
                      </div>
                    </div>
                    <label className="reading-field reading-notes" htmlFor="reading-notes"><span className="reading-label">Measurement source or field notes</span><small className="help-text">For example: rain gauge, station name, inspection date, or how the sample was selected.</small><textarea id="reading-notes" rows={3} maxLength={500} value={readings.measurementNotes} onChange={(event) => updateReading("measurementNotes", event.target.value)} /></label>
                  </>
                )}

                {mode === "GUIDED" && <p className="reading-mode-note">Switch to <strong>Expert</strong> above to enter rainfall, temperature, humidity, twig diameter, shade, nearby vegetation, and plant-stress readings.</p>}
                <p className="reading-model-note">The expanded research model receives every entered factor and reading. Leave readings blank when unknown; the synthetic demo model imputes missing optional values. Field notes are kept on this device and are not sent to the model.</p>
                <div className="screening-step-actions">
                  <button className="outline-button" type="button" onClick={() => goBack(3)}>Back</button>
                  <span>Optional fields can be left blank.</span>
                  <button className="primary-button" type="button" onClick={continueToReview}>Review screening</button>
                </div>
              </section>
            )}

            {currentStep === 5 && (
              <section className="panel screening-panel screening-step-active">
                <div className="panel-header">
                  <div>
                    <h3 tabIndex={-1}>Check your answers</h3>
                    <p className="step-intro">The research model receives the core answers and every optional factor you entered. Blank optional readings are imputed; the result is based on synthetic labels, not verified farm outcomes.</p>
                  </div>
                </div>

                {modelError && (
                  <p className="form-error" ref={errorRef} tabIndex={-1} role="alert">
                    {modelError}
                  </p>
                )}

                <dl className="model-input-review">
                  {reviewRows.map((row) => (
                    <div key={row.label} className={row.ok ? "" : "review-missing"}>
                      <dt>{row.label}</dt>
                      <dd>
                        {row.value}
                        <button
                          type="button"
                          className="text-button-sm"
                          onClick={() => goBack(row.step)}
                          aria-label={`Edit: ${row.label}`}
                        >
                          {row.ok ? "Change" : "Answer"}
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="readings-review">
                  <div><h4>Optional farm readings</h4><button type="button" className="text-button-sm" onClick={() => { setMode("EXPERT"); setCurrentStep(4); }}>Change readings</button></div>
                  <p>Recorded values stay separate from the model score.</p>
                  <ul>
                    <li>Sample: {readings.inspectionDate || "date not recorded"}; {readings.coffeeTreesInspected ?? "—"} trees inspected, {readings.treesWithPossibleSigns ?? "—"} with possible signs{!inconsistentTreeSample && readings.coffeeTreesInspected && readings.treesWithPossibleSigns !== null ? ` (${(readings.treesWithPossibleSigns / readings.coffeeTreesInspected * 100).toFixed(1)}% of the inspected sample)` : ""}, over {readings.plotAreaHa ?? "—"} ha</li>
                    <li>30-day weather: rainfall {readings.rainfall30dMm ?? "—"} mm; mean temperature {readings.meanTemperature30dC ?? "—"} °C; mean humidity {readings.meanRelativeHumidity30dPct ?? "—"}%</li>
                    <li>Farm structure: canopy cover {readings.canopyCoverPct ?? "—"}%; shade trees {readings.shadeTreeCount ?? "—"}; affected twig diameter {readings.affectedTwigDiameterMm ?? "—"} mm</li>
                    <li>Nearby woodland distance: {readings.distanceToWoodlandM ?? "—"} m; shade/nearby species: {readings.shadeTreeSpecies || "not recorded"}</li>
                    <li>Possible host plants nearby: {answerText(readings.nearbyHostVegetation)}; water-stress symptoms: {answerText(readings.droughtStressObserved)}; recent transplanting: {answerText(readings.recentlyTransplanted)}; infested twigs removed: {answerText(readings.infestedTwigsRemoved)}</li>
                    {readings.measurementNotes && <li>Measurement notes: {readings.measurementNotes}</li>}
                  </ul>
                </div>

                {mode === "EXPERT" && (
                  <fieldset className="extra-notes">
                    <legend>Field notes (saved with your draft, not used by the model)</legend>
                    <div className="extra-checks">
                      {(
                        [
                          ["yellowing", "Leaf yellowing"],
                          ["blackening", "Twig blackening"],
                          ["wilting", "Wilting"],
                          ["drying", "Drying"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="check-inline">
                          <input
                            type="checkbox"
                            checked={assessment[key] === true}
                            onChange={(event) => update(key, event.target.checked)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <label htmlFor="farmer-notes" className="notes-label">
                      Notes
                      <textarea
                        id="farmer-notes"
                        rows={3}
                        maxLength={500}
                        placeholder="Block, tree age, recent weather, anything unusual"
                        value={assessment.farmerNotes}
                        onChange={(event) => update("farmerNotes", event.target.value)}
                      />
                    </label>
                  </fieldset>
                )}

                <div className="screening-step-actions screening-final-actions">
                  <button className="outline-button" type="button" onClick={() => goBack(4)}>
                    Back
                  </button>
                  <span>Result and entered factors are saved in your device-local visit journal; no officer is notified.</span>
                  <button className="primary-button screening-submit" type="submit" disabled={calculating}>
                    {calculating ? "Waiting for trained model…" : "Check my risk"}
                  </button>
                </div>
              </section>
            )}
          </form>
        </>
      )}

      {result && (
        <section
          className={`panel screening-result risk-${result.predicted_risk.toLowerCase()}`}
          ref={resultRef}
          tabIndex={-1}
          aria-live="polite"
        >
          <div className="result-heading">
            <div>
              <h3>
                {riskPlain[result.predicted_risk].title}
                <small> (synthetic-data model)</small>
              </h3>
              <p>{riskPlain[result.predicted_risk].line}</p>
              <p className="score-label">
                Uncalibrated model output for this class:{" "}
                <strong>{(result.class_probabilities[result.predicted_risk] * 100).toFixed(1)}%</strong>. This is
                not a real-world likelihood or confidence estimate.
              </p>
            </div>
            <span className="risk-icon" aria-hidden="true">
              {result.predicted_risk === "HIGH" ? "!" : result.predicted_risk === "MODERATE" ? "~" : "✓"}
            </span>
          </div>

          {result.model_name.includes("Local") && (
            <div className="local-fallback-notice">
              <p className="settings-info-card">
                <strong>Computed on your device</strong> The prediction service was unavailable, so this
                screening used the AgriSense expert rule engine. It is still an early warning, not a diagnosis.
              </p>
              <button
                className="outline-button"
                type="button"
                onClick={() => void retryModelPrediction()}
                disabled={calculating}
              >
                {calculating ? "Retrying…" : "Retry trained model"}
              </button>
            </div>
          )}

          <div className="research-actions">
            <h4>What to do next</h4>
            <p>Advice is matched to reported observations. Confirm symptoms in the field before acting; the model result is not a diagnosis.</p>
            {result.recommendations?.items.length ? (
              <div className="recommendation-list">
                {result.recommendations.items.map((item) => (
                  <article className="recommendation-card" key={item.code}>
                    <div><span className={`recommendation-priority ${item.priority.toLowerCase()}`}>{item.priority}</span><strong>{item.title}</strong></div>
                    <small>Matched to: {item.evidence_feature}</small>
                    <ul>{item.actions.map((action) => <li key={action}>{action}</li>)}</ul>
                  </article>
                ))}
                {result.recommendations.extension_referral.recommended && <p className="extension-referral-note">Extension referral recommended: {result.recommendations.extension_referral.reason}</p>}
                <small>{result.recommendations.safety_note}</small>
              </div>
            ) : (
              <ol>{result.actionable_steps.map((step) => <li key={step}>{step}</li>)}</ol>
            )}
          </div>

          <details className="research-explanation" open={mode === "EXPERT"}>
            <summary>Why did the model choose this? (SHAP)</summary>
            <p>
              Each line shows how one of your answers pushed the model toward or away from this result,
              compared with synthetic reference data. Positive values support the result and negative values
              oppose it. These are patterns learned from synthetic labels, not causes or field evidence.
            </p>
            <div className="shap-top-three" aria-label="Three strongest model feature contributions">
              <h4>Three strongest feature contributions</h4>
              {(result.top_shap_contributions || result.shap_contributions
                .slice().sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 3))
                .map((item) => {
                  const largest = Math.max(0.0001, ...result.shap_contributions.map((entry) => Math.abs(entry.contribution)));
                  const width = Math.max(2, Math.abs(item.contribution) / largest * 100);
                  const positive = item.contribution >= 0;
                  return <div className="shap-chart-row" key={`chart-${item.feature}`}>
                    <span>{item.feature}</span>
                    <div className="shap-bar-track" role="meter" aria-label={`${item.feature} contribution`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(width)}>
                      <span className={`shap-bar-fill ${positive ? "positive" : "negative"}`} style={{ width: `${width}%` }} />
                    </div>
                    <strong className={positive ? "positive" : "negative"}>{item.contribution > 0 ? "+" : ""}{item.contribution.toFixed(3)}</strong>
                  </div>;
                })}
            </div>
            <ol className="shap-list">
              {result.shap_contributions.map((item) => (
                <li className="shap-row" key={item.feature}>
                  <span>
                    <strong>{item.feature}</strong>
                    <small>
                      Your answer: {item.value} ·{" "}
                      {item.direction === "SUPPORTS_PREDICTION"
                        ? "supports this result"
                        : item.direction === "OPPOSES_PREDICTION"
                          ? "opposes this result"
                          : "no material effect"}
                    </small>
                  </span>
                  <strong>
                    {item.contribution > 0 ? "+" : ""}
                    {item.contribution.toFixed(3)}
                  </strong>
                </li>
              ))}
            </ol>
            <small>Scale: model log-odds, not percentage points.</small>
          </details>

          {result.predicted_risk === "HIGH" && result.counterfactual && (
            <details className="research-explanation">
              <summary>Model counterfactual (DiCE)</summary>
              <p>Changes the model found that would produce the requested lower class:</p>
              <ul className="factors-list">
                {Object.entries(result.counterfactual.changes).map(([feature, value]) => (
                  <li key={feature}><strong>{feature.replace(/_/g, " ")}</strong>: {String(value)}</li>
                ))}
              </ul>
              <small>{result.counterfactual.disclaimer}</small>
            </details>
          )}

          <details className="research-explanation" open={mode === "EXPERT"}>
            <summary>All class probabilities and model details</summary>
            <ul className="factors-list">
              {(["LOW", "MODERATE", "HIGH"] as const).map((level) => (
                <li key={level}>
                  {level}: {(result.class_probabilities[level] * 100).toFixed(1)}%
                </li>
              ))}
            </ul>
            <p>{result.disclaimer}</p>
            <div className="result-meta-footer">
              <span>Model: <strong>{result.model_name}</strong></span>
              <span>Artifact: <strong>{result.model_artifact}</strong></span>
              <span>Inputs: <strong>{result.input_count}/{result.input_total}</strong></span>
            </div>
          </details>

          {modelInputs && <WhatIfRiskExplorer inputs={modelInputs} baseline={result} rainfall30dMm={readings.rainfall30dMm} />}
        </section>
      )}
    </section>
  );
}
