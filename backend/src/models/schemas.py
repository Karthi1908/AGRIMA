"""
Core domain models and schemas for AGRIMA Structured Product Explainer.
Conforms strictly to Data Model Specification and OpenAPI 3.0 Contract.
Zero-Retention: in-memory ephemeral validation models only.
"""
from __future__ import annotations
import uuid
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class ProductArchetype(str, Enum):
    DCI = "DCI"
    EQUITY_AUTOCALL_OPTION = "EQUITY_AUTOCALL_OPTION"
    EQUITY_AUTOCALL_SWAP = "EQUITY_AUTOCALL_SWAP"
    FCN_AUTOCALL_NOTE = "FCN_AUTOCALL_NOTE"
    TWIN_WIN_NOTE = "TWIN_WIN_NOTE"
    STEP_UP_AUTOCALL_NOTE = "STEP_UP_AUTOCALL_NOTE"
    STEP_DOWN_AUTOCALL_NOTE = "STEP_DOWN_AUTOCALL_NOTE"
    EQUITY_ACCUMULATOR = "EQUITY_ACCUMULATOR"
    EQUITY_DECUMULATOR = "EQUITY_DECUMULATOR"


class KnockInObservationType(str, Enum):
    EUROPEAN = "EUROPEAN"
    AMERICAN = "AMERICAN"


class UnderlyingAsset(BaseModel):
    symbol: str = Field(..., description="Ticker symbol (e.g. AAPL, NVDA, EUR/USD)")
    name: str = Field(..., description="Clean descriptive asset name")
    currency: str = Field(default="USD", description="ISO 4217 currency code")
    initial_fixing: float = Field(..., gt=0.0, description="Baseline spot fixing price at inception")
    simulated_price: Optional[float] = Field(default=None, ge=0.0, description="Active scenario price being evaluated")
    performance_pct: float = Field(default=0.0, description="(simulated_price - initial_fixing) / initial_fixing * 100")

    @model_validator(mode="before")
    @classmethod
    def populate_simulated_price(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if data.get("simulated_price") is None and data.get("initial_fixing") is not None:
                data["simulated_price"] = data["initial_fixing"]
        return data

    @model_validator(mode="after")
    def compute_perf_if_empty(self):
        if self.simulated_price is None:
            self.simulated_price = self.initial_fixing
        if self.initial_fixing > 0:
            self.performance_pct = ((self.simulated_price - self.initial_fixing) / self.initial_fixing) * 100.0
        return self


class BarrierObservation(BaseModel):
    period_index: int = Field(..., ge=1, description="1-based sequential period index")
    observation_date: str = Field(..., description="ISO 8601 date string (YYYY-MM-DD)")
    knock_out_barrier_pct: Optional[float] = Field(None, description="Hurdle for early redemption as % of initial spot")
    knock_in_barrier_pct: Optional[float] = Field(None, description="Downside barrier level as % of initial spot")
    coupon_barrier_pct: Optional[float] = Field(None, description="Hurdle required to receive periodic coupon")
    coupon_rate_pct: float = Field(default=0.0, description="Annualized or periodic coupon percentage rate")
    has_memory: bool = Field(default=False, description="True if unpaid coupons accrue and pay when barrier is subsequently met")
    knock_in_observation_type: KnockInObservationType = Field(
        default=KnockInObservationType.EUROPEAN,
        description="EUROPEAN (at maturity) or AMERICAN (continuous intra-period monitoring)"
    )


class DciSpecificParams(BaseModel):
    base_currency: str = Field(..., description="Base investment currency e.g. USD")
    alternate_currency: str = Field(..., description="Alternate linked currency e.g. EUR")
    strike_rate: float = Field(..., gt=0.0, description="Conversion strike FX rate")
    tenor_days: int = Field(default=30, ge=1, description="Tenor in days")


class TwinWinSpecificParams(BaseModel):
    downside_participation: float = Field(default=1.0, description="Participation in downside movement above knock-in")
    upside_participation: float = Field(default=1.0, description="Participation in upside movement")
    cap_pct: Optional[float] = Field(None, description="Maximum payoff cap percentage")


class AccumulatorSpecificParams(BaseModel):
    strike_price: float = Field(..., gt=0.0, description="Purchase or sale price per share")
    strike_pct: Optional[float] = Field(None, gt=0.0, description="Strike as percentage of initial fixing spot")
    knock_out_barrier_pct: float = Field(..., gt=0.0, description="Knock-out cancellation level as % of initial fixing")
    knock_out_observation_type: KnockInObservationType = Field(
        default=KnockInObservationType.EUROPEAN,
        description="EUROPEAN (daily close) or AMERICAN (continuous intraday touch)"
    )
    gearing_ratio: float = Field(default=2.0, ge=1.0, description="Multiplier when spot breaches strike (typically 2.0x)")
    daily_share_count: float = Field(..., gt=0.0, description="Base shares accumulated/decumulated per observation day")
    total_observation_days: int = Field(default=60, ge=1, description="Total scheduled observation trading days")
    guaranteed_days: int = Field(default=0, ge=0, description="Initial days protected from early cancellation")


class StructuredProductDefinition(BaseModel):
    product_id: str = Field(default_factory=lambda: f"prod-{uuid.uuid4().hex[:8]}", description="Ephemeral UUID identifying active in-memory session")
    archetype: ProductArchetype = Field(..., description="Product classification")
    title: Optional[str] = Field(default="Structured Product", description="Product descriptive title")
    denomination_currency: str = Field(default="USD", description="Main currency of notional investment")
    notional_amount: float = Field(default=100000.0, gt=0.0, description="Reference face value")
    issue_date: str = Field(default="2026-10-01", description="Inception fixing date (YYYY-MM-DD)")
    maturity_date: str = Field(default="2027-10-01", description="Final settlement date (YYYY-MM-DD)")
    underlyings: List[UnderlyingAsset] = Field(..., min_length=1, max_length=10, description="Linked assets")
    barrier_schedule: List[BarrierObservation] = Field(default_factory=list, description="Sequence of observation points")
    capital_protection_pct: float = Field(default=0.0, ge=0.0, description="Minimum guaranteed principal return")
    dci_parameters: Optional[DciSpecificParams] = Field(None, description="Extra parameters for DCI")
    twin_win_parameters: Optional[TwinWinSpecificParams] = Field(None, description="Extra parameters for Twin-Win")
    accumulator_parameters: Optional[AccumulatorSpecificParams] = Field(None, description="Extra parameters for Accumulator or Decumulator")

    @model_validator(mode="before")
    @classmethod
    def sanitize_dates_and_id(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("product_id"):
                data["product_id"] = f"prod-{uuid.uuid4().hex[:8]}"
            if not data.get("issue_date"):
                data["issue_date"] = "2026-10-01"
            if not data.get("maturity_date"):
                data["maturity_date"] = "2027-10-01"
        return data


class PayoffSimulationState(BaseModel):
    is_knocked_out: bool = Field(..., description="Whether early redemption was triggered")
    early_redemption_period: Optional[int] = Field(None, description="Period index where autocall occurred")
    is_knocked_in: bool = Field(..., description="Whether downside barrier was breached at or before maturity")
    worst_performing_asset: UnderlyingAsset = Field(..., description="Asset currently exhibiting lowest percentage performance")
    tied_worst_of_assets: List[UnderlyingAsset] = Field(default_factory=list, description="Assets sharing lowest performance when tied")
    worst_of_tie_broken_by: Optional[str] = Field(None, description="Deterministic tie-break method e.g. ALPHABETICAL_SYMBOL")
    total_coupons_earned_pct: float = Field(default=0.0, description="Cumulative coupon received across all observed periods")
    capital_repaid_pct: float = Field(..., description="Principal returned to investor at conclusion")
    net_total_return_pct: float = Field(..., description="capital_repaid_pct + total_coupons_earned_pct - 100.0")
    net_payout_amount: float = Field(..., description="Total currency cash flow returned on notional")
    dci_settlement_currency: Optional[str] = Field(None, description="Resulting payout currency for DCI structures")
    total_shares_transacted: Optional[float] = Field(None, description="Total shares accumulated or decumulated")
    gross_cash_amount: Optional[float] = Field(None, description="Gross cash paid (accumulator) or received (decumulator) at strike")
    average_execution_price: Optional[float] = Field(None, description="Average execution price per share")
    gearing_active: Optional[bool] = Field(None, description="True if 2x gearing was triggered")


class ScenarioNarratives(BaseModel):
    best_case: str = Field(..., description="Narrative of maximum upside")
    base_case: str = Field(..., description="Narrative of moderate market consolidation")
    worst_case: str = Field(..., description="Narrative of severe market downturn")


class TermsheetExtractionResponse(BaseModel):
    product: Optional[StructuredProductDefinition] = Field(None, description="Parsed financial model")
    field_provenance: Dict[str, str] = Field(default_factory=dict, description="Provenance indicator: FOUND, INFERRED, MISSING, CONFLICT, USER_SUPPLIED for each field")
    flagged_warnings: List[str] = Field(default_factory=list, description="Fields requiring user verification in drawer")
    is_rejected: bool = Field(default=False, description="True if document is encrypted or unrelated to structured products")
    rejection_reason: Optional[str] = Field(None, description="Error code e.g. ENCRYPTED_PDF, UNRECOGNIZED_STRUCTURE")
    rejection_guidance: Optional[str] = Field(None, description="Actionable explanation or list of supported archetypes")


class SimulationCalculationRequest(BaseModel):
    product: StructuredProductDefinition
    simulated_prices: Dict[str, float] = Field(..., description="Map of asset symbol to simulated current price")
    target_period: Optional[int] = Field(None, description="Optional observation period index being evaluated")


class NarrativeGenerationRequest(BaseModel):
    product: StructuredProductDefinition
