from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal, Optional

ExtractionStatus = Literal['Found', 'Inferred', 'Missing', 'Conflict', 'User-Supplied']

class ExtractedField(BaseModel):
    value: Any = None
    status: ExtractionStatus
    source_text: Optional[str] = None
    confirmed: bool = False

class ExtractionResponse(BaseModel):
    product_type: str
    fields: Dict[str, ExtractedField]

class SimulationAssumptions(BaseModel):
    volatility: float = Field(..., ge=0.0)
    drift: float
    dividend_yield: float = Field(..., ge=0.0)
    correlation: float = Field(..., ge=-1.0, le=1.0)
    path_count: int = Field(..., gt=0)
    seed: int
    method: Literal['simulated', 'historical']
    persona: str

class SimulationResult(BaseModel):
    knock_out_probability: float = Field(..., ge=0.0, le=1.0)
    expected_shares: float
    percentile_5_shares: float
    percentile_50_shares: float
    percentile_95_shares: float
    expected_pnl: float
    probability_of_loss: float = Field(..., ge=0.0, le=1.0)
    worst_5_percent_average_loss: float
    method: Literal['simulated', 'historical']
    pnl_distribution: List[float]
    representative_paths: Dict[str, List[float]]

class ValuationEstimate(BaseModel):
    fair_value: float
    implied_cost_currency: float
    implied_cost_percent: float
    range_low: float
    range_high: float
    assumptions_used: Dict[str, Any]

class StressTestScenario(BaseModel):
    name: str
    loss: float
    margin_call_flag: bool

class RiskProfile(BaseModel):
    maximum_loss: float
    unbounded_loss_statement: str
    gain_loss_shape: str
    stress_tests: Dict[str, StressTestScenario]

class SimulateResponse(BaseModel):
    simulation_result: SimulationResult
    valuation_estimate: ValuationEstimate
    risk_profile: RiskProfile

class CompareRequest(BaseModel):
    alternatives: List[Dict[str, Any]]
    assumptions: SimulationAssumptions

class CompareResponse(BaseModel):
    results: Dict[str, SimulateResponse]
