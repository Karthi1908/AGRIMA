import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface ManualEntryFallbackProps {
  rejectionReason: string;
  guidance: string;
  onRetry: () => void;
}

export const ManualEntryFallback: React.FC<ManualEntryFallbackProps> = ({ rejectionReason, guidance, onRetry }) => {
  return (
    <div className="editorial-card" style={{ padding: '32px', background: 'var(--bg-card)', maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
      <div style={{ width: '64px', height: '64px', background: 'var(--status-crimson-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <AlertCircle size={32} color="var(--status-crimson)" />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
        Extraction Failed: {rejectionReason}
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
        {guidance}
      </p>
      
      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '24px 0' }} />
      
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
        You can try uploading a clearer scan, or proceed to manually input the economic parameters to run the simulation.
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <button className="btn-secondary" onClick={onRetry}>
          <ArrowLeft size={16} />
          Try Another File
        </button>
        <button className="btn-primary" onClick={() => alert("Manual Entry Mode (Coming Soon)")}>
          Enter Details Manually
        </button>
      </div>
    </div>
  );
};
