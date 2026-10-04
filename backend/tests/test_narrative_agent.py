"""
Contract tests for ClientNarrativeAgent and /api/narrative/generate endpoint.
Verifies plain-language explanations for Best, Base, and Worst cases with zero institutional branding.
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

client = TestClient(app)

def test_generate_scenario_narratives():
    payload = {
        "product": {
            "product_id": "test-narrative-01",
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
                    "initial_fixing": 225.0,
                    "simulated_price": 225.0,
                    "performance_pct": 0.0
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
                    "has_memory": True,
                    "knock_in_observation_type": "EUROPEAN"
                }
            ],
            "capital_protection_pct": 0.0
        }
    }

    response = client.post("/api/narrative/generate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "best_case" in data and len(data["best_case"]) > 20
    assert "base_case" in data and len(data["base_case"]) > 20
    assert "worst_case" in data and len(data["worst_case"]) > 20

    # Privacy & brand check: No institutional branding
    for case_text in [data["best_case"], data["base_case"], data["worst_case"]]:
        assert "Goldman" not in case_text
        assert "Barclays" not in case_text
        assert "Morgan" not in case_text
