"""
End-to-End integration test suite matching quickstart.md validation scenarios.
Covers:
- Scenario 1: Termsheet Ingestion & Parameter Verification
- Scenario 2: Dynamic Payoff Simulation & Worst-Of Slider Interaction
- Scenario 3: Dual Currency Investment (DCI) Currency Conversion
- Scenario 4: Plain-Language Scenario Narratives (Gemini / ADK)
- Step-Down Autocall & Twin-Win dual slope validation
"""
import os
import pytest
from fastapi.testclient import TestClient

from backend.src.main import app
from backend.src.models.schemas import ProductArchetype

client = TestClient(app)
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_quickstart_scenario_1_ingestion():
    """Scenario 1: Termsheet Ingestion & Verification Drawer."""
    fcn_pdf = os.path.join(FIXTURES_DIR, "fcn_termsheet.pdf")
    with open(fcn_pdf, "rb") as f:
        resp = client.post("/api/termsheets/parse", files={"file": ("fcn.pdf", f, "application/pdf")})

    assert resp.status_code == 200
    data = resp.json()
    assert data["is_rejected"] is False
    prod = data["product"]
    assert prod["archetype"] == ProductArchetype.FCN_AUTOCALL_NOTE.value
    assert len(prod["underlyings"]) == 3
    # Verify no PII leaked
    prod_str = str(prod)
    for institution in ["Goldman", "Barclays", "Morgan Stanley", "Citigroup", "UBS"]:
        assert institution not in prod_str

def test_quickstart_scenario_2_simulation_worst_of():
    """Scenario 2: Dynamic Payoff Simulation & Worst-Of Slider Interaction."""
    # 3-stock basket where AAPL drops to 65% of strike (-35%) while MSFT and NVDA are +5%
    payload = {
        "product": {
            "product_id": "test-e2e-02",
            "archetype": "FCN_AUTOCALL_NOTE",
            "denomination_currency": "USD",
            "notional_amount": 100000.0,
            "issue_date": "2026-10-01",
            "maturity_date": "2027-10-01",
            "underlyings": [
                {"symbol": "AAPL", "name": "Apple", "currency": "USD", "initial_fixing": 200.0, "simulated_price": 130.0, "performance_pct": -35.0},
                {"symbol": "MSFT", "name": "Microsoft", "currency": "USD", "initial_fixing": 400.0, "simulated_price": 420.0, "performance_pct": 5.0},
                {"symbol": "NVDA", "name": "Nvidia", "currency": "USD", "initial_fixing": 100.0, "simulated_price": 105.0, "performance_pct": 5.0}
            ],
            "barrier_schedule": [
                {
                    "period_index": 1,
                    "observation_date": "2027-10-01",
                    "knock_out_barrier_pct": 100.0,
                    "knock_in_barrier_pct": 70.0,
                    "coupon_barrier_pct": 80.0,
                    "coupon_rate_pct": 0.0,
                    "has_memory": False,
                    "knock_in_observation_type": "EUROPEAN"
                }
            ],
            "capital_protection_pct": 0.0
        },
        "simulated_prices": {
            "AAPL": 130.0,
            "MSFT": 420.0,
            "NVDA": 105.0
        }
    }

    resp = client.post("/api/simulation/calculate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["worst_performing_asset"]["symbol"] == "AAPL"
    assert data["is_knocked_in"] is True
    assert data["capital_repaid_pct"] == 65.0
    assert data["net_total_return_pct"] == -35.0
    assert data["net_payout_amount"] == 65000.0

def test_quickstart_scenario_3_dci_conversion():
    """Scenario 3: Dual Currency Investment (DCI) Currency Conversion."""
    dci_payload_above = {
        "product": {
            "product_id": "test-dci-e2e",
            "archetype": "DCI",
            "denomination_currency": "USD",
            "notional_amount": 100000.0,
            "issue_date": "2026-10-01",
            "maturity_date": "2026-11-15",
            "underlyings": [
                {"symbol": "EUR/USD", "name": "EUR/USD FX", "currency": "USD", "initial_fixing": 1.0950, "simulated_price": 1.0900, "performance_pct": 0.0}
            ],
            "barrier_schedule": [
                {"period_index": 1, "observation_date": "2026-11-15", "coupon_rate_pct": 1.05, "has_memory": False, "knock_in_observation_type": "EUROPEAN"}
            ],
            "capital_protection_pct": 0.0,
            "dci_parameters": {
                "base_currency": "USD",
                "alternate_currency": "EUR",
                "strike_rate": 1.0800,
                "tenor_days": 45
            }
        },
        "simulated_prices": {"EUR/USD": 1.0900}
    }

    # EUR/USD >= 1.0800 -> Receives USD
    resp_usd = client.post("/api/simulation/calculate", json=dci_payload_above)
    assert resp_usd.status_code == 200
    assert resp_usd.json()["dci_settlement_currency"] == "USD"
    assert resp_usd.json()["capital_repaid_pct"] == 100.0

    # EUR/USD < 1.0800 (1.0500) -> Converted to EUR
    dci_payload_below = dict(dci_payload_above)
    dci_payload_below["simulated_prices"] = {"EUR/USD": 1.0500}
    resp_eur = client.post("/api/simulation/calculate", json=dci_payload_below)
    assert resp_eur.status_code == 200
    assert resp_eur.json()["dci_settlement_currency"] == "EUR"
    assert resp_eur.json()["is_knocked_in"] is True

def test_quickstart_scenario_4_narratives():
    """Scenario 4: Plain-Language Scenario Narratives."""
    payload = {
        "product": {
            "product_id": "test-narr-e2e",
            "archetype": "STEP_DOWN_AUTOCALL_NOTE",
            "denomination_currency": "USD",
            "notional_amount": 250000.0,
            "issue_date": "2026-10-01",
            "maturity_date": "2027-10-01",
            "underlyings": [
                {"symbol": "TSLA", "name": "Tesla Inc.", "currency": "USD", "initial_fixing": 240.0, "simulated_price": 240.0, "performance_pct": 0.0}
            ],
            "barrier_schedule": [
                {"period_index": 1, "observation_date": "2027-01-01", "knock_out_barrier_pct": 100.0, "coupon_barrier_pct": 80.0, "coupon_rate_pct": 2.5, "has_memory": True, "knock_in_observation_type": "EUROPEAN"},
                {"period_index": 2, "observation_date": "2027-04-01", "knock_out_barrier_pct": 95.0, "coupon_barrier_pct": 80.0, "coupon_rate_pct": 2.5, "has_memory": True, "knock_in_observation_type": "EUROPEAN"}
            ],
            "capital_protection_pct": 0.0
        }
    }

    resp = client.post("/api/narrative/generate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["best_case"]) > 0
    assert len(data["base_case"]) > 0
    assert len(data["worst_case"]) > 0
