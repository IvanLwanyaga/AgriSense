FROM python:3.12-slim

WORKDIR /app

COPY AgriSense_BCTB_Data_Retrieval/ml/api-requirements.txt .
COPY AgriSense_BCTB_Data_Retrieval/ml/rag-requirements.txt AgriSense_BCTB_Data_Retrieval/ml/speech-requirements.txt AgriSense_BCTB_Data_Retrieval/ml/vision-requirements.txt ./
ARG INSTALL_OPTIONAL_ML_EXTRAS=false
RUN pip install --no-cache-dir -r api-requirements.txt \
    && if [ "$INSTALL_OPTIONAL_ML_EXTRAS" = "true" ]; then \
         pip install --no-cache-dir -r rag-requirements.txt -r speech-requirements.txt -r vision-requirements.txt; \
       fi

COPY AgriSense_BCTB_Data_Retrieval/ml/api.py .
COPY AgriSense_BCTB_Data_Retrieval/ml/models/logistic_regression.joblib models/logistic_regression.joblib
COPY AgriSense_BCTB_Data_Retrieval/data/processed/agrisense_synthetic_expanded_dataset.csv data/processed/agrisense_synthetic_expanded_dataset.csv

ENV PORT=8000
ENV SHAP_BACKGROUND_PATH=/app/data/processed/agrisense_synthetic_expanded_dataset.csv
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT}"]
