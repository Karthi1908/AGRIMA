# Interface Contracts: 004-risk-analytics-trust

## API Endpoints (Backend FastAPI)

### 1. Extractor Service
**Endpoint**: `POST /api/extract`
**Request Payload**:
```json
{
  "document_base64": "<base64_pdf_or_image>",
  "mime_type": "application/pdf"
}
```
**Response Payload** (Termsheet with Provenance):
```json
{
  "archetype": "EQUITY_ACCUMULATOR",
  "fields": {
    "strike_price": {
      "value": 85.0,
      "provenance": {
        "status": "Found",
        "source_text": "Strike Price: 85% of Initial Fixing",
        "is_confirmed": true
      }
    },
    "knock_out_barrier": {
      "value": null,
      "provenance": {
        "status": "Missing",
        "source_text": null,
        "is_confirmed": false
      }
    }
  }
}
```

### 2. Simulator Service
**Endpoint**: `POST /api/simulate`
**Request Payload**:
```json
{
  "product_terms": { ... },
  "assumptions": {
    "volatility": 0.25,
    "risk_free_rate": 0.04,
    "dividend_yield": 0.01,
    "correlation_matrix": [[1.0, 0.5], [0.5, 1.0]],
    "path_count": 10000,
    "seed": 42,
    "method": "SIMULATED"
  }
}
```
**Response Payload** (SimulationResult & ValuationEstimate):
```json
{
  "risk_analytics": {
    "knock_out_probability": 0.65,
    "expected_shares": 5000,
    "percentiles": {
      "5th": 2500,
      "50th": 5000,
      "95th": 10000
    },
    "expected_pnl": 15000,
    "worst_5_percent_loss": -12000
  },
  "valuation": {
    "fair_value": 3.2,
    "implied_cost_pct": 1.5,
    "range_low": 2.8,
    "range_high": 3.6
  }
}
```

### 3. Stress Test Service
**Endpoint**: `POST /api/stress_test`
**Request Payload**: Product Terms + Assumptions + `scenario` Enum.
**Response Payload**: Stress Scenario outcome (shares, cash, pnl).
