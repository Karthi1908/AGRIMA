# Data Model Specification: Smart Termsheet Scanner & Payoff Explainer

**Feature**: `001-termsheet-payoff-explainer`  
**Date**: 2026-09-27  
**Status**: Completed  

---

## 1. Overview & Principles

In accordance with Constitution Principle I (Zero-Retention Client Privacy), all data structures defined herein exist purely in-memory as ephemeral validation payloads and client-side reactive state models. No database entities or persistent storage schemas exist.

---

## 2. Core Entities & Enums

### 2.1 ProductArchetype (Enum)
Defines the supported structured derivative structures:
- `DCI`: Dual Currency Investment (FX strike, base vs. alternate currency, yield enhancement).
- `EQUITY_AUTOCALL_OPTION`: Single or multi-stock equity autocall option contract.
- `EQUITY_AUTOCALL_SWAP`: Equity autocall swap with periodic payment legs and knock-out termination.
- `FCN_AUTOCALL_NOTE`: Fixed Coupon Note with knock-in barrier and periodic autocall observation.
- `TWIN_WIN_NOTE`: Note with upside participation and positive return on moderate downside unless knock-in barrier is breached.
- `STEP_UP_AUTOCALL_NOTE`: Autocall note with ascending knock-out hurdle levels over time.
- `STEP_DOWN_AUTOCALL_NOTE`: Autocall note with declining knock-out hurdle levels over time.

---

### 2.2 UnderlyingAsset
Represents an individual stock, equity index, or currency pair linked to the product.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `symbol` | `str` | Yes | Ticker symbol (e.g. `AAPL`, `NVDA`, `EUR/USD`). |
| `name` | `str` | Yes | Clean descriptive asset name (e.g. `Apple Inc.`). |
| `currency` | `str` | Yes | ISO 4217 currency code (e.g. `USD`, `EUR`, `SGD`). |
| `initial_fixing` | `float` | Yes | Baseline spot fixing price at inception. Must be > 0. |
| `simulated_price` | `float` | Yes | Active scenario price being evaluated. |
| `performance_pct` | `float` | Computed | `(simulated_price - initial_fixing) / initial_fixing * 100`. |

---

### 2.3 BarrierObservation
Defines the parameters for a specific observation event across the product lifecycle.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `period_index` | `int` | Yes | 1-based sequential period number. |
| `observation_date`| `str` | Yes | ISO 8601 date string (`YYYY-MM-DD`). |
| `knock_out_barrier_pct` | `float?` | Optional | Hurdle level for early redemption as % of initial spot (e.g., `100.0` or `95.0`). |
| `knock_in_barrier_pct` | `float?` | Optional | Downside barrier level as % of initial spot (e.g., `70.0`). |
| `coupon_barrier_pct` | `float?` | Optional | Hurdle required to receive periodic coupon (e.g., `75.0`). |
| `coupon_rate_pct` | `float` | Yes | Annualized or periodic coupon percentage rate. |
| `has_memory` | `bool` | Yes | `true` if unpaid coupons accrue and pay when barrier is subsequently met. |
| `knock_in_observation_type` | `str` | Yes | `"EUROPEAN"` (final valuation at maturity, default) or `"AMERICAN"` (continuous intra-period monitoring). |

---

### 2.4 StructuredProductDefinition
The primary normalized economic contract describing the financial product extracted from the termsheet.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `product_id` | `str` | Yes | Ephemeral UUID identifying the active in-memory session. |
| `archetype` | `ProductArchetype` | Yes | Product classification. |
| `denomination_currency` | `str` | Yes | Main currency of notional investment (e.g. `USD`). |
| `notional_amount` | `float` | Yes | Reference face value for scenario calculations (default: `100000.0`). |
| `issue_date` | `str` | Yes | Inception fixing date (`YYYY-MM-DD`). |
| `maturity_date` | `str` | Yes | Final scheduled settlement date (`YYYY-MM-DD`). |
| `underlyings` | `List[UnderlyingAsset]` | Yes | Linked assets (1 to 4 assets). |
| `barrier_schedule` | `List[BarrierObservation]`| Yes | Sequence of observation points. |
| `capital_protection_pct` | `float` | Yes | Minimum guaranteed principal return (0.0 for unprotected, 100.0 for full). |
| `dci_parameters` | `DciSpecificParams?` | Optional | Extra fields for DCI (base currency, alternate currency, strike FX rate). |
| `twin_win_parameters` | `TwinWinSpecificParams?`| Optional | Extra fields for Twin-Win (downside participation factor, upside cap). |

---

### 2.5 PayoffSimulationState
The evaluated quantitative state resulting from real-time slider manipulation.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `is_knocked_out` | `bool` | Yes | Whether early redemption was triggered. |
| `early_redemption_period` | `int?` | Optional | Period index where autocall occurred. |
| `is_knocked_in` | `bool` | Yes | Whether downside barrier was breached at or before maturity. |
| `worst_performing_asset` | `UnderlyingAsset` | Yes | Asset currently exhibiting lowest percentage performance. |
| `tied_worst_of_assets` | `List[UnderlyingAsset]` | Yes | All assets sharing the lowest percentage performance when tied. |
| `worst_of_tie_broken_by` | `str?` | Optional | Deterministic tie-break method (`"ALPHABETICAL_SYMBOL"` or `null`). |
| `total_coupons_earned_pct`| `float` | Yes | Cumulative coupon received across all observed periods. |
| `capital_repaid_pct` | `float` | Yes | Principal returned to investor at conclusion (e.g., `100.0%` or `-25.0%`). |
| `net_total_return_pct` | `float` | Yes | `capital_repaid_pct + total_coupons_earned_pct - 100.0`. |
| `net_payout_amount` | `float` | Yes | Total currency cash flow returned on notional. |
| `dci_settlement_currency` | `str?` | Optional | Resulting payout currency for DCI structures. |

---

### 2.6 ScenarioNarratives
Plain-language executive narratives generated by the ClientNarrativeAgent.

| Field | Type | Description |
| :--- | :--- | :--- |
| `best_case` | `str` | Narrative of maximum upside (early autocall or full coupon + upside participation). |
| `base_case` | `str` | Narrative of moderate market consolidation (capital preserved at par + periodic coupons). |
| `worst_case` | `str` | Narrative of severe market downturn (knock-in breached, put conversion, capital drawdown). |

---

### 2.7 TermsheetExtractionResponse
Payload returned by the backend after parsing an uploaded document.

| Field | Type | Description |
| :--- | :--- | :--- |
| `product` | `StructuredProductDefinition?` | Optional | Parsed normalized financial model (null if document is rejected). |
| `field_confidence` | `Dict[str, float]` | Confidence score (0.0 to 1.0) for each extracted parameter. |
| `flagged_warnings` | `List[str]` | Human-readable warnings for fields requiring user verification in drawer. |
| `is_rejected` | `bool` | True if document is encrypted or unrelated to structured products. |
| `rejection_reason` | `str?` | Specific error code (`"ENCRYPTED_PDF"`, `"UNRECOGNIZED_STRUCTURE"`, or `null`). |
| `rejection_guidance` | `str?` | Actionable explanation or list of supported archetypes. |
