import React, { useState, useEffect } from 'react';
import { StructuredProductDefinition } from '../types';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { CompareCharts } from '../components/CompareCharts';

interface CompareModeProps {
  baseProduct: StructuredProductDefinition;
  compareProduct: StructuredProductDefinition;
  onClose: () => void;
}

export const CompareMode: React.FC<CompareModeProps> = ({ baseProduct, compareProduct, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: [baseProduct, compareProduct],
        assumptions: {
          volatility: 0.25,
          drift: 0.05,
          dividend_yield: 0.0,
          path_count: 10000,
          seed: 42,
          method: 'simulated',
          persona: 'Neutral'
        }
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Comparison failed or underlying asset mismatch.");
      return res.json();
    })
    .then(data => {
      setResults(data.results);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [baseProduct, compareProduct]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <button className="btn-secondary" onClick={onClose} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Product
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <BarChart2 size={24} color="var(--terracotta-primary)" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Side-by-Side Comparison
        </h2>
      </div>

      {loading && <div style={{ padding: '40px', textAlign: 'center' }}>Running aligned Monte Carlo scenarios...</div>}
      {error && <div style={{ color: 'var(--status-crimson)', padding: '20px', background: 'var(--status-crimson-bg)' }}>{error}</div>}

      {results && results.length === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Base Product Stats */}
          <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>{baseProduct.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Expected P&L:</span>
                <span style={{ fontWeight: 700 }}>${results[0].expected_pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>CVaR (95% Worst):</span>
                <span style={{ fontWeight: 700, color: 'var(--status-crimson)' }}>${results[0].worst_5_percent_average_loss.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Prob of Loss:</span>
                <span style={{ fontWeight: 700 }}>{(results[0].probability_of_loss * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Compare Product Stats */}
          <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>{compareProduct.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Expected P&L:</span>
                <span style={{ fontWeight: 700 }}>${results[1].expected_pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>CVaR (95% Worst):</span>
                <span style={{ fontWeight: 700, color: 'var(--status-crimson)' }}>${results[1].worst_5_percent_average_loss.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Prob of Loss:</span>
                <span style={{ fontWeight: 700 }}>{(results[1].probability_of_loss * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div style={{ gridColumn: 'span 2' }}>
            <CompareCharts results={results} />
          </div>
        </div>
      )}
    </div>
  );
};
