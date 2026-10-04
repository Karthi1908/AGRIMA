import pytest
import numpy as np
from backend.src.models.schemas import StructuredProductDefinition, UnderlyingAsset, AccumulatorSpecificParams
from backend.src.models.analytics import SimulationAssumptions
from backend.src.services.simulator import SimulationEngine
from backend.src.services.valuator import ValuatorService

def test_accumulator_simulation_integrity():
    # Construct a test product
    underlying = UnderlyingAsset(
        symbol="NVDA",
        name="NVIDIA Corp",
        currency="USD",
        initial_fixing=100.0,
        simulated_price=100.0,
        performance_pct=0.0
    )
    
    acc_params = AccumulatorSpecificParams(
        strike_price=90.0,
        strike_pct=90.0,
        knock_out_barrier_pct=105.0,
        knock_out_observation_type="EUROPEAN",
        gearing_ratio=2.0,
        daily_share_count=100.0,
        total_observation_days=60,
        guaranteed_days=0
    )
    
    product = StructuredProductDefinition(
        product_id="test_acc_01",
        archetype="EQUITY_ACCUMULATOR",
        title="Test Accumulator",
        denomination_currency="USD",
        notional_amount=100000.0,
        issue_date="2026-10-01",
        maturity_date="2026-12-31",
        underlyings=[underlying],
        barrier_schedule=[],
        capital_protection_pct=0.0,
        accumulator_parameters=acc_params
    )
    
    assumptions = SimulationAssumptions(
        volatility=0.25,
        drift=0.05,
        dividend_yield=0.0,
        path_count=1000,
        seed=42,
        method="simulated"
    )
    
    # 1. Test Simulation Engine
    result = SimulationEngine.simulate_paths(product, assumptions)
    
    assert result.knock_out_probability > 0.0
    assert result.knock_out_probability < 1.0
    assert result.expected_shares > 0.0
    
    # Check bounds
    assert result.percentile_5_shares <= result.percentile_50_shares <= result.percentile_95_shares
    
    # Check that representative paths were collected
    assert "median" in result.representative_paths
    assert "worst" in result.representative_paths
    
    # 2. Test Valuator Engine
    valuation = ValuatorService.estimate_fair_value(product, result, assumptions)
    
    # Valuation should mirror the expected P&L logically
    assert valuation.fair_value is not None
    assert valuation.implied_cost_currency >= 0.0
    assert valuation.implied_cost_percent >= 0.0

if __name__ == "__main__":
    pytest.main(["-v", __file__])
