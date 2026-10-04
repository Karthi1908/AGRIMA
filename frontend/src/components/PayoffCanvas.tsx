import React, { useRef, useEffect } from 'react';
import { StructuredProductDefinition, PayoffSimulationState } from '../types';
import { ClientPayoffEngine } from '../engine/client_payoff_engine';

interface PayoffCanvasProps {
  product: StructuredProductDefinition;
  simulationState: PayoffSimulationState;
  simulatedPrices: Record<string, number>;
}

export const PayoffCanvas: React.FC<PayoffCanvasProps> = ({
  product,
  simulationState,
  simulatedPrices,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas with subtle warm background
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, width, height);

    // Padding & Plot Area
    const padding = { top: 48, right: 36, bottom: 56, left: 56 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Axis Range: Performance from -60% to +60%
    const minPerf = -60;
    const maxPerf = 60;
    const minReturn = -60;
    const maxReturn = 40;

    const getX = (perf: number) => padding.left + ((perf - minPerf) / (maxPerf - minPerf)) * plotWidth;
    const getY = (ret: number) => padding.top + plotHeight - ((ret - minReturn) / (maxReturn - minReturn)) * plotHeight;

    // 1. Draw Barrier Background Zones
    const schedule = product.barrier_schedule;
    const lastObs = schedule.length > 0 ? schedule[schedule.length - 1] : null;
    const kiBarrier = lastObs?.knock_in_barrier_pct ?? 70.0;
    const kiPerf = kiBarrier - 100.0; // e.g. -30%
    const autocallBarrier = schedule[0]?.knock_out_barrier_pct ?? 100.0;
    const autocallPerf = autocallBarrier - 100.0; // e.g. 0%

    // Terracotta Knock-in Loss Zone (below KI barrier)
    const kiX = Math.max(padding.left, getX(kiPerf));
    ctx.fillStyle = 'rgba(200, 90, 50, 0.08)';
    ctx.fillRect(padding.left, padding.top, kiX - padding.left, plotHeight);

    // Sage Autocall Zone (above Autocall barrier)
    if (product.archetype !== 'TWIN_WIN_NOTE') {
      const acX = Math.min(padding.left + plotWidth, getX(autocallPerf));
      ctx.fillStyle = 'rgba(39, 103, 73, 0.08)';
      ctx.fillRect(acX, padding.top, padding.left + plotWidth - acX, plotHeight);
    }

    // 2. Draw Gridlines & Axes
    ctx.strokeStyle = '#EBE5DC';
    ctx.lineWidth = 1;

    for (let ret = minReturn; ret <= maxReturn; ret += 20) {
      const y = getY(ret);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#736E65';
      ctx.font = '11px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`${ret > 0 ? '+' : ''}${ret}%`, padding.left - 10, y + 4);
    }

    for (let perf = minPerf; perf <= maxPerf; perf += 20) {
      const x = getX(perf);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + plotHeight);
      ctx.stroke();

      ctx.fillStyle = '#736E65';
      ctx.font = '11px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${perf > 0 ? '+' : ''}${perf}%`, x, padding.top + plotHeight + 18);
    }

    // Zero axis lines
    ctx.strokeStyle = '#C9BFB0';
    ctx.lineWidth = 1.5;
    const zeroY = getY(0);
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(padding.left + plotWidth, zeroY);
    ctx.stroke();

    const zeroX = getX(0);
    ctx.beginPath();
    ctx.moveTo(zeroX, padding.top);
    ctx.lineTo(zeroX, padding.top + plotHeight);
    ctx.stroke();

    // 3. Draw Barrier Boundary Lines & Labels
    // Knock-In Barrier Line (Terracotta)
    ctx.strokeStyle = '#C85A32';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(kiX, padding.top);
    ctx.lineTo(kiX, padding.top + plotHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#C85A32';
    ctx.font = '600 11px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.fillText(`Knock-In (${kiBarrier}%)`, kiX, padding.top - 10);

    // 4. Step-Up/Down Hurdle Progression
    const isStepStructure = product.archetype === 'STEP_DOWN_AUTOCALL_NOTE' || product.archetype === 'STEP_UP_AUTOCALL_NOTE';
    if (isStepStructure && schedule.length > 1) {
      schedule.forEach((obs) => {
        if (obs.knock_out_barrier_pct != null) {
          const stepPerf = obs.knock_out_barrier_pct - 100.0;
          const sX = getX(stepPerf);
          ctx.strokeStyle = 'rgba(39, 103, 73, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(sX, padding.top + 20);
          ctx.lineTo(sX, padding.top + plotHeight);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#276749';
          ctx.font = '600 10px Plus Jakarta Sans';
          ctx.textAlign = 'center';
          ctx.fillText(`P${obs.period_index}: ${obs.knock_out_barrier_pct}%`, sX, padding.top + 14);
        }
      });
    } else if (product.archetype !== 'TWIN_WIN_NOTE') {
      // Standard Autocall Line (Sage)
      const acX = Math.min(padding.left + plotWidth, getX(autocallPerf));
      ctx.strokeStyle = '#276749';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(acX, padding.top);
      ctx.lineTo(acX, padding.top + plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#276749';
      ctx.font = '600 11px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText(`Autocall (${autocallBarrier}%)`, acX, padding.top - 10);
    }

    // 5. Continuous 2D Payoff Curve
    ctx.beginPath();
    ctx.strokeStyle = product.archetype === 'TWIN_WIN_NOTE' ? '#7C3218' : '#1A1A1A';
    ctx.lineWidth = 2.75;

    const samplePoints = 240;
    const baseUnderlying = product.underlyings[0];
    const initialPrice = baseUnderlying?.initial_fixing || 100.0;

    for (let i = 0; i <= samplePoints; i++) {
      const pPerf = minPerf + (i / samplePoints) * (maxPerf - minPerf);
      const testPrice = initialPrice * (1 + pPerf / 100.0);

      const testPrices: Record<string, number> = {};
      for (const u of product.underlyings) {
        testPrices[u.symbol] = testPrice;
      }

      const simulatedPoint = ClientPayoffEngine.calculatePayoff(product, testPrices);
      const x = getX(pPerf);
      const y = getY(simulatedPoint.net_total_return_pct);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // 6. Draw Active Current Scenario Marker
    const worstPerf = simulationState.worst_performing_asset.performance_pct;
    const currentX = getX(Math.max(minPerf, Math.min(maxPerf, worstPerf)));
    const currentY = getY(Math.max(minReturn, Math.min(maxReturn, simulationState.net_total_return_pct)));

    // Outer glow with terracotta tint
    const glowGradient = ctx.createRadialGradient(currentX, currentY, 3, currentX, currentY, 16);
    glowGradient.addColorStop(0, 'rgba(200, 90, 50, 0.4)');
    glowGradient.addColorStop(1, 'rgba(200, 90, 50, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 16, 0, Math.PI * 2);
    ctx.fill();

    // Inner marker dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#C85A32';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Marker label box
    const labelText = `${worstPerf >= 0 ? '+' : ''}${worstPerf.toFixed(1)}% → ${simulationState.net_total_return_pct >= 0 ? '+' : ''}${simulationState.net_total_return_pct.toFixed(1)}%`;
    ctx.font = '600 11px JetBrains Mono';
    const textWidth = ctx.measureText(labelText).width;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#DED7CD';
    ctx.lineWidth = 1;
    const boxX = currentX - textWidth / 2 - 8;
    const boxY = currentY - 32;
    ctx.fillRect(boxX, boxY, textWidth + 16, 22);
    ctx.strokeRect(boxX, boxY, textWidth + 16, 22);

    ctx.fillStyle = simulationState.net_total_return_pct >= 0 ? '#276749' : '#C85A32';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, currentX, boxY + 15);

    // Axis titles
    ctx.fillStyle = '#736E65';
    ctx.font = '500 11px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.fillText('Underlying Asset Market Performance (%)', padding.left + plotWidth / 2, height - 14);

    ctx.save();
    ctx.translate(18, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Investor Net Total Return (%)', 0, 0);
    ctx.restore();

  }, [product, simulationState, simulatedPrices]);

  return (
    <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            2D Interactive Payoff Simulation
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {product.archetype === 'TWIN_WIN_NOTE'
              ? 'Twin-Win dual-slope participation: positive return on both upside and moderate drop'
              : product.archetype === 'STEP_DOWN_AUTOCALL_NOTE'
              ? 'Step-Down Autocall schedule: declining early redemption hurdles over time'
              : 'Real-time 60fps mathematical evaluation across barrier thresholds'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--status-sage-bg)', border: '1px solid var(--status-sage)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Autocall Zone</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--terracotta-light)', border: '1px solid var(--terracotta-primary)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Knock-In Zone</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '3px', background: 'var(--text-primary)', borderRadius: '2px' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Payoff Curve
            </span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '380px', position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    </div>
  );
};
