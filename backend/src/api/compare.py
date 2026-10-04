from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import copy
from backend.src.models.schemas import StructuredProductDefinition
from backend.src.models.analytics import SimulationAssumptions, SimulationResult
from backend.src.services.simulator import SimulationEngine
from backend.src.services.valuator import ValuatorService
from backend.src.services.stress_tests import StressTestService

router = APIRouter()

class ComparePayload(BaseModel):
    products: List[StructuredProductDefinition]
    assumptions: SimulationAssumptions

class CompareResponse(BaseModel):
    results: List[SimulationResult]

@router.post("", response_model=CompareResponse)
async def compare_products(payload: ComparePayload):
    if len(payload.products) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least 2 products to compare.")
    
    base_underlyings = [u.symbol for u in payload.products[0].underlyings]
    
    for idx, prod in enumerate(payload.products[1:], start=1):
        prod_underlyings = [u.symbol for u in prod.underlyings]
        if set(base_underlyings) != set(prod_underlyings):
            raise HTTPException(
                status_code=400, 
                detail=f"Product at index {idx} has different underlyings {prod_underlyings} than base {base_underlyings}. Cannot compare distinct underlyings."
            )
            
    # Force the same initial fixings across all products to ensure exact parity
    base_fixings = {u.symbol: u.initial_fixing for u in payload.products[0].underlyings}
    
    results = []
    
    for prod in payload.products:
        prod_copy = copy.deepcopy(prod)
        for u in prod_copy.underlyings:
            u.initial_fixing = base_fixings[u.symbol]
            
        try:
            res = SimulationEngine.simulate_paths(prod_copy, payload.assumptions)
            
            # Attach valuation and risk profile
            res.valuation = ValuatorService.estimate_fair_value(prod_copy, res, payload.assumptions)
            res.risk_profile = StressTestService.evaluate_risk_profile(prod_copy)
            
            results.append(res)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Simulation error on product {prod_copy.archetype}: {str(e)}")
            
    return CompareResponse(results=results)
