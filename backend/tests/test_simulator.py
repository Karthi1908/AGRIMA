import numpy as np
from backend.src.models.schemas import StructuredProductDefinition, UnderlyingAsset, ProductArchetype
from backend.src.models.analytics import SimulationAssumptions
from backend.src.services.simulator import SimulationEngine

def test_simulator_basket_correlation():
    product = StructuredProductDefinition(
        archetype=ProductArchetype.FCN_AUTOCALL_NOTE,
        denomination_currency="USD",
        notional_amount=100000,
        underlyings=[
            UnderlyingAsset(symbol="AAPL", name="Apple", initial_fixing=100),
            UnderlyingAsset(symbol="MSFT", name="Microsoft", initial_fixing=100),
            UnderlyingAsset(symbol="GOOG", name="Google", initial_fixing=100)
        ]
    )
    
    # Test non-PSD matrix projection
    # A matrix with 1 on diag and -0.9 on off-diag for 3x3 is NOT positive semi-definite.
    # The simulator should project it to the nearest PSD matrix and not crash.
    correlation = [
        [1.0, -0.9, -0.9],
        [-0.9, 1.0, -0.9],
        [-0.9, -0.9, 1.0]
    ]
    
    assumptions = SimulationAssumptions(
        volatility=0.20,
        drift=0.05,
        dividend_yield=0.0,
        correlation=correlation,
        path_count=1000,
        seed=42,
        method="simulated"
    )
    
    # Should not raise exception
    result = SimulationEngine.simulate_paths(product, assumptions)
    
    # Check that paths were generated (result is valid)
    assert result.method == "simulated"
