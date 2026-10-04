# API Contracts: Risk Analytics & Trust

## 1. Extract Termsheet
`POST /api/extract`

**Request:** `multipart/form-data` containing the termsheet PDF or image.
**Response:**
```json
{
  "product_type": "Accumulator",
  "fields": {
    "underlying": {
      "value": "NVDA",
      "status": "Found",
      "source_text": "Underlying: NVIDIA Corporation (NVDA)",
      "confirmed": true
    },
    "strike_price": {
      "value": null,
      "status": "Missing",
      "source_text": null,
      "confirmed": false
    },
    "currency": {
      "value": "USD",
      "status": "Conflict",
      "source_text": "Option A says USD, Option B says EUR",
      "confirmed": false
    }
  }
}
```

## 2. Run Simulation & Valuation
`POST /api/simulate`

**Request:**
```json
{
  "product_details": {
    // Verified product fields, e.g. knock_out_barrier, tenor, shares_per_day
  },
  "assumptions": {
    "volatility": 0.45,
    "drift": 0.05,
    "dividend_yield": 0.0,
    "correlation": 0.5,
    "path_count": 10000,
    "seed": 42,
    "method": "simulated",
    "persona": "Neutral"
  }
}
```

**Response:**
```json
{
  "simulation_result": {
    "knock_out_probability": 0.15,
    "expected_shares": 5000,
    "percentile_5_shares": 1000,
    "percentile_50_shares": 4500,
    "percentile_95_shares": 10000,
    "expected_pnl": 12000.0,
    "probability_of_loss": 0.35,
    "worst_5_percent_average_loss": -45000.0,
    "method": "simulated",
    "pnl_distribution": [...],
    "representative_paths": { ... }
  },
  "valuation_estimate": {
    "fair_value": 500.0,
    "implied_cost_currency": 500.0,
    "implied_cost_percent": 0.01,
    "range_low": 400.0,
    "range_high": 600.0,
    "assumptions_used": { ... }
  },
  "risk_profile": {
    "maximum_loss": 500000.0,
    "unbounded_loss_statement": "Loss is bounded by the stock price falling to zero.",
    "gain_loss_shape": "Gain capped at knock-out; loss equal to purchasing 10,000 shares at strike.",
    "stress_tests": {
      "2008_crash": { ... },
      "2020_crash": { ... },
      "single_stock_gap": { ... }
    }
  }
}
```

## 3. Compare Mode
`POST /api/compare`

**Request:**
```json
{
  "alternatives": [
    { "id": "acc_1", "type": "accumulator", "details": { ... } },
    { "id": "fcn_1", "type": "fcn", "details": { ... } },
    { "id": "hold_stock", "type": "hold_stock", "details": { ... } }
  ],
  "assumptions": { ... }
}
```

**Response:**
```json
{
  "results": {
    "acc_1": { /* simulation_result and risk_profile */ },
    "fcn_1": { /* simulation_result and risk_profile */ },
    "hold_stock": { /* simulation_result and risk_profile */ }
  }
}
```
