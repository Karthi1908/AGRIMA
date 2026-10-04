import React, { useState } from 'react';
import { Check, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { StructuredProductDefinition, TermsheetExtractionResponse } from '../types';
import { TermsheetDetails } from './TermsheetDetails';

interface VerificationDrawerProps {
  isOpen: boolean;
  extractionData: TermsheetExtractionResponse | null;
  onConfirm: (verifiedProduct: StructuredProductDefinition) => void;
  onClose: () => void;
}

export const VerificationDrawer: React.FC<VerificationDrawerProps> = ({
  isOpen,
  extractionData,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !extractionData || !extractionData.product) return null;

  const [product, setProduct] = useState<StructuredProductDefinition>(
    JSON.parse(JSON.stringify(extractionData.product))
  );
  
  const [confirmedFields, setConfirmedFields] = useState<Set<string>>(new Set());

  const provenance = extractionData.field_provenance || {};
  const warnings = extractionData.flagged_warnings || [];

  const unconfirmedCount = Object.keys(provenance).filter(k => 
    (['INFERRED', 'MISSING', 'CONFLICT'].includes(provenance[k])) && !confirmedFields.has(k)
  ).length;
  const handleConfirmField = (field: string) => {
    setConfirmedFields(prev => new Set([...prev, field]));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(26, 26, 26, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid var(--border-medium)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card-alt)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--status-sage)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Verify Economic Parameters
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Extracted from sanitized termsheet. Review parameters before simulation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Warnings Banner if any */}
        {warnings.length > 0 && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-amber-bg)',
              border: '1px solid var(--status-amber-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} style={{ color: 'var(--status-amber)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--status-amber)' }}>
                Parameters Requiring Attention
              </span>
            </div>
            {warnings.map((w, idx) => (
              <span key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '24px' }}>
                • {w}
              </span>
            ))}
          </div>
        )}

        {/* Form Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <TermsheetDetails 
             product={product} 
             setProduct={setProduct}
             provenance={provenance}
             confirmedFields={confirmedFields}
             onConfirmField={handleConfirmField}
          />
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '18px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '12px',
            background: 'var(--bg-card-alt)'
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 2, opacity: unconfirmedCount > 0 ? 0.5 : 1, cursor: unconfirmedCount > 0 ? 'not-allowed' : 'pointer' }}
            disabled={unconfirmedCount > 0}
            onClick={() => onConfirm(product)}
          >
            <Check size={17} />
            {unconfirmedCount > 0 ? `Confirm ${unconfirmedCount} more fields` : 'Confirm & Launch Simulation'}
          </button>
        </div>
      </div>
    </div>
  );
};
