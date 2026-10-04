/**
 * TypeScript types for AGRIMA Structured Product Explainer.
 * Exactly mirrors OpenAPI 3.0 contracts and backend Pydantic models.
 */

export type ProductArchetype =
  | 'DCI'
  | 'EQUITY_AUTOCALL_OPTION'
  | 'EQUITY_AUTOCALL_SWAP'
  | 'FCN_AUTOCALL_NOTE'
  | 'TWIN_WIN_NOTE'
  | 'STEP_UP_AUTOCALL_NOTE'
  | 'STEP_DOWN_AUTOCALL_NOTE'
  | 'EQUITY_ACCUMULATOR'
  | 'EQUITY_DECUMULATOR';

export type KnockInObservationType = 'EUROPEAN' | 'AMERICAN';

export interface UnderlyingAsset {
  symbol: string;
  name: string;
  currency: string;
  initial_fixing: number;
  simulated_price: number;
  performance_pct: number;
}

export interface BarrierObservation {
  period_index: number;
  observation_date: string;
  knock_out_barrier_pct?: number | null;
  knock_in_barrier_pct?: number | null;
  coupon_barrier_pct?: number | null;
  coupon_rate_pct: number;
  has_memory: boolean;
  knock_in_observation_type: KnockInObservationType;
}

export interface DciSpecificParams {
  base_currency: string;
  alternate_currency: string;
  strike_rate: number;
  tenor_days: number;
}

export interface TwinWinSpecificParams {
  downside_participation: number;
  upside_participation: number;
  cap_pct?: number | null;
}

export interface AccumulatorSpecificParams {
  strike_price: number;
  strike_pct?: number | null;
  knock_out_barrier_pct: number;
  knock_out_observation_type?: KnockInObservationType;
  gearing_ratio: number;
  daily_share_count: number;
  total_observation_days: number;
  guaranteed_days?: number;
}

export interface StructuredProductDefinition {
  product_id: string;
  archetype: ProductArchetype;
  title?: string;
  denomination_currency: string;
  notional_amount: number;
  issue_date: string;
  maturity_date: string;
  underlyings: UnderlyingAsset[];
  barrier_schedule: BarrierObservation[];
  capital_protection_pct: number;
  dci_parameters?: DciSpecificParams | null;
  twin_win_parameters?: TwinWinSpecificParams | null;
  accumulator_parameters?: AccumulatorSpecificParams | null;
}

export interface PayoffSimulationState {
  is_knocked_out: boolean;
  early_redemption_period?: number | null;
  is_knocked_in: boolean;
  worst_performing_asset: UnderlyingAsset;
  tied_worst_of_assets?: UnderlyingAsset[];
  worst_of_tie_broken_by?: string | null;
  total_coupons_earned_pct: number;
  capital_repaid_pct: number;
  net_total_return_pct: number;
  net_payout_amount: number;
  dci_settlement_currency?: string | null;
  total_shares_transacted?: number | null;
  gross_cash_amount?: number | null;
  average_execution_price?: number | null;
  gearing_active?: boolean | null;
  accumulator_pnl_amount?: number | null;
}

export interface ScenarioNarratives {
  best_case: string;
  base_case: string;
  worst_case: string;
}

export interface TermsheetExtractionResponse {
  product?: StructuredProductDefinition | null;
  field_provenance: Record<string, 'FOUND' | 'INFERRED' | 'MISSING' | 'CONFLICT' | 'USER_SUPPLIED'>;
  flagged_warnings: string[];
  is_rejected: boolean;
  rejection_reason?: string | null;
  rejection_guidance?: string | null;
}

export interface SimulationCalculationRequest {
  product: StructuredProductDefinition;
  simulated_prices: Record<string, number>;
  target_period?: number | null;
}

export interface NarrativeGenerationRequest {
  product: StructuredProductDefinition;
}
