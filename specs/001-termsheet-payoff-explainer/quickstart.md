# Quickstart & Validation Guide: Smart Termsheet Scanner & Payoff Explainer

**Feature**: `001-termsheet-payoff-explainer`  
**Date**: 2026-09-27  
**Status**: Ready for Validation  

---

## 1. Prerequisites

- **Python**: 3.11+ (with `pip` or `uv`)
- **Node.js**: 20+ (with `npm` or `pnpm`)
- **Google Cloud Access**: Vertex AI API enabled or `GEMINI_API_KEY` configured in environment
- **Google Cloud CLI**: `gcloud` authenticated (for Cloud Run deployment testing)

---

## 2. Environment Setup

### Backend (Python + Google ADK + FastAPI)
```bash
# Clone / navigate to repo root
cd c:/Users/Karth/hacks-projects/AGRIMA

# Set up Python virtual environment
python -m venv .venv
.venv\Scripts\activate  # On Windows

# Install backend dependencies
pip install fastapi uvicorn google-genai pydantic pypdf pdf2image pillow python-multipart

# Set Gemini API Key
$env:GEMINI_API_KEY="your-gemini-api-key"
```

### Frontend (Vite + TypeScript + Modern UI)
```bash
# In frontend directory
cd frontend
npm install
```

---

## 3. Running Locally

### Start Backend Service
```bash
# In repository root
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### Start Frontend Application
```bash
# In frontend directory
npm run dev
```
UI will be accessible at: `http://localhost:5173`

---

## 4. End-to-End Validation Scenarios

### Scenario 1: Termsheet Ingestion & Verification Drawer (P1)
1. Navigate to `http://localhost:5173`.
2. Drag and drop a sample PDF termsheet (e.g. 3-Stock Equity Autocall FCN) onto the upload zone.
3. **Expected Outcome**:
   - Extraction completes within 5-10 seconds.
   - The interactive parameter verification drawer slides open.
   - Economic fields (tickers, initial spot prices, 70% knock-in, 100% autocall hurdle, monthly observation schedule) are accurately populated.
   - No bank logos, investor names, or account numbers appear anywhere in the interface.

### Scenario 2: Dynamic Payoff Simulation & Worst-Of Slider Interaction (P1 & P2)
1. Confirm the verified parameters in the verification drawer.
2. The main canvas renders the high-contrast interactive 2D payoff diagram.
3. Drag the independent slider for Stock A down to -35% (below the 70% knock-in barrier) while Stock B and C remain at +5%.
4. **Expected Outcome**:
   - The graph dynamically recalculates within <100ms.
   - Stock A is immediately highlighted as the active "Worst-Of" performer.
   - The knock-in barrier is triggered, shifting the maturity payoff into the capital-loss put zone.
   - The calculated net return percentage updates fluidly at 60fps.

### Scenario 3: Dual Currency Investment (DCI) Simulation
1. Switch to the DCI sample product or upload a DCI termsheet (e.g. USD/EUR linked at 1.0800 strike).
2. Move the simulated FX fixing rate above vs below 1.0800.
3. **Expected Outcome**:
   - The chart dynamically switches payout denomination between USD and EUR.
   - Conversion mechanics and effective annualized yield are clearly indicated.

### Scenario 4: Plain-Language Scenario Narratives (P3)
1. Click the **"Explain Scenarios"** button.
2. **Expected Outcome**:
   - The ClientNarrativeAgent delivers three concise narrative cards: **Best Case**, **Base Case**, and **Worst Case**.
   - Clear explanations describe under what market moves early redemption occurs, when coupons are earned, and downside risk.

---

## 5. Google Cloud Run Deployment Validation

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and deploy container directly to Cloud Run (stateless)
gcloud run deploy structured-product-explainer \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=secretmanager:GEMINI_API_KEY
```
Verify the live HTTPS Cloud Run URL opens cleanly and performs termsheet scanning statelessly.
