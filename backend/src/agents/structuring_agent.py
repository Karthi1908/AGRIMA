"""
Economic Structuring Agent for AGRIMA.
Parses sanitized termsheet text into normalized Pydantic StructuredProductDefinition.
Defaults to European observation with dynamic detection of American continuous monitoring.
Computes field confidence scores and flags low-confidence (<0.7) fields for the verification drawer.
"""
import os
import re
import json
import uuid
import logging
from typing import Dict, Any, Tuple, List, Optional

from backend.src.models.schemas import (
    ProductArchetype,
    StructuredProductDefinition,
    UnderlyingAsset,
    BarrierObservation,
    KnockInObservationType,
    DciSpecificParams,
    TwinWinSpecificParams,
    AccumulatorSpecificParams,
    TermsheetExtractionResponse,
)
from backend.src.agents.llm_client import (
    get_gemini_api_key,
    get_pro_model_candidates,
    generate_with_model_fallback,
)

logger = logging.getLogger("agrima.structuring")

class EconomicStructuringAgent:
    """Agent that normalizes sanitized termsheet text into StructuredProductDefinition."""

    def __init__(self):
        pass

    def structure_termsheet(self, sanitized_text: str) -> TermsheetExtractionResponse:
        """
        Transforms sanitized text into a verified product structure with confidence scoring.
        """
        api_key = get_gemini_api_key()
        # Attempt Gemini Pro extraction if API key is present
        if api_key:
            try:
                res = self._extract_with_gemini(sanitized_text, api_key)
                if res and res.product:
                    return res
            except Exception as e:
                logger.warning(f"Gemini structuring failed, using rule-based parsing: {e}")

        # Deterministic financial rule parser fallback
        return self._rule_based_parse(sanitized_text)

    def _rule_based_parse(self, text: str) -> TermsheetExtractionResponse:
        """Rule-based extractor supporting DCI, FCN, Step-Down, Twin-Win, Accumulator, and Decumulator."""
        confidence: Dict[str, float] = {}
        warnings: List[str] = []
        product_id = f"prod-{uuid.uuid4().hex[:8]}"

        text_lower = text.lower()

        # Determine Archetype
        if "accumulator" in text_lower or "share accumulator" in text_lower:
            archetype = ProductArchetype.EQUITY_ACCUMULATOR
            confidence["archetype"] = 0.98
        elif "decumulator" in text_lower or "share decumulator" in text_lower:
            archetype = ProductArchetype.EQUITY_DECUMULATOR
            confidence["archetype"] = 0.98
        elif "dual currency" in text_lower or "dci" in text_lower or "alternate currency" in text_lower:
            archetype = ProductArchetype.DCI
            confidence["archetype"] = 0.98
        elif "step-down" in text_lower or "step down" in text_lower:
            archetype = ProductArchetype.STEP_DOWN_AUTOCALL_NOTE
            confidence["archetype"] = 0.95
        elif "step-up" in text_lower or "step up" in text_lower:
            archetype = ProductArchetype.STEP_UP_AUTOCALL_NOTE
            confidence["archetype"] = 0.95
        elif "twin-win" in text_lower or "twin win" in text_lower:
            archetype = ProductArchetype.TWIN_WIN_NOTE
            confidence["archetype"] = 0.96
        elif "fixed coupon" in text_lower or "fcn" in text_lower:
            archetype = ProductArchetype.FCN_AUTOCALL_NOTE
            confidence["archetype"] = 0.97
        else:
            archetype = ProductArchetype.FCN_AUTOCALL_NOTE
            confidence["archetype"] = 0.65
            warnings.append("Product archetype inferred as FCN Autocall Note with medium confidence.")

        # Notional and currency
        currency = "USD"
        curr_match = re.search(r"\b(USD|EUR|GBP|JPY|CHF|SGD|AUD|HKD|CNH)\b", text)
        if curr_match:
            currency = curr_match.group(1).upper()
            confidence["denomination_currency"] = 0.95
        else:
            confidence["denomination_currency"] = 0.70

        notional = 100000.0
        notional_match = re.search(r"(?i)notional(?: amount)?\s*:\s*[A-Z]{3}?\s*([\d,]+(?:\.\d+)?)", text)
        if notional_match:
            notional = float(notional_match.group(1).replace(",", ""))
            confidence["notional_amount"] = 0.95
        else:
            confidence["notional_amount"] = 0.60
            warnings.append("Notional amount defaulted to 100,000. Verify against termsheet.")

        # Observation Type: Dynamic American detection, European by default
        is_american = (
            "continuous" in text_lower or
            "american" in text_lower or
            "intra-period" in text_lower or
            "any time" in text_lower
        )
        obs_type = KnockInObservationType.AMERICAN if is_american else KnockInObservationType.EUROPEAN
        confidence["knock_in_observation_type"] = 0.92

        # Extraction for DCI
        dci_params = None
        underlyings = []
        barrier_schedule = []
        twin_win_params = None
        accumulator_params = None
        capital_protection_pct = 0.0

        if archetype == ProductArchetype.DCI:
            title = "Dual Currency Investment"
            alt_curr = "EUR" if currency == "USD" else "USD"
            alt_match = re.search(r"(?i)alternate currency\s*:\s*([A-Z]{3})", text)
            if alt_match:
                alt_curr = alt_match.group(1).upper()

            strike_rate = 1.0800
            strike_match = re.search(r"(?i)strike\s*(?:/\s*linked rate)?\s*:\s*([\d.]+)", text)
            if strike_match:
                strike_rate = float(strike_match.group(1))
                confidence["strike_rate"] = 0.96
            else:
                confidence["strike_rate"] = 0.60
                warnings.append("DCI Strike rate confidence below 0.7. Please confirm strike rate.")

            tenor_days = 45
            tenor_match = re.search(r"(?i)tenor\s*:\s*(\d+)\s*days", text)
            if tenor_match:
                tenor_days = int(tenor_match.group(1))

            coupon_rate = 8.5
            coupon_match = re.search(r"(?i)(?:coupon|yield)\s*:\s*([\d.]+)%", text)
            if coupon_match:
                coupon_rate = float(coupon_match.group(1))
                confidence["coupon_rate_pct"] = 0.95

            dci_params = DciSpecificParams(
                base_currency=currency,
                alternate_currency=alt_curr,
                strike_rate=strike_rate,
                tenor_days=tenor_days
            )

            underlyings.append(UnderlyingAsset(
                symbol=f"{alt_curr}/{currency}",
                name=f"{alt_curr}/{currency} FX Rate",
                currency=currency,
                initial_fixing=1.0950,
                simulated_price=strike_rate,
                performance_pct=0.0
            ))

            barrier_schedule.append(BarrierObservation(
                period_index=1,
                observation_date="2026-11-15",
                knock_in_barrier_pct=100.0,
                coupon_rate_pct=coupon_rate,
                has_memory=False,
                knock_in_observation_type=obs_type
            ))

        # Extraction for FCN and Autocall notes
        elif archetype in [ProductArchetype.FCN_AUTOCALL_NOTE, ProductArchetype.STEP_DOWN_AUTOCALL_NOTE, ProductArchetype.STEP_UP_AUTOCALL_NOTE]:
            title = "Fixed Coupon Autocall Note" if archetype == ProductArchetype.FCN_AUTOCALL_NOTE else "Step-Down Autocall Note"
            
            # Underlying assets detection
            # Look for tickers like AAPL, MSFT, NVDA, TSLA
            found_symbols = []
            for sym, name, default_px in [
                ("AAPL", "Apple Inc.", 225.0),
                ("MSFT", "Microsoft Corp.", 430.0),
                ("NVDA", "NVIDIA Corp.", 120.0),
                ("TSLA", "Tesla Inc.", 240.0),
                ("GOOGL", "Alphabet Inc.", 180.0),
                ("AMZN", "Amazon.com Inc.", 190.0)
            ]:
                if sym in text:
                    found_symbols.append((sym, name, default_px))

            if not found_symbols:
                found_symbols = [("AAPL", "Apple Inc.", 225.0)]
                confidence["underlyings"] = 0.55
                warnings.append("Underlying asset not clearly identified. Defaulted to AAPL.")
            else:
                confidence["underlyings"] = 0.95

            for sym, name, init_px in found_symbols:
                underlyings.append(UnderlyingAsset(
                    symbol=sym,
                    name=name,
                    currency=currency,
                    initial_fixing=init_px,
                    simulated_price=init_px,
                    performance_pct=0.0
                ))

            # Barriers
            ki_barrier = 70.0
            ki_match = re.search(r"(?i)knock-in\s*(?:barrier)?\s*:\s*([\d.]+)%", text)
            if ki_match:
                ki_barrier = float(ki_match.group(1))
                confidence["knock_in_barrier_pct"] = 0.94
            else:
                confidence["knock_in_barrier_pct"] = 0.65
                warnings.append("Knock-in barrier not explicitly stated. Defaulted to 70%.")

            coupon_barrier = 80.0
            cb_match = re.search(r"(?i)coupon barrier\s*:\s*([\d.]+)%", text)
            if cb_match:
                coupon_barrier = float(cb_match.group(1))
                confidence["coupon_barrier_pct"] = 0.92

            coupon_rate = 12.0
            cr_match = re.search(r"(?i)(?:coupon|yield)\s*:\s*([\d.]+)%", text)
            if cr_match:
                coupon_rate = float(cr_match.group(1))
                confidence["coupon_rate_pct"] = 0.95

            has_memory = "memory" in text_lower

            # Schedule
            if archetype == ProductArchetype.STEP_DOWN_AUTOCALL_NOTE:
                schedule_barriers = [100.0, 95.0, 90.0, 85.0]
                for idx, b_pct in enumerate(schedule_barriers, start=1):
                    barrier_schedule.append(BarrierObservation(
                        period_index=idx,
                        observation_date=f"2027-0{idx*3 if idx*3 < 10 else idx*3}-01",
                        knock_out_barrier_pct=b_pct,
                        knock_in_barrier_pct=ki_barrier if idx == len(schedule_barriers) else None,
                        coupon_barrier_pct=coupon_barrier,
                        coupon_rate_pct=coupon_rate / 4,
                        has_memory=has_memory,
                        knock_in_observation_type=obs_type
                    ))
            else:
                for idx in range(1, 13):
                    barrier_schedule.append(BarrierObservation(
                        period_index=idx,
                        observation_date=f"2027-{idx:02d}-01",
                        knock_out_barrier_pct=100.0 if idx >= 3 else None,
                        knock_in_barrier_pct=ki_barrier if idx == 12 else None,
                        coupon_barrier_pct=coupon_barrier,
                        coupon_rate_pct=coupon_rate / 12,
                        has_memory=has_memory,
                        knock_in_observation_type=obs_type
                    ))

        # Twin-Win Note
        elif archetype == ProductArchetype.TWIN_WIN_NOTE:
            title = "Twin-Win Certificate"
            underlyings.append(UnderlyingAsset(
                symbol="SPY",
                name="S&P 500 ETF",
                currency="USD",
                initial_fixing=560.0,
                simulated_price=560.0,
                performance_pct=0.0
            ))
            ki_barrier = 75.0
            ki_match = re.search(r"(?i)knock-in\s*(?:barrier)?\s*:\s*([\d.]+)%", text)
            if ki_match:
                ki_barrier = float(ki_match.group(1))

            twin_win_params = TwinWinSpecificParams(
                downside_participation=1.0,
                upside_participation=1.0,
                cap_pct=125.0
            )

            barrier_schedule.append(BarrierObservation(
                period_index=1,
                observation_date="2028-04-01",
                knock_in_barrier_pct=ki_barrier,
                coupon_rate_pct=0.0,
                has_memory=False,
                knock_in_observation_type=obs_type
            ))
        elif archetype == ProductArchetype.EQUITY_ACCUMULATOR:
            title = "Equity Share Accumulator"
            sym = "NVDA"
            name = "NVIDIA Corp."
            spot = 120.0
            sym_match = re.search(r"\b([A-Z]{2,5})\b", text)
            if sym_match and sym_match.group(1) not in ("USD", "EUR", "GBP", "JPY", "CHF", "SGD", "HKD"):
                sym = sym_match.group(1)
                name = f"{sym} Equity"
            underlyings.append(UnderlyingAsset(
                symbol=sym,
                name=name,
                currency=currency,
                initial_fixing=spot,
                simulated_price=spot,
                performance_pct=0.0
            ))

            strike_val = spot * 0.85
            strike_match = re.search(r"(?i)strike(?:\s*price)?\s*:\s*([\d.]+)", text)
            if strike_match:
                strike_val = float(strike_match.group(1))

            ko_val = 103.0
            ko_match = re.search(r"(?i)knock-out(?:\s*barrier)?\s*:\s*([\d.]+)%", text)
            if ko_match:
                ko_val = float(ko_match.group(1))

            daily_shares = 100.0
            shares_match = re.search(r"(?i)daily(?:\s*shares)?\s*:\s*([\d.]+)", text)
            if shares_match:
                daily_shares = float(shares_match.group(1))

            accumulator_params = AccumulatorSpecificParams(
                strike_price=strike_val,
                strike_pct=(strike_val / spot) * 100.0 if spot > 0 else 85.0,
                knock_out_barrier_pct=ko_val,
                knock_out_observation_type=obs_type,
                gearing_ratio=2.0,
                daily_share_count=daily_shares,
                total_observation_days=60,
                guaranteed_days=0
            )
            confidence["archetype"] = 0.98
            confidence["accumulator_parameters"] = 0.95

        elif archetype == ProductArchetype.EQUITY_DECUMULATOR:
            title = "Equity Share Decumulator"
            sym = "TSLA"
            name = "Tesla Inc."
            spot = 240.0
            sym_match = re.search(r"\b([A-Z]{2,5})\b", text)
            if sym_match and sym_match.group(1) not in ("USD", "EUR", "GBP", "JPY", "CHF", "SGD", "HKD"):
                sym = sym_match.group(1)
                name = f"{sym} Equity"
            underlyings.append(UnderlyingAsset(
                symbol=sym,
                name=name,
                currency=currency,
                initial_fixing=spot,
                simulated_price=spot,
                performance_pct=0.0
            ))

            strike_val = spot * 1.15
            strike_match = re.search(r"(?i)strike(?:\s*price)?\s*:\s*([\d.]+)", text)
            if strike_match:
                strike_val = float(strike_match.group(1))

            ko_val = 95.0
            ko_match = re.search(r"(?i)knock-out(?:\s*barrier)?\s*:\s*([\d.]+)%", text)
            if ko_match:
                ko_val = float(ko_match.group(1))

            daily_shares = 100.0
            shares_match = re.search(r"(?i)daily(?:\s*shares)?\s*:\s*([\d.]+)", text)
            if shares_match:
                daily_shares = float(shares_match.group(1))

            accumulator_params = AccumulatorSpecificParams(
                strike_price=strike_val,
                strike_pct=(strike_val / spot) * 100.0 if spot > 0 else 115.0,
                knock_out_barrier_pct=ko_val,
                knock_out_observation_type=obs_type,
                gearing_ratio=2.0,
                daily_share_count=daily_shares,
                total_observation_days=60,
                guaranteed_days=0
            )
            confidence["archetype"] = 0.98
            confidence["accumulator_parameters"] = 0.95
        else:
            title = "Structured Product"

        product = StructuredProductDefinition(
            product_id=product_id,
            archetype=archetype,
            title=title,
            denomination_currency=currency,
            notional_amount=notional,
            issue_date="2026-10-01",
            maturity_date="2027-10-01",
            underlyings=underlyings,
            barrier_schedule=barrier_schedule,
            capital_protection_pct=capital_protection_pct,
            dci_parameters=dci_params,
            twin_win_parameters=twin_win_params,
            accumulator_parameters=accumulator_params
        )

        return TermsheetExtractionResponse(
            product=product,
            field_confidence=confidence,
            flagged_warnings=warnings,
            is_rejected=False
        )

    def _extract_with_gemini(self, text: str, api_key: str) -> Optional[TermsheetExtractionResponse]:
        """Extracts structured schema using Gemini Pro with automatic candidate fallback."""
        from google import genai
        client = genai.Client(api_key=api_key)

        prompt = f"""
        Extract the structured product termsheet into JSON conforming to the StructuredProductDefinition schema:
        Return valid JSON with:
        - product_id: "prod-..."
        - archetype: "DCI" | "FCN_AUTOCALL_NOTE" | "TWIN_WIN_NOTE" | "STEP_UP_AUTOCALL_NOTE" | "STEP_DOWN_AUTOCALL_NOTE" | "EQUITY_ACCUMULATOR" | "EQUITY_DECUMULATOR"
        - denomination_currency: string
        - notional_amount: number
        - issue_date: YYYY-MM-DD
        - maturity_date: YYYY-MM-DD
        - underlyings: list of {{ symbol, name, currency, initial_fixing, simulated_price }}
        - barrier_schedule: list of {{ period_index, observation_date, knock_out_barrier_pct, knock_in_barrier_pct, coupon_barrier_pct, coupon_rate_pct, has_memory, knock_in_observation_type }}
        - dci_parameters: {{ base_currency, alternate_currency, strike_rate, tenor_days }} (if DCI)
        - accumulator_parameters: {{ strike_price, strike_pct, knock_out_barrier_pct, knock_out_observation_type, gearing_ratio, daily_share_count, total_observation_days, guaranteed_days }} (if Accumulator or Decumulator)
        - field_confidence: dictionary mapping field names to confidence 0.0-1.0
        - flagged_warnings: list of string warnings for fields with confidence < 0.70

        Sanitized Termsheet:
        {text}
        """

        candidates = get_pro_model_candidates()
        raw_json = generate_with_model_fallback(
            client=client,
            model_candidates=candidates,
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )

        if raw_json:
            data = json.loads(raw_json)
            prod_data = data.get("product", data)
            if isinstance(prod_data, dict):
                if not prod_data.get("product_id"):
                    prod_data["product_id"] = f"prod-{uuid.uuid4().hex[:8]}"
                if not prod_data.get("issue_date"):
                    prod_data["issue_date"] = "2026-10-01"
                if not prod_data.get("maturity_date"):
                    prod_data["maturity_date"] = "2027-10-01"
                if "underlyings" in prod_data and isinstance(prod_data["underlyings"], list):
                    for u in prod_data["underlyings"]:
                        if isinstance(u, dict):
                            if u.get("simulated_price") is None:
                                u["simulated_price"] = u.get("initial_fixing", 100.0)
            product = StructuredProductDefinition.model_validate(prod_data)
            return TermsheetExtractionResponse(
                product=product,
                field_confidence=data.get("field_confidence", {}),
                flagged_warnings=data.get("flagged_warnings", []),
                is_rejected=False
            )
        return None
