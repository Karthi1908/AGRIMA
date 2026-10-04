# Quickstart Validation Guide: Clear Termsheet Home & Dedicated Details View

**Feature**: `002-clear-home-termsheet`
**Date**: 2026-10-02

## Prerequisites
- Node.js 18+ and npm
- Python 3.11 with FastAPI backend (optional for sample validation; required for live OCR extraction)

## Setup Commands
```bash
# 1. Install frontend dependencies (if not already installed)
cd frontend
npm install

# 2. Run the frontend development server
npm run dev
```

---

## Validation Scenarios

### Scenario 1: Clean Minimalist Home Landing View
1. Open the browser to `http://localhost:5173`.
2. **Observe**:
   - The page renders a calm, editorial header with brand title, "ADK Active", and Principle I Zero-Retention badge.
   - The hero intake section asks directly for the user's termsheet with a prominent drag-and-drop / file-select zone.
   - **Verification**: Ensure NO payoff canvas charts, multi-asset sliders, or outcome cards are visible.
   - **Verification**: Subtle sample links ("Try sample: 3-Stock FCN | Dual Currency DCI") are present at the bottom of the intake card.

### Scenario 2: Sample Termsheet Selection to Details View
1. On the landing page, click **"3-Stock FCN"** under sample termsheets.
2. **Observe**:
   - The view smoothly transitions from `LANDING_UPLOAD` to `TERMSHEET_DETAILS`.
   - **Verification**: The page displays the dedicated `TermsheetDetails` view containing:
     - Product title and archetype badge (`Fixed Coupon Note`)
     - Currency, Notional ($100,000.00), Issue Date, and Maturity Date
     - Underlyings table listing AAPL, MSFT, and NVDA with their initial fixing prices
     - Barrier schedule table showing periods 1, 2, 3 with Knock-Out (100%), Knock-In (70%), Coupon Barrier (80%), and Coupon Rate (1.00%)
     - Plain-language payoff mechanics explaining coupon payout conditions and downside risks.
   - **Verification**: No counterparty bank names or confidential investor IDs are displayed.

### Scenario 3: One-Click Reset to Clean Home State
1. In the `TermsheetDetails` view, click **"Upload Another Termsheet"** (or **"Reset Session"** in the top bar).
2. **Observe**:
   - The screen immediately returns to the clean `LANDING_UPLOAD` state.
   - In-memory product state is cleared.

### Scenario 4: Optional Interactive Simulator Expansion
1. Load a termsheet (e.g., click "Dual Currency DCI").
2. In the `TermsheetDetails` header, click **"Open Interactive Simulator"**.
3. **Observe**:
   - The interactive simulation workspace (DCI workspace or Autocall 2-column workspace with sliders) expands below the termsheet details cards.
   - Adjusting spot sliders updates the return metrics dynamically.
   - Clicking **"Hide Simulator"** collapses the interactive controls, returning focus purely to the termsheet details.
