# Phase 1 Data Model: Equity Accumulator & Equity Decumulator Products

**Feature**: `003-equity-accumulator-decumulator`
**Date**: 2026-10-02

## Entity Relationship Overview

```text
┌─────────────────────────────────┐
│   StructuredProductDefinition   │
│ - product_id: string (UUID)     │
│ - archetype: ProductArchetype   │◄── Added 'EQUITY_ACCUMULATOR'
│ - title: string                 │         'EQUITY_DECUMULATOR'
│ - denomination_currency: string │
│ - notional_amount: float        │
│ - issue_date / maturity_date    │
│ - underlyings: [UnderlyingAsset]│ (exactly 1 underlying in v1)
│ - accumulator_parameters?       │◄── New optional parameters
└──────────────┬──────────────────┘
               │ 1:1
               ▼
┌─────────────────────────────────┐
│    AccumulatorSpecificParams    │
│ - strike_price: float           │ (Purchase or sale price level)
│ - strike_pct: float             │ (Discount or premium % of S0)
│ - knock_out_barrier_pct: float  │ (103.0% for Acc, 95.0% for Dec)
│ - knock_out_observation_type    │ ('EUROPEAN' | 'AMERICAN')
│ - gearing_ratio: float          │ (Default: 2.0)
│ - daily_share_count: float      │ (e.g., 100 shares/day)
│ - total_observation_days: int   │ (e.g., 60 days)
│ - guaranteed_days: int          │ (Default: 0)
└─────────────────────────────────┘
```

---

## Schema Definitions

### 1. Product Archetype Enumeration
```python
# backend/src/models/schemas.py
class ProductArchetype(str, Enum):
    DCI = "DCI"
    EQUITY_AUTOCALL_OPTION = "EQUITY_AUTOCALL_OPTION"
    EQUITY_AUTOCALL_SWAP = "EQUITY_AUTOCALL_SWAP"
    FCN_AUTOCALL_NOTE = "FCN_AUTOCALL_NOTE"
    TWIN_WIN_NOTE = "TWIN_WIN_NOTE"
    STEP_UP_AUTOCALL_NOTE = "STEP_UP_AUTOCALL_NOTE"
    STEP_DOWN_AUTOCALL_NOTE = "STEP_DOWN_AUTOCALL_NOTE"
    EQUITY_ACCUMULATOR = "EQUITY_ACCUMULATOR"       # NEW
    EQUITY_DECUMULATOR = "EQUITY_DECUMULATOR"       # NEW
```

```typescript
// frontend/src/types/index.ts
export type ProductArchetype =
  | 'DCI'
  | 'EQUITY_AUTOCALL_OPTION'
  | 'EQUITY_AUTOCALL_SWAP'
  | 'FCN_AUTOCALL_NOTE'
  | 'TWIN_WIN_NOTE'
  | 'STEP_UP_AUTOCALL_NOTE'
  | 'STEP_DOWN_AUTOCALL_NOTE'
  | 'EQUITY_ACCUMULATOR'
  | 'EQUITY_DECUMULATOR';
```

### 2. Accumulator Specific Parameters
```python
class AccumulatorSpecificParams(BaseModel):
    strike_price: float = Field(..., gt=0.0, description="Purchase or sale price per share")
    strike_pct: Optional[float] = Field(None, gt=0.0, description="Strike as percentage of initial fixing spot")
    knock_out_barrier_pct: float = Field(..., gt=0.0, description="Knock-out cancellation level as % of initial fixing")
    knock_out_observation_type: KnockInObservationType = Field(
        default=KnockInObservationType.EUROPEAN,
        description="EUROPEAN (daily close) or AMERICAN (continuous intraday touch)"
    )
    gearing_ratio: float = Field(default=2.0, ge=1.0, description="Multiplier when spot breaches strike (typically 2.0x)")
    daily_share_count: float = Field(..., gt=0.0, description="Base shares accumulated/decumulated per observation day")
    total_observation_days: int = Field(default=60, ge=1, description="Total scheduled observation trading days")
    guaranteed_days: int = Field(default=0, ge=0, description="Initial days protected from early cancellation")
```

### 3. Simulation Outcome State
```typescript
export interface AccumulatorSimulationState {
  is_knocked_out: boolean;
  total_shares_accumulated_or_sold: number;
  total_cash_outflow_or_inflow: number;
  average_price_per_share: number;
  current_market_value: number;
  net_pnl_amount: number;
  net_return_pct: number;
  gearing_active: boolean;
}
```

---

## Validation Rules & Invariants

1. **Underlying Count Invariant**:
   - For `EQUITY_ACCUMULATOR` and `EQUITY_DECUMULATOR`, `len(underlyings) == 1`.
2. **Accumulator Strike Invariant**:
   - `strike_price < initial_fixing` (discount, typically `strike_pct < 100.0%`).
   - `knock_out_barrier_pct > 100.0%` (upside cancellation).
3. **Decumulator Strike Invariant**:
   - `strike_price > initial_fixing` (premium, typically `strike_pct > 100.0%`).
   - `knock_out_barrier_pct < 100.0%` (downside cancellation).
4. **Gearing Invariant**:
   - `gearing_ratio >= 1.0` (standard market baseline is `2.0`).
5. **Guaranteed Days Invariant**:
   - `0 <= guaranteed_days <= total_observation_days`.
