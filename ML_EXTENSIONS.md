# AgriSense ML and offline extensions

These extensions use the existing authenticated React/Firebase app and the Python inference API in `AgriSense_BCTB_Data_Retrieval/ml`. They do not create a second frontend or expose the model API key in browser code.

## 1. Prediction explanations

The expanded 34-feature Logistic Regression pipeline accepts the seven required screening inputs plus answered symptoms, farm management/context, measured weather, plot/sample measurements, and shade/host information. Unanswered optional predictors are explicitly null and imputed by the pipeline; notes and direct inspection dates are not sent (month is derived locally). The `/predict` response contains all 34 grouped SHAP contributions, the top three, structured non-chemical follow-up advice, and a counterfactual for HIGH. DiCE proposals are exhaustively checked over permitted sanitation/pruning options. Every artifact label remains synthetic and probabilities are not field risk estimates.

`dice-ml` is included in `ml/api-requirements.txt`. If it cannot produce a valid candidate, prediction still succeeds and `counterfactual` is `null`.

## 2. Offline use and synchronization

`src/hooks/useOfflineSync.ts` exposes connectivity, the pending queue count, and a manual sync action. A completed research-model form submitted offline is stored in the user-scoped IndexedDB `research_queue` with `synced: false`; when connectivity returns, the authenticated Firebase Function sends it to the model API and the returned result is retained on the device. The screening page also keeps a user-scoped, device-local field visit journal with the entered observations/readings, sync state, and synthetic model output; it can be exported to CSV for farmer-controlled sharing with an extension officer. This is local device storage, not a cloud backup or verified diagnosis record. Assessment drafts and the older Firebase assessment queue also remain available. `public/service-worker.js` caches the app shell and same-origin static assets, and deliberately skips `/api/*` responses. Registration happens in production from `src/main.tsx`.

The assessment submit function keeps the original creation time and applies an incoming queued edit only when its `clientModifiedAt` is newer than the saved copy. Queue IDs remain idempotent and scoped to the signed-in farmer.

## 3. FastAPI and Docker Compose

The model artifact and locked scikit-learn dependency are kept together in the existing container. It uses Python 3.12 to support the checked-in model stack and current optional ML packages. Pydantic rejects missing, malformed, or extra model fields with FastAPI validation errors. Compose runs the API and PostgreSQL; successful predictions write a feature-only audit row when PostgreSQL is configured. Audit failure does not block inference.

For local development, store `RESEARCH_MODEL_API_KEY` in `functions/.secret.local`. This is the same file used by the Firebase Functions emulator. Set a non-default `POSTGRES_PASSWORD`, then start Compose from `agri-intelligence`:

```powershell
npm run compose:up
```

The FastAPI service listens on port 8000. Set `RESEARCH_MODEL_API_URL` for Functions to the API's reachable URL. For local Vite/Firebase emulator use, follow the Python API instructions in `AgriSense_BCTB_Data_Retrieval/README.md` and keep the API key in the Functions secret configuration; do not add it to a `VITE_` variable.

## 4. Manual RAG chat

Install the optional dependencies and add trusted PDF manuals:

```powershell
python -m pip install -r AgriSense_BCTB_Data_Retrieval/ml/rag-requirements.txt
python AgriSense_BCTB_Data_Retrieval/ml/rag_ingest.py
```

The script reads PDFs from `ml/documents` and writes a Chroma index to `ml/chroma`. Start Ollama, download the selected model once (`ollama pull llama3`), and set `OLLAMA_BASE_URL` so the API can reach it. The authenticated `/chat` route retrieves three chunks and instructs the model to answer only from those chunks, returning “I don't know” when the context has no answer. In Compose, the optional requirements are installed and the Ollama service is included; run `docker compose exec ollama ollama pull llama3` once before using manual search.

## 5. Luganda speech input

Install `ml/speech-requirements.txt`. The AI assistant page records with `MediaRecorder`, converts the audio to WAV in the browser, and sends it through an authenticated Firebase Function to `/transcribe`. The endpoint uses `sulaimank/whisper-small-lg-lm` and passes the requested `language="sw"` / `task="transcribe"` arguments. Model weights download on first use; allow enough disk, memory, and startup time. Audio is not retained by the API.

## 6. Optional twig image detector

Install `ml/vision-requirements.txt`. Prepare a correctly labeled Ultralytics detection dataset (YOLO bounding-box labels are required; image-level healthy/damaged labels are not enough), then train:

```powershell
python AgriSense_BCTB_Data_Retrieval/ml/train_twig_detector.py --data path/to/dataset.yaml --epochs 50
```

Copy the resulting `best.pt` to `AgriSense_BCTB_Data_Retrieval/ml/models/optional/twig_holes.pt` for Compose, or set `TWIG_YOLO_MODEL` to the weights path. The authenticated `/detect-twig` route returns pixel-coordinate boxes and confidence scores. The frontend displays the detections. No trained detector weights or verified labeled twig dataset are included, so this route reports that weights are unavailable until you supply them. Visual detections remain screening signals and require field confirmation.

A minimal Ultralytics dataset YAML has this shape (with one YOLO `.txt` box-label file per image):

```yaml
path: /absolute/path/to/twig-dataset
train: images/train
val: images/val
names:
  0: bctb_hole
```

## Current research boundary

The checked-in risk model and its SHAP reference data are synthetic demonstrations, not verified BCTB outcomes. Do not present their probabilities, feature effects, DiCE suggestions, or the optional image detector as diagnosis or treatment guidance. The app's existing non-chemical cultural guidance and extension verification workflow remain the appropriate field pathway.

Run `python AgriSense_BCTB_Data_Retrieval/ml/generate_expanded_synthetic_data.py` followed by `python AgriSense_BCTB_Data_Retrieval/ml/01_train_synthetic_models.py` to regenerate and train the expanded synthetic demo. The labels are generated from illustrative weights and simulated measurements, solely to exercise a wider pipeline. The screening's optional symptom, context, and measured inputs now reach the API and appear in SHAP; absent readings are imputed. Free-text field notes stay local. The what-if panel reruns the API when sanitation, pruning, or a rainfall scenario changes. These changes demonstrate software behavior, not agricultural validity.

## Retraining plan for a field model

The expanded synthetic labels are suitable for demonstrating features, preprocessing, explanations, and integration, but not for agronomic validation. For a field model, collect repeated, consented farm-visit records with a stable `farm_id`, visit date, subcounty, coffee type, inspection protocol, all entered factors, and a separately verified outcome. Record whether suspected signs were confirmed as BCTB by a trained officer or diagnostic protocol; keep `suspected signs` separate from `confirmed BCTB`. Record inspection effort (trees/twigs checked) so raw counts can be interpreted. Weather must include source, station/grid, time window, and missingness. Collect enough farms and positive confirmed cases across seasons and districts before claiming generalization.

Split evaluation data by farm, and reserve a later time period or district as an untouched external test where sample size permits. Fit preprocessing only on training folds. Compare a simple baseline (logistic regression) with Random Forest and gradient boosting using group-aware cross-validation. Report sensitivity/recall for confirmed cases, specificity, precision, PR-AUC, calibration/Brier score, confidence intervals, subgroup performance, and the confusion matrix at the chosen operating threshold. Tune thresholds on validation data only. After selecting the model, compute SHAP using training-fold background data and check explanation stability. Permit DiCE to change only actionable management fields; keep symptoms, prior reports, location and measured environmental facts immutable. Save data/model versions, split definitions, metrics, and an explicit research status with the artifact.

For the academic demo, present this as a staged system: (1) standardized field capture and offline synchronization, (2) transparent synthetic baseline clearly marked as a prototype, (3) SHAP-linked field verification advice, (4) constrained what-if explanation, then (5) the data and group/time-split validation needed before a field model. Do not present a counterfactual class flip as an agronomic treatment effect or a model score as a calibrated disease probability.

## Farmer pilot and product path

The product value to test with farmers is a repeatable field workflow: record the same sample consistently, keep a visit history offline, export a simple record for an extension visit, receive cautious next steps, and return to compare observations. The prediction is a prototype add-on until validated. Before charging or claiming field accuracy, pilot with farmers and extension officers in target districts; test Luganda and local-language wording, low-cost Android usability, shared-device privacy, offline recovery, advisory comprehension, and whether the journal/export actually improves follow-up. Track task completion, repeat inspections, confirmed/refuted cases, and referral outcomes. Use these findings to prioritize product work and build a consented, verified dataset. A polished synthetic demo can prove the architecture and explainability workflow; farmer willingness to pay and agronomic performance require field evidence.
