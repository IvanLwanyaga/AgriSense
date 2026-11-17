#!/usr/bin/env bash
set -e
cd AgriSense_BCTB_Data_Retrieval/ml
uvicorn api:app --host 0.0.0.0 --port $PORT
