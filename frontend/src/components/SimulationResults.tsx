import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { PathInspector } from './PathInspector';
import { ValuationPanel } from './ValuationPanel';
import { RiskPanel } from './RiskPanel';

interface SimulationResultsProps {
  result: any;
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({ result }) => {
  const [activePath, setActivePath] = useState<'median' | 'worst'>('median');

  const fmtMoney = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)', marginTop: '24px', borderTop: '3px solid var(--terracotta-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Activity size={20} color="var(--terracotta-primary)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Monte Carlo Risk Analytics
        </h3>
        <span className="badge badge-sage" style={{ marginLeft: 'auto' }}>
          10,000 Paths Simulated
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Knock-Out Probability</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#2563EB' }}>
            {(result.knock_out_probability * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Expected Shares (Mean)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {result.expected_shares.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Expected P&L (Mean)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: result.expected_pnl >= 0 ? 'var(--sage-primary)' : 'var(--terracotta-primary)' }}>
            {result.expected_pnl >= 0 ? '+' : ''}{fmtMoney(result.expected_pnl)}
          </div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>CVaR (Worst 5% Loss)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--terracotta-primary)' }}>
            {fmtMoney(result.worst_5_percent_average_loss)}
          </div>
        </div>
      </div>

      {result.valuation && (
        <ValuationPanel valuation={result.valuation} currency="USD" />
      )}

      {result.risk_profile && (
        <RiskPanel riskProfile={result.risk_profile} currency="USD" />
      )}

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Path Inspector</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={activePath === 'median' ? 'btn-primary' : 'btn-secondary'} 
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setActivePath('median')}
            >
              Median Path
            </button>
            <button 
              className={activePath === 'worst' ? 'btn-primary' : 'btn-secondary'} 
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setActivePath('worst')}
            >
              Worst Path (CVaR)
            </button>
          </div>
        </div>

        <PathInspector 
          pathResult={result.representative_paths[activePath]} 
          title={`Running P&L - ${activePath === 'median' ? 'Median Scenario' : 'Worst 5% Scenario'}`} 
        />
      </div>
    </div>
  );
};
