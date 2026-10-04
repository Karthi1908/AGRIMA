import React from 'react';
import { AlertOctagon, TrendingDown, Info } from 'lucide-react';

interface StressOutcome {
  shares_transacted: number;
  cash_required: number;
  pnl: number;
  margin_call_triggered: boolean;
  indicative_margin_size: number;
}

interface RiskProfile {
  maximum_loss: number | null;
  unbounded_loss_statement: string;
  gain_loss_shape: string;
  stress_tests: Record<string, StressOutcome>;
}

interface RiskPanelProps {
  riskProfile: RiskProfile;
  currency: string;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({ riskProfile, currency }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);

  const getScenarioLabel = (key: string) => {
    switch (key) {
      case '2008_crash': return '2008 Financial Crisis (-40%)';
      case '2020_covid': return '2020 COVID Crash (-30%)';
      case 'single_stock_gap': return 'Single Stock Gap Down (-25%)';
      default: return key;
    }
  };

  return (
    <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)', marginTop: '24px', borderTop: '3px solid var(--status-crimson)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <AlertOctagon size={20} color="var(--status-crimson)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Explicit Risk Lens & Stress Tests
        </h3>
      </div>

      <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--status-crimson-bg)', borderRadius: '8px', border: '1px solid var(--status-crimson-border)' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--status-crimson)', fontWeight: 700, marginBottom: '8px' }}>
          Maximum Loss Profile
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 500 }}>
          {riskProfile.unbounded_loss_statement}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong>Payoff Shape:</strong> {riskProfile.gain_loss_shape}
        </p>
      </div>

      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>Historical Stress Scenarios</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {Object.entries(riskProfile.stress_tests).map(([key, outcome]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-card-alt)', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--status-crimson-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={20} color="var(--status-crimson)" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {getScenarioLabel(key)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Notional Exposure: {formatCurrency(outcome.cash_required)}
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--status-crimson)' }}>
                {formatCurrency(outcome.pnl)}
              </div>
              {outcome.margin_call_triggered && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', color: 'var(--status-amber)', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>
                  <Info size={12} />
                  Margin Call: {formatCurrency(outcome.indicative_margin_size)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
