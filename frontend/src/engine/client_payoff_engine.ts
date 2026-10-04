/**
 * Client-Side Zero-Latency Mathematical Scenario Engine.
 * Enables 60fps real-time reactive slider updates without network roundtrips.
 * Exactly matches backend PayoffCalculator mathematics for 100% consistency.
 */
import {
  StructuredProductDefinition,
  UnderlyingAsset,
  PayoffSimulationState,
} from '../types';

export class ClientPayoffEngine {
  public static calculatePayoff(
    product: StructuredProductDefinition,
    simulatedPrices: Record<string, number>,
    targetPeriod?: number | null
  ): PayoffSimulationState {
    // 1. Evaluate underlying assets with updated scenario prices
    const evaluatedUnderlyings: UnderlyingAsset[] = product.underlyings.map((u) => {
      const simPx = simulatedPrices[u.symbol] !== undefined ? simulatedPrices[u.symbol] : u.simulated_price;
      const initPx = u.initial_fixing > 0 ? u.initial_fixing : 1.0;
      const perfPct = ((simPx - initPx) / initPx) * 100.0;
      return {
        ...u,
        simulated_price: simPx,
        performance_pct: perfPct,
      };
    });

    // 2. Identify worst-performing asset and tie-break
    let minPerf = Infinity;
    for (const u of evaluatedUnderlyings) {
      if (u.performance_pct < minPerf) {
        minPerf = u.performance_pct;
      }
    }

    const tiedAssets = evaluatedUnderlyings.filter(
      (u) => Math.abs(u.performance_pct - minPerf) < 0.0001
    );

    let worstAsset: UnderlyingAsset;
    let tieBrokenBy: string | null = null;

    if (tiedAssets.length > 1) {
      // Alphabetical symbol tie-break
      worstAsset = [...tiedAssets].sort((a, b) => a.symbol.localeCompare(b.symbol))[0];
      tieBrokenBy = 'ALPHABETICAL_SYMBOL';
    } else {
      worstAsset = tiedAssets[0] || evaluatedUnderlyings[0];
    }

    // 3. Archetype specific calculations
    if (product.archetype === 'DCI' && product.dci_parameters) {
      return this.calculateDci(product, evaluatedUnderlyings[0]);
    }

    if (product.archetype === 'TWIN_WIN_NOTE') {
      return this.calculateTwinWin(product, worstAsset, tiedAssets, tieBrokenBy);
    }

    if (product.archetype === 'EQUITY_ACCUMULATOR' && product.accumulator_parameters) {
      return this.calculateAccumulator(product, evaluatedUnderlyings[0]);
    }

    if (product.archetype === 'EQUITY_DECUMULATOR' && product.accumulator_parameters) {
      return this.calculateDecumulator(product, evaluatedUnderlyings[0]);
    }

    return this.calculateAutocallFcn(
      product,
      evaluatedUnderlyings,
      worstAsset,
      tiedAssets,
      tieBrokenBy,
      targetPeriod
    );
  }

  private static calculateDci(
    product: StructuredProductDefinition,
    fxAsset: UnderlyingAsset
  ): PayoffSimulationState {
    const dci = product.dci_parameters!;
    const strike = dci.strike_rate;
    const spot = fxAsset.simulated_price;

    let couponPct = 0;
    if (product.barrier_schedule && product.barrier_schedule.length > 0) {
      couponPct = product.barrier_schedule[0].coupon_rate_pct;
    }

    const isConverted = spot < strike;

    let settlementCurr: string;
    let capitalRepaidPct: number;
    let netTotalReturnPct: number;
    let netPayout: number;

    if (!isConverted) {
      settlementCurr = dci.base_currency;
      capitalRepaidPct = 100.0;
      netTotalReturnPct = couponPct;
      netPayout = product.notional_amount * (1.0 + couponPct / 100.0);
    } else {
      settlementCurr = dci.alternate_currency;
      capitalRepaidPct = (spot / strike) * 100.0;
      netTotalReturnPct = capitalRepaidPct + couponPct - 100.0;
      netPayout = (product.notional_amount / strike) * (1.0 + couponPct / 100.0);
    }

    return {
      is_knocked_out: false,
      early_redemption_period: null,
      is_knocked_in: isConverted,
      worst_performing_asset: fxAsset,
      tied_worst_of_assets: [fxAsset],
      worst_of_tie_broken_by: null,
      total_coupons_earned_pct: couponPct,
      capital_repaid_pct: capitalRepaidPct,
      net_total_return_pct: netTotalReturnPct,
      net_payout_amount: netPayout,
      dci_settlement_currency: settlementCurr,
    };
  }

  private static calculateTwinWin(
    product: StructuredProductDefinition,
    worstAsset: UnderlyingAsset,
    tiedAssets: UnderlyingAsset[],
    tieBrokenBy: string | null
  ): PayoffSimulationState {
    const perf = worstAsset.performance_pct;
    const twin = product.twin_win_parameters;
    let kiBarrierPct = 75.0;

    if (product.barrier_schedule && product.barrier_schedule.length > 0) {
      const lastObs = product.barrier_schedule[product.barrier_schedule.length - 1];
      if (lastObs.knock_in_barrier_pct != null) {
        kiBarrierPct = lastObs.knock_in_barrier_pct;
      }
    }

    const spotLevel = 100.0 + perf;
    const isKnockedIn = spotLevel < kiBarrierPct;

    let capitalRepaidPct: number;
    if (!isKnockedIn) {
      const participation = perf < 0 ? (twin?.downside_participation ?? 1.0) : (twin?.upside_participation ?? 1.0);
      const rawGain = Math.abs(perf) * participation;
      const gain = twin?.cap_pct != null ? Math.min(rawGain, twin.cap_pct - 100.0) : rawGain;
      capitalRepaidPct = 100.0 + gain;
    } else {
      capitalRepaidPct = 100.0 + perf;
    }

    const netTotalReturnPct = capitalRepaidPct - 100.0;
    const netPayout = product.notional_amount * (capitalRepaidPct / 100.0);

    return {
      is_knocked_out: false,
      early_redemption_period: null,
      is_knocked_in: isKnockedIn,
      worst_performing_asset: worstAsset,
      tied_worst_of_assets: tiedAssets,
      worst_of_tie_broken_by: tieBrokenBy,
      total_coupons_earned_pct: 0.0,
      capital_repaid_pct: capitalRepaidPct,
      net_total_return_pct: netTotalReturnPct,
      net_payout_amount: netPayout,
      dci_settlement_currency: product.denomination_currency,
    };
  }

  private static calculateAutocallFcn(
    product: StructuredProductDefinition,
    _underlyings: UnderlyingAsset[],
    worstAsset: UnderlyingAsset,
    tiedAssets: UnderlyingAsset[],
    tieBrokenBy: string | null,
    targetPeriod?: number | null
  ): PayoffSimulationState {
    const schedule = [...product.barrier_schedule].sort((a, b) => a.period_index - b.period_index);
    const maxPeriod = targetPeriod || (schedule.length > 0 ? schedule.length : 1);

    let isKnockedOut = false;
    let earlyRedemptionPeriod: number | null = null;
    let totalCoupons = 0.0;
    let accruedMemoryCoupons = 0.0;

    for (const obs of schedule) {
      if (obs.period_index > maxPeriod) break;

      const spotLevel = 100.0 + worstAsset.performance_pct;

      // Check Coupon Barrier
      const couponBarrier = obs.coupon_barrier_pct || 0.0;
      if (spotLevel >= couponBarrier) {
        const earned = obs.coupon_rate_pct + (obs.has_memory ? accruedMemoryCoupons : 0.0);
        totalCoupons += earned;
        accruedMemoryCoupons = 0.0;
      } else if (obs.has_memory) {
        accruedMemoryCoupons += obs.coupon_rate_pct;
      }

      // Check Autocall (Knock-Out) Barrier
      if (obs.knock_out_barrier_pct != null && spotLevel >= obs.knock_out_barrier_pct) {
        isKnockedOut = true;
        earlyRedemptionPeriod = obs.period_index;
        break;
      }
    }

    // Knock-in assessment
    const lastObs = schedule.length > 0 ? schedule[schedule.length - 1] : null;
    const kiBarrierPct = lastObs?.knock_in_barrier_pct ?? 70.0;

    let isKnockedIn = false;
    if (!isKnockedOut) {
      const currentSpotPct = 100.0 + worstAsset.performance_pct;
      if (currentSpotPct < kiBarrierPct) {
        isKnockedIn = true;
      }
    }

    // Capital Repayment
    let capitalRepaidPct: number;
    if (isKnockedOut || !isKnockedIn) {
      capitalRepaidPct = 100.0;
    } else {
      const rawCapital = 100.0 + worstAsset.performance_pct;
      capitalRepaidPct = Math.max(product.capital_protection_pct, rawCapital);
    }

    const netTotalReturnPct = capitalRepaidPct + totalCoupons - 100.0;
    const netPayout = product.notional_amount * ((capitalRepaidPct + totalCoupons) / 100.0);

    return {
      is_knocked_out: isKnockedOut,
      early_redemption_period: earlyRedemptionPeriod,
      is_knocked_in: isKnockedIn,
      worst_performing_asset: worstAsset,
      tied_worst_of_assets: tiedAssets,
      worst_of_tie_broken_by: tieBrokenBy,
      total_coupons_earned_pct: totalCoupons,
      capital_repaid_pct: capitalRepaidPct,
      net_total_return_pct: netTotalReturnPct,
      net_payout_amount: netPayout,
      dci_settlement_currency: product.denomination_currency,
    };
  }

  private static calculateAccumulator(
    product: StructuredProductDefinition,
    asset: UnderlyingAsset
  ): PayoffSimulationState {
    const acc = product.accumulator_parameters!;
    const spot = asset.simulated_price;
    const s0 = asset.initial_fixing;
    const strike = acc.strike_price;
    const koBarrierPrice = s0 * (acc.knock_out_barrier_pct / 100.0);
    const gearing = acc.gearing_ratio > 0 ? acc.gearing_ratio : 2.0;
    const dailyShares = acc.daily_share_count;
    const totalDays = acc.total_observation_days;
    const guaranteedDays = acc.guaranteed_days || 0;

    const isKo = spot >= koBarrierPrice;
    let gearingActive = false;
    let shares = 0;

    if (isKo) {
      shares = guaranteedDays * dailyShares;
    } else {
      if (spot >= strike) {
        shares = totalDays * dailyShares;
        gearingActive = false;
      } else {
        shares = totalDays * (dailyShares * gearing);
        gearingActive = true;
      }
    }

    const grossCash = shares * strike;
    const marketVal = shares * spot;
    const pnl = marketVal - grossCash;
    const avgPx = strike;
    const retPct = strike > 0 ? ((spot - strike) / strike) * 100.0 : 0.0;
    const capitalRepaid = (shares > 0 || !isKo) ? 100.0 + retPct : 100.0;

    return {
      is_knocked_out: isKo,
      early_redemption_period: isKo ? 1 : null,
      is_knocked_in: gearingActive,
      worst_performing_asset: asset,
      tied_worst_of_assets: [asset],
      worst_of_tie_broken_by: null,
      total_coupons_earned_pct: 0.0,
      capital_repaid_pct: capitalRepaid,
      net_total_return_pct: retPct,
      net_payout_amount: marketVal,
      dci_settlement_currency: null,
      total_shares_transacted: shares,
      gross_cash_amount: grossCash,
      average_execution_price: avgPx,
      gearing_active: gearingActive,
      accumulator_pnl_amount: pnl,
    };
  }

  private static calculateDecumulator(
    product: StructuredProductDefinition,
    asset: UnderlyingAsset
  ): PayoffSimulationState {
    const dec = product.accumulator_parameters!;
    const spot = asset.simulated_price;
    const s0 = asset.initial_fixing;
    const strike = dec.strike_price;
    const koBarrierPrice = s0 * (dec.knock_out_barrier_pct / 100.0);
    const gearing = dec.gearing_ratio > 0 ? dec.gearing_ratio : 2.0;
    const dailyShares = dec.daily_share_count;
    const totalDays = dec.total_observation_days;
    const guaranteedDays = dec.guaranteed_days || 0;

    const isKo = spot <= koBarrierPrice;
    let gearingActive = false;
    let shares = 0;

    if (isKo) {
      shares = guaranteedDays * dailyShares;
    } else {
      if (spot <= strike) {
        shares = totalDays * dailyShares;
        gearingActive = false;
      } else {
        shares = totalDays * (dailyShares * gearing);
        gearingActive = true;
      }
    }

    const grossCash = shares * strike;
    const marketVal = shares * spot;
    const pnl = grossCash - marketVal;
    const avgPx = strike;
    const retPct = strike > 0 ? ((strike - spot) / strike) * 100.0 : 0.0;
    const capitalRepaid = (shares > 0 || !isKo) ? 100.0 + retPct : 100.0;

    return {
      is_knocked_out: isKo,
      early_redemption_period: isKo ? 1 : null,
      is_knocked_in: gearingActive,
      worst_performing_asset: asset,
      tied_worst_of_assets: [asset],
      worst_of_tie_broken_by: null,
      total_coupons_earned_pct: 0.0,
      capital_repaid_pct: capitalRepaid,
      net_total_return_pct: retPct,
      net_payout_amount: grossCash,
      dci_settlement_currency: null,
      total_shares_transacted: shares,
      gross_cash_amount: grossCash,
      average_execution_price: avgPx,
      gearing_active: gearingActive,
      accumulator_pnl_amount: pnl,
    };
  }
}

