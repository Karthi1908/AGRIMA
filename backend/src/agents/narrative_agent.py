"""
Client Narrative Agent for AGRIMA.
Synthesizes plain-language executive scenario narratives (Best Case, Base Case, Worst Case)
for private wealth clients and relationship managers using Gemini 2.5 Flash.
Strictly complies with Constitution Principle I (Zero-Retention) & Principle II (Brand Sanitization).
"""
import os
import json
import logging
from typing import Optional
from backend.src.models.schemas import (
    StructuredProductDefinition,
    ScenarioNarratives,
    ProductArchetype,
)
from backend.src.agents.llm_client import (
    get_gemini_api_key,
    get_flash_model_candidates,
    generate_with_model_fallback,
)

logger = logging.getLogger("agrima.narrative")

class ClientNarrativeAgent:
    """Agent synthesizing non-technical, plain-language scenario narratives."""

    def __init__(self):
        pass

    def generate_narratives(self, product: StructuredProductDefinition) -> ScenarioNarratives:
        """
        Generates Best, Base, and Worst case explanations for the product.
        """
        api_key = get_gemini_api_key()
        if api_key:
            try:
                res = self._generate_with_gemini(product, api_key)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Gemini narrative generation failed, falling back to templates: {e}")

        return self._generate_template_narratives(product)

    def _generate_with_gemini(self, product: StructuredProductDefinition, api_key: str) -> Optional[ScenarioNarratives]:
        """Calls Gemini Flash with candidate model fallback."""
        from google import genai
        client = genai.Client(api_key=api_key)

        product_summary = {
            "archetype": product.archetype.value,
            "currency": product.denomination_currency,
            "notional": product.notional_amount,
            "underlyings": [u.symbol for u in product.underlyings],
            "barrier_schedule_length": len(product.barrier_schedule),
            "knock_in_barrier_pct": product.barrier_schedule[-1].knock_in_barrier_pct if product.barrier_schedule else 70.0,
            "annualized_coupon": sum(b.coupon_rate_pct for b in product.barrier_schedule),
        }

        if product.accumulator_parameters:
            acc = product.accumulator_parameters
            product_summary["accumulator"] = {
                "strike_price": acc.strike_price,
                "strike_pct": acc.strike_pct,
                "knock_out_barrier_pct": acc.knock_out_barrier_pct,
                "gearing_ratio": acc.gearing_ratio,
                "daily_share_count": acc.daily_share_count,
                "total_observation_days": acc.total_observation_days,
                "guaranteed_days": acc.guaranteed_days,
            }

        prompt = f"""
        You are an elite, trusted structured products client advisor explaining an investment product in crystal-clear, plain English to a high-net-worth client.
        
        CRITICAL RULES:
        1. Absolutely DO NOT mention any issuing banks, broker-dealers, or brand names.
        2. Avoid excessive Wall Street derivative jargon. Use intuitive terms like "early return", "safety buffer", "quarterly income", and "market drop".
        3. For Accumulators/Decumulators, you MUST explicitly explain the 2x gearing obligation (mandatory purchase or delivery of double shares) during adverse market moves.
        4. Return a JSON object with exactly three fields:
           - "best_case": A concise paragraph explaining maximum possible return.
           - "base_case": A concise paragraph explaining moderate market consolidation outcome.
           - "worst_case": A concise paragraph explaining downside risk if barriers are breached or gearing triggers.

        Product Economics:
        {json.dumps(product_summary, indent=2)}
        """

        candidates = get_flash_model_candidates()
        raw_json = generate_with_model_fallback(
            client=client,
            model_candidates=candidates,
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )

        if raw_json:
            data = json.loads(raw_json)
            return ScenarioNarratives(
                best_case=data.get("best_case", ""),
                base_case=data.get("base_case", ""),
                worst_case=data.get("worst_case", "")
            )
        return None

    def _generate_template_narratives(self, product: StructuredProductDefinition) -> ScenarioNarratives:
        """High quality deterministic fallback narrative templates."""
        curr = product.denomination_currency
        notional = f"{curr} {product.notional_amount:,.0f}"
        symbols = ", ".join(u.symbol for u in product.underlyings)
        ki_barrier = product.barrier_schedule[-1].knock_in_barrier_pct if product.barrier_schedule and product.barrier_schedule[-1].knock_in_barrier_pct is not None else 70.0
        total_coupon = sum(b.coupon_rate_pct for b in product.barrier_schedule)

        if product.archetype == ProductArchetype.EQUITY_ACCUMULATOR and product.accumulator_parameters:
            acc = product.accumulator_parameters
            u_sym = symbols or "the underlying stock"
            best_case = (
                f"In the best-case scenario, {u_sym} trades steadily between the discounted strike price of "
                f"${acc.strike_price:.2f} ({acc.strike_pct:.1f}% of initial) and the {acc.knock_out_barrier_pct:.1f}% Knock-Out barrier. "
                f"You systematically accumulate {acc.daily_share_count:,.0f} shares per business day at a favorable discount without triggering early contract cancellation."
            )
            base_case = (
                f"In the base-case scenario, {u_sym} performs strongly and touches the {acc.knock_out_barrier_pct:.1f}% Knock-Out barrier early in the contract. "
                f"The contract terminates early, locking in your accumulated discounted shares (or {acc.guaranteed_days or 0} guaranteed days) and preserving your remaining capital."
            )
            worst_case = (
                f"In the downside scenario, {u_sym} drops sharply below the ${acc.strike_price:.2f} strike price. "
                f"Under the contract's {acc.gearing_ratio:.1f}x gearing mechanism, you are legally obligated to purchase DOUBLE the daily share allocation "
                f"({acc.daily_share_count * acc.gearing_ratio:,.0f} shares/day) at the higher strike price, resulting in substantial unrealized capital losses."
            )
        elif product.archetype == ProductArchetype.EQUITY_DECUMULATOR and product.accumulator_parameters:
            dec = product.accumulator_parameters
            u_sym = symbols or "the underlying stock"
            best_case = (
                f"In the best-case scenario, {u_sym} remains above the {dec.knock_out_barrier_pct:.1f}% downside Knock-Out floor and below the premium strike of "
                f"${dec.strike_price:.2f}. You systematically liquidate your position at {dec.daily_share_count:,.0f} shares per day at an attractive premium above prevailing market levels."
            )
            base_case = (
                f"In the base-case scenario, {u_sym} pulls back below the {dec.knock_out_barrier_pct:.1f}% Knock-Out floor early in the schedule. "
                f"The contract terminates early, stopping mandatory share sales and preserving your remaining stock holdings."
            )
            worst_case = (
                f"In the upside scenario, {u_sym} rallies powerfully well beyond the ${dec.strike_price:.2f} strike price. "
                f"Under the {dec.gearing_ratio:.1f}x gearing mechanism, you are legally required to deliver DOUBLE the daily share volume "
                f"({dec.daily_share_count * dec.gearing_ratio:,.0f} shares/day) at the capped strike price, forfeiting substantial market upside."
            )
        elif product.archetype == ProductArchetype.DCI and product.dci_parameters:
            dci = product.dci_parameters
            best_case = (
                f"In the best-case scenario, the {dci.alternate_currency}/{dci.base_currency} exchange rate remains above the strike level "
                f"of {dci.strike_rate:.4f} at maturity. You will receive 100% of your principal in {dci.base_currency} along with the enhanced "
                f"yield payout of {total_coupon:.2f}%, maximizing your cash return."
            )
            base_case = (
                f"In the base-case scenario, the exchange rate hovers near the strike rate. As long as it closes above {dci.strike_rate:.4f} "
                f"on the final fixing date, your principal remains fully protected in {dci.base_currency} while you capture attractive short-term yield."
            )
            worst_case = (
                f"In the downside scenario, {dci.alternate_currency} weakens substantially against {dci.base_currency} below {dci.strike_rate:.4f}. "
                f"Your principal will be automatically converted into {dci.alternate_currency} at the agreed strike rate. While you keep the coupon yield, "
                f"the market value of your converted currency position will reflect the currency depreciation."
            )
        elif product.archetype == ProductArchetype.TWIN_WIN_NOTE:
            best_case = (
                f"In the best-case scenario, the underlying asset rallies upward. You capture 100% of the upside gains up to the cap level, "
                f"delivering strong capital growth on your {notional} investment."
            )
            base_case = (
                f"In the base-case scenario, market prices soften moderately but never breach the {ki_barrier:.0f}% safety barrier. Under the "
                f"Twin-Win structure, a moderate price drop is converted into positive capital return equal to the percentage decline."
            )
            worst_case = (
                f"In the downside scenario, market volatility causes the underlying asset to breach the {ki_barrier:.0f}% knock-in barrier. "
                f"The capital protection and twin-win features are deactivated, and your investment experiences 1-to-1 losses matching the final market decline."
            )
        else:
            # FCN / Autocall structures
            best_case = (
                f"In the best-case scenario, all linked underlying assets ({symbols}) perform well and trade at or above their initial strike levels on an "
                f"observation date. The note will automatically redeem early, returning 100% of your {notional} principal plus all scheduled coupon payments."
            )
            base_case = (
                f"In the base-case scenario, market prices remain sideways or experience moderate pullbacks without breaching the {ki_barrier:.0f}% knock-in barrier. "
                f"You collect regular periodic income coupons, and 100% of your principal is returned at maturity."
            )
            worst_case = (
                f"In the downside scenario, the worst-performing asset in the basket falls sharply and closes below the {ki_barrier:.0f}% knock-in barrier at maturity. "
                f"Capital protection expires, and your repaid principal will be reduced 1-to-1 in proportion to the decline of the lowest-performing stock."
            )

        return ScenarioNarratives(
            best_case=best_case,
            base_case=base_case,
            worst_case=worst_case
        )
