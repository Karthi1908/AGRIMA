import React from 'react';

interface ValuationPanelProps {
  valuation: {
    fair_value: number;
    implied_cost_currency: number;
    implied_cost_percent: number;
    range_low: number;
    range_high: number;
  };
  currency: string;
}

export const ValuationPanel: React.FC<ValuationPanelProps> = ({ valuation, currency }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);

  return (
    <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)', marginTop: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
        Fair Value & Embedded Cost
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-card-alt)', border: '1px solid var(--border-medium)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Estimated Fair Value</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCurrency(valuation.fair_value)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Range: {formatCurrency(valuation.range_low)} - {formatCurrency(valuation.range_high)}
          </div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-card-alt)', border: '1px solid var(--border-medium)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Implied Embedded Cost</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-amber)' }}>
            {formatCurrency(valuation.implied_cost_currency)}
          </div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-card-alt)', border: '1px solid var(--border-medium)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Cost as % of Max Capital</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-amber)' }}>
            {valuation.implied_cost_percent.toFixed(2)}%
          </div>
        </div>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px', fontStyle: 'italic' }}>
        * Fair value represents the risk-neutral expected discounted payoff of the product structure. Implied embedded cost represents the estimated structural margin retained by the issuer.
      </p>
    </div>
  );
};
