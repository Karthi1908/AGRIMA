"""
Unit tests for deterministic financial payoff calculator.
Validates:
1. Autocall early redemption
2. Memory coupon accrual
3. European vs American knock-in mechanics
4. DCI conversion rules and alternate currency settlement
"""
import pytest
from backend.src.models.schemas import (
    ProductArchetype,
    StructuredProductDefinition,
    UnderlyingAsset,
    BarrierObservation,
    KnockInObservationType,
    DciSpecificParams,
)
from backend.src.engine.payoff_calculator import PayoffCalculator

def test_autocall_knock_out():
    product = StructuredProductDefinition(
        product_id="test-fcn",
        archetype=ProductArchetype.FCN_AUTOCALL_NOTE,
        denomination_currency="USD",
        notional_amount=100000.0,
        issue_date="2026-10-01",
        maturity_date="2027-10-01",
        underlyings=[
            UnderlyingAsset(symbol="AAPL", name="Apple", currency="USD", initial_fixing=200.0, simulated_price=210.0, performance_pct=5.0)
        ],
        barrier_schedule=[
            BarrierObservation(
                period_index=1,
                observation_date="2026-11-01",
                knock_out_barrier_pct=100.0,
                knock_in_barrier_pct=None,
                coupon_barrier_pct=80.0,
                coupon_rate_pct=1.0,
                has_memory=True,
                knock_in_observation_type=KnockInObservationType.EUROPEAN,
            )
        ],
        capital_protection_pct=0.0
    )

    state = PayoffCalculator.calculate_payoff(product, {"AAPL": 210.0}, target_period=1)

    assert state.is_knocked_out is True
    assert state.early_redemption_period == 1
    assert state.capital_repaid_pct == 100.0
    assert state.total_coupons_earned_pct == 1.0
    assert state.net_total_return_pct == 1.0
    assert state.net_payout_amount == 101000.0

def test_memory_coupon_accrual():
    product = StructuredProductDefinition(
        product_id="test-memory",
        archetype=ProductArchetype.FCN_AUTOCALL_NOTE,
        denomination_currency="USD",
        notional_amount=100000.0,
        issue_date="2026-10-01",
        maturity_date="2027-10-01",
        underlyings=[
            UnderlyingAsset(symbol="TSLA", name="Tesla", currency="USD", initial_fixing=100.0, simulated_price=85.0, performance_pct=-15.0)
        ],
        barrier_schedule=[
            BarrierObservation(
                period_index=1,
                observation_date="2026-11-01",
                knock_out_barrier_pct=105.0,
                coupon_barrier_pct=80.0,
                coupon_rate_pct=1.0,
                has_memory=True,
                knock_in_observation_type=KnockInObservationType.EUROPEAN,
            ),
            BarrierObservation(
                period_index=2,
                observation_date="2026-12-01",
                knock_out_barrier_pct=105.0,
                coupon_barrier_pct=80.0,
                coupon_rate_pct=1.0,
                has_memory=True,
                knock_in_observation_type=KnockInObservationType.EUROPEAN,
            )
        ],
        capital_protection_pct=0.0
    )

    # Period 1 missed coupon (price 75 vs barrier 80)
    # Period 2 meets coupon (price 85 vs barrier 80) -> pays 1% + 1% catch-up = 2%
    historical_observations = {1: {"TSLA": 75.0}}
    state = PayoffCalculator.calculate_payoff(
        product,
        {"TSLA": 85.0},
        target_period=2,
        historical_period_prices=historical_observations
    )

    assert state.is_knocked_out is False
    assert state.total_coupons_earned_pct == 2.0  # Period 2 + Period 1 catch-up

def test_european_knock_in_at_maturity():
    product = StructuredProductDefinition(
        product_id="test-ki",
        archetype=ProductArchetype.FCN_AUTOCALL_NOTE,
        denomination_currency="USD",
        notional_amount=100000.0,
        issue_date="2026-10-01",
        maturity_date="2027-10-01",
        underlyings=[
            UnderlyingAsset(symbol="NVDA", name="Nvidia", currency="USD", initial_fixing=100.0, simulated_price=65.0, performance_pct=-35.0)
        ],
        barrier_schedule=[
            BarrierObservation(
                period_index=1,
                observation_date="2027-10-01",
                knock_out_barrier_pct=100.0,
                knock_in_barrier_pct=70.0,
                coupon_barrier_pct=70.0,
                coupon_rate_pct=0.0,
                has_memory=False,
                knock_in_observation_type=KnockInObservationType.EUROPEAN,
            )
        ],
        capital_protection_pct=0.0
    )

    # Price 65 is below 70% knock-in at maturity
    state = PayoffCalculator.calculate_payoff(product, {"NVDA": 65.0}, target_period=1)
    assert state.is_knocked_in is True
    assert state.capital_repaid_pct == 65.0
    assert state.net_total_return_pct == -35.0
    assert state.net_payout_amount == 65000.0

def test_dci_fx_conversion():
    product = StructuredProductDefinition(
        product_id="test-dci",
        archetype=ProductArchetype.DCI,
        denomination_currency="USD",
        notional_amount=100000.0,
        issue_date="2026-10-01",
        maturity_date="2026-11-15",
        underlyings=[
            UnderlyingAsset(symbol="EUR/USD", name="EUR/USD FX", currency="USD", initial_fixing=1.0950, simulated_price=1.0500, performance_pct=-4.1)
        ],
        barrier_schedule=[
            BarrierObservation(
                period_index=1,
                observation_date="2026-11-15",
                coupon_rate_pct=8.5 * (45 / 365),
                has_memory=False,
                knock_in_observation_type=KnockInObservationType.EUROPEAN,
            )
        ],
        capital_protection_pct=0.0,
        dci_parameters=DciSpecificParams(
            base_currency="USD",
            alternate_currency="EUR",
            strike_rate=1.0800,
            tenor_days=45
        )
    )

    # Case A: EUR/USD >= Strike 1.0800 -> Investor receives USD
    state_usd = PayoffCalculator.calculate_payoff(product, {"EUR/USD": 1.0900})
    assert state_usd.dci_settlement_currency == "USD"
    assert state_usd.capital_repaid_pct == 100.0

    # Case B: EUR/USD < Strike 1.0800 (1.0500) -> Converted to EUR at strike 1.0800
    state_eur = PayoffCalculator.calculate_payoff(product, {"EUR/USD": 1.0500})
    assert state_eur.dci_settlement_currency == "EUR"
    # EUR payout = (100000 / 1.0800) * (1 + coupon_pct / 100)
    expected_eur = (100000.0 / 1.0800) * (1 + (8.5 * 45 / 365) / 100.0)
    assert pytest.approx(state_eur.net_payout_amount, 0.01) == expected_eur

def test_worst_of_alphabetical_tie_break():
    # Multi-asset basket with AAPL and MSFT exhibiting the exact same negative return of -25%
    product = StructuredProductDefinition(
        product_id="test-tie",
        archetype=ProductArchetype.FCN_AUTOCALL_NOTE,
        denomination_currency="USD",
        notional_amount=100000.0,
        issue_date="2026-10-01",
        maturity_date="2027-10-01",
        underlyings=[
            UnderlyingAsset(symbol="MSFT", name="Microsoft", currency="USD", initial_fixing=400.0, simulated_price=300.0, performance_pct=-25.0),
            UnderlyingAsset(symbol="AAPL", name="Apple", currency="USD", initial_fixing=200.0, simulated_price=150.0, performance_pct=-25.0),
            UnderlyingAsset(symbol="NVDA", name="Nvidia", currency="USD", initial_fixing=100.0, simulated_price=90.0, performance_pct=-10.0),
        ],
        barrier_schedule=[
            BarrierObservation(
                period_index=1,
                observation_date="2027-10-01",
                knock_in_barrier_pct=70.0,
                coupon_barrier_pct=80.0,
                coupon_rate_pct=0.0,
                has_memory=False,
                knock_in_observation_type=KnockInObservationType.EUROPEAN,
            )
        ],
        capital_protection_pct=0.0
    )

    state = PayoffCalculator.calculate_payoff(product, {"MSFT": 300.0, "AAPL": 150.0, "NVDA": 90.0})

    # Both MSFT and AAPL are at -25% (spot level 75%)
    assert len(state.tied_worst_of_assets) == 2
    assert state.worst_of_tie_broken_by == "ALPHABETICAL_SYMBOL"
    # AAPL precedes MSFT alphabetically
    assert state.worst_performing_asset.symbol == "AAPL"
    # Spot 75% is above KI barrier 70%
    assert state.is_knocked_in is False
    assert state.capital_repaid_pct == 100.0

