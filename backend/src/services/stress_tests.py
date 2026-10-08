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
            
        else:
            notional = product.notional_amount or 1000.0
            capital_protection = product.capital_protection_pct or 0.0
            
            barrier = 0.0
            if product.barrier_schedule:
                for b in product.barrier_schedule:
                    if b.knock_in_barrier_pct is not None:
                        barrier = b.knock_in_barrier_pct / 100.0
                        break

            for name, drop in scenarios.items():
                # End of period drop
                price_pct = 1.0 + drop
                
                # Check if KI is breached
                if barrier > 0 and price_pct <= barrier:
                    # Breached KI -> Loss 1:1 with underlying, bounded by capital protection
                    final_payout = max(capital_protection / 100.0, price_pct) * notional
                elif barrier > 0 and price_pct > barrier:
                    # Above KI -> Capital protected at par
                    final_payout = notional
                else:
                    # No KI barrier, linear payout
                    final_payout = max(capital_protection / 100.0, price_pct) * notional
                    
                pnl = final_payout - notional
                
                stress_tests[name] = StressScenarioOutcome(
                    shares_transacted=0,
                    cash_required=notional,
                    pnl=pnl,
                    margin_call_triggered=False,
                    indicative_margin_size=0.0
                )
                
            return RiskProfile(
                maximum_loss=notional * (1 - (capital_protection / 100.0)),
                unbounded_loss_statement="Loss is limited to the principal amount invested minus any capital protection floor.",
                gain_loss_shape="Upside capped by coupon/autocall, Downside 1:1 with worst underlying if Knock-In is breached.",
                stress_tests=stress_tests
            )
