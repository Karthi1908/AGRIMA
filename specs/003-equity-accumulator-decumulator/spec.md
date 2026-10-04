# Feature Specification: Equity Accumulator & Equity Decumulator Products

**Feature Branch**: `003-equity-accumulator-decumulator`

**Created**: 2026-10-02

**Status**: Draft

**Input**: User description: "add new products such as equity accumulator and equity deccumulator to the existing prodcut list"

## Clarifications

### Session 2026-10-02
- Q: How should the simulation calculate and display settlement outcomes for Equity Accumulators and Decumulators at maturity or knock-out? → A: Option A (Dual Display: Show both physical share count [shares acquired/sold at strike price] and net mark-to-market cash P&L at simulated spot).
- Q: Should the Knock-Out barrier evaluation for accumulators and decumulators default to Daily Closing price observation or Intraday Continuous monitoring? → A: Option A (Daily Close Default: Evaluate Knock-Out based on daily closing market prices, enabling continuous intraday monitoring only when explicitly specified in the termsheet).
- Q: Should the initial implementation of accumulators and decumulators support single-underlying contracts only, or also multi-asset 'worst-of' baskets? → A: Option A (Single-Underlying Focus: Scope v1 strictly to single-stock accumulators and decumulators, ensuring a streamlined, focused interface before considering multi-stock baskets).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Equity Accumulator Termsheet Ingestion, Verification & Payoff Simulation (Priority: P1)

As a private wealth sales specialist or high-net-worth investor, I want to upload or select an Equity Accumulator termsheet, verify its contractual parameters (discounted strike price, knock-out barrier %, gearing ratio, daily/periodic share count, and guaranteed periods), and simulate accumulated share counts and financial P&L across underlying market prices, so that I can evaluate share acquisition economics and downside gearing risks.

**Why this priority**: Share Accumulators are among the most actively traded equity structured products in wealth management. Investors agree to buy shares periodically at a discount, but take on substantial 2x gearing risk if the share price drops below the strike price. Having dynamic visualization of this non-linear risk is essential for client suitability.

**Independent Test**: Can be tested independently by loading an Equity Accumulator contract (e.g. on AAPL or NVDA with 85% Strike, 103% Knock-Out, 2x Gearing below strike, 100 shares/day, 60 observation days) and verifying that:
1. When simulated spot price is above the Knock-Out barrier (≥103%), the contract terminates early (autocalls).
2. When simulated spot is between Strike (85%) and Knock-Out (103%), the investor accumulates 1x daily shares at the 85% discount strike.
3. When simulated spot falls below Strike (<85%), the 2x gearing triggers mandatory purchase of 200 shares/day at the 85% strike price, clearly displaying the resulting mark-to-market loss.

**Acceptance Scenarios**:

1. **Given** an uploaded or sample Equity Accumulator termsheet, **When** the system parses the document, **Then** it identifies the archetype as `EQUITY_ACCUMULATOR` and extracts strike price (% and level), knock-out barrier (%), gearing ratio (e.g. 2.0x), daily share quantity, and guaranteed accumulation days.
2. **Given** an active Equity Accumulator, **When** the user drags the market spot price slider above the knock-out barrier, **Then** the simulation immediately flags early cancellation (Knock-Out) and calculates the exact number of shares accumulated up to the termination point.
3. **Given** an active Equity Accumulator, **When** the market price falls significantly below the strike level, **Then** the interface clearly highlights the 2x geared obligation, showing both the total accumulated shares (2x daily rate) and the cash outflow required at the strike price.

---

### User Story 2 - Equity Decumulator Termsheet Ingestion, Verification & Payoff Simulation (Priority: P1)

As a corporate insider or concentrated equity holder, I want to upload or select an Equity Decumulator termsheet, verify its parameters (premium strike price, downside knock-out barrier %, upside gearing ratio, and daily share count), and simulate decumulation outcomes across underlying prices, so that I can orderly sell shares at an attractive premium while understanding upside opportunity loss and 2x delivery obligations if the stock rallies.

**Why this priority**: Equity Decumulators provide the inverse mechanism to accumulators: selling shares at a premium price above spot. If the stock rallies strongly above the strike, the seller is obligated to sell double the shares (2x gearing) at the strike, capping gains and increasing stock disposal rate.

**Independent Test**: Can be tested independently by loading an Equity Decumulator contract (e.g. on TSLA with 115% Strike, 95% Knock-Out, 2x Gearing above strike, 100 shares/day) and verifying that:
1. When simulated spot drops to or below the Knock-Out barrier (≤95%), the decumulator cancels early.
2. When simulated spot is between Knock-Out (95%) and Strike (115%), the investor successfully sells 1x daily shares at the premium strike (115%).
3. When simulated spot surges above Strike (>115%), the 2x gearing triggers mandatory sale of 200 shares/day at the 115% strike price, displaying the opportunity cost relative to prevailing market prices.

**Acceptance Scenarios**:

1. **Given** an uploaded or sample Equity Decumulator termsheet, **When** the system parses the document, **Then** it identifies the archetype as `EQUITY_DECUMULATOR` and extracts strike price (% and level), downside knock-out barrier (%), gearing ratio (e.g. 2.0x), and daily share quantity.
2. **Given** an active Equity Decumulator, **When** the simulated stock price breaches below the knock-out barrier, **Then** the system registers early termination and displays final decumulated share proceeds.
3. **Given** an active Equity Decumulator, **When** the stock price rises above the strike price, **Then** the interface clearly visualizes the 2x geared delivery obligation and calculates the net proceeds versus spot market value.

---

### User Story 3 - Dedicated Termsheet Details & Visual Workspace Adaptation (Priority: P2)

As a sales specialist reviewing accumulator or decumulator terms with a client, I want the `TermsheetDetails` view and interactive workspace to display contract-specific cards and tables (such as daily share commitments, total maximum share capacity, strike discount/premium, and gearing triggers), so that the contract specifics are immediately transparent.

**Why this priority**: Accumulators and decumulators operate on share units and cash settlements rather than fixed bond coupon payments. The UI must present tailored terminology ("Daily Shares", "Accumulation Strike", "Gearing Multiple", "Max Shares Committed") rather than forcing generic bond coupon tables.

**Independent Test**: Can be tested independently by viewing an `EQUITY_ACCUMULATOR` or `EQUITY_DECUMULATOR` in the `TermsheetDetails` view and verifying that the details cards display share commitments, gearing parameters, and termination rules accurately.

**Acceptance Scenarios**:

1. **Given** an active `EQUITY_ACCUMULATOR`, **When** displayed in `TermsheetDetails`, **Then** the view shows an Accumulator Structure Card highlighting the strike discount %, daily shares, max shares at 1x vs 2x gearing, knock-out barrier %, and guaranteed days.
2. **Given** an active `EQUITY_DECUMULATOR`, **When** displayed in `TermsheetDetails`, **Then** the view shows a Decumulator Structure Card highlighting the strike premium %, daily shares to sell, max shares obligated under 2x gearing, and downside knock-out barrier %.
3. **Given** sample product selectors across the platform, **When** exploring available archetypes, **Then** "Equity Accumulator" and "Equity Decumulator" are selectable alongside DCI, FCN, Step-Down, and Twin-Win notes.

---

### User Story 4 - Plain-Language Narrative Summaries for Accumulator & Decumulator Contracts (Priority: P3)

As an investor or advisor, I want plain-language executive summaries of Best Case, Base Case, and Worst Case scenarios specifically tailored for accumulator and decumulator dynamics, so that non-technical clients understand maximum profit, market exit points, and tail-risk gearing obligations.

**Why this priority**: Explaining accumulator 2x gearing in plain language is legally and practically vital to prevent client misunderstandings regarding forced share purchases or sales.

**Independent Test**: Can be tested independently by requesting narrative cards for an accumulator and verifying that the Worst Case explicitly details the mandatory purchase of double shares at the fixed strike price during market drops.

**Acceptance Scenarios**:

1. **Given** an Equity Accumulator, **When** narrative scenarios are generated, **Then** the Worst Case explicitly explains: "If the stock falls below the Strike Price, you are legally obligated to buy double the shares (2x gearing) at the strike price, resulting in amplified capital losses."
2. **Given** an Equity Decumulator, **When** narrative scenarios are generated, **Then** the Worst Case explicitly explains: "If the stock price surges above the Strike Price, you must sell double the shares at the lower strike price, forgoing significant market upside."

---

### Edge Cases

- **Zero or Negative Stock Price Simulation**: What happens if the simulated spot price approaches zero for an accumulator? The engine enforces a 0.0 floor and displays the maximum cash liability under 2x gearing (Total Days × Daily Shares × 2 × Strike Price).
- **Guaranteed Days with Knock-Out Touch**: What happens if the stock breaches the knock-out barrier during the guaranteed period? The contract records the breach but continues accumulating until the end of the guaranteed period before terminating.
- **Continuous (American) vs. Periodic (European) Knock-Out**: How does the system handle daily closing knock-out vs. intraday high/low touch? The system defaults to European daily close observation (closing price breaches barrier) and activates American continuous monitoring only when explicitly identified in the termsheet.
- **Fractional Share Quantities**: What happens if daily shares or gearing produce non-integer shares? The system formats share counts with standard 2-decimal precision or cash-in-lieu fractional settlement per termsheet convention.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expand supported `ProductArchetype` enumeration to include `EQUITY_ACCUMULATOR` and `EQUITY_DECUMULATOR`.
- **FR-002**: System MUST accept and parse termsheets for Equity Accumulators and Decumulators in PDF and image formats, scoped in v1 to a single underlying equity asset, extracting strike levels, knock-out barriers, gearing multiples, daily share counts, and tenor days.
- **FR-003**: System MUST define an `AccumulatorParameters` schema containing:
  - `strike_price`: baseline purchase/sale price (or strike percentage of initial fixing).
  - `knock_out_barrier_pct`: barrier percentage triggering early cancellation.
  - `knock_out_observation_type`: observation style, defaulting to `EUROPEAN` (daily close), with `AMERICAN` (continuous intraday) when specified.
  - `gearing_ratio`: multiplier applied when price breaches strike (default: `2.0`).
  - `daily_share_count`: base number of shares accumulated/decumulated per observation day.
  - `total_observation_days`: total scheduled observation days across the tenor.
  - `guaranteed_days`: number of initial days protected from early knock-out (default: `0`).
- **FR-004**: For `EQUITY_ACCUMULATOR`, when simulated spot is:
  - At or above Knock-Out Barrier: contract terminates (is_knocked_out = true).
  - Between Strike and Knock-Out: daily accumulation = `daily_share_count × 1.0` at `strike_price`.
  - Below Strike: daily accumulation = `daily_share_count × gearing_ratio` at `strike_price`.
- **FR-005**: For `EQUITY_DECUMULATOR`, when simulated spot is:
  - At or below Knock-Out Barrier: contract terminates (is_knocked_out = true).
  - Between Knock-Out and Strike: daily decumulation = `daily_share_count × 1.0` at `strike_price`.
  - Above Strike: daily decumulation = `daily_share_count × gearing_ratio` at `strike_price`.
- **FR-006**: Calculation engine (both client-side `ClientPayoffEngine` and backend `PayoffCalculator`) MUST compute and provide Dual Display settlement metrics:
  - Physical Delivery view: Total shares acquired/sold, average acquisition/disposal price, and gross cash paid/received at the contractual strike price.
  - Cash P&L view: Net mark-to-market profit/loss and percentage return evaluated at the active simulated market spot price.
- **FR-007**: The `TermsheetDetails` view MUST adapt to display accumulator/decumulator metrics cleanly, including strike discount/premium %, daily share count, gearing ratio, and maximum committed shares.
- **FR-008**: The interactive payoff visualization (`PayoffCanvas` or dedicated accumulator workspace) MUST display:
  - The non-linear P&L curve reflecting 1x accumulation zone, 2x gearing zone, and Knock-Out termination boundary.
  - Dynamic spot price slider with real-time feedback.
- **FR-009**: The sample product catalog MUST include pre-configured demo contracts for both an Equity Accumulator and an Equity Decumulator.
- **FR-010**: All termsheet extraction and simulation for accumulators/decumulators MUST adhere strictly to Constitution Principle I (Zero-Retention Ephemeral Execution) and Principle II (Counterparty Anonymization).

### Key Entities

- **AccumulatorSpecificParams**:
  - `strike_price`: float (absolute price or percentage level of initial fixing)
  - `knock_out_barrier_pct`: float (e.g. 103.0 for accumulator, 95.0 for decumulator)
  - `gearing_ratio`: float (typically 2.0)
  - `daily_share_count`: float / int (e.g. 100 shares)
  - `total_observation_days`: int (e.g. 60 or 250 trading days)
  - `guaranteed_days`: int (default 0)
- **AccumulatorSimulationState**:
  - `total_shares_transacted`: number
  - `total_cash_value`: number
  - `average_price_per_share`: number
  - `is_knocked_out`: boolean
  - `effective_pnl_amount`: number
  - `effective_return_pct`: number

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of standard Equity Accumulator and Decumulator termsheets with standard 2x gearing and knock-out barriers are successfully extracted and mapped into the accumulator schema.
- **SC-002**: Payoff and share accumulation calculations for both archetypes execute in under 16ms (60 fps) during real-time slider manipulation.
- **SC-003**: The Termsheet Details view displays customized share count, gearing multiple, and barrier levels for accumulator/decumulator products without visual overlap or broken layouts across mobile and desktop viewports.
- **SC-004**: Users can toggle between existing autocall/DCI products and the new accumulator/decumulator products seamlessly with instant state updates.
- **SC-005**: 100% compliance with zero-retention privacy (no client trades or simulated amounts stored).

---

## Assumptions

- **Standard Market Conventions**: Accumulators default to a 2x gearing multiple below strike; decumulators default to a 2x gearing multiple above strike; single underlying stock per accumulator/decumulator contract.
- **Observation Frequency**: Default observation frequency is daily across standard trading days (e.g. 20-22 days per month).
- **Physical vs. Cash Settlement**: The simulation calculates both share quantity delivered and cash equivalent value at prevailing spot, accommodating both physical share delivery and cash-settled contracts.
