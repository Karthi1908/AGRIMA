# Validation Quickstart: Risk Analytics & Trust

This guide explains how to validate the end-to-end functionality for the 004-risk-analytics-trust feature without requiring access to external financial APIs.

## Prerequisites

1.  Python 3.11+
2.  Node.js 18+
3.  Google Gemini API key (`GEMINI_API_KEY`) set in backend `.env`.

## 1. Validating Backend Simulation (No UI)

You can validate the deterministic payoff engine directly using `pytest`.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
pytest tests/unit/test_simulator.py -v
```
**Expected Outcome:** Tests pass, proving that Monte Carlo simulation calculates knock-out probabilities, expected shares, worst 5% loss, and stress tests correctly given fixed mock inputs.

## 2. Validating the Extraction Benchmark (Agent ADK)

The extraction benchmark runs the `google-genai` agent orchestration over a set of synthetic termsheets to measure field provenance and accuracy.

```bash
cd backend
python scripts/run_benchmark.py
```
**Expected Outcome:** A console report summarizing the exact-match rate (>90%) and missing-detection rate (>95%), validating FR-012 and the Field Provenance models.

## 3. Validating End-to-End via the Web UI

Start the backend:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

1. Open `http://localhost:5173`.
2. **Upload a Termsheet**: Provide a sample termsheet (e.g. `tests/samples/nvda_accumulator.pdf`).
3. **Verify Provenance**: Observe the Termsheet Details view. Check that fields are labeled as `Found`, `Inferred`, or `Missing`.
4. **Run Simulation**: Ensure you cannot simulate until `Missing` fields are user-supplied. Once supplied, review the Simulation Assumptions inputs (drift defaults to risk-free minus dividend; override is labelled), set a seed, and run. Re-running with the same seed must give identical results; editing any input marks results stale.
5. **Inspect Risk Lens**: View the risk panel to see the "gain capped at X" statement and stress test impacts.
6. **Export PDF**: Optionally open "Report branding" (session only) and set firm name, colour, logo and disclaimer. Click "Export Client PDF" (disabled while results are stale). A `.pdf` downloads, generated entirely in the browser, with disclaimers and a client name/date/signature block.
7. **Basket correlation**: for a product with more than one underlying, confirm the correlation field is required (-1 to 1) and appears labelled as an assumption in the PDF.
**Expected Outcome:** E2E validation matches acceptance criteria from user stories 1, 2, 4, 6 and 7.
