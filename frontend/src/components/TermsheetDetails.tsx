import React from 'react';
import { StructuredProductDefinition } from '../types';
import { ShieldCheck } from 'lucide-react';

interface TermsheetDetailsProps {
  product: StructuredProductDefinition;
  setProduct: (product: StructuredProductDefinition) => void;
  provenance: Record<string, string>;
  confirmedFields: Set<string>;
  onConfirmField: (field: string) => void;
}

export const TermsheetDetails: React.FC<TermsheetDetailsProps> = ({
  product,
  setProduct,
  provenance,
  confirmedFields,
  onConfirmField,
}) => {
  const getStatus = (field: string) => {
    return provenance[field] || 'FOUND';
  };

  const FieldWrapper: React.FC<{ field: string; label: string; children: React.ReactNode }> = ({ field, label, children }) => {
    const status = getStatus(field);
    const isConfirmed = confirmedFields.has(field);

    let borderColor = 'var(--border-medium)';
    let badge = null;

    if (status === 'MISSING') {
      borderColor = 'var(--status-crimson)';
      badge = <span className="badge badge-crimson" style={{ fontSize: '0.65rem' }}>Missing</span>;
    } else if (status === 'CONFLICT') {
      borderColor = 'var(--status-amber)';
      badge = <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Conflict</span>;
    } else if (status === 'INFERRED') {
      borderColor = 'var(--status-amber)';
      badge = <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Inferred</span>;
    } else if (status === 'USER_SUPPLIED') {
      badge = <span className="badge badge-sage" style={{ fontSize: '0.65rem' }}>User-Supplied</span>;
    } else {
       badge = <span className="badge badge-sage" style={{ fontSize: '0.65rem' }}>Found</span>;
    }

    return (
      <div style={{ marginBottom: '16px', padding: '12px', border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-md)', position: 'relative', background: 'var(--bg-card-alt)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {badge}
            {['MISSING', 'INFERRED', 'CONFLICT'].includes(status) && !isConfirmed && (
              <button 
                onClick={(e) => { e.preventDefault(); onConfirmField(field); }} 
                className="btn-primary" 
                style={{ padding: '2px 8px', fontSize: '0.7rem' }}
              >
                Confirm
              </button>
            )}
            {isConfirmed && <ShieldCheck size={16} color="var(--status-sage)" />}
          </div>
        </div>
        {children}
      </div>
    );
  };

  const handleUnderlyingChange = (index: number, field: string, value: any) => {
    const updated = [...product.underlyings];
    updated[index] = { ...updated[index], [field]: value };
    setProduct({ ...product, underlyings: updated });
    // Dynamically mark as USER_SUPPLIED when user edits
    if (provenance[`underlyings[${index}].${field}`] !== 'USER_SUPPLIED') {
      provenance[`underlyings[${index}].${field}`] = 'USER_SUPPLIED';
      onConfirmField(`underlyings[${index}].${field}`);
    }
  };

  const handleFieldChange = (field: keyof StructuredProductDefinition, value: any) => {
    setProduct({ ...product, [field]: value });
    if (provenance[field] !== 'USER_SUPPLIED') {
      provenance[field] = 'USER_SUPPLIED';
      onConfirmField(field as string);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <FieldWrapper field="archetype" label="Product Archetype">
        <select
          value={product.archetype}
          onChange={(e) => handleFieldChange('archetype', e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: '#FFFFFF' }}
        >
          <option value="DCI">Dual Currency Investment (DCI)</option>
          <option value="FCN_AUTOCALL_NOTE">Fixed Coupon Note (FCN)</option>
          <option value="STEP_DOWN_AUTOCALL_NOTE">Step-Down Autocall Note</option>
          <option value="EQUITY_ACCUMULATOR">Equity Accumulator</option>
          <option value="EQUITY_DECUMULATOR">Equity Decumulator</option>
          <option value="TWIN_WIN_NOTE">Twin-Win Certificate</option>
        </select>
      </FieldWrapper>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <FieldWrapper field="denomination_currency" label="Currency">
          <input
            type="text"
            value={product.denomination_currency}
            onChange={(e) => handleFieldChange('denomination_currency', e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: '#FFFFFF' }}
          />
        </FieldWrapper>
        <FieldWrapper field="notional_amount" label="Notional Amount">
          <input
            type="number"
            value={product.notional_amount}
            onChange={(e) => handleFieldChange('notional_amount', parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: '#FFFFFF', fontFamily: 'var(--font-mono)' }}
          />
        </FieldWrapper>
        <FieldWrapper field="capital_protection_pct" label="Capital Protection (%)">
          <input
            type="number"
            step="any"
            value={product.capital_protection_pct ?? 0}
            onChange={(e) => handleFieldChange('capital_protection_pct', parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: '#FFFFFF', fontFamily: 'var(--font-mono)' }}
          />
        </FieldWrapper>
      </div>

      <FieldWrapper field="underlyings" label="Underlying Asset(s)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {product.underlyings.map((u, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={u.symbol} onChange={(e) => handleUnderlyingChange(idx, 'symbol', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid var(--border-medium)', background: '#FFFFFF' }} placeholder="Symbol" />
              <input type="text" value={u.name} onChange={(e) => handleUnderlyingChange(idx, 'name', e.target.value)} style={{ flex: 2, padding: '8px', border: '1px solid var(--border-medium)', background: '#FFFFFF' }} placeholder="Name" />
              <input type="number" step="any" value={u.initial_fixing} onChange={(e) => handleUnderlyingChange(idx, 'initial_fixing', parseFloat(e.target.value) || 0)} style={{ flex: 1, padding: '8px', border: '1px solid var(--border-medium)', background: '#FFFFFF', fontFamily: 'var(--font-mono)' }} placeholder="Spot" />
            </div>
          ))}
        </div>
      </FieldWrapper>
    </div>
  );
};
