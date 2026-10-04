import React, { useState } from 'react';
import { 
  Calendar, 
  Percent, 
  DollarSign, 
  HelpCircle, 
  AlertCircle,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { StructuredProductDefinition } from '../types';

interface DciWorkspaceProps {
  product: StructuredProductDefinition;
  simulatedSpot: number;
  onSpotChange: (newSpot: number) => void;
}

export const DciWorkspace: React.FC<DciWorkspaceProps> = ({
  product,
  simulatedSpot,
  onSpotChange,
}) => {
  const dci = product.dci_parameters;
  const [dayCountBasis, setDayCountBasis] = useState<360 | 365>(360);

  if (!dci) {
    return (
      <div className="editorial-card" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No DCI parameters found for this product.</p>
      </div>
    );
  }

  const baseCurr = dci.base_currency || 'USD';
  const altCurr = dci.alternate_currency || 'EUR';
  const strikeRate = dci.strike_rate || 1.08;
  const tenorDays = dci.tenor_days || 45;
  const notional = product.notional_amount || 100000;

  // Extract raw coupon from barrier schedule
  const rawCoupon = product.barrier_schedule?.[0]?.coupon_rate_pct ?? 8.5;

  // Determine if raw coupon is annualized (typically > 3%) or already periodic
  const isAnnualizedQuoted = rawCoupon >= 3.0;
  
  const annualizedYieldPct = isAnnualizedQuoted 
    ? rawCoupon 
    : (rawCoupon * (dayCountBasis / tenorDays));

  // Precise mathematical period yield calculation:
  // Period Yield = Annualized Yield * (Tenor Days / Day Count Basis)
  const periodicYieldPct = isAnnualizedQuoted 
    ? (annualizedYieldPct * (tenorDays / dayCountBasis))
    : rawCoupon;

  // Exact interest cash flow
  const interestEarnedBase = notional * (periodicYieldPct / 100.0);
  const totalPayoutBaseNoConversion = notional + interestEarnedBase;

  // Converted payout in Alternate Currency
  // Investor receives Alternate Currency = (Notional / Strike) * (1 + periodicYield)
  const convertedPayoutAlt = (notional / strikeRate) * (1.0 + periodicYieldPct / 100.0);

  // Mark-to-market value in Base Currency if converted
  const convertedValueInBase = convertedPayoutAlt * simulatedSpot;
  const netTotalReturnPct = ((convertedValueInBase - notional) / notional) * 100.0;

  const isConverted = simulatedSpot < strikeRate;
  const pctFromStrike = ((simulatedSpot - strikeRate) / strikeRate) * 100.0;

  // Breakeven spot rate = Strike / (1 + periodicYield)
  const breakevenSpot = strikeRate / (1.0 + periodicYieldPct / 100.0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner & Termsheet Specs */}
      <div 
        className="editorial-card"
        style={{ 
          padding: '28px', 
          borderLeft: '4px solid var(--terracotta-primary)',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="badge badge-terracotta" style={{ fontSize: '0.75rem' }}>
                Dual Currency Investment (DCI)
              </span>
              <span className="badge badge-sage" style={{ fontSize: '0.75rem' }}>
                Non-Autocall / Fixed Tenor
              </span>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0 6px' }}>
              {product.title || `${altCurr}/${baseCurr} Dual Currency Investment`}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Short-term yield enhancement note linked to the foreign exchange rate of {altCurr} against {baseCurr}.
            </p>
          </div>

          {/* Settlement Status Pill */}
          <div 
            style={{ 
              padding: '12px 18px', 
              borderRadius: 'var(--radius-md)', 
              background: isConverted ? 'var(--status-amber-bg)' : 'var(--status-sage-bg)',
              border: `1px solid ${isConverted ? 'var(--status-amber-border)' : 'var(--status-sage-border)'}`,
              textAlign: 'right'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isConverted ? 'var(--status-amber)' : 'var(--status-sage)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Settlement Status at Expiry
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isConverted ? 'var(--status-amber)' : 'var(--status-sage)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              {isConverted ? (
                <>
                  <AlertCircle size={17} />
                  Converted to {altCurr}
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  Repaid in {baseCurr} + Yield
                </>
              )}
            </div>
          </div>
        </div>

        {/* Termsheet Key Parameters Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '14px', 
            marginTop: '24px', 
            paddingTop: '20px', 
            borderTop: '1px solid var(--border-subtle)' 
          }}
        >
          <div style={{ background: 'var(--bg-card-alt)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Principal Notional
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {baseCurr} {notional.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-alt)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Linked FX Pair
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {altCurr}/{baseCurr}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-alt)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Conversion Strike Rate
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--terracotta-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {strikeRate.toFixed(4)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-alt)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Investment Tenor
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {tenorDays} Days
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-alt)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Inception / Maturity Date
            </span>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '6px' }}>
              {product.issue_date || '2026-10-01'} → {product.maturity_date || '2026-11-15'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Accurate Yield Breakdown & Calculation Engine */}
      <div 
        className="editorial-card"
        style={{ padding: '28px', background: 'var(--bg-card)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Accurate Yield & Return Mathematics
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Complies with Money Market standards (Act/{dayCountBasis} Day Count Convention)
            </p>
          </div>

          {/* Day count toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card-alt)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '8px' }}>Day Basis:</span>
            <button
              type="button"
              onClick={() => setDayCountBasis(360)}
              style={{
                background: dayCountBasis === 360 ? 'var(--terracotta-primary)' : 'transparent',
                color: dayCountBasis === 360 ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Act/360
            </button>
            <button
              type="button"
              onClick={() => setDayCountBasis(365)}
              style={{
                background: dayCountBasis === 365 ? 'var(--terracotta-primary)' : 'transparent',
                color: dayCountBasis === 365 ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Act/365
            </button>
          </div>
        </div>

        {/* 3 Metric Cards for Yield Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Annualized Rate */}
          <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Percent size={16} style={{ color: 'var(--terracotta-primary)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Annualized Yield (p.a.)
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--terracotta-primary)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
              {annualizedYieldPct.toFixed(2)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Quoted headline annual coupon rate
            </div>
          </div>

          {/* Tenor Period Yield */}
          <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} style={{ color: 'var(--status-sage)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Effective Tenor Yield ({tenorDays}d)
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--status-sage)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
              +{periodicYieldPct.toFixed(4)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {annualizedYieldPct.toFixed(2)}% × ({tenorDays} / {dayCountBasis})
            </div>
          </div>

          {/* Guaranteed Interest Amount */}
          <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} style={{ color: 'var(--text-primary)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Interest Cash Flow Earned
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
              +{baseCurr} {interestEarnedBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Guaranteed cash yield regardless of spot
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Spot Simulation Slider */}
      <div className="editorial-card" style={{ padding: '28px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} style={{ color: 'var(--terracotta-primary)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Simulate Expiry Fixing Spot Rate ({altCurr}/{baseCurr})
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Drag slider to test different market exchange rates at the final fixing date.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--terracotta-primary)' }}>
              {simulatedSpot.toFixed(4)}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: pctFromStrike >= 0 ? 'var(--status-sage)' : 'var(--status-amber)' }}>
              {pctFromStrike >= 0 ? '+' : ''}{pctFromStrike.toFixed(2)}% vs Strike
            </div>
          </div>
        </div>

        {/* Range input */}
        <input
          type="range"
          min={strikeRate * 0.85}
          max={strikeRate * 1.15}
          step={0.0005}
          value={simulatedSpot}
          onChange={(e) => onSpotChange(parseFloat(e.target.value))}
          className="slider-control"
          style={{ width: '100%', margin: '14px 0' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>{(strikeRate * 0.85).toFixed(4)} (-15% Heavy Drop)</span>
          <span style={{ fontWeight: 600, color: 'var(--terracotta-primary)' }}>Strike: {strikeRate.toFixed(4)}</span>
          <span>{(strikeRate * 1.15).toFixed(4)} (+15% Appreciation)</span>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Presets:</span>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            onClick={() => onSpotChange(strikeRate * 0.95)}
          >
            -5% (Convert {altCurr})
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            onClick={() => onSpotChange(strikeRate * 0.98)}
          >
            -2% (Mild Convert)
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px', borderColor: 'var(--terracotta-primary)' }}
            onClick={() => onSpotChange(strikeRate)}
          >
            At Strike ({strikeRate.toFixed(4)})
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            onClick={() => onSpotChange(strikeRate * 1.02)}
          >
            +2% (Base Repaid)
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            onClick={() => onSpotChange(strikeRate * 1.05)}
          >
            +5% (Base Repaid)
          </button>
        </div>
      </div>

      {/* 4. Side-by-Side Settlement Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Scenario 1: No Conversion */}
        <div 
          className="editorial-card"
          style={{ 
            padding: '24px', 
            background: isConverted ? 'var(--bg-card-alt)' : '#FFFFFF',
            border: isConverted ? '1px solid var(--border-subtle)' : '2px solid var(--status-sage)',
            opacity: isConverted ? 0.75 : 1
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Scenario A: Spot ≥ Strike Rate
            </h4>
            {!isConverted && <span className="badge badge-sage">Active Outcome</span>}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            If {altCurr} finishes at or above {strikeRate.toFixed(4)}, you receive full principal in {baseCurr} plus the enhanced yield in {baseCurr}.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Principal Returned:</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{baseCurr} {notional.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Yield Interest ({periodicYieldPct.toFixed(2)}%):</span>
              <span style={{ fontWeight: 600, color: 'var(--status-sage)', fontFamily: 'var(--font-mono)' }}>+{baseCurr} {interestEarnedBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem', fontWeight: 700, borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '4px' }}>
              <span>Total Payout:</span>
              <span style={{ color: 'var(--status-sage)', fontFamily: 'var(--font-mono)' }}>
                {baseCurr} {totalPayoutBaseNoConversion.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Scenario 2: Conversion Triggered */}
        <div 
          className="editorial-card"
          style={{ 
            padding: '24px', 
            background: isConverted ? '#FFFFFF' : 'var(--bg-card-alt)',
            border: isConverted ? '2px solid var(--status-amber)' : '1px solid var(--border-subtle)',
            opacity: isConverted ? 1 : 0.75
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Scenario B: Spot &lt; Strike Rate
            </h4>
            {isConverted && <span className="badge badge-amber">Active Outcome</span>}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            If {altCurr} finishes below {strikeRate.toFixed(4)}, the notional and yield are converted to {altCurr} at the agreed Strike Rate.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Conversion Rate:</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>1 {altCurr} = {strikeRate.toFixed(4)} {baseCurr}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Settlement in {altCurr}:</span>
              <span style={{ fontWeight: 600, color: 'var(--status-amber)', fontFamily: 'var(--font-mono)' }}>
                {altCurr} {convertedPayoutAlt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem', fontWeight: 700, borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '4px' }}>
              <span>Value in {baseCurr} at spot:</span>
              <span style={{ color: netTotalReturnPct >= 0 ? 'var(--status-sage)' : 'var(--status-crimson)', fontFamily: 'var(--font-mono)' }}>
                {baseCurr} {convertedValueInBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({netTotalReturnPct >= 0 ? '+' : ''}{netTotalReturnPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Breakeven & Risk Analysis Note */}
      <div 
        style={{ 
          padding: '16px 20px', 
          background: 'var(--bg-card-alt)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle size={18} style={{ color: 'var(--terracotta-primary)' }} />
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Breakeven FX Rate Analysis:
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
              Because of the enhanced +{periodicYieldPct.toFixed(2)}% coupon, your principal value is protected against {altCurr} depreciation down to 
              <strong style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>{breakevenSpot.toFixed(4)}</strong>.
            </span>
          </div>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Breakeven = Strike / (1 + Yield)
        </div>
      </div>
    </div>
  );
};
