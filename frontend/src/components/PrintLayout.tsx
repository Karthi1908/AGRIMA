import React from 'react';
import { StructuredProductDefinition } from '../types';

export interface SessionBranding {
  firmName: string;
  accentColor: string;
  logoDataUrl: string | null;
  disclaimer: string;
}

export interface PrintAssumptions {
  volatility: number;
  drift: number;
  dividend_yield: number;
  path_count: number;
  seed: number;
  method: string;
  correlation?: number | null;
}

export const DEFAULT_DISCLAIMER =
  'This document is indicative, educational decision-support material. It is not investment advice, ' +
  'an executable quote, or an offer. Fair value figures are model estimates based on the stated assumptions ' +
  'and will differ from issuer pricing. Past or simulated performance is not a guarantee of future results. ' +
  'Default wording must be reviewed by compliance before real-world use.';

interface PrintLayoutProps {
  product: StructuredProductDefinition;
  result: any;
  assumptions: PrintAssumptions;
  branding: SessionBranding;
  /** Map of field name to provenance status (Found, Inferred, Missing, Conflict, User-Supplied). */
  provenanceMap?: Record<string, string>;
}

const pct = (v: number | undefined | null) => (v == null ? 'n/a' : `${(v * 100).toFixed(1)}%`);
const num = (v: number | undefined | null) =>
  v == null ? 'n/a' : v.toLocaleString(undefined, { maximumFractionDigits: 2 });

const sectionTitle = (accent: string): React.CSSProperties => ({
  fontSize: '13px', fontWeight: 700, color: accent, textTransform: 'uppercase',
  letterSpacing: '0.06em', margin: '18px 0 6px', borderBottom: `1px solid ${accent}`, paddingBottom: '3px',
});
const cell: React.CSSProperties = { padding: '4px 8px', fontSize: '12px', borderBottom: '1px solid #e5e5e5' };

/**
 * A4-proportioned (794px wide) printable layout. Rendered off-screen and snapshotted
 * client-side only; nothing here is persisted (Constitution Principle I, FR-027).
 */
export const PrintLayout: React.FC<PrintLayoutProps> = ({
  product, result, assumptions, branding, provenanceMap = {},
}) => {
  const accent = branding.accentColor;
  const rp = result?.risk_profile;
  const val = result?.valuation;
  const symbols = product.underlyings.map(u => u.symbol).join(', ');
  const drift = assumptions.drift;

  return (
    <div id="print-layout" style={{
      width: '794px', padding: '40px', background: '#fff', color: '#222',
      fontFamily: 'Inter, Arial, sans-serif', boxSizing: 'border-box',
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `3px solid ${accent}`, paddingBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: accent }}>{branding.firmName || 'Advisor Report'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Risk Analytics &amp; Scenario Summary</div>
        </div>
        {branding.logoDataUrl && <img src={branding.logoDataUrl} alt="Firm logo" style={{ maxHeight: '48px', maxWidth: '160px' }} />}
      </header>

      <div style={sectionTitle(accent)}>Product Terms</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
        <tr><td style={cell}>Product</td><td style={cell}>{product.title || product.archetype}</td></tr>
        <tr><td style={cell}>Underlying(s)</td><td style={cell}>{symbols}</td></tr>
        <tr><td style={cell}>Notional</td><td style={cell}>{num(product.notional_amount)} {product.denomination_currency}</td></tr>
        <tr><td style={cell}>Issue / Maturity</td><td style={cell}>{product.issue_date} → {product.maturity_date}</td></tr>
        {product.accumulator_parameters && (<>
          <tr><td style={cell}>Strike</td><td style={cell}>{num(product.accumulator_parameters.strike_price)}</td></tr>
          <tr><td style={cell}>Knock-out barrier</td><td style={cell}>{num(product.accumulator_parameters.knock_out_barrier_pct)}%</td></tr>
          <tr><td style={cell}>Gearing / daily shares</td><td style={cell}>{product.accumulator_parameters.gearing_ratio}x / {num(product.accumulator_parameters.daily_share_count)}</td></tr>
        </>)}
        <tr><td style={cell}>Provenance</td><td style={cell}>
          {Object.keys(provenanceMap).length 
            ? Object.entries(provenanceMap).map(([k, v]) => `${k} (${v})`).join(', ')
            : 'All fields user-verified'}
        </td></tr>
      </tbody></table>

      <div style={sectionTitle(accent)}>Assumptions (method: {assumptions.method})</div>
      <div style={{ fontSize: '12px' }}>
        Volatility {pct(assumptions.volatility)} · Drift {pct(drift)} · Dividend yield {pct(assumptions.dividend_yield)} ·
        Paths {assumptions.path_count.toLocaleString()} · Seed {assumptions.seed}
        {assumptions.correlation != null && <> · Correlation {assumptions.correlation.toFixed(2)} (assumption)</>}
      </div>

      <div style={sectionTitle(accent)}>Risk Distribution</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
        <tr><td style={cell}>Knock-out probability</td><td style={cell}>{pct(result?.knock_out_probability)}</td></tr>
        <tr><td style={cell}>Expected shares (5th / 50th / 95th)</td><td style={cell}>{num(result?.expected_shares)} ({num(result?.percentile_5_shares)} / {num(result?.percentile_50_shares)} / {num(result?.percentile_95_shares)})</td></tr>
        <tr><td style={cell}>Expected P&amp;L</td><td style={cell}>{num(result?.expected_pnl)}</td></tr>
        <tr><td style={cell}>Probability of loss</td><td style={cell}>{pct(result?.probability_of_loss)}</td></tr>
        <tr><td style={cell}>Average loss in worst 5% of paths</td><td style={cell}>{num(result?.worst_5_percent_average_loss)}</td></tr>
      </tbody></table>

      {val && (<>
        <div style={sectionTitle(accent)}>Fair Value &amp; Embedded Cost (indicative estimate, not a quote)</div>
        <div style={{ fontSize: '12px' }}>
          Fair value {num(val.fair_value)} (range {num(val.range_low)} – {num(val.range_high)}) ·
          Implied cost {num(val.implied_cost_currency)} ({num(val.implied_cost_percent)}%)
        </div>
      </>)}

      {rp && (<>
        <div style={sectionTitle(accent)}>Risk Lens &amp; Stress Tests</div>
        <div style={{ fontSize: '12px', marginBottom: '6px' }}>
          <strong>{rp.gain_loss_shape}</strong><br />
          Maximum loss: {rp.maximum_loss == null ? rp.unbounded_loss_statement : num(rp.maximum_loss)}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Scenario', 'Shares', 'Cash required', 'P&L', 'Margin call'].map(h =>
            <th key={h} style={{ ...cell, textAlign: 'left', fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>{Object.entries(rp.stress_tests || {}).map(([k, s]: [string, any]) => (
            <tr key={k}>
              <td style={cell}>{k.replace(/_/g, ' ')}</td><td style={cell}>{num(s.shares_transacted)}</td>
              <td style={cell}>{num(s.cash_required)}</td><td style={cell}>{num(s.pnl)}</td>
              <td style={cell}>{s.margin_call_triggered ? `Yes (${num(s.indicative_margin_size)})` : 'No'}</td>
            </tr>))}
          </tbody>
        </table>
      </>)}

      <div style={sectionTitle(accent)}>Disclaimer</div>
      <p style={{ fontSize: '10px', color: '#555', lineHeight: 1.4 }}>{branding.disclaimer || DEFAULT_DISCLAIMER}</p>

      <div style={sectionTitle(accent)}>Client Acknowledgement</div>
      <div style={{ display: 'flex', gap: '24px', marginTop: '28px', fontSize: '11px' }}>
        {['Client name', 'Date', 'Signature'].map(l => (
          <div key={l} style={{ flex: 1, borderTop: '1px solid #222', paddingTop: '4px' }}>{l}</div>
        ))}
      </div>
    </div>
  );
};
