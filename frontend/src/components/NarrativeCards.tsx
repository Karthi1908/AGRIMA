import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { StructuredProductDefinition, ScenarioNarratives } from '../types';

interface NarrativeCardsProps {
  product: StructuredProductDefinition;
}

export const NarrativeCards: React.FC<NarrativeCardsProps> = ({ product }) => {
  const [narratives, setNarratives] = useState<ScenarioNarratives | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNarratives(null);
    setError(null);
  }, [product.product_id]);

  const fetchNarratives = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/narrative/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate narratives (HTTP ${response.status})`);
      }

      const data: ScenarioNarratives = await response.json();
      setNarratives(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with narrative agent.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackNarratives = (): ScenarioNarratives => {
    if (product.archetype === 'EQUITY_ACCUMULATOR') {
      const acc = product.accumulator_parameters;
      const strike = acc?.strike_price ? `$${acc.strike_price.toFixed(2)}` : 'strike';
      const ko = acc?.knock_out_barrier_pct ? `${acc.knock_out_barrier_pct}%` : 'KO barrier';
      return {
        best_case: `Stock trades favorably between the discounted strike (${strike}) and the ${ko} Knock-Out barrier. You systematically accumulate shares daily at a discount without triggering early contract cancellation.`,
        base_case: `Stock touches or exceeds the ${ko} Knock-Out barrier early. The contract knocks out and terminates, locking in your accumulated discounted shares and returning uncommitted capital.`,
        worst_case: `Stock plummets below the ${strike} strike price. 2x gearing obligates you to purchase DOUBLE the daily share count at the higher strike price, resulting in heavy accumulation of devalued shares.`,
      };
    }
    if (product.archetype === 'EQUITY_DECUMULATOR') {
      const acc = product.accumulator_parameters;
      const strike = acc?.strike_price ? `$${acc.strike_price.toFixed(2)}` : 'strike';
      const ko = acc?.knock_out_barrier_pct ? `${acc.knock_out_barrier_pct}%` : 'KO barrier';
      return {
        best_case: `Stock stays above the ${ko} downside Knock-Out floor and below the premium strike (${strike}). You systematically liquidate concentrated shares at an attractive premium above market price.`,
        base_case: `Stock falls below the ${ko} downside Knock-Out barrier early in the tenor. Contract terminates, stopping further mandatory share liquidations and protecting your inventory.`,
        worst_case: `Stock rallies sharply above the ${strike} strike price. 2x gearing obligates you to deliver DOUBLE the daily shares at the capped strike price, missing out on open-market stock upside.`,
      };
    }
    if (product.archetype === 'DCI') {
      return {
        best_case: 'Exchange rate stays above the strike rate at maturity. You receive 100% principal back in your base currency plus the high yield coupon payout.',
        base_case: 'Exchange rate hovers near the strike rate and closes above it on final fixing. Full principal is returned in base currency with earned interest.',
        worst_case: 'Alternate currency weakens substantially below strike. Your principal is converted into the weaker currency at the agreed strike rate, incurring market loss.',
      };
    }
    return {
      best_case: 'Market performs favorably or remains above hurdles. Investor captures full periodic coupon yields with principal safely redeemed at 100% par value.',
      base_case: 'Market trades sideways with moderate consolidation. Downside barriers are not breached, coupon cash flows accrue as planned, protecting capital.',
      worst_case: 'Severe market decline triggers conversion or breaches the downside knock-in buffer. Principal return reflects linked asset performance at expiry.',
    };
  };

  const activeNarratives = narratives || getFallbackNarratives();

  return (
    <div className="editorial-card" style={{ padding: '26px', marginTop: '24px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--terracotta-border)',
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--terracotta-primary)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Plain-Language Client Scenario Narratives
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Brand-sanitized plain English explanations tailored for private wealth clients
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          onClick={fetchNarratives}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Synthesizing...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate AI Narratives
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-crimson-bg)',
            border: '1px solid var(--status-crimson-border)',
            color: 'var(--status-crimson)',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* 3 Scenario Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Best Case */}
        <div
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--status-sage-border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--status-sage-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={14} style={{ color: 'var(--status-sage)' }} />
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--status-sage)' }}>
              Best Case Scenario
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, flex: 1 }}>
            {activeNarratives.best_case}
          </p>
        </div>

        {/* Base Case */}
        <div
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={14} style={{ color: 'var(--text-primary)' }} />
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              Base Case Scenario
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, flex: 1 }}>
            {activeNarratives.base_case}
          </p>
        </div>

        {/* Worst Case */}
        <div
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--terracotta-border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--terracotta-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={14} style={{ color: 'var(--terracotta-primary)' }} />
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--terracotta-primary)' }}>
              Worst Case Scenario
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, flex: 1 }}>
            {activeNarratives.worst_case}
          </p>
        </div>
      </div>
    </div>
  );
};
