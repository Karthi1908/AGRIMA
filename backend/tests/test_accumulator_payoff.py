"""
Unit tests for Equity Accumulator and Equity Decumulator mathematical payoff calculations.
Validates:
- 1x accumulation vs 2x gearing below strike
- Early Knock-Out cancellation
- Downside Knock-Out for decumulator
- 2x upside delivery obligations for decumulator
- Dual Display metrics (total shares, gross cash, net P&L)
"""
import pytest
from backend.src.models.schemas import (
    ProductArchetype,
    StructuredProductDefinition,
    UnderlyingAsset,
    AccumulatorSpecificParams,
)
from backend.src.engine.payoff_calculator import PayoffCalculator


@pytest.fixture
def sample_accumulator() -> StructuredProductDefinition:
    """NVDA 60-Day Equity Accumulator: S0=120, Strike=102 (85%), KO=103% (123.6), 100 shares/day, 2x gearing."""
    return StructuredProductDefinition(
        product_id="test-acc-01",
        archetype=ProductArchetype.EQUITY_ACCUMULATOR,
        title="NVDA 60D Accumulator",
        denomination_currency="USD",
        notional_amount=612000.0,
        issue_date="2026-10-01",
        maturity_date="2026-12-31",
        underlyings=[
            UnderlyingAsset(
                symbol="NVDA",
                name="NVIDIA Corp.",
                currency="USD",
                initial_fixing=120.0,
                simulated_price=120.0,
                performance_pct=0.0
            )
        ],
        barrier_schedule=[],
        capital_protection_pct=0.0,
        accumulator_parameters=AccumulatorSpecificParams(
            strike_price=102.0,
            strike_pct=85.0,
            knock_out_barrier_pct=103.0,
            gearing_ratio=2.0,
            daily_share_count=100.0,
            total_observation_days=60,
            guaranteed_days=0
        )
    )


@pytest.fixture
def sample_decumulator() -> StructuredProductDefinition:
    """TSLA 60-Day Equity Decumulator: S0=240, Strike=276 (115%), KO=95% (228.0), 100 shares/day, 2x gearing."""
    return StructuredProductDefinition(
        product_id="test-dec-01",
        archetype=ProductArchetype.EQUITY_DECUMULATOR,
        title="TSLA 60D Decumulator",
        denomination_currency="USD",
        notional_amount=1656000.0,
        issue_date="2026-10-01",
        maturity_date="2026-12-31",
        underlyings=[
            UnderlyingAsset(
                symbol="TSLA",
                name="Tesla Inc.",
                currency="USD",
                initial_fixing=240.0,
                simulated_price=240.0,
                performance_pct=0.0
            )
        ],
        barrier_schedule=[],
        capital_protection_pct=0.0,
        accumulator_parameters=AccumulatorSpecificParams(
            strike_price=276.0,
            strike_pct=115.0,
            knock_out_barrier_pct=95.0,
            gearing_ratio=2.0,
            daily_share_count=100.0,
            total_observation_days=60,
            guaranteed_days=0
        )
    )


def test_accumulator_knock_out(sample_accumulator):
    """Spot at 125.0 is above KO barrier (120 * 1.03 = 123.6) -> Knocked out."""
    state = PayoffCalculator.calculate_payoff(sample_accumulator, {"NVDA": 125.0})
    assert state.is_knocked_out is True
    assert state.total_shares_transacted == 0.0
    assert state.gearing_active is False


def test_accumulator_normal_1x_accumulation(sample_accumulator):
    """Spot at 110.0 is between Strike (102.0) and KO (123.6) -> 1x accumulation."""
    state = PayoffCalculator.calculate_payoff(sample_accumulator, {"NVDA": 110.0})
    assert state.is_knocked_out is False
    assert state.gearing_active is False
    # 60 days * 100 shares = 6,000 shares
    assert state.total_shares_transacted == 6000.0
    # Gross cash = 6000 * 102 = 612,000
    assert state.gross_cash_amount == 612000.0
    # Market value = 6000 * 110 = 660,000
    assert state.net_payout_amount == 660000.0
    # Net return pct = (110 - 102) / 102 * 100 = 7.84%
    assert round(state.net_total_return_pct, 2) == 7.84


def test_accumulator_2x_gearing_below_strike(sample_accumulator):
    """Spot at 90.0 is below Strike (102.0) -> 2x gearing triggers mandatory purchase."""
    state = PayoffCalculator.calculate_payoff(sample_accumulator, {"NVDA": 90.0})
    assert state.is_knocked_out is False
    assert state.gearing_active is True
    # 60 days * (100 * 2) = 12,000 shares
    assert state.total_shares_transacted == 12000.0
    # Gross cash paid = 12000 * 102 = 1,224,000
    assert state.gross_cash_amount == 1224000.0
    # Market value = 12000 * 90 = 1,080,000
    assert state.net_payout_amount == 1080000.0
    # Loss: (90 - 102) / 102 * 100 = -11.76%
    assert round(state.net_total_return_pct, 2) == -11.76


def test_decumulator_knock_out(sample_decumulator):
    """Spot at 220.0 is below downside KO barrier (240 * 0.95 = 228.0) -> Knocked out."""
    state = PayoffCalculator.calculate_payoff(sample_decumulator, {"TSLA": 220.0})
    assert state.is_knocked_out is True
    assert state.total_shares_transacted == 0.0
    assert state.gearing_active is False


def test_decumulator_normal_1x_sale(sample_decumulator):
    """Spot at 250.0 is between KO (228.0) and Strike (276.0) -> 1x sale at premium strike."""
    state = PayoffCalculator.calculate_payoff(sample_decumulator, {"TSLA": 250.0})
    assert state.is_knocked_out is False
    assert state.gearing_active is False
    # 60 days * 100 shares = 6,000 shares
    assert state.total_shares_transacted == 6000.0
    # Gross cash proceeds = 6000 * 276 = 1,656,000
    assert state.gross_cash_amount == 1656000.0


def test_decumulator_2x_gearing_above_strike(sample_decumulator):
    """Spot at 300.0 is above Strike (276.0) -> 2x gearing triggers mandatory sale of double shares."""
    state = PayoffCalculator.calculate_payoff(sample_decumulator, {"TSLA": 300.0})
    assert state.is_knocked_out is False
    assert state.gearing_active is True
    # 60 days * (100 * 2) = 12,000 shares
    assert state.total_shares_transacted == 12000.0
    # Gross cash proceeds = 12000 * 276 = 3,312,000
    assert state.gross_cash_amount == 3312000.0
