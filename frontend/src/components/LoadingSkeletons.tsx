import React from 'react';

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)', marginTop: '24px' }}>
      <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--border-subtle)' }} />
          <div style={{ width: '200px', height: '20px', borderRadius: '4px', background: 'var(--border-subtle)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
           {[1,2,3,4].map(i => (
             <div key={i} style={{ height: '80px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}></div>
           ))}
        </div>
        <div style={{ height: '300px', width: '100%', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}></div>
      </div>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}
      </style>
    </div>
  );
};
