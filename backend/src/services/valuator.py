import numpy as np
from backend.src.models.schemas import StructuredProductDefinition
from backend.src.models.analytics import SimulationAssumptions, SimulationResult, ValuationEstimate

class ValuatorService:
    @staticmethod
    def estimate_fair_value(
        product: StructuredProductDefinition, 
        sim_result: SimulationResult, 
        assumptions: SimulationAssumptions
    ) -> ValuationEstimate:
        # Simple risk-neutral discounting of the expected P&L.
        # Note: If the drift in assumptions was NOT risk-free rate, 
        # this is a "real-world" expectation, not strict fair value.
        # But for this MVP, we use expected_pnl from the simulation.
        
        # Determine maturity in years
        if product.accumulator_parameters:
            days = product.accumulator_parameters.total_observation_days
        else:
            days = 252
            
        t_years = days / 252.0
        r = 0.05 # assume 5% risk-free rate for discounting
        
        # Discount the expected P&L
        discount_factor = np.exp(-r * t_years)
        discounted_pnl = sim_result.expected_pnl * discount_factor
        
        # For accumulators, fair value is essentially the expected discounted P&L
        # The upfront premium paid is usually zero, but the client enters at a cost.
        # We will represent fair value as the discounted PNL.
        fair_value = discounted_pnl
        
        # Calculate standard error for confidence intervals
        # Approximate the range based on the simulated 5th and 95th percentiles (discounted)
        range_low = sim_result.pnl_distribution[0] * discount_factor
        range_high = sim_result.pnl_distribution[-1] * discount_factor
        
        # Implied cost to client (often structural margin baked into the strike)
        # We estimate structural margin by looking at the fair value. If fair_value < 0, 
        # it implies the client is 'paying' that expected loss to the issuer.
        implied_cost_currency = abs(min(0, fair_value))
        
        # Calculate as a percentage of max capital commitment or notional
        max_capital = product.notional_amount
        if product.accumulator_parameters:
            acc = product.accumulator_parameters
            max_capital = acc.total_observation_days * acc.daily_share_count * acc.gearing_ratio * acc.strike_price
            
        implied_cost_percent = (implied_cost_currency / max_capital) * 100 if max_capital > 0 else 0.0
        
        return ValuationEstimate(
            fair_value=fair_value,
            implied_cost_currency=implied_cost_currency,
            implied_cost_percent=implied_cost_percent,
            range_low=range_low,
            range_high=range_high,
            assumptions_used=assumptions
        )
