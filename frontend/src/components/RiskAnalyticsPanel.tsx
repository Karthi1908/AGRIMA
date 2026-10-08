import React, { useState, useEffect, useRef } from 'react';
import { StructuredProductDefinition } from '../types';
import { AnalyticsSkeleton } from './LoadingSkeletons';
import { SimulationResults } from './SimulationResults';
import { PrintLayout, SessionBranding, DEFAULT_DISCLAIMER } from './PrintLayout';

interface RiskAnalyticsPanelProps {
  product: StructuredProductDefinition;
  provenanceMap?: Record<string, string>;
}

interface Draft {
  volatility: string;
  riskFree: string;
  dividendYield: string;
  driftOverride: boolean;
  driftValue: string;
  pathCount: string;
  seed: string;
  method: 'simulated' | 'historical';
  correlation: string;
  persona: string;
}

const DEFAULT_DRAFT: Draft = {
  volatility: '0.25', riskFree: '0.05', dividendYield: '0', driftOverride: false, driftValue: '0.05',
  pathCount: '10000', seed: '42', method: 'simulated', correlation: '[[1.0, 0.5], [0.5, 1.0]]', persona: 'Neutral',
};

const MAX_PATHS = 100000;

interface AppliedAssumptions {
  volatility: number; drift: number; dividend_yield: number; path_count: number;
  seed: number; method: string; correlation: number[][] | null; persona: string;
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: '#fff', width: '100%',
};
const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' };

/** Validates a draft; returns an error message (no silent clamping, per spec edge cases) or the parsed assumptions. */
const parseDraft = (d: Draft, multi: boolean): { error: string; assumptions?: undefined } | { error?: undefined; assumptions: AppliedAssumptions } => {
  const volatility = parseFloat(d.volatility);
  const rf = parseFloat(d.riskFree);
  const q = parseFloat(d.dividendYield);
  const path_count = parseInt(d.pathCount, 10);
  const seed = parseInt(d.seed, 10);
  if (!(volatility > 0)) return { error: 'Volatility must be greater than zero.' };
  if (isNaN(rf) || isNaN(q)) return { error: 'Risk-free rate and dividend yield must be numbers.' };
  if (!(path_count > 0)) return { error: 'Path count must be a positive integer.' };
  if (path_count > MAX_PATHS) return { error: `Path count is capped at ${MAX_PATHS.toLocaleString()} to stay responsive.` };
  if (isNaN(seed)) return { error: 'Seed must be an integer.' };
  let drift = rf - q;
  if (d.driftOverride) {
    drift = parseFloat(d.driftValue);
    if (isNaN(drift)) return { error: 'Drift override must be a number.' };
  }
  let correlation: number[][] | null = null;
  if (multi) {
    if (d.correlation.trim() === '') return { error: 'Basket correlation matrix must be supplied.' };
    try {
      const parsedCorr = JSON.parse(d.correlation);
      if (!Array.isArray(parsedCorr) || !Array.isArray(parsedCorr[0])) throw new Error();
      correlation = parsedCorr;
    } catch (e) {
      return { error: 'Correlation must be a valid JSON matrix (e.g., [[1, 0.5], [0.5, 1]]).' };
    }
  }
  return {
    assumptions: {
      volatility, drift, dividend_yield: q, path_count, seed, method: d.method, correlation, persona: d.persona,
    },
  };
};

export const RiskAnalyticsPanel: React.FC<RiskAnalyticsPanelProps> = ({ product, provenanceMap = {} }) => {
  const multi = product.underlyings.length > 1;
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [applied, setApplied] = useState<AppliedAssumptions | null>(null);
  const [appliedKey, setAppliedKey] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [branding, setBranding] = useState<SessionBranding>(() => {
    try {
      const stored = sessionStorage.getItem('agrima_branding');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { firmName: '', accentColor: '#C85A32', logoDataUrl: null, disclaimer: DEFAULT_DISCLAIMER };
  });

  useEffect(() => {
    sessionStorage.setItem('agrima_branding', JSON.stringify(branding));
  }, [branding]);
  const reqId = useRef(0);

  const draftKey = JSON.stringify(draft);
  const stale = result !== null && draftKey !== appliedKey;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft(prev => ({ ...prev, [k]: v }));

  const run = (overrideDraft?: Draft) => {
    const d = overrideDraft || draft;
    const currentDraftKey = JSON.stringify(d);
    const parsed = parseDraft(d, multi);
    if ('error' in parsed && parsed.error) { setFormError(parsed.error); return; }
    setFormError(null);
    const assumptions = parsed.assumptions!;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, assumptions }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Simulation calculation failed on server.');
        return res.json();
      })
      .then(data => {
        if (id !== reqId.current) return;
        setResult(data);
        setApplied(assumptions);
        setAppliedKey(currentDraftKey);
        setLoading(false);
      })
      .catch(err => {
        if (id !== reqId.current) return;
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  // Initial run for all products (defaults are visible and editable above the results).
  useEffect(() => {
    let currentDraft = { ...draft };
    if (multi) {
      const n = product.underlyings.length;
      const corr = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((_, j) => (i === j ? 1.0 : 0.5)));
      currentDraft.correlation = JSON.stringify(corr);
      setDraft(currentDraft);
    }
    run(currentDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBranding(b => ({ ...b, logoDataUrl: String(reader.result) }));
    reader.readAsDataURL(file); // kept in component state only; never persisted
  };

  const exportPdf = async () => {
    if (stale) { setExportMsg('Assumptions changed since the last run. Re-run the simulation before exporting.'); return; }
    setExportMsg(null);
    try {
      const { generateRiskPDF } = await import('../utils/pdf_generator');
      await generateRiskPDF('print-layout');
    } catch (err) {
      console.error(err);
      setExportMsg('PDF generation failed in this browser. Try again or use the browser print function.');
    }
  };

  if (product.archetype === 'DCI') return null; // DCI has a separate analytics view
  return (
    <div id="risk-analytics-container">
      <div className="editorial-card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>Simulation Assumptions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          <label style={labelStyle}>Volatility (e.g. 0.25)
            <input id="assump-vol" style={inputStyle} value={draft.volatility} onChange={e => set('volatility', e.target.value)} /></label>
          <label style={labelStyle}>Risk-free rate
            <input id="assump-rf" style={inputStyle} value={draft.riskFree} onChange={e => set('riskFree', e.target.value)} /></label>
          <label style={labelStyle}>Dividend yield
            <input id="assump-div" style={inputStyle} value={draft.dividendYield} onChange={e => set('dividendYield', e.target.value)} /></label>
          <label style={labelStyle}>Path count
            <input id="assump-paths" style={inputStyle} value={draft.pathCount} onChange={e => set('pathCount', e.target.value)} /></label>
          <label style={labelStyle}>Seed
            <input id="assump-seed" style={inputStyle} value={draft.seed} onChange={e => set('seed', e.target.value)} /></label>
          <label style={labelStyle}>Method
            <select id="assump-method" style={inputStyle} value={draft.method} onChange={e => set('method', e.target.value as Draft['method'])}>
              <option value="simulated">Simulated (Monte Carlo)</option>
              <option value="historical" disabled>Historical replay (Coming soon)</option>
            </select></label>
          {multi && (
            <label style={labelStyle}>Basket correlation matrix
              <input id="assump-corr" style={inputStyle} placeholder="[[1, 0.5], [0.5, 1]]" value={draft.correlation} onChange={e => set('correlation', e.target.value)} /></label>
          )}
          <label style={labelStyle}>Client persona
            <select id="assump-persona" style={inputStyle} value={draft.persona} onChange={e => set('persona', e.target.value)}>
              <option value="Neutral">Neutral (Base Case)</option>
              <option value="Bullish">Bullish (+15% Drift)</option>
              <option value="Bearish">Bearish (-10% Drift)</option>
              <option value="High Volatility">High Volatility (45% Vol)</option>
              <option value="Conservative">Conservative (Low Vol)</option>
            </select></label>
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>Drift: <strong>{draft.driftOverride ? 'user override' : 'risk-free − dividend (default)'}</strong></span>
          <label><input id="assump-drift-toggle" type="checkbox" checked={draft.driftOverride} onChange={e => set('driftOverride', e.target.checked)} /> Override</label>
          {draft.driftOverride && (
            <input id="assump-drift" style={{ ...inputStyle, width: '100px' }} value={draft.driftValue} onChange={e => set('driftValue', e.target.value)} />
          )}
          <button id="run-simulation" className="btn-primary" onClick={run} disabled={loading}>
            {result ? 'Re-run Simulation' : 'Run Simulation'}
          </button>
          {stale && <span style={{ color: '#B45309' }}>Assumptions changed — results are stale.</span>}
        </div>
        {formError && <div role="alert" style={{ color: '#991B1B', marginTop: '8px', fontSize: '0.85rem' }}>{formError}</div>}
      </div>

      {loading && <AnalyticsSkeleton />}
      {error && !loading && (
        <div className="editorial-card" style={{ padding: '24px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', marginTop: '24px' }}>
          <strong>Simulation Error:</strong> {error}
        </div>
      )}

      {result && !loading && (
        <>
          <SimulationResults result={result} />

          <details className="editorial-card" style={{ padding: '16px', margin: '16px 0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Report branding (session only, never stored)</summary>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '12px' }}>
              <label style={labelStyle}>Firm name
                <input id="brand-firm" style={inputStyle} value={branding.firmName} onChange={e => setBranding(b => ({ ...b, firmName: e.target.value }))} /></label>
              <label style={labelStyle}>Accent colour
                <input id="brand-color" type="color" value={branding.accentColor} onChange={e => setBranding(b => ({ ...b, accentColor: e.target.value }))} /></label>
              <label style={labelStyle}>Logo
                <input id="brand-logo" type="file" accept="image/*" onChange={onLogo} /></label>
            </div>
            <label style={{ ...labelStyle, marginTop: '12px' }}>Disclaimer text
              <textarea id="brand-disclaimer" rows={4} style={inputStyle} value={branding.disclaimer} onChange={e => setBranding(b => ({ ...b, disclaimer: e.target.value }))} /></label>
          </details>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button id="export-pdf" className="btn-primary" onClick={exportPdf} disabled={stale}>Export Client PDF</button>
            {exportMsg && <span role="alert" style={{ color: '#991B1B', fontSize: '0.85rem' }}>{exportMsg}</span>}
          </div>

          {/* Off-screen print layout, snapshotted client-side only */}
          {applied && (
            <div style={{ position: 'fixed', left: '-10000px', top: 0 }} aria-hidden="true">
              <PrintLayout
                product={product}
                result={result}
                branding={branding}
                provenanceMap={provenanceMap}
                assumptions={{
                  volatility: applied.volatility, drift: applied.drift, dividend_yield: applied.dividend_yield,
                  path_count: applied.path_count, seed: applied.seed ?? 42, method: applied.method, correlation: applied.correlation,
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
