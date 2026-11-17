# AgriSense-BCTB data retrieval scripts

## What these scripts retrieve/create

1. `01_fetch_nasa_power.py` downloads genuine NASA POWER gridded daily weather estimates for each site.
2. `02_generate_synthetic_assessments.py` creates clearly marked synthetic farm-assessment rows for software/pipeline demonstration.
3. `03_merge_weather_and_assessments.py` joins each synthetic assessment to the preceding 30-day weather summary.
4. `04_check_dataset.py` checks the resulting dataset.

**Important:** There is no verified BCTB outcome dataset being downloaded here. Public weather data cannot supply confirmed farm-level BCTB labels. The synthetic risk band is generated from illustrative rules and must not be presented as actual infestation status, model validation, or real predictive performance.

## Setup

From this folder:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

## Required site coordinates

Edit `data/raw/sites.csv` and enter decimal latitude and longitude for each location.
The downloader deliberately stops if coordinates are blank; it does not invent coordinates.
Use the actual farm/site coordinates or a documented district/site centroid. Record which one you used.

## Run

```bash
python scripts/01_fetch_nasa_power.py
python scripts/02_generate_synthetic_assessments.py
python scripts/03_merge_weather_and_assessments.py
python scripts/04_check_dataset.py
```

Main output:
`data/processed/agrisense_synthetic_demo_dataset.csv`

## Methodological boundary

The synthetic dataset is useful for testing preprocessing, model code, charts, and the application workflow. It cannot establish that the model predicts real BCTB risk. For real model evaluation, replace synthetic rows and labels with baseline farm assessments and independently verified follow-up inspection outcomes. Do not treat `LOW/MODERATE/HIGH` synthetic labels as confirmed BCTB presence.

## Research inference API

The farmer assessment page sends the seven required answers plus all additional entered symptom, farm-context, weather, and measurement factors to the authenticated Firebase Function `predictResearchBctb`. The Function checks the signed-in user's role and proxies to the Python API; the API loads `ml/models/logistic_regression.joblib`. The expanded API returns class probabilities and SHAP contributions grouped back to all 34 predictors. Missing optional readings are imputed by the saved pipeline. The generated expanded labels and data are demonstration-only; metrics against them do not establish field performance. The model API key is held by the Function and Python service, never in the browser. The Function does not fall back to the rules engine if inference fails.

### Run locally

Start the model API and app from the repository root (`AgriSense_BCTB_Data_Retrieval` is inside this folder). Use two PowerShell terminals.

**Terminal 1 — install dependencies once, configure the local key, and start the model API:**
```powershell
python -m pip install -r AgriSense_BCTB_Data_Retrieval\ml\api-requirements.txt
python AgriSense_BCTB_Data_Retrieval\ml\generate_expanded_synthetic_data.py
python AgriSense_BCTB_Data_Retrieval\ml\01_train_synthetic_models.py
$keyLine = Select-String -Path functions\.secret.local -Pattern '^RESEARCH_MODEL_API_KEY=' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($keyLine) {
  $key = $keyLine.Line.Substring('RESEARCH_MODEL_API_KEY='.Length)
} else {
  $key = [Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N")
  Add-Content -Path functions\.secret.local -Value "RESEARCH_MODEL_API_KEY=$key"
}
$env:RESEARCH_MODEL_API_KEY = $key
python -m uvicorn --app-dir AgriSense_BCTB_Data_Retrieval\ml api:app --host 127.0.0.1 --port 8000
```

The API should print that it is listening on `127.0.0.1:8000`. Check `http://127.0.0.1:8000/health` in a browser; it should return `{"status":"ready",...}`.

Alternatively, run the API and its dependencies in Docker Compose from `agri-intelligence` with `npm run compose:up`. Compose reads only `RESEARCH_MODEL_API_KEY` from the same `functions\.secret.local` file used by the emulator, so both services use the same local key.

**Terminal 2 — build/reload Firebase Functions and start the frontend:**
```powershell
npm run dev
```

This project script builds `functions` before starting the emulator and Vite. If the app or emulator was already running when you added `predictResearchBctb`, stop it with `Ctrl+C` and restart it now; otherwise the emulator can keep serving an older build and return 404. Keep both terminals running while testing.

In the frontend, sign in with a local farmer or farm-manager account. Select **Start Screening**, complete the required questions, optionally enter detailed readings, then submit. The Function authenticates the user and forwards all model factors to the Python API. The synthetic class, 34-feature SHAP breakdown, recommendations, counterfactual, and what-if explorer appear below the form.

### Deploy

Build and deploy the Python API container to Cloud Run from the repository root (the build context includes the synthetic reference dataset used by SHAP):

```powershell
docker build -f AgriSense_BCTB_Data_Retrieval\ml\Dockerfile -t agrisense-bctb-model-api .
```

Configure `RESEARCH_MODEL_API_KEY` on Cloud Run through Google Secret Manager and require it for prediction requests. The endpoint must be reachable by the Firebase Function.

Set the same secret for the Function using `firebase functions:secrets:set RESEARCH_MODEL_API_KEY`. In `functions\.env.<firebase-project-id>`, set `RESEARCH_MODEL_API_URL` to the Cloud Run service URL. Then deploy the endpoint and Hosting rewrite:

```powershell
firebase deploy --only functions:predictResearchBctb,hosting
```

Do not put the shared API key in a Vite variable, frontend configuration, or committed file. If the Python API or Function is unavailable or rejects the request, the assessment displays an error and does not substitute a rules-based prediction.
