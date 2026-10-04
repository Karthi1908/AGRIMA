# Interface Contract: Termsheet Details & View Routing

**Feature**: `002-clear-home-termsheet`
**Date**: 2026-10-02

## 1. UI Component Contract: `TermsheetDetails.tsx`

### Props Interface
```typescript
export interface TermsheetDetailsProps {
  /** The verified structured product contract definition */
  product: StructuredProductDefinition;
  
  /** Callback invoked when user clicks "Upload Another Termsheet" */
  onUploadAnother: () => void;
  
  /** Flag determining whether the interactive simulation workspace is expanded */
  showSimulator: boolean;
  
  /** Callback invoked to toggle interactive simulator expansion */
  onToggleSimulator: () => void;
}
```

### Component Structure & Visual Sections
1. **Header Action Bar**:
   - Back button / Action: `<ArrowLeft /> Upload Another Termsheet`
   - Privacy badge: `Principle II: Redacted & Anonymized`
   - Simulator action: `<SlidersHorizontal /> Open Interactive Simulator` (or `Hide Simulator`)
2. **Card 1: Product Summary**:
   - Title: Product Name / Structure
   - Archetype Badge (e.g., Fixed Coupon Note, Dual Currency Investment, Step-Down Autocall)
   - Grid: Denomination Currency, Notional Amount, Issue Date, Final Maturity Date, Capital Protection Level
3. **Card 2: Linked Underlying Assets**:
   - Table displaying:
     - Symbol / Ticker (e.g. `AAPL`, `MSFT`, `EUR/USD`)
     - Name (e.g. Apple Inc., Euro / US Dollar)
     - Initial Fixing Level (formatted with currency)
     - Strike Price / Level (% and absolute)
     - Knock-In Barrier Level (% and absolute)
4. **Card 3: Barrier & Coupon Architecture**:
   - Table or schedule cards showing:
     - Observation Period Index & Date
     - Autocall Knock-Out Barrier (% and level)
     - Knock-In Barrier (% and observation type: European vs American)
     - Coupon Barrier (%) & Periodic Coupon Rate (% and per-period payout)
     - Memory Feature indicator badge
5. **Card 4: Contractual Payoff Logic**:
   - Concise plain-language bullet points explaining:
     - Coupon payment condition (e.g. "Coupons paid if worst-performing underlying closes at or above 80% on observation date")
     - Early redemption condition (e.g. "Autocalls at 100% par + coupon if all underlyings close at or above 100% on observation date")
     - Maturity redemption condition (e.g. "If no autocall and worst-offender never breached 70% knock-in, 100% capital is returned")

---

## 2. Page Navigation Contract in `App.tsx`

```typescript
// Active view mode
type ActiveView = 'LANDING_UPLOAD' | 'TERMSHEET_DETAILS';

// View rendering logic
{activeView === 'LANDING_UPLOAD' && (
  <LandingIntakeView
    onExtractionComplete={handleExtractionComplete}
    onSelectSample={handleSelectSample}
    isUploading={isUploading}
    setIsUploading={setIsUploading}
  />
)}

{activeView === 'TERMSHEET_DETAILS' && product && (
  <TermsheetDetails
    product={product}
    onUploadAnother={handleResetToUpload}
    showSimulator={showSimulator}
    onToggleSimulator={() => setShowSimulator(prev => !prev)}
  />
)}
```
