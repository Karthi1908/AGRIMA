import React, { useRef, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Layers,
  ShieldAlert,
  Info,
  Sliders,
} from 'lucide-react';
import { StructuredProductDefinition } from '../types';
import { ClientPayoffEngine } from '../engine/client_payoff_engine';
import { RiskAnalyticsPanel } from './RiskAnalyticsPanel';

interface AccumulatorWorkspaceProps {
  product: StructuredProductDefinition;
  simulatedSpot: number;
  onSpotChange: (newSpot: number) => void;
}

export const AccumulatorWorkspace: React.FC<AccumulatorWorkspaceProps> = ({
  product,
  simulatedSpot,
  onSpotChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isAccumulator = product.archetype === 'EQUITY_ACCUMULATOR';
  const isDecumulator = product.archetype === 'EQUITY_DECUMULATOR';
  const acc = product.accumulator_parameters;
  const underlying = product.underlyings?.[0];

  if (!acc || !underlying) {
    return (
      <div className="editorial-card" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          No accumulator parameters or underlying asset found for this product.
        </p>
      </div>
    );
  }

  const s0 = underlying.initial_fixing;
  const strike = acc.strike_price;
  const koBarrierPct = acc.knock_out_barrier_pct;
  const koPrice = s0 * (koBarrierPct / 100.0);
  const gearing = acc.gearing_ratio > 0 ? acc.gearing_ratio : 2.0;
  const dailyShares = acc.daily_share_count;
  const totalDays = acc.total_observation_days;
  const guaranteedDays = acc.guaranteed_days || 0;
  const currency = product.denomination_currency || 'USD';

  // Calculate live state using ClientPayoffEngine
  const payoffState = ClientPayoffEngine.calculatePayoff(product, {
    [underlying.symbol]: simulatedSpot,
  });

  const isKo = payoffState.is_knocked_out;
  const isGearingActive = !!payoffState.gearing_active;
  const sharesTransacted = payoffState.total_shares_transacted || 0;
  const grossCash = payoffState.gross_cash_amount || 0;
  const marketVal = payoffState.net_payout_amount || 0;
  const pnl = payoffState.accumulator_pnl_amount ?? (isAccumulator ? marketVal - grossCash : grossCash - marketVal);
  const retPct = payoffState.net_total_return_pct;

  // Formatting helpers
  const fmtMoney = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val);

  const fmtPrice = (val: number) => `$${val.toFixed(2)}`;

  // Dynamic range for spot slider (from 60% of S0 to 140% of S0)
  const minSliderSpot = Math.floor(s0 * 0.6);
  const maxSliderSpot = Math.ceil(s0 * 1.4);

  // Status message and coloring
  let statusTitle = '';
  let statusBadgeClass = '';
  let statusDescription = '';

  if (isAccumulator) {
    if (isKo) {
      statusTitle = 'KNOCKED OUT (Early Termination)';
      statusBadgeClass = 'badge badge-slate';
      statusDescription = `Spot price ($${simulatedSpot.toFixed(2)}) is at or above the Knock-Out Barrier ($${koPrice.toFixed(2)}). Contract terminates immediately. Only guaranteed days (${guaranteedDays} days = ${(guaranteedDays * dailyShares).toLocaleString()} shares) are accumulated.`;
    } else if (isGearingActive) {
      statusTitle = '2x GEARING ACTIVE (Mandatory Double Purchase)';
      statusBadgeClass = 'badge badge-terracotta';
      statusDescription = `Spot price ($${simulatedSpot.toFixed(2)}) is below the Strike ($${strike.toFixed(2)}). 2x gearing is triggered: mandatory purchase of ${(dailyShares * gearing).toLocaleString()} shares/day at the fixed Strike price!`;
    } else {
      statusTitle = 'NORMAL ACCUMULATION (1x Discount Execution)';
      statusBadgeClass = 'badge badge-sage';
      statusDescription = `Spot price ($${simulatedSpot.toFixed(2)}) is between Strike ($${strike.toFixed(2)}) and KO Barrier ($${koPrice.toFixed(2)}). Accumulating ${dailyShares.toLocaleString()} shares/day at the discounted Strike price ($${strike.toFixed(2)}).`;
    }
  } else {
    // Decumulator
    if (isKo) {
      statusTitle = 'KNOCKED OUT (Downside Early Termination)';
      statusBadgeClass = 'badge badge-slate';
      statusDescription = `Spot price ($${simulatedSpot.toFixed(2)}) is at or below the Downside Knock-Out Barrier ($${koPrice.toFixed(2)}). Contract terminates early. Only guaranteed days (${guaranteedDays} days = ${(guaranteedDays * dailyShares).toLocaleString()} shares) are liquidated.`;
    } else if (isGearingActive) {
      statusTitle = '2x GEARING ACTIVE (Mandatory Double Share Delivery)';
      statusBadgeClass = 'badge badge-terracotta';
      statusDescription = `Spot price ($${simulatedSpot.toFixed(2)}) is above Strike ($${strike.toFixed(2)}). 2x gearing is triggered: mandatory sale/delivery of ${(dailyShares * gearing).toLocaleString()} shares/day at the capped Strike price!`;
    } else {
      statusTitle = 'PREMIUM LIQUIDATION (1x Sale)';
      statusBadgeClass = 'badge badge-sage';
      statusDescription = `Spot price ($${simulatedSpot.toFixed(2)}) is between Downside KO ($${koPrice.toFixed(2)}) and Strike ($${strike.toFixed(2)}). Liquidating ${dailyShares.toLocaleString()} shares/day at the premium Strike price ($${strike.toFixed(2)}).`;
    }
  }

  // Draw 2D Interactive Payoff Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Background
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 40, right: 36, bottom: 50, left: 70 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Spot Range on X-axis: 65% of S0 to 135% of S0
    const minPlotSpot = s0 * 0.65;
    const maxPlotSpot = s0 * 1.35;

    // P&L calculation for points across curve
    const steps = 150;
    const points: { spot: number; pnl: number; isKo: boolean }[] = [];
    let minPnl = 0;
    let maxPnl = 0;

    for (let i = 0; i <= steps; i++) {
      const sp = minPlotSpot + (i / steps) * (maxPlotSpot - minPlotSpot);
      let pnlVal = 0;
      let ko = false;

      if (isAccumulator) {
        if (sp >= koPrice) {
          ko = true;
          const sh = guaranteedDays * dailyShares;
          pnlVal = sh * (sp - strike);
        } else if (sp >= strike) {
          const sh = totalDays * dailyShares;
          pnlVal = sh * (sp - strike);
        } else {
          const sh = totalDays * dailyShares * gearing;
          pnlVal = sh * (sp - strike);
        }
      } else {
        // Decumulator
        if (sp <= koPrice) {
          ko = true;
          const sh = guaranteedDays * dailyShares;
          pnlVal = sh * (strike - sp);
        } else if (sp <= strike) {
          const sh = totalDays * dailyShares;
          pnlVal = sh * (strike - sp);
        } else {
          const sh = totalDays * dailyShares * gearing;
          pnlVal = sh * (strike - sp);
        }
      }

      points.push({ spot: sp, pnl: pnlVal, isKo: ko });
      if (pnlVal < minPnl) minPnl = pnlVal;
      if (pnlVal > maxPnl) maxPnl = pnlVal;
    }

    // Add 15% headroom to Y-axis
    const pnlRange = Math.max(Math.abs(minPnl), Math.abs(maxPnl)) * 1.25 || 100000;
    const yAxisMin = -pnlRange;
    const yAxisMax = pnlRange;

    const getX = (sp: number) =>
      padding.left + ((sp - minPlotSpot) / (maxPlotSpot - minPlotSpot)) * plotWidth;
    const getY = (pVal: number) =>
      padding.top + plotHeight - ((pVal - yAxisMin) / (yAxisMax - yAxisMin)) * plotHeight;

    // 1. Shaded Zones
    // Gearing Zone
    if (isAccumulator) {
      const strikeX = getX(strike);
      ctx.fillStyle = 'rgba(200, 90, 50, 0.08)'; // Terracotta for 2x downside
      ctx.fillRect(padding.left, padding.top, Math.max(0, strikeX - padding.left), plotHeight);

      // KO Zone
      const koX = getX(koPrice);
      ctx.fillStyle = 'rgba(100, 116, 139, 0.10)'; // Slate for KO
      ctx.fillRect(koX, padding.top, Math.max(0, padding.left + plotWidth - koX), plotHeight);
    } else {
      // Decumulator: KO on downside, Gearing on upside
      const koX = getX(koPrice);
      ctx.fillStyle = 'rgba(100, 116, 139, 0.10)'; // Slate for Downside KO
      ctx.fillRect(padding.left, padding.top, Math.max(0, koX - padding.left), plotHeight);

      const strikeX = getX(strike);
      ctx.fillStyle = 'rgba(200, 90, 50, 0.08)'; // Terracotta for 2x upside delivery
      ctx.fillRect(strikeX, padding.top, Math.max(0, padding.left + plotWidth - strikeX), plotHeight);
    }

    // 2. Grid lines & zero axis
    ctx.strokeStyle = '#EBE5DC';
    ctx.lineWidth = 1;

    // Horizontal 0-line
    const zeroY = getY(0);
    ctx.strokeStyle = '#736E65';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(padding.left + plotWidth, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Y-axis labels
    const ySteps = 4;
    for (let j = -ySteps; j <= ySteps; j++) {
      const val = (j / ySteps) * pnlRange;
      const y = getY(val);
      ctx.strokeStyle = '#F0EBE1';
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#736E65';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      const label = `${val >= 0 ? '+' : ''}$${(val / 1000).toFixed(0)}k`;
      ctx.fillText(label, padding.left - 8, y + 3);
    }

    // X-axis Strike line
    const strikeX = getX(strike);
    ctx.strokeStyle = '#C85A32';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(strikeX, padding.top);
    ctx.lineTo(strikeX, padding.top + plotHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#C85A32';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Strike: $${strike.toFixed(1)}`, strikeX, padding.top - 8);

    // X-axis Knock-Out Barrier line
    const koX = getX(koPrice);
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(koX, padding.top);
    ctx.lineTo(koX, padding.top + plotHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2563EB';
    ctx.fillText(`KO: $${koPrice.toFixed(1)} (${koBarrierPct}%)`, koX, padding.top - 8);

    // 3. Draw Payoff Curve
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1E293B';
    ctx.beginPath();

    let started = false;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = getX(pt.spot);
      const y = getY(pt.pnl);

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        // Detect step-off cliff at KO barrier
        const prev = points[i - 1];
        if (prev.isKo !== pt.isKo) {
          // Draw vertical drop/cliff
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();

    // 4. Current Simulated Spot Dot
    const curX = getX(simulatedSpot);
    const curY = getY(pnl);

    // Vertical line through current spot
    ctx.strokeStyle = isGearingActive ? '#C85A32' : isKo ? '#64748B' : '#276749';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(curX, padding.top);
    ctx.lineTo(curX, padding.top + plotHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outer glow dot
    ctx.fillStyle = isGearingActive
      ? 'rgba(200, 90, 50, 0.25)'
      : isKo
      ? 'rgba(100, 116, 139, 0.25)'
      : 'rgba(39, 103, 73, 0.25)';
    ctx.beginPath();
    ctx.arc(curX, curY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Solid inner dot
    ctx.fillStyle = isGearingActive ? '#C85A32' : isKo ? '#475569' : '#276749';
    ctx.beginPath();
    ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // X-axis Current Spot Label
    ctx.fillStyle = '#1A1815';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Spot: $${simulatedSpot.toFixed(2)}`, curX, padding.top + plotHeight + 18);
  }, [product, simulatedSpot, isAccumulator, isDecumulator, s0, strike, koPrice, gearing, dailyShares, totalDays, guaranteedDays, pnl, isGearingActive, isKo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner & Contract Identity */}
      <div
        className="editorial-card"
        style={{
          padding: '24px',
          borderLeft: `4px solid ${
            isGearingActive ? 'var(--terracotta-primary)' : isKo ? '#64748B' : 'var(--sage-primary)'
          }`,
          background: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className={`badge ${isAccumulator ? 'badge-terracotta' : 'badge-sage'}`} style={{ fontSize: '0.75rem' }}>
                {isAccumulator ? 'Equity Accumulator' : 'Equity Decumulator'}
              </span>
              <span className="badge badge-slate" style={{ fontSize: '0.75rem' }}>
                Single-Stock ({underlying.symbol})
              </span>
              <span className="badge badge-slate" style={{ fontSize: '0.75rem' }}>
                {acc.gearing_ratio}x Gearing
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0 6px' }}>
              {product.title || `${underlying.name} (${underlying.symbol}) ${isAccumulator ? 'Accumulator' : 'Decumulator'}`}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {isAccumulator
                ? `Systematic share accumulation at a ${Math.abs(100 - (acc.strike_pct ?? 85.0)).toFixed(1)}% discount with ${acc.knock_out_barrier_pct}% Knock-Out ceiling.`
                : `Systematic share liquidation at a ${Math.abs((acc.strike_pct ?? 115.0) - 100).toFixed(1)}% premium with ${acc.knock_out_barrier_pct}% Knock-Out floor.`}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Initial Fixing (S₀)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                {fmtPrice(s0)}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Strike Price</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--terracotta-primary)', fontFamily: 'JetBrains Mono' }}>
                {fmtPrice(strike)}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>KO Barrier</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#2563EB', fontFamily: 'JetBrains Mono' }}>
                {fmtPrice(koPrice)} ({koBarrierPct}%)
              </div>
            </div>
          </div>
        </div>

        {/* Status Callout Banner */}
        <div
          style={{
            marginTop: '20px',
            padding: '14px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: isGearingActive
              ? 'rgba(200, 90, 50, 0.08)'
              : isKo
              ? 'rgba(100, 116, 139, 0.08)'
              : 'rgba(39, 103, 73, 0.08)',
            border: `1px solid ${
              isGearingActive
                ? 'rgba(200, 90, 50, 0.25)'
                : isKo
                ? 'rgba(100, 116, 139, 0.25)'
                : 'rgba(39, 103, 73, 0.25)'
            }`,
          }}
        >
          {isGearingActive ? (
            <ShieldAlert size={20} color="var(--terracotta-primary)" style={{ flexShrink: 0 }} />
          ) : isKo ? (
            <AlertTriangle size={20} color="#64748B" style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={20} color="var(--sage-primary)" style={{ flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className={statusBadgeClass} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {statusTitle}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {statusDescription}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Spot Price Slider */}
      <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--terracotta-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Simulate Underlying Spot Price ({underlying.symbol})
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Simulated Spot:</span>
            <input
              type="number"
              step="0.5"
              value={simulatedSpot}
              onChange={(e) => onSpotChange(parseFloat(e.target.value) || 0)}
              style={{
                fontFamily: 'JetBrains Mono',
                fontWeight: 600,
                fontSize: '1rem',
                width: '100px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                textAlign: 'right',
              }}
            />
          </div>
        </div>

        <input
          type="range"
          min={minSliderSpot}
          max={maxSliderSpot}
          step="0.25"
          value={simulatedSpot}
          onChange={(e) => onSpotChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: isGearingActive ? 'var(--terracotta-primary)' : isKo ? '#64748B' : 'var(--sage-primary)',
            cursor: 'pointer',
            height: '8px',
          }}
        />

        {/* Quick Scenario Preset Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
            Quick Scenarios:
          </span>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            onClick={() => onSpotChange(s0 * 0.75)}
          >
            📉 Severe Downturn (-25%)
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            onClick={() => onSpotChange(strike)}
          >
            🎯 At Strike ({fmtPrice(strike)})
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            onClick={() => onSpotChange((strike + koPrice) / 2)}
          >
            ⚖️ Mid Accumulation Zone
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            onClick={() => onSpotChange(koPrice * (isAccumulator ? 0.99 : 1.01))}
          >
            ⚠️ Just Below KO Barrier
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            onClick={() => onSpotChange(koPrice * (isAccumulator ? 1.04 : 0.96))}
          >
            🚪 Knocked Out Early
          </button>
        </div>
      </div>

      {/* 3. Dual Display Settlement Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Card A: Physical Share Execution */}
        <div
          className="editorial-card"
          style={{
            padding: '22px',
            background: 'var(--bg-card)',
            borderTop: '3px solid var(--terracotta-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--terracotta-primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {isAccumulator ? 'Physical Share Accumulation' : 'Physical Share Delivery'}
              </h3>
            </div>
            <span
              className={`badge ${isGearingActive ? 'badge-terracotta' : 'badge-sage'}`}
              style={{ fontSize: '0.72rem' }}
            >
              {isGearingActive ? '2.0x Gearing' : '1.0x Standard'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isAccumulator ? 'Total Shares Acquired:' : 'Total Shares Delivered:'}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                {sharesTransacted.toLocaleString()} shares
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Execution Strike Price:</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                {fmtPrice(strike)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isAccumulator ? 'Gross Cash Required:' : 'Gross Cash Received:'}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--terracotta-primary)' }}>
                {fmtMoney(grossCash)}
              </span>
            </div>

            <div
              style={{
                marginTop: '8px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              {isKo ? (
                <span>Early termination at KO: contract only settled {guaranteedDays} guaranteed observation days.</span>
              ) : isGearingActive ? (
                <span style={{ color: 'var(--terracotta-primary)', fontWeight: 500 }}>
                  ⚠️ 2x gearing obliged doubling daily purchase to {(dailyShares * gearing).toLocaleString()} shares/day across {totalDays} days.
                </span>
              ) : (
                <span>Standard accumulation of {dailyShares.toLocaleString()} shares/day across {totalDays} days.</span>
              )}
            </div>
          </div>
        </div>

        {/* Card B: Mark-to-Market Financial P&L */}
        <div
          className="editorial-card"
          style={{
            padding: '22px',
            background: 'var(--bg-card)',
            borderTop: `3px solid ${pnl >= 0 ? 'var(--sage-primary)' : 'var(--terracotta-primary)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color={pnl >= 0 ? 'var(--sage-primary)' : 'var(--terracotta-primary)'} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Mark-to-Market Financial Valuation
              </h3>
            </div>
            <span
              className={`badge ${pnl >= 0 ? 'badge-sage' : 'badge-terracotta'}`}
              style={{ fontSize: '0.72rem' }}
            >
              {pnl >= 0 ? 'Net Gain' : 'Net Loss'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Simulated Market Value:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                {fmtMoney(marketVal)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Net Mark-to-Market P&L:</span>
              <span
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono',
                  color: pnl >= 0 ? 'var(--sage-primary)' : 'var(--terracotta-primary)',
                }}
              >
                {pnl >= 0 ? '+' : ''}{fmtMoney(pnl)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isAccumulator ? 'Return vs Strike (%):' : 'Advantage vs Market (%):'}
              </span>
              <span
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono',
                  color: retPct >= 0 ? 'var(--sage-primary)' : 'var(--terracotta-primary)',
                }}
              >
                {retPct >= 0 ? '+' : ''}{retPct.toFixed(2)}%
              </span>
            </div>

            <div
              style={{
                marginTop: '8px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              {isAccumulator ? (
                pnl >= 0 ? (
                  <span>
                    Accruing shares at ${strike.toFixed(2)} which currently trade at ${simulatedSpot.toFixed(2)} on the open market.
                  </span>
                ) : (
                  <span>
                    Unrealized deficit: paying ${strike.toFixed(2)} for shares that have fallen to ${simulatedSpot.toFixed(2)}.
                  </span>
                )
              ) : pnl >= 0 ? (
                <span>
                  Liquidated shares at premium strike ${strike.toFixed(2)}, outperforming open market spot of ${simulatedSpot.toFixed(2)}.
                </span>
              ) : (
                <span>
                  Opportunity loss: delivering shares at capped price ${strike.toFixed(2)} while market has risen to ${simulatedSpot.toFixed(2)}.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Payoff Curve Canvas */}
      <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Analytical Payoff Profile & Barrier Discontinuity
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Visualizing the 2x slope kink below Strike and the discontinuous cancellation cliff at the Knock-Out barrier.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: 'rgba(200, 90, 50, 0.4)', borderRadius: '2px' }} />
              2x Gearing Zone
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: 'rgba(100, 116, 139, 0.4)', borderRadius: '2px' }} />
              Knock-Out Zone
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '320px', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              borderRadius: '6px',
            }}
          />
        </div>
      </div>

      {/* 5. Contractual Parameters Breakdown */}
      <div className="editorial-card" style={{ padding: '22px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Info size={18} color="var(--terracotta-primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Contract Specifications & Barrier Mechanics
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Share Count</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
              {dailyShares.toLocaleString()} shares / day
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Observation Tenor</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
              {totalDays} business days (~{(totalDays / 21).toFixed(1)} months)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Guaranteed Accumulation</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
              {guaranteedDays > 0 ? `${guaranteedDays} days guaranteed` : 'None (immediate KO check)'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Knock-Out Type</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
              {acc.knock_out_observation_type || 'European (Daily Close)'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Share Commitment</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'JetBrains Mono', color: 'var(--terracotta-primary)' }}>
              {(totalDays * dailyShares * gearing).toLocaleString()} shares (under full 2x gearing)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Capital Commitment</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'JetBrains Mono', color: 'var(--terracotta-primary)' }}>
              {fmtMoney(totalDays * dailyShares * gearing * strike)}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Advanced Monte Carlo Risk Analytics (Server-Side Simulation) */}
      <RiskAnalyticsPanel product={product} />

    </div>
  );
};
