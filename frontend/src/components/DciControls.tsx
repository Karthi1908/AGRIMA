import React from 'react';
import { ArrowRightLeft, TrendingUp, AlertTriangle } from 'lucide-react';
import { StructuredProductDefinition, PayoffSimulationState } from '../types';

interface DciControlsProps {
  product: StructuredProductDefinition;
  simulationState: PayoffSimulationState;
  simulatedSpot: number;
  onSpotChange: (newSpot: number) => void;
}

export const DciControls: React.FC<DciControlsProps> = ({
  product,
  simulationState,
  simulatedSpot,
  onSpotChange,
}) => {
  const dci = product.dci_parameters;
  if (!dci) return null;

  const strike = dci.strike_rate;
  const isConverted = simulatedSpot < strike;
  const couponPct = product.barrier_schedule[0]?.coupon_rate_pct || 0;

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowRightLeft size={18} style={{ color: '#06b6d4' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Dual Currency Investment (DCI) Controls
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Linked FX Pair: {dci.alternate_currency}/{dci.base_currency} | Strike: {strike.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Settlement Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Settlement:</span>
          {isConverted ? (
            <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} />
              Converted to {dci.alternate_currency}
            </span>
          ) : (
            <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} />
              Repaid in {dci.base_currency} + Yield
            </span>
          )}
        </div>
      </div>

      {/* Spot Slider Control */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
            Simulated Fixing Spot Rate ({dci.alternate_currency}/{dci.base_currency})
          </span>
          <span style={{ fontSize: '1.1rem', fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#38bdf8' }}>
            {simulatedSpot.toFixed(4)}
          </span>
        </div>

        <input
          type="range"
          min={strike * 0.85}
          max={strike * 1.15}
          step={0.0005}
          value={simulatedSpot}
          onChange={(e) => onSpotChange(parseFloat(e.target.value))}
          className="slider-control"
          style={{ width: '100%' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
          <span>{(strike * 0.85).toFixed(4)} (-15%)</span>
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>Strike: {strike.toFixed(4)}</span>
          <span>{(strike * 1.15).toFixed(4)} (+15%)</span>
        </div>
      </div>

      {/* Financial Payout Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Principal Notional</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px', fontFamily: 'JetBrains Mono' }}>
            {dci.base_currency} {product.notional_amount.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Yield Return (Tenor)</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '2px', fontFamily: 'JetBrains Mono' }}>
            +{couponPct.toFixed(2)}%
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: '10px', background: isConverted ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${isConverted ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}` }}>
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Total Payout at Maturity</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isConverted ? '#fbbf24' : '#34d399', marginTop: '2px', fontFamily: 'JetBrains Mono' }}>
            {simulationState.dci_settlement_currency} {simulationState.net_payout_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};
