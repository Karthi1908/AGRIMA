# Phase 1 Data Model: Clear Termsheet Home & Dedicated Details View

**Feature**: `002-clear-home-termsheet`
**Date**: 2026-10-02

## View State Model

```text
[ Initial Load / Reset ]
         │
         ▼
┌───────────────────────────────┐
│     LANDING_UPLOAD (Home)     │
│   - Header with Logo/Privacy  │
│   - Termsheet Intake Dropzone │
│   - Discreet Sample Links     │
└──────────────┬────────────────┘
               │
               │ File Uploaded & Verified OR Sample Selected
               ▼
┌───────────────────────────────┐
│       TERMSHEET_DETAILS       │
│   - Product Overview Card     │
│   - Underlying Assets Table   │
│   - Barrier & Coupon Schedule │
│   - Payoff Rules Summary      │
│   - (Optional Simulator Mode) │
└──────────────┬────────────────┘
               │
               │ Click "Upload Another Termsheet" or "Reset Session"
               ▼
[ Returns to LANDING_UPLOAD with state cleared ]
```

---

## TypeScript State Interfaces

### 1. View Navigation State
```typescript
export type ActivePageView = 'LANDING_UPLOAD' | 'TERMSHEET_DETAILS';

export interface AppViewState {
  activeView: ActivePageView;
  product: StructuredProductDefinition | null;
  extractionData: TermsheetExtractionResponse | null;
  isUploading: boolean;
  isDrawerOpen: boolean;
  showSimulator: boolean;
  simulatedPrices: Record<string, number>;
}
```

### 2. Termsheet Details Display Entity
```typescript
export interface TermsheetDetailsProps {
  product: StructuredProductDefinition;
  onUploadAnother: () => void;
  showSimulator: boolean;
  onToggleSimulator: () => void;
}
```

### 3. Core Termsheet Economic Model (Reused & Validated)
```typescript
export interface StructuredProductDefinition {
  product_id: string;
  archetype: ProductArchetype; // 'DCI' | 'FCN_AUTOCALL_NOTE' | 'STEP_DOWN_AUTOCALL_NOTE' | ...
  title?: string;
  denomination_currency: string;
  notional_amount: number;
  issue_date: string;
  maturity_date: string;
  underlyings: UnderlyingAsset[];
  barrier_schedule: BarrierObservation[];
  capital_protection_pct: number;
  dci_parameters?: DciSpecificParams | null;
  twin_win_parameters?: TwinWinSpecificParams | null;
}

export interface UnderlyingAsset {
  symbol: string;
  name: string;
  currency: string;
  initial_fixing: number;
  simulated_price: number;
  performance_pct: number;
}

export interface BarrierObservation {
  period_index: number;
  observation_date: string;
  knock_out_barrier_pct?: number | null;
  knock_in_barrier_pct?: number | null;
  coupon_barrier_pct?: number | null;
  coupon_rate_pct: number;
  has_memory: boolean;
  knock_in_observation_type: 'EUROPEAN' | 'AMERICAN';
}
```

---

## State Transitions & Invariants

1. **Initial Home State (`activeView === 'LANDING_UPLOAD'`)**:
   - `product === null`
   - `simulatedPrices === {}`
   - Initial page load MUST NOT render `PayoffCanvas`, `MultiAssetSliders`, or `NarrativeCards`.
   - The primary viewport is occupied exclusively by the clean `UploadZone` and privacy indicators.

2. **Transition: Upload & Verification**:
   - User drops PDF/image into `UploadZone`.
   - Backend extracts `TermsheetExtractionResponse`.
   - User verifies/confirms in `VerificationDrawer` (or direct confirmation).
   - `setProduct(verifiedProduct)` is called.
   - `setActiveView('TERMSHEET_DETAILS')` transitions the main screen.

3. **Transition: Sample Termsheet Selection**:
   - User clicks e.g. "Try sample: 3-Stock FCN".
   - `setProduct(DEMO_PRODUCTS.FCN)` is called.
   - `setActiveView('TERMSHEET_DETAILS')` transitions immediately.

4. **Transition: Reset / Upload Another**:
   - User clicks "Upload Another Termsheet" or "Reset Session".
   - `setProduct(null)`
   - `setExtractionData(null)`
   - `setShowSimulator(false)`
   - `setActiveView('LANDING_UPLOAD')` returns the screen to pristine intake state.
   - Zero retention: in-memory state is immediately discarded.
