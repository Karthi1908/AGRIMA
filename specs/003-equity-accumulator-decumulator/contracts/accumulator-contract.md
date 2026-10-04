# Interface Contracts: Equity Accumulator & Equity Decumulator

**Feature**: `003-equity-accumulator-decumulator`
**Date**: 2026-10-02

## 1. Backend REST API Schema Extension

### Endpoint: `/api/extract` (POST)
Extracts termsheet and populates `accumulator_parameters` when archetype is `EQUITY_ACCUMULATOR` or `EQUITY_DECUMULATOR`.

```json
{
  "product": {
    "product_id": "prod-acc-01",
    "archetype": "EQUITY_ACCUMULATOR",
    "title": "NVDA 60-Day Equity Share Accumulator",
    "denomination_currency": "USD",
    "notional_amount": 600000.0,
    "issue_date": "2026-10-01",
    "maturity_date": "2026-12-31",
    "underlyings": [
      {
        "symbol": "NVDA",
        "name": "NVIDIA Corp.",
        "currency": "USD",
        "initial_fixing": 120.0,
        "simulated_price": 120.0,
        "performance_pct": 0.0
      }
    ],
    "barrier_schedule": [],
    "capital_protection_pct": 0.0,
    "accumulator_parameters": {
      "strike_price": 102.0,
      "strike_pct": 85.0,
      "knock_out_barrier_pct": 103.0,
      "knock_out_observation_type": "EUROPEAN",
      "gearing_ratio": 2.0,
      "daily_share_count": 100.0,
      "total_observation_days": 60,
      "guaranteed_days": 0
    }
  },
  "field_confidence": {
    "archetype": 0.98,
    "accumulator_parameters.strike_price": 0.96,
    "accumulator_parameters.knock_out_barrier_pct": 0.95,
    "accumulator_parameters.daily_share_count": 0.94
  },
  "flagged_warnings": [],
  "is_rejected": false
}
```

---

## 2. Frontend UI Workspace Contract: `AccumulatorWorkspace.tsx`

```typescript
export interface AccumulatorWorkspaceProps {
  product: StructuredProductDefinition;
  simulatedSpot: number;
  onSpotChange: (newSpot: number) => void;
}
```

### Visual Components of `AccumulatorWorkspace`
1. **Interactive Underlying Spot Slider**:
   - Single slider linked to the single underlying stock.
   - Distinct visual color zones:
     - Green Zone: Discount accumulation / profit zone.
     - Amber/Red Zone: 2x Gearing downside risk zone ($P < K$ for accumulator; $P > K$ for decumulator).
     - Silver/Blue Zone: Knock-Out cancellation threshold ($P \ge B_{KO}$).
2. **Dual Display Outcome Card**:
   - **Left Panel (Physical Execution)**:
     - Total Shares Acquired / Delivered (e.g. `6,000 shares` at 1x vs `12,000 shares` at 2x).
     - Purchase / Sale Price per Share (Contractual Strike $K$).
     - Total Cash Outflow / Inflow ($Q \times K$).
   - **Right Panel (Mark-to-Market Evaluation)**:
     - Market Value at Simulated Spot ($Q \times P$).
     - Net Dollar Profit/Loss ($Q \times (P - K)$ for Acc; $Q \times (K - P)$ for Dec).
     - Net Percentage Return (%).
3. **Accumulator Payoff Curve (`AccumulatorPayoffChart`)**:
   - 2D Canvas or SVG charting the P&L curve across a spot range of -50% to +50%.
   - Highlights the kink at the Strike Price where slope doubles due to 2x gearing.
   - Highlights the vertical drop or step-off at the Knock-Out barrier.
