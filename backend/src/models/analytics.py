from __future__ import annotations
from typing import Optional, Dict
from pydantic import BaseModel

class SimulationAssumptions(BaseModel):
    volatility: float  # e.g., 0.25 for 25%
    drift: float       # Risk-free rate minus dividend yield by default
    dividend_yield: float
    correlation: Optional[list[list[float]]] = None  # Full matrix for worst-of baskets
    path_count: int = 10000
    seed: Optional[int] = 42
    method: str = "simulated" # or "historical"
    persona: Optional[str] = "Neutral"

class PathResult(BaseModel):
    # Represents a single path for inspection
    day_by_day_accumulation: list[float]
    running_pnl: list[float]
    knock_out_date: Optional[str] = None

class ValuationEstimate(BaseModel):
    fair_value: float
    implied_cost_currency: float
    implied_cost_percent: float
    range_low: float
    range_high: float
    assumptions_used: SimulationAssumptions

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
    representative_paths: Dict[str, PathResult] # e.g., {"median": ..., "worst": ...}
    valuation: Optional[ValuationEstimate] = None
    risk_profile: Optional[RiskProfile] = None

class StressScenarioOutcome(BaseModel):
    shares_transacted: float
    cash_required: float
    pnl: float
    margin_call_triggered: bool
    indicative_margin_size: float

class RiskProfile(BaseModel):
    maximum_loss: Optional[float] # or None if unbounded
    unbounded_loss_statement: str # e.g., "loss not bounded below the stated floor"
    gain_loss_shape: str # e.g., "gain capped at X, loss up to Y"
    stress_tests: Dict[str, StressScenarioOutcome] # e.g., "2008_crash", "2020_crash", "single_stock_gap"
