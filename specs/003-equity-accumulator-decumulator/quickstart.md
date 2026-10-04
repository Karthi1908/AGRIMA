# Quickstart Validation Guide: Equity Accumulator & Equity Decumulator Products

**Feature**: `003-equity-accumulator-decumulator`
**Date**: 2026-10-02

## Prerequisites
- Node.js 18+ and npm
- Python 3.11 with FastAPI backend (optional for sample validation; required for PDF extraction)

## Setup Commands
```bash
# 1. Install frontend dependencies
cd frontend
npm install

# 2. Start frontend dev server
npm run dev
```

---

## Validation Scenarios

### Scenario 1: Explore Sample Equity Accumulator
1. Open `http://localhost:5173`.
2. Click **"Equity Accumulator"** from the sample products or demo selector.
3. **Observe**:
   - The view loads the NVDA 60-Day Equity Accumulator ($S_0 = \$120.00$, Strike $K = \$102.00$ [85%], Knock-Out = $103\%$, Gearing = 2.0x, Daily Shares = 100).
   - In `TermsheetDetails`:
     - Badge shows `Equity Accumulator`.
     - Parameters table displays: Daily Shares: `100`, Total Days: `60`, Strike: `\$102.00 (85.0%)`, Knock-Out Barrier: `103.0%`, Gearing: `2.0x`.
     - Dual Display shows physical shares commitment (6,000 shares at 1x) and cash commitment.

### Scenario 2: Simulate Spot Movement Across Accumulator Zones
1. In the Accumulator workspace, adjust the Spot Price Slider:
   - **Above Knock-Out (e.g. $125.00)**:
     - Badge displays `Knocked Out (Early Cancellation)`.
     - Simulation registers contract termination.
   - **Between Strike and Knock-Out (e.g. $110.00)**:
     - Accumulation is active at 1x (6,000 shares).
     - Net profit displays as positive: `6,000 × ($110 - $102) = +$48,000.00`.
   - **Below Strike (e.g. $90.00)**:
     - 2x Gearing triggers!
     - Total shares accumulated doubles to `12,000 shares`.
     - Cash required at strike is `12,000 × $102 = $1,224,000.00`.
     - Net mark-to-market loss is clearly displayed: `12,000 × ($90 - $102) = -$144,000.00`.

### Scenario 3: Explore Sample Equity Decumulator
1. Switch product to **"Equity Decumulator"** (TSLA, $S_0 = \$240.00$, Strike $K = \$276.00$ [115% premium], Knock-Out = $95\%$, Gearing = 2.0x, Daily Shares = 100).
2. **Observe**:
   - In `TermsheetDetails`:
     - Badge displays `Equity Decumulator`.
     - Downside knock-out barrier (95%) and upside strike (115%) are clearly displayed.
3. Move spot slider:
   - **Below Knock-Out (<$228.00)**: Contract cancels early.
   - **Between KO and Strike ($250.00)**: Sells 1x shares (6,000 shares) at the premium strike ($276.00).
   - **Above Strike ($300.00)**: 2x gearing triggers mandatory sale of double shares (12,000 shares) at the $276.00 strike price, displaying the net opportunity cost compared to market spot.
