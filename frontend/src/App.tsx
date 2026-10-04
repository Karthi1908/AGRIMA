import React, { useState, useEffect } from 'react';
import { ShieldCheck, BarChart3, Sparkles, RefreshCw } from 'lucide-react';
import { StructuredProductDefinition, TermsheetExtractionResponse, PayoffSimulationState } from './types';
import { ClientPayoffEngine } from './engine/client_payoff_engine';
import { UploadZone } from './components/UploadZone';
import { VerificationDrawer } from './components/VerificationDrawer';
import { PayoffCanvas } from './components/PayoffCanvas';
import { DciWorkspace } from './components/DciWorkspace';
import { AccumulatorWorkspace } from './components/AccumulatorWorkspace';
import { MultiAssetSliders } from './components/MultiAssetSliders';
import { NarrativeCards } from './components/NarrativeCards';
import { CompareMode } from './pages/CompareMode';
import './styles/theme.css';

// Seed demo products for instant exploratory simulation
const DEMO_PRODUCTS: Record<string, StructuredProductDefinition> = {
  FCN: {
    product_id: 'demo-fcn-01',
    archetype: 'FCN_AUTOCALL_NOTE',
    title: '3-Stock Worst-Of Fixed Coupon Note',
    denomination_currency: 'USD',
    notional_amount: 100000.0,
    issue_date: '2026-10-01',
    maturity_date: '2027-10-01',
    underlyings: [
      { symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD', initial_fixing: 225.0, simulated_price: 225.0, performance_pct: 0.0 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', currency: 'USD', initial_fixing: 430.0, simulated_price: 430.0, performance_pct: 0.0 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', currency: 'USD', initial_fixing: 120.0, simulated_price: 120.0, performance_pct: 0.0 },
    ],
    barrier_schedule: [
      { period_index: 1, observation_date: '2026-11-01', knock_out_barrier_pct: 100.0, knock_in_barrier_pct: 70.0, coupon_barrier_pct: 80.0, coupon_rate_pct: 1.0, has_memory: true, knock_in_observation_type: 'EUROPEAN' },
      { period_index: 2, observation_date: '2026-12-01', knock_out_barrier_pct: 100.0, knock_in_barrier_pct: 70.0, coupon_barrier_pct: 80.0, coupon_rate_pct: 1.0, has_memory: true, knock_in_observation_type: 'EUROPEAN' },
      { period_index: 3, observation_date: '2027-01-01', knock_out_barrier_pct: 100.0, knock_in_barrier_pct: 70.0, coupon_barrier_pct: 80.0, coupon_rate_pct: 1.0, has_memory: true, knock_in_observation_type: 'EUROPEAN' },
    ],
    capital_protection_pct: 0.0,
  },
  DCI: {
    product_id: 'demo-dci-01',
    archetype: 'DCI',
    title: 'USD/EUR Dual Currency Investment',
    denomination_currency: 'USD',
    notional_amount: 100000.0,
    issue_date: '2026-10-01',
    maturity_date: '2026-11-15',
    underlyings: [
      { symbol: 'EUR/USD', name: 'EUR/USD FX Rate', currency: 'USD', initial_fixing: 1.0950, simulated_price: 1.0800, performance_pct: 0.0 },
    ],
    barrier_schedule: [
      { period_index: 1, observation_date: '2026-11-15', knock_in_barrier_pct: 100.0, coupon_rate_pct: 8.5, has_memory: false, knock_in_observation_type: 'EUROPEAN' },
    ],
    capital_protection_pct: 0.0,
    dci_parameters: {
      base_currency: 'USD',
      alternate_currency: 'EUR',
      strike_rate: 1.0800,
      tenor_days: 45,
    },
  },
  STEP_DOWN: {
    product_id: 'demo-stepdown-01',
    archetype: 'STEP_DOWN_AUTOCALL_NOTE',
    title: 'TSLA Step-Down Autocall Note',
    denomination_currency: 'USD',
    notional_amount: 250000.0,
    issue_date: '2026-10-01',
    maturity_date: '2027-10-01',
    underlyings: [
      { symbol: 'TSLA', name: 'Tesla Inc.', currency: 'USD', initial_fixing: 240.0, simulated_price: 240.0, performance_pct: 0.0 },
    ],
    barrier_schedule: [
      { period_index: 1, observation_date: '2027-01-01', knock_out_barrier_pct: 100.0, coupon_barrier_pct: 80.0, coupon_rate_pct: 2.625, has_memory: true, knock_in_observation_type: 'EUROPEAN' },
      { period_index: 2, observation_date: '2027-04-01', knock_out_barrier_pct: 95.0, coupon_barrier_pct: 80.0, coupon_rate_pct: 2.625, has_memory: true, knock_in_observation_type: 'EUROPEAN' },
      { period_index: 3, observation_date: '2027-07-01', knock_out_barrier_pct: 90.0, coupon_barrier_pct: 80.0, coupon_rate_pct: 2.625, has_memory: true, knock_in_observation_type: 'EUROPEAN' },
      { period_index: 4, observation_date: '2027-10-01', knock_out_barrier_pct: 85.0, knock_in_barrier_pct: 65.0, coupon_barrier_pct: 80.0, coupon_rate_pct: 2.625, has_memory: true, knock_in_observation_type: 'EUROPEAN' },
    ],
    capital_protection_pct: 0.0,
  },
  TWIN_WIN: {
    product_id: 'demo-twinwin-01',
    archetype: 'TWIN_WIN_NOTE',
    title: 'SPY 18M Twin-Win Certificate',
    denomination_currency: 'USD',
    notional_amount: 100000.0,
    issue_date: '2026-10-01',
    maturity_date: '2028-04-01',
    underlyings: [
      { symbol: 'SPY', name: 'S&P 500 ETF', currency: 'USD', initial_fixing: 560.0, simulated_price: 560.0, performance_pct: 0.0 },
    ],
    barrier_schedule: [
      { period_index: 1, observation_date: '2028-04-01', knock_in_barrier_pct: 75.0, coupon_rate_pct: 0.0, has_memory: false, knock_in_observation_type: 'AMERICAN' },
    ],
    capital_protection_pct: 0.0,
    twin_win_parameters: {
      downside_participation: 1.0,
      upside_participation: 1.0,
      cap_pct: 125.0,
    },
  },
  ACCUMULATOR: {
    product_id: 'demo-acc-01',
    archetype: 'EQUITY_ACCUMULATOR',
    title: 'NVDA 60-Day Equity Share Accumulator',
    denomination_currency: 'USD',
    notional_amount: 612000.0,
    issue_date: '2026-10-01',
    maturity_date: '2026-12-31',
    underlyings: [
      { symbol: 'NVDA', name: 'NVIDIA Corp.', currency: 'USD', initial_fixing: 120.0, simulated_price: 120.0, performance_pct: 0.0 },
    ],
    barrier_schedule: [],
    capital_protection_pct: 0.0,
    accumulator_parameters: {
      strike_price: 102.0,
      strike_pct: 85.0,
      knock_out_barrier_pct: 103.0,
      knock_out_observation_type: 'EUROPEAN',
      gearing_ratio: 2.0,
      daily_share_count: 100.0,
      total_observation_days: 60,
      guaranteed_days: 0,
    },
  },
  DECUMULATOR: {
    product_id: 'demo-dec-01',
    archetype: 'EQUITY_DECUMULATOR',
    title: 'TSLA 60-Day Equity Share Decumulator',
    denomination_currency: 'USD',
    notional_amount: 1656000.0,
    issue_date: '2026-10-01',
    maturity_date: '2026-12-31',
    underlyings: [
      { symbol: 'TSLA', name: 'Tesla Inc.', currency: 'USD', initial_fixing: 240.0, simulated_price: 240.0, performance_pct: 0.0 },
    ],
    barrier_schedule: [],
    capital_protection_pct: 0.0,
    accumulator_parameters: {
      strike_price: 276.0,
      strike_pct: 115.0,
      knock_out_barrier_pct: 95.0,
      knock_out_observation_type: 'EUROPEAN',
      gearing_ratio: 2.0,
      daily_share_count: 100.0,
      total_observation_days: 60,
      guaranteed_days: 0,
    },
  },
};

export const App: React.FC = () => {
  const [product, setProduct] = useState<StructuredProductDefinition>(DEMO_PRODUCTS.FCN);
  const [extractionData, setExtractionData] = useState<TermsheetExtractionResponse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Simulated price map symbol -> price
  const [simulatedPrices, setSimulatedPrices] = useState<Record<string, number>>(() => {
    const initMap: Record<string, number> = {};
    for (const u of DEMO_PRODUCTS.FCN.underlyings) {
      initMap[u.symbol] = u.initial_fixing;
    }
    return initMap;
  });

  // Payoff state computed synchronously via ClientPayoffEngine at 60fps
  const [simulationState, setSimulationState] = useState<PayoffSimulationState>(() =>
    ClientPayoffEngine.calculatePayoff(DEMO_PRODUCTS.FCN, simulatedPrices)
  );

  // Re-calculate payoff whenever product or simulated prices change
  useEffect(() => {
    const newState = ClientPayoffEngine.calculatePayoff(product, simulatedPrices);
    setSimulationState(newState);
  }, [product, simulatedPrices]);

  const handleExtractionComplete = (response: TermsheetExtractionResponse) => {
    if (response.product) {
      setExtractionData(response);
      setIsDrawerOpen(true);
    }
  };

  const handleVerifiedProduct = (verified: StructuredProductDefinition) => {
    setProduct(verified);
    setIsDrawerOpen(false);
    // Reset simulated prices to initial fixings
    const newPrices: Record<string, number> = {};
    for (const u of verified.underlyings) {
      newPrices[u.symbol] = u.initial_fixing;
    }
    setSimulatedPrices(newPrices);
  };

  const handleSelectDemo = (archetypeKey: keyof typeof DEMO_PRODUCTS) => {
    const selected = DEMO_PRODUCTS[archetypeKey];
    setProduct(selected);
    const newPrices: Record<string, number> = {};
    for (const u of selected.underlyings) {
      newPrices[u.symbol] = u.initial_fixing;
    }
    setSimulatedPrices(newPrices);
  };

  const handleResetSession = () => {
    handleSelectDemo('FCN');
    setExtractionData(null);
  };

  const isDciProduct = product.archetype === 'DCI';
  const isAccumulatorOrDecumulator =
    product.archetype === 'EQUITY_ACCUMULATOR' || product.archetype === 'EQUITY_DECUMULATOR';

  if (isCompareMode) {
    const altProduct = JSON.parse(JSON.stringify(product));
    altProduct.title = `Alternative: ${altProduct.title}`;
    if (altProduct.accumulator_parameters) {
      altProduct.accumulator_parameters.strike_price *= 0.95; // 5% lower strike
    } else if (altProduct.barrier_schedule && altProduct.barrier_schedule.length > 0) {
      altProduct.barrier_schedule[0].knock_in_barrier_pct *= 1.15; // 15% higher knock-in risk
    }

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
        <header style={{ borderBottom: '1px solid var(--border-subtle)', background: '#fff', padding: '16px 24px' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 600 }}>AGRIMA - Compare Mode</h1>
        </header>
        <CompareMode 
          baseProduct={product} 
          compareProduct={altProduct} 
          onClose={() => setIsCompareMode(false)} 
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Top Editorial Navigation Bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(249, 248, 246, 0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo & Title in Editorial Charcoal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--terracotta-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(200, 90, 50, 0.25)',
              }}
            >
              <BarChart3 size={20} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  AGRIMA
                </h1>
                <span className="badge badge-sage" style={{ fontSize: '0.68rem' }}>
                  ADK Active
                </span>
                {isDciProduct && (
                  <span className="badge badge-terracotta" style={{ fontSize: '0.68rem' }}>
                    DCI Mode
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Smart Termsheet Scanner & Interactive Client Payoff Explainer
              </p>
            </div>
          </div>

          {/* Privacy & Session Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-sage-bg)',
                border: '1px solid var(--status-sage-border)',
              }}
            >
              <ShieldCheck size={15} style={{ color: 'var(--status-sage)' }} />
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--status-sage)' }}>
                Principle I: Ephemeral RAM / Zero-Retention
              </span>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '7px 12px' }}
              onClick={handleResetSession}
            >
              <RefreshCw size={13} />
              Reset Session
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: '0.78rem', padding: '7px 12px' }}
              onClick={() => setIsCompareMode(true)}
            >
              Compare
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px', flex: 1, width: '100%' }}>
        {/* Upload Zone */}
        <UploadZone
          onExtractionComplete={handleExtractionComplete}
          isLoading={isUploading}
          setIsLoading={setIsUploading}
        />

        {/* Quick Archetype Demo Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 18px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--terracotta-primary)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Explore Sample Structured Products:
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={product.archetype === 'DCI' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              onClick={() => handleSelectDemo('DCI')}
            >
              Dual Currency (DCI)
            </button>
            <button
              type="button"
              className={product.archetype === 'FCN_AUTOCALL_NOTE' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              onClick={() => handleSelectDemo('FCN')}
            >
              3-Stock FCN (Worst-Of)
            </button>
            <button
              type="button"
              className={product.archetype === 'STEP_DOWN_AUTOCALL_NOTE' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              onClick={() => handleSelectDemo('STEP_DOWN')}
            >
              Step-Down Autocall
            </button>
            <button
              type="button"
              className={product.archetype === 'TWIN_WIN_NOTE' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              onClick={() => handleSelectDemo('TWIN_WIN')}
            >
              Twin-Win Certificate
            </button>
            <button
              type="button"
              className={product.archetype === 'EQUITY_ACCUMULATOR' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              onClick={() => handleSelectDemo('ACCUMULATOR')}
            >
              NVDA Accumulator
            </button>
            <button
              type="button"
              className={product.archetype === 'EQUITY_DECUMULATOR' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              onClick={() => handleSelectDemo('DECUMULATOR')}
            >
              TSLA Decumulator
            </button>
          </div>
        </div>

        {/* DYNAMIC WORKSPACE: DCI vs ACCUMULATOR vs AUTOCALL */}
        {isDciProduct ? (
          /* When DCI: Show exclusively DCI termsheet specs & yield simulation, hiding all autocall displays */
          <DciWorkspace
            product={product}
            simulatedSpot={simulatedPrices[product.underlyings[0]?.symbol] || product.dci_parameters?.strike_rate || 1.08}
            onSpotChange={(newSpot) => {
              const sym = product.underlyings[0]?.symbol;
              if (sym) {
                setSimulatedPrices({ ...simulatedPrices, [sym]: newSpot });
              }
            }}
          />
        ) : isAccumulatorOrDecumulator ? (
          /* When Accumulator or Decumulator: Show specialized accumulator workspace */
          <AccumulatorWorkspace
            product={product}
            simulatedSpot={simulatedPrices[product.underlyings[0]?.symbol] ?? product.underlyings[0]?.initial_fixing ?? 100}
            onSpotChange={(newSpot) => {
              const sym = product.underlyings[0]?.symbol;
              if (sym) {
                setSimulatedPrices({ ...simulatedPrices, [sym]: newSpot });
              }
            }}
          />
        ) : (
          /* When NOT DCI or Accumulator (Autocall / FCN / Step-Down / Twin-Win): Show 2-column Autocall Workspace */
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(360px, 1fr)', gap: '24px' }}>
            {/* Left Column: 2D Payoff Canvas */}
            <div>
              <PayoffCanvas
                product={product}
                simulationState={simulationState}
                simulatedPrices={simulatedPrices}
              />
            </div>

            {/* Right Column: Autocall Scenario Metrics & Basket Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Autocall Outcome Card */}
              <div className="editorial-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Simulated Scenario Outcome
                  </h3>
                  {simulationState.is_knocked_out ? (
                    <span className="badge badge-sage">Autocalled (Period {simulationState.early_redemption_period})</span>
                  ) : simulationState.is_knocked_in ? (
                    <span className="badge badge-crimson">Knock-In Barrier Breached</span>
                  ) : (
                    <span className="badge badge-sage">Capital Protected at Par</span>
                  )}
                </div>

                {/* Return Display */}
                <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Net Total Return
                  </span>
                  <div
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: simulationState.net_total_return_pct >= 0 ? 'var(--status-sage)' : 'var(--status-crimson)',
                      marginTop: '4px',
                    }}
                  >
                    {simulationState.net_total_return_pct >= 0 ? '+' : ''}
                    {simulationState.net_total_return_pct.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Payout: {product.denomination_currency}{' '}
                    {simulationState.net_payout_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <div style={{ background: 'var(--bg-card-alt)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Capital Repaid</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {simulationState.capital_repaid_pct.toFixed(2)}%
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card-alt)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Coupons Earned</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--terracotta-primary)', fontFamily: 'var(--font-mono)' }}>
                      +{simulationState.total_coupons_earned_pct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Underlying Asset Sliders */}
              <MultiAssetSliders
                product={product}
                simulationState={simulationState}
                simulatedPrices={simulatedPrices}
                onPriceChange={(symbol, newPx) => {
                  setSimulatedPrices({ ...simulatedPrices, [symbol]: newPx });
                }}
                onResetAll={() => {
                  const resetMap: Record<string, number> = {};
                  for (const u of product.underlyings) {
                    resetMap[u.symbol] = u.initial_fixing;
                  }
                  setSimulatedPrices(resetMap);
                }}
              />
            </div>
          </div>
        )}

        {/* Client Scenario Narratives */}
        <NarrativeCards product={product} />
      </main>

      {/* Verification Drawer */}
      <VerificationDrawer
        isOpen={isDrawerOpen}
        extractionData={extractionData}
        onConfirm={handleVerifiedProduct}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default App;
