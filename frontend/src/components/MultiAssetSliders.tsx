import React from 'react';
import { Sliders, Award, Layers } from 'lucide-react';
import { StructuredProductDefinition, PayoffSimulationState } from '../types';

interface MultiAssetSlidersProps {
  product: StructuredProductDefinition;
  simulationState: PayoffSimulationState;
  simulatedPrices: Record<string, number>;
  onPriceChange: (symbol: string, price: number) => void;
  onResetAll: () => void;
}

export const MultiAssetSliders: React.FC<MultiAssetSlidersProps> = ({
  product,
  simulationState,
  simulatedPrices,
  onPriceChange,
  onResetAll,
}) => {
  const isTied = (simulationState.tied_worst_of_assets?.length || 0) > 1;

  return (
    <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'var(--terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--terracotta-border)',
            }}
          >
            <Sliders size={17} style={{ color: 'var(--terracotta-primary)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Multi-Asset Basket Controls
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Independent price sliders with real-time worst-of tracking
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isTied ? (
            <span className="badge badge-tied" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={12} />
              Tied Worst-Of ({simulationState.worst_of_tie_broken_by})
            </span>
          ) : (
            <span className="badge badge-crimson" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={12} />
              Worst-Of: {simulationState.worst_performing_asset.symbol}
            </span>
          )}

          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            onClick={onResetAll}
          >
            Reset Fixings
          </button>
        </div>
      </div>

      {/* Asset Cards & Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {product.underlyings.map((u) => {
          const currentPx = simulatedPrices[u.symbol] !== undefined ? simulatedPrices[u.symbol] : u.initial_fixing;
          const perf = ((currentPx - u.initial_fixing) / u.initial_fixing) * 100.0;
          const isWorst = simulationState.worst_performing_asset.symbol === u.symbol;
          const isPartOfTie = simulationState.tied_worst_of_assets?.some((a) => a.symbol === u.symbol) && isTied;

          return (
            <div
              key={u.symbol}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: isPartOfTie
                  ? '#FAF5FF'
                  : isWorst
                  ? 'var(--status-crimson-bg)'
                  : 'var(--bg-card-alt)',
                border: isPartOfTie
                  ? '1px solid #D8B4FE'
                  : isWorst
                  ? '1px solid var(--status-crimson-border)'
                  : '1px solid var(--border-subtle)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--terracotta-primary)' }}>{u.symbol}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.name}</span>
                  {isPartOfTie ? (
                    <span className="badge badge-tied" style={{ fontSize: '0.65rem' }}>
                      Tied Return
                    </span>
                  ) : isWorst ? (
                    <span className="badge badge-crimson" style={{ fontSize: '0.65rem' }}>
                      Active Worst-Of
                    </span>
                  ) : null}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                    ${currentPx.toFixed(2)}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: perf >= 0 ? 'var(--status-sage)' : 'var(--status-crimson)',
                    }}
                  >
                    ({perf >= 0 ? '+' : ''}{perf.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={u.initial_fixing * 0.3}
                max={u.initial_fixing * 1.7}
                step={u.initial_fixing * 0.005}
                value={currentPx}
                onChange={(e) => onPriceChange(u.symbol, parseFloat(e.target.value))}
                className="slider-control"
              />

              {/* Quick Scenario Snap Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Spot: ${u.initial_fixing.toFixed(2)}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    style={{
                      background: 'var(--status-crimson-bg)',
                      border: '1px solid var(--status-crimson-border)',
                      color: 'var(--status-crimson)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => onPriceChange(u.symbol, u.initial_fixing * 0.65)}
                  >
                    Knock-In (65%)
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'var(--status-amber-bg)',
                      border: '1px solid var(--status-amber-border)',
                      color: 'var(--status-amber)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => onPriceChange(u.symbol, u.initial_fixing * 0.8)}
                  >
                    Coupon (80%)
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'var(--status-sage-bg)',
                      border: '1px solid var(--status-sage-border)',
                      color: 'var(--status-sage)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => onPriceChange(u.symbol, u.initial_fixing * 1.0)}
                  >
                    Strike (100%)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
