import numpy as np
from typing import Dict, List, Tuple
from backend.src.models.schemas import StructuredProductDefinition, ProductArchetype
from backend.src.models.analytics import SimulationAssumptions, SimulationResult, PathResult

class SimulationEngine:
    @staticmethod
    def simulate_paths(product: StructuredProductDefinition, assumptions: SimulationAssumptions) -> SimulationResult:
        np.random.seed(assumptions.seed)
        
        # Determine number of days
        if product.accumulator_parameters:
            days = product.accumulator_parameters.total_observation_days
        else:
            days = 252 # Default to 1 year if not specified
        
        dt = 1.0 / 252.0
        paths = assumptions.path_count
        num_assets = len(product.underlyings)
        
        S0 = np.array([u.initial_fixing for u in product.underlyings])
        
        mu = assumptions.drift
        sigma = assumptions.volatility
        if assumptions.persona:
            persona = assumptions.persona.lower()
            if persona == "bullish":
                mu = 0.15
                sigma = 0.20
            elif persona == "bearish":
                mu = -0.10
                sigma = 0.30
            elif persona == "high volatility":
                mu = 0.05
                sigma = 0.45
            elif persona == "conservative":
                mu = 0.03
                sigma = 0.15

        if num_assets > 1 and assumptions.correlation is not None:
            corr_matrix = np.array(assumptions.correlation)
            # Project to nearest positive semi-definite matrix if needed (FR-028)
            eigvals, eigvecs = np.linalg.eigh(corr_matrix)
            if np.any(eigvals < 0):
                eigvals = np.maximum(eigvals, 0)
                corr_matrix = eigvecs @ np.diag(eigvals) @ eigvecs.T
                # Re-normalize diagonal to 1
                d = np.sqrt(np.diag(corr_matrix))
                corr_matrix = (corr_matrix / d[:, None]) / d[None, :]
                
            # Add tiny jitter for numerical stability during Cholesky
            L = np.linalg.cholesky(corr_matrix + np.eye(num_assets) * 1e-8)
            Z = np.random.randn(paths, days, num_assets)
            correlated_Z = np.einsum('ij,pkj->pki', L, Z)
            log_returns = (mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * correlated_Z
        else:
            Z = np.random.randn(paths, days, num_assets)
            log_returns = (mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z
            
        cumulative_returns = np.cumsum(log_returns, axis=1)
        S_paths = S0 * np.exp(cumulative_returns)
        
        # Add day 0
        S0_reshaped = np.broadcast_to(S0, (paths, 1, num_assets))
        S_paths = np.concatenate([S0_reshaped, S_paths], axis=1)
        
        if product.archetype == ProductArchetype.EQUITY_ACCUMULATOR:
            return SimulationEngine._evaluate_accumulator(S_paths, product, assumptions)
        else:
            return SimulationEngine._evaluate_generic(S_paths, product, assumptions)

    @staticmethod
    def _evaluate_accumulator(S_paths: np.ndarray, product: StructuredProductDefinition, assumptions: SimulationAssumptions) -> SimulationResult:
        params = product.accumulator_parameters
        strike = params.strike_price
        ko_barrier = (params.knock_out_barrier_pct / 100.0) * product.underlyings[0].initial_fixing
        daily_shares = params.daily_share_count
        gearing = params.gearing_ratio
        paths, days_plus_one, num_assets = S_paths.shape
        days = days_plus_one - 1
        guaranteed_days = params.guaranteed_days

        S = S_paths[:, 1:, 0]
        
        knocked_out = S >= ko_barrier
        if guaranteed_days > 0:
            knocked_out[:, :guaranteed_days] = False
            
        ko_indices = np.argmax(knocked_out, axis=1)
        is_ko = knocked_out[np.arange(paths), ko_indices]
        
        active_days = np.where(is_ko, ko_indices + 1, days)
        
        total_shares = np.zeros(paths)
        total_cost = np.zeros(paths)
        
        for i in range(paths):
            d = active_days[i]
            path_S = S[i, :d]
            daily_shares_mult = np.where(path_S <= strike, gearing, 1.0)
            shares_acquired = daily_shares * daily_shares_mult
            cost_acquired = shares_acquired * strike
            total_shares[i] = np.sum(shares_acquired)
            total_cost[i] = np.sum(cost_acquired)
            
        final_prices = S[np.arange(paths), active_days - 1]
        final_value = total_shares * final_prices
        pnl = final_value - total_cost
        
        ko_prob = np.mean(is_ko)
        exp_shares = np.mean(total_shares)
        exp_pnl = np.mean(pnl)
        
        pnl_percentiles = np.percentile(pnl, [5, 25, 50, 75, 95], method='linear')
        shares_percentiles = np.percentile(total_shares, [5, 50, 95], method='linear')
        
        worst_5_loss = np.mean(pnl[pnl <= pnl_percentiles[0]]) if np.any(pnl <= pnl_percentiles[0]) else 0.0
        prob_loss = np.mean(pnl < 0)
        
        median_idx = np.argsort(pnl)[paths // 2]
        worst_idx = np.argmin(pnl)
        
        def get_path_result(idx):
            d = active_days[idx]
            path_S = S[idx, :d]
            daily_shares_mult = np.where(path_S <= strike, gearing, 1.0)
            shares_acquired = daily_shares * daily_shares_mult
            cost_acquired = shares_acquired * strike
            running_shares = np.cumsum(shares_acquired)
            running_cost = np.cumsum(cost_acquired)
            running_pnl = running_shares * path_S - running_cost
            return PathResult(
                day_by_day_accumulation=running_shares.tolist(),
                running_pnl=running_pnl.tolist(),
                knock_out_date=str(d) if is_ko[idx] else None
            )

        rep_paths = {
            "median": get_path_result(median_idx),
            "worst": get_path_result(worst_idx)
        }
        
        return SimulationResult(
            knock_out_probability=float(ko_prob),
            expected_shares=float(exp_shares),
            percentile_5_shares=float(shares_percentiles[0]),
            percentile_50_shares=float(shares_percentiles[1]),
            percentile_95_shares=float(shares_percentiles[2]),
            pnl_distribution=pnl_percentiles.tolist(),
            expected_pnl=float(exp_pnl),
            probability_of_loss=float(prob_loss),
            worst_5_percent_average_loss=float(worst_5_loss),
            method=assumptions.method,
            representative_paths=rep_paths
        )

    @staticmethod
    def _evaluate_generic(S_paths: np.ndarray, product: StructuredProductDefinition, assumptions: SimulationAssumptions) -> SimulationResult:
        return SimulationResult(
            knock_out_probability=0.0,
            expected_shares=0.0,
            percentile_5_shares=0.0,
            percentile_50_shares=0.0,
            percentile_95_shares=0.0,
            pnl_distribution=[0.0, 0.0, 0.0, 0.0, 0.0],
            expected_pnl=0.0,
            probability_of_loss=0.0,
            worst_5_percent_average_loss=0.0,
            method=assumptions.method,
            representative_paths={}
        )
