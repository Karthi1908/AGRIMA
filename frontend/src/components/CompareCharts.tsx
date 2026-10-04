import React from 'react';

interface CompareChartsProps {
  results: any[];
}

export const CompareCharts: React.FC<CompareChartsProps> = ({ results }) => {
  // We represent the distribution as a simple CSS-based normalized bar chart overlay.
  const dist1 = results[0].pnl_distribution; // [p5, p25, p50, p75, p95]
  const dist2 = results[1].pnl_distribution;

  const minVal = Math.min(dist1[0], dist2[0]);
  const maxVal = Math.max(dist1[4], dist2[4]);
  const range = maxVal - minVal || 1;

  const getLeftPct = (val: number) => ((val - minVal) / range) * 100;
  const getWidthPct = (low: number, high: number) => ((high - low) / range) * 100;

  return (
    <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>P&L Distribution Overlay (90% Confidence Interval)</h3>
      
      <div style={{ position: 'relative', height: '120px', marginBottom: '24px' }}>
        {/* Zero Line */}
        <div style={{ position: 'absolute', left: `${getLeftPct(0)}%`, top: 0, bottom: 0, width: '2px', background: 'var(--text-primary)', zIndex: 1 }} />
        <div style={{ position: 'absolute', left: `${getLeftPct(0)}%`, top: '-20px', fontSize: '0.75rem', transform: 'translateX(-50%)', fontWeight: 700 }}>$0</div>
        
        {/* Product 1 Bar */}
        <div style={{ position: 'absolute', top: '20px', left: `${getLeftPct(dist1[0])}%`, width: `${getWidthPct(dist1[0], dist1[4])}%`, height: '24px', background: 'rgba(200, 90, 50, 0.4)', borderRadius: '4px', border: '1px solid var(--terracotta-primary)' }} />
        {/* Product 1 Median Marker */}
        <div style={{ position: 'absolute', top: '16px', left: `${getLeftPct(dist1[2])}%`, width: '4px', height: '32px', background: 'var(--terracotta-primary)' }} />

        {/* Product 2 Bar */}
        <div style={{ position: 'absolute', top: '60px', left: `${getLeftPct(dist2[0])}%`, width: `${getWidthPct(dist2[0], dist2[4])}%`, height: '24px', background: 'rgba(50, 100, 200, 0.4)', borderRadius: '4px', border: '1px solid #2563EB' }} />
        {/* Product 2 Median Marker */}
        <div style={{ position: 'absolute', top: '56px', left: `${getLeftPct(dist2[2])}%`, width: '4px', height: '32px', background: '#2563EB' }} />
      </div>

      <div style={{ display: 'flex', gap: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: 'var(--terracotta-primary)' }} /> Base Product
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: '#2563EB' }} /> Compare Product
        </div>
        <div style={{ marginLeft: 'auto' }}>
          Bars represent 5th to 95th percentile P&L outcomes. Marker is the median (50th percentile).
        </div>
      </div>
    </div>
  );
};
