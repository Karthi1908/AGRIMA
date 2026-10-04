"""
Contract test for /api/simulation/calculate endpoint.
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

client = TestClient(app)

def test_simulation_calculate_api():
    payload = {
        "product": {
            "product_id": "test-sim-01",
            "archetype": "FCN_AUTOCALL_NOTE",
            "denomination_currency": "USD",
            "notional_amount": 100000.0,
            "issue_date": "2026-10-01",
            "maturity_date": "2027-10-01",
            "underlyings": [
                {
                    "symbol": "AAPL",
                    "name": "Apple Inc.",
                    "currency": "USD",
                    "initial_fixing": 200.0,
                    "simulated_price": 220.0,
                    "performance_pct": 10.0
                }
            ],
            "barrier_schedule": [
                {
                    "period_index": 1,
                    "observation_date": "2026-11-01",
                    "knock_out_barrier_pct": 100.0,
                    "knock_in_barrier_pct": 70.0,
                    "coupon_barrier_pct": 80.0,
                    "coupon_rate_pct": 1.0,
                    "has_memory": False,
                    "knock_in_observation_type": "EUROPEAN"
                }
            ],
            "capital_protection_pct": 0.0
        },
        "simulated_prices": {
            "AAPL": 220.0
        },
        "target_period": 1
    }

    response = client.post("/api/simulation/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_knocked_out"] is True
    assert data["capital_repaid_pct"] == 100.0
    assert data["net_total_return_pct"] == 1.0
    assert data["worst_performing_asset"]["symbol"] == "AAPL"
