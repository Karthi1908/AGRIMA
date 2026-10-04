from backend.src.models.schemas import StructuredProductDefinition, ProductArchetype
from backend.src.models.analytics import RiskProfile, StressScenarioOutcome

class StressTestService:
    @staticmethod
    def evaluate_risk_profile(product: StructuredProductDefinition) -> RiskProfile:
        stress_tests = {}
        
        # Scenarios: immediate gap down in underlying price
        scenarios = {
            "2008_crash": -0.50,
            "2020_covid": -0.30,
            "single_stock_gap": -0.25
        }
        
        if product.archetype == ProductArchetype.EQUITY_ACCUMULATOR and product.accumulator_parameters:
            acc = product.accumulator_parameters
            max_shares = acc.total_observation_days * acc.daily_share_count * acc.gearing_ratio
            strike = acc.strike_price
            initial_spot = product.underlyings[0].initial_fixing
            
            for name, drop in scenarios.items():
                shocked_price = initial_spot * (1 + drop)
                # In a stress scenario, we assume the worst: no KO, full tenor, all shares acquired at gearing
                cash_required = max_shares * strike
                final_value = max_shares * shocked_price
                pnl = final_value - cash_required
                
                # If loss exceeds a certain threshold (e.g., 20% of cash required), margin call is triggered
                margin_call = pnl < (-0.20 * cash_required)
                
                stress_tests[name] = StressScenarioOutcome(
                    shares_transacted=max_shares,
                    cash_required=cash_required,
                    pnl=pnl,
                    margin_call_triggered=margin_call,
                    indicative_margin_size=abs(pnl) if margin_call else 0.0
                )
                
            max_loss = None # Unbounded (can lose more than invested if cash_required is large and price goes to 0)
            max_loss_theoretical = max_shares * strike # if price goes to 0
            
            return RiskProfile(
                maximum_loss=max_loss_theoretical,
                unbounded_loss_statement="Losses are capped at the total notional cash obligation if the underlying asset goes to zero, but practically unbounded relative to initial margin.",
                gain_loss_shape="Gains capped (Knock-Out), Losses amplified by gearing (2x below strike).",
                stress_tests=stress_tests
            )
            
        # Default fallback for other products
        return RiskProfile(
            maximum_loss=product.notional_amount,
            unbounded_loss_statement="Loss is limited to the principal amount invested.",
            gain_loss_shape="Symmetric or principal protected depending on product structure.",
            stress_tests={}
        )
