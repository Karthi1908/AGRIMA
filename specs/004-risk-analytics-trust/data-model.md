# Data Model: Risk Analytics & Trust

## 1. Provenance and Trust

```python
from enum import Enum
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar('T')

class ProvenanceStatus(str, Enum):
    FOUND = "Found"
    INFERRED = "Inferred"
    MISSING = "Missing"
    CONFLICT = "Conflict"
    USER_SUPPLIED = "User-Supplied"

class ProvenanceField(BaseModel, Generic[T]):
    value: Optional[T]
    status: ProvenanceStatus
    source_text: Optional[str] = None
    confirmed: bool = False # Must be true if status is INFERRED or MISSING for simulation to run
```

## 2. Simulation & Valuation Assumptions

```python
class SimulationAssumptions(BaseModel):
    volatility: float  # e.g., 0.25 for 25%
    drift: float       # Risk-free rate minus dividend yield by default
    dividend_yield: float
    correlation: Optional[list[list[float]]] = None  # Full matrix for worst-of baskets (max 5 underlyings)
    path_count: int = 10000
    seed: Optional[int] = 42
    method: str = "simulated" # or "historical" (defaults to 3-year lookback)
    persona: Optional[str] = "Neutral"
```

## 3. Analytics Results

```python
class PathResult(BaseModel):
    # Represents a single path for inspection
    day_by_day_accumulation: list[float]
    running_pnl: list[float]
    knock_out_date: Optional[str] = None

class SimulationResult(BaseModel):
    knock_out_probability: float
    expected_shares: float
    percentile_5_shares: float
    percentile_50_shares: float
    percentile_95_shares: float
    pnl_distribution: list[float] # Histogram bins or summary stats
    expected_pnl: float
    probability_of_loss: float
    worst_5_percent_average_loss: float
    method: str
    representative_paths: dict[str, PathResult] # e.g., {"median": ..., "worst": ...}
    valuation: Optional[ValuationEstimate] = None
    risk_profile: Optional[RiskProfile] = None

class ValuationEstimate(BaseModel):
    fair_value: float
    implied_cost_currency: float
    implied_cost_percent: float
    range_low: float
    range_high: float
    assumptions_used: SimulationAssumptions
```

## 4. Risk Profile & Stress Tests

```python
class StressScenarioOutcome(BaseModel):
    shares_transacted: float
    cash_required: float
    pnl: float
    margin_call_triggered: bool
    indicative_margin_size: float

class RiskProfile(BaseModel):
    maximum_loss: Optional[float] # None if unbounded
    unbounded_loss_statement: str # e.g., "loss not bounded below the stated floor"
    gain_loss_shape: str # e.g., "gain capped at X, loss up to Y"
    stress_tests: dict[str, StressScenarioOutcome] # e.g., "2008_crash" (-50% spot, +200% vol/1y), "2020_crash" (-30% spot, +100% vol/1m)
```

## 5. Termsheet Benchmark

```python
class FieldAccuracy(BaseModel):
    field_name: str
    exact_match_rate: float
    missing_detection_rate: float
    false_positive_rate: float

class BenchmarkReport(BaseModel):
    corpus_size: int
    public_proportion: float
    synthetic_proportion: float
    overall_exact_match_rate: float
    overall_missing_detection_rate: float
    field_accuracy: list[FieldAccuracy]
    date_run: str
```
