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
        paths, days_plus_one, num_assets = S_paths.shape
        days = days_plus_one - 1
        
        # We assume asset 0 is the worst-of for simplified path stats, or we use minimum path performance
        S0 = np.array([u.initial_fixing for u in product.underlyings])
        
        # Min performance path across all assets
        perf_paths = S_paths / S0[None, None, :]
        min_perf_paths = np.min(perf_paths, axis=2) # Shape: (paths, days_plus_one)
        S = min_perf_paths[:, 1:] * 100.0 # Normalized to 100 strike
        
        schedule = sorted(product.barrier_schedule, key=lambda b: b.period_index) if product.barrier_schedule else []
        final_obs = schedule[-1] if schedule else None
        
        ko_barrier = 105.0
        for obs in schedule:
            if obs.knock_out_barrier_pct is not None:
                ko_barrier = obs.knock_out_barrier_pct
                break
                
        ki_barrier = final_obs.knock_in_barrier_pct if (final_obs and final_obs.knock_in_barrier_pct is not None) else 70.0
        ki_type = final_obs.knock_in_observation_type if final_obs else "EUROPEAN"
        coupon_rate = sum(obs.coupon_rate_pct for obs in schedule) if schedule else 5.0
        
        # Determine discrete observation days (approx equidistant)
        num_periods = len(schedule) if schedule else 1
        obs_days = [int(days * (i + 1) / num_periods) - 1 for i in range(num_periods)]
        
        pnl = np.zeros(paths)
        shares_accumulated = np.zeros(paths)
        is_ko = np.zeros(paths, dtype=bool)
        ko_days = np.zeros(paths, dtype=int)
        
        for p in range(paths):
            # Check discrete knock-out
            knocked_out = False
            for i, obs_day in enumerate(obs_days):
                if S[p, obs_day] >= ko_barrier:
                    is_ko[p] = True
                    ko_days[p] = obs_day
                    # Prorated coupon based on periods survived + 1 for the KO period
                    pnl[p] = coupon_rate * ((i + 1) / num_periods)
                    knocked_out = True
                    break
            
            if not knocked_out:
                final_price = S[p, -1]
                if ki_type == "AMERICAN":
                    knocked_in = np.any(S[p] <= ki_barrier)
                else:
                    knocked_in = final_price <= ki_barrier
                
                # Check capital protection (if final price is below 100 and knocked in)
                cap_prot = product.capital_protection_pct if product.capital_protection_pct is not None else 0.0
                
                if knocked_in and final_price < 100.0:
                    loss_pct = (100.0 - final_price)
                    # Cannot lose more than 100 - cap_prot
                    loss_pct = min(loss_pct, 100.0 - cap_prot)
                    pnl[p] = coupon_rate - loss_pct
                    shares_accumulated[p] = 100.0 / 100.0
                else:
                    pnl[p] = coupon_rate
                    
        ko_prob = np.mean(is_ko)
                    
        exp_pnl = np.mean(pnl)
        prob_loss = np.mean(pnl < 0)
        pnl_percentiles = np.percentile(pnl, [5, 25, 50, 75, 95], method='linear')
        worst_5_loss = np.mean(pnl[pnl <= pnl_percentiles[0]]) if np.any(pnl <= pnl_percentiles[0]) else 0.0
        
        median_idx = np.argsort(pnl)[paths // 2]
        worst_idx = np.argmin(pnl)
        
        def get_path_result(idx):
            d = ko_days[idx] if is_ko[idx] else days
            running_pnl = np.zeros(d)
            if d > 0:
                running_pnl[-1] = pnl[idx]
            return PathResult(
                day_by_day_accumulation=np.zeros(d).tolist(),
                running_pnl=running_pnl.tolist(),
                knock_out_date=str(d) if is_ko[idx] else None
            )

        rep_paths = {
            "median": get_path_result(median_idx),
            "worst": get_path_result(worst_idx)
        }
        
        return SimulationResult(
            knock_out_probability=float(ko_prob),
            expected_shares=float(np.mean(shares_accumulated)),
            percentile_5_shares=0.0,
            percentile_50_shares=0.0,
            percentile_95_shares=0.0,
            pnl_distribution=pnl_percentiles.tolist(),
            expected_pnl=float(exp_pnl),
            probability_of_loss=float(prob_loss),
            worst_5_percent_average_loss=float(worst_5_loss),
            method=assumptions.method,
            representative_paths=rep_paths
        )
