# Phase 0 Research: Equity Accumulator & Equity Decumulator Products

**Feature**: `003-equity-accumulator-decumulator`
**Date**: 2026-10-02

## 1. Domain Modeling: Accumulators and Decumulators

### Equity Accumulator Mechanics
- **Economic Objective**: Investor wants to acquire shares of a blue-chip or growth stock at a discount to current market price over a fixed period (e.g. 30 to 250 trading days).
- **Core Parameters**:
  - `underlying`: Single equity stock (e.g., NVDA, AAPL, TSLA).
  - `initial_fixing` ($S_0$): Base stock price on trade date.
  - `strike_price` ($K$): Fixed purchase price, typically set at 80%–90% of $S_0$ (10%–20% discount).
  - `knock_out_barrier_pct` ($B_{KO}$): Typically 102%–105% of $S_0$.
  - `gearing_ratio` ($G$): Standard 2.0x (mandatory purchase of double shares when $P < K$).
  - `daily_share_count` ($S$): Base shares accumulated per observation day.
  - `total_observation_days` ($N$): Total scheduled days across tenor.
  - `guaranteed_days` ($N_{guar}$): Initial days during which knock-out cannot terminate accumulation (default: 0).
  - `knock_out_observation_type`: Default `EUROPEAN` (evaluated against daily closing price).

### Equity Decumulator Mechanics
- **Economic Objective**: Concentrated equity holder or corporate executive wants to systematically liquidate shares at a premium above the current market price.
- **Core Parameters**:
  - `strike_price` ($K$): Fixed selling price, typically set at 110%–120% of $S_0$ (10%–20% premium).
  - `knock_out_barrier_pct` ($B_{KO}$): Downside cancellation barrier, typically 90%–95% of $S_0$.
  - `gearing_ratio` ($G$): Standard 2.0x (mandatory delivery of double shares when $P > K$).
  - `daily_share_count` ($S$): Base shares sold per observation day.

---

## 2. Mathematical Payoff Equations & Dual Settlement

### Accumulator Payoff Logic (per simulated spot $P$)
1. **Knock-Out Check**:
   - If $P \ge S_0 \times (B_{KO} / 100)$ and outside guaranteed period: Contract terminates.
   - Status: `is_knocked_out = true`.
2. **Shares Accumulated ($Q_{acc}$)**:
   - If Knocked Out: $Q_{acc} = N_{guar} \times S$ (or 0 if no guaranteed days).
   - If Active and $P \ge K$: $Q_{acc} = N \times S$ (1x accumulation).
   - If Active and $P < K$: $Q_{acc} = N \times (S \times G) = N \times 2S$ (2x gearing).
3. **Cash Commitment (Physical Outflow)**:
   - $\text{Total Cash Outflow} = Q_{acc} \times K$
4. **Mark-to-Market P&L (Cash Settlement Equivalent)**:
   - $\text{Market Value of Acquired Shares} = Q_{acc} \times P$
   - $\text{Net P&L} = \text{Market Value} - \text{Total Cash Outflow} = Q_{acc} \times (P - K)$
   - $\text{Return \%} = (P - K) / K \times 100\%$

### Decumulator Payoff Logic (per simulated spot $P$)
1. **Knock-Out Check**:
   - If $P \le S_0 \times (B_{KO} / 100)$ and outside guaranteed period: Contract terminates.
2. **Shares Decumulated ($Q_{dec}$)**:
   - If Active and $P \le K$: $Q_{dec} = N \times S$ (1x decumulation).
   - If Active and $P > K$: $Q_{dec} = N \times (S \times G) = N \times 2S$ (2x delivery).
3. **Cash Proceeds (Physical Inflow)**:
   - $\text{Total Cash Inflow} = Q_{dec} \times K$
4. **Mark-to-Market P&L (versus prevailing market spot)**:
   - $\text{Alternative Spot Proceeds} = Q_{dec} \times P$
   - $\text{Net Advantage vs Spot} = \text{Total Cash Inflow} - \text{Alternative Spot Proceeds} = Q_{dec} \times (K - P)$

---

## 3. Architecture & Integration Decisions

- **Decision 1: Modular Accumulator Workspace**:
  - Similar to how `DciWorkspace` handles dual-currency investments without cluttering autocalls, create `AccumulatorWorkspace.tsx` to host the specialized share-volume curves, spot slider, and Dual Display outcome cards.
- **Decision 2: Dual Display Card**:
  - Present two clearly separated panels:
    1. **Physical Execution**: Total Shares Acquired / Delivered, Effective Price per Share ($K$), and Total Cash Required / Received.
    2. **Mark-to-Market Evaluation**: Market Value at Spot $P$, Net Profit/Loss ($), and Percentage Gain/Loss (%).
- **Decision 3: Zero-Retention Compliance (Constitution Principle I)**:
  - All calculation state for accumulator share simulation runs in-memory synchronously via `ClientPayoffEngine`. No user scenarios or share holdings are stored on disk.
- **Decision 4: Sample Product Catalog Updates**:
  - Add two pre-configured demo definitions: `DEMO_PRODUCTS.ACCUMULATOR` (NVDA 85% Strike, 103% KO, 2x Gearing, 100 shares/day, 60 days) and `DEMO_PRODUCTS.DECUMULATOR` (TSLA 115% Strike, 95% KO, 2x Gearing, 100 shares/day, 60 days).
