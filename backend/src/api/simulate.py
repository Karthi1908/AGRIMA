from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.src.models.schemas import StructuredProductDefinition
from backend.src.models.analytics import SimulationAssumptions, SimulationResult
from backend.src.services.simulator import SimulationEngine
from backend.src.services.historical_replay import HistoricalReplayEngine
from backend.src.services.valuator import ValuatorService
from backend.src.services.stress_tests import StressTestService

router = APIRouter()

class SimulatePayload(BaseModel):
    product: StructuredProductDefinition
    assumptions: SimulationAssumptions

@router.post("", response_model=SimulationResult)
async def simulate(payload: SimulatePayload):
    try:
        if payload.assumptions.method == "historical":
            result = HistoricalReplayEngine.simulate_paths(payload.product, payload.assumptions)
        else:
            result = SimulationEngine.simulate_paths(payload.product, payload.assumptions)
            
        valuation = ValuatorService.estimate_fair_value(payload.product, result, payload.assumptions)
        result.valuation = valuation
        
        risk_profile = StressTestService.evaluate_risk_profile(payload.product)
        result.risk_profile = risk_profile
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Simulation error: {str(e)}")
