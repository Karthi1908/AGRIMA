# Feature Specification: Smart Termsheet Scanner & Interactive Payoff Explainer

**Feature Branch**: `001-termsheet-payoff-explainer`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "Build a smart termsheet scanner and interactive client payoff explainer that allows structured product sales specialists and clients to upload termsheets (PDF/image), verify key economic parameters, and dynamically simulate knock-in, knock-out, and maturity payoff scenarios with modern interactive visuals and plain-language scenario summaries. Termsheet format may vary as per product and as per issuer. Initially start with regular structured products such Dual Currency investment DCI, Equity autocall option, Equity autocall Swap, Equity autocall notes (FCN, Twin win, step up and step down). Clean and clear UI and payoff diagram graphs for multi-currency and multi-instrument."

## Clarifications

### Session 2026-09-27
- Q: Should the knock-in barrier evaluation default to European observation (evaluated only at maturity) or American observation (continuous intra-period monitoring)? → A: Option A (European observation as default; automatically detect and configure American continuous monitoring when explicitly identified in termsheet).
- Q: How should the system handle uploaded documents that are valid PDF/image files but completely unrelated to structured financial products? → A: Option A (Immediate rejection with an informative "Unrecognized Product Structure" warning banner listing supported product types).
- Q: In multi-underlying basket products, how should the system handle tie-breaking when two or more underlying assets exhibit the identical lowest percentage return? → A: Option A (Alphabetical tie-break by symbol as primary driver; display "Tied Worst-Of" badge across tied assets).
- Q: How should the termsheet ingestion pipeline handle transient Gemini API rate limits or network timeouts during document scanning? → A: Option A (Automatic exponential backoff with up to 3 background retries, followed by a user-facing "Retry Extraction" button if all retries fail).
- Q: How should the system handle uploaded PDF termsheets that are password-protected or encrypted with security permissions? → A: Option A (Immediate rejection with an informative notification explaining that encrypted PDFs cannot be parsed statelessly, prompting an unprotected upload).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Termsheet Upload, Sanitized Extraction & Parameter Verification (Priority: P1)

As a structured product sales specialist or prospective investor, I want to upload a termsheet (as a PDF document or scanned image) and have the system automatically extract and display its core economic terms in a clean verification panel, while strictly scrubbing all issuer and buyer identity data, so that I can confirm product terms before visualizing payoffs without exposing confidential counterparty data.

**Why this priority**: Without accurate, privacy-compliant termsheet parameter extraction (underlying assets, initial spot levels, strike prices, barrier thresholds, coupon rates, observation schedules), downstream payoff calculation and dynamic simulation are impossible.

**Independent Test**: Can be tested independently by uploading sample PDF/image termsheets for each supported product archetype (DCI, Autocall Option, Autocall Swap, FCN, Twin-Win, Step-Up/Step-Down Notes) and verifying that the system populates all key economic parameters in an editable review table while completely omitting buyer and issuer names.

**Acceptance Scenarios**:

1. **Given** a multi-page PDF or image termsheet from any issuer, **When** the user uploads the file, **Then** the system extracts key economic parameters (product archetype, currency pair or underlying ticker(s), spot fixing, strike levels, knock-in/knock-out barriers, observation frequency, maturity date, and coupon terms) and presents them in an interactive verification view within 5 seconds.
2. **Given** a termsheet containing prominent buyer names, investor account numbers, or bank issuer branding, **When** the document is ingested, **Then** all counterparty, client, and issuer identifiers are scrubbed and excluded from the extracted payload and interface.
3. **Given** an extracted parameter that has ambiguous text or requires adjustment, **When** the user edits the value in the verification panel, **Then** the economic model updates immediately to reflect the corrected input.

---

### User Story 2 - Dynamic Interactive Payoff Diagram & Barrier Simulation (Priority: P1)

As an investor or sales specialist, I want to manipulate interactive market price sliders and barrier toggles to visualize how underlying asset price movements, knock-in events, and knock-out early calls affect product returns and capital protection across observation dates.

**Why this priority**: Static spreadsheets fail to convey non-linear payoff risks. This interactive visualization represents the primary Unique Selling Proposition (USP) of the platform, enabling immediate comprehension of conditional derivative mechanics.

**Independent Test**: Can be tested independently by loading verified product parameters and dragging the market spot price slider across boundary thresholds (above knock-out, between barriers, and below knock-in) to verify that the payoff curve, barrier markers, and return metrics update dynamically in real time.

**Acceptance Scenarios**:

1. **Given** an Equity Autocallable Note (FCN, Step-Up, Step-Down, or Twin-Win) with defined knock-out and knock-in barriers, **When** the user drags the underlying price slider across the observation timeline, **Then** the payoff graph highlights active barrier breaches, autocall call-away events, and downside put-exposure zones with distinct, color-coded visual states.
2. **Given** a Dual Currency Investment (DCI), **When** the user simulates the FX fixing rate at maturity above versus below the linked strike rate, **Then** the payoff chart dynamically displays the net return in the base currency versus the alternate currency conversion outcome with explicit breakeven boundaries.
3. **Given** an Equity Autocall Option or Swap, **When** the user toggles periodic observation dates, **Then** the visualization details periodic coupon payments, accrued coupons (with memory feature when applicable), and early settlement status.

---

### User Story 3 - Multi-Asset & Multi-Currency Scenario Exploration (Priority: P2)

As a sales specialist presenting to a client, I want to simulate multi-underlying "worst-of" performance and multi-currency exchange rates simultaneously, so that the client can examine realistic correlation stress scenarios across all linked instruments in the structure.

**Why this priority**: Many autocall notes (especially FCNs) are linked to a basket of 2 to 4 underlying stocks, where the payoff is governed by the worst-performing stock. Visualizing this multidimensional risk is critical to client suitability and confidence.

**Independent Test**: Can be tested independently by configuring a 3-stock basket autocall note and adjusting individual underlying prices to observe the automatic selection of the worst-performing asset governing the knock-in barrier.

**Acceptance Scenarios**:

1. **Given** a multi-stock Equity Autocall Note, **When** the user adjusts the price of each underlying stock independently or applies a correlated market shock slider, **Then** the payoff diagram instantly identifies and tracks the "worst-of" performer and displays its distance to knock-in and knock-out thresholds.
2. **Given** a multi-currency structured note denominated in a foreign currency, **When** currency exchange rates fluctuate, **Then** the payoff graph displays returns converted into the investor's benchmark currency alongside native contract returns.

---

### User Story 4 - Plain-Language Scenario Narratives & Ephemeral Client Summary (Priority: P3)

As an investor reviewing the product or a sales specialist concluding an advisory meeting, I want plain-language executive summaries of the "Best Case", "Base Case", and "Worst Case" scenarios, so that I can clearly understand maximum upside, downside risk, and barrier conditions without technical jargon.

**Why this priority**: Non-technical clients require accessible, jargon-free explanations alongside mathematical graphs to ensure genuine understanding and compliance suitability.

**Independent Test**: Can be tested independently by generating the scenario summary for an active product configuration and verifying that plain-language bullet points accurately describe the exact financial outcomes for all three scenarios without retaining any user session data.

**Acceptance Scenarios**:

1. **Given** any verified structured product, **When** the user requests the scenario breakdown, **Then** the system renders concise plain-language narratives explaining: (a) Best Case (e.g., early autocall with maximum annualized coupon), (b) Base Case (e.g., maturity redemption at par with periodic coupon income), and (c) Worst Case (e.g., knock-in barrier breached, capital loss tracking the worst-performing underlying).
2. **Given** an active session, **When** the user closes the browser tab or resets the view, **Then** all hypothetical amounts, scenarios, and session interactions evaporate completely, leaving zero persistent footprint.

---

### Edge Cases

- **Encrypted or Password-Protected PDFs**: What happens when an uploaded PDF is encrypted or password-protected? The system immediately detects encryption locks, halts ingestion before sending bytes to OCR, and displays a user-friendly notice stating that encrypted files cannot be processed statelessly, directing the user to supply an unencrypted copy.
- **Irrelevant or Non-Structured Product Documents**: What happens when an uploaded file is a valid PDF or image but completely unrelated to structured financial products (e.g., an invoice, receipt, or general news report)? The system immediately halts processing, rejects document ingestion, and displays an informative banner explaining that no structured derivative parameters were detected and listing supported archetypes.
- **Transient API Latency & Rate Limits**: What happens when multimodal extraction encounters temporary network timeouts or API rate limits? The ingestion pipeline automatically retries up to 3 times using exponential backoff (1s, 2s, 4s); if all retries fail, the user is presented with a clear error notification and a one-click "Retry Extraction" action.
- **Corrupted or Illegible Scans**: What happens when an uploaded termsheet is blurry, low-resolution, or missing critical sections? The system must highlight low-confidence fields with clear visual warnings and prompt the user to manually enter or verify the missing values rather than hallucinating economic parameters.
- **Unconventional Observation Schedules**: How does the system handle non-standard observation dates (e.g., irregular daily monitoring vs. monthly periodic observations, or shifting step-down autocall hurdles)? The scheduler must support custom discrete observation tables with variable barrier percentages.
- **Extreme Market Drawdowns**: What happens when simulated market drops exceed 90%? The payoff graph must gracefully scale its axes to reflect severe tail-risk scenarios while preserving clear visual differentiation between capital protection levels and total capital loss.
- **Currency Parity & Large Notional Amounts**: How does the system handle exotic currency pairs or large notional values? The system must format multi-currency figures using localized number formatting and clear symbol indicators without rounding errors or visual overflow.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept termsheet documents in PDF format and common image formats (PNG, JPEG) up to 25MB, rejecting password-protected or encrypted PDFs with a descriptive notification prompting an unencrypted upload.
- **FR-002**: System MUST automatically extract and classify product mechanics into one of the supported archetypes: Dual Currency Investment (DCI), Equity Autocall Option, Equity Autocall Swap, Equity Autocall Note (FCN, Twin-Win, Step-Up Autocall, Step-Down Autocall).
- **FR-003**: System MUST identify and extract key economic terms including underlying asset tickers/names, initial fixing prices, strike prices, coupon rates/frequencies, memory coupon flags, knock-out barrier levels/dates, knock-in barrier levels (defaulting to European maturity observation with dynamic detection of American continuous monitoring), maturity date, and settlement currency.
- **FR-004**: System MUST scrub, redact, and exclude all party identification (issuing banks, broker-dealers, buyer/client names, contact info, account numbers) from extracted data and views in compliance with privacy principles.
- **FR-005**: System MUST provide an editable verification interface allowing users to review, correct, or supplement any extracted parameter before launching simulation.
- **FR-006**: System MUST render an interactive, high-definition 2D payoff graph that updates in real time (<100ms response) as users manipulate market price and timeline sliders.
- **FR-007**: System MUST distinctly visualize knock-in barrier thresholds, knock-out hurdles, coupon barriers, and capital protection zones using high-contrast, modern color coding.
- **FR-008**: System MUST support Step-Up and Step-Down autocall structures with visually declining or ascending hurdle lines across consecutive observation dates.
- **FR-009**: System MUST support Twin-Win payoff logic, demonstrating positive return participation in down-markets as long as the downside barrier has not been breached.
- **FR-010**: System MUST support multi-underlying basket products, dynamically calculating and visualizing the "worst-of" asset's distance to barriers, with deterministic alphabetical symbol tie-breaking and a visual "Tied Worst-Of" indicator badge when two or more assets share the identical lowest percentage return.
- **FR-011**: System MUST generate three clear, plain-language scenario descriptions (Best Case, Base Case, Worst Case) describing exact dollar/percentage return outcomes and barrier status.
- **FR-012**: System MUST operate in a completely stateless, zero-retention mode where no user inputs, simulated notional amounts, or uploaded documents are stored in persistent databases or external caches.
- **FR-013**: System MUST provide independent interactive price sliders for each underlying asset in a multi-underlying basket product, enabling users to independently adjust individual asset prices and evaluate the resulting worst-of barrier triggers and payoff consequences.
- **FR-014**: System MUST handle unreadable or non-standard termsheets through an interactive verification review drawer pre-populated with high-confidence fields, visually highlighting uncertain or missing parameters with amber warning indicators and prompting user verification prior to launching simulations.

---

### Key Entities *(include if feature involves data)*

- **StructuredProductDefinition**: The normalized in-memory economic model of the instrument (archetype, notional, currency, underlying assets, initial spot fixes, maturity date).
- **UnderlyingAsset**: Individual equity, index, or currency pair linked to the product, including symbol, initial fixing price, current simulated price, and percentage performance.
- **BarrierSchedule**: The collection of observation events, each specifying observation date, barrier type (Knock-Out, Knock-In, Coupon Barrier), barrier percentage of initial spot, step direction (if step-up/down), and coupon payment mechanics (fixed, memory, or contingent).
- **PayoffSimulationState**: The ephemeral scenario calculation containing simulated underlying spot prices, active barrier breaches, early redemption status, net return percentage, and currency conversion outcomes.
- **ScenarioNarrative**: Plain-language textual interpretation summarizing the financial outcome for Best, Base, and Worst case projections.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload a standard termsheet and see verified economic parameters ready for simulation in under 10 seconds.
- **SC-002**: Parameter extraction achieves at least 90% accuracy on standard termsheets for the supported product archetypes, with all ambiguous fields clearly highlighted for user verification.
- **SC-003**: Payoff diagram and barrier metrics update dynamically in under 100 milliseconds upon slider adjustment, ensuring smooth 60fps interactive exploration.
- **SC-004**: 100% of counterparty and client identifying information is stripped prior to rendering, with zero client data retained in server storage after session close.
- **SC-005**: 90% of evaluated users (sales specialists and clients) report that interactive payoff diagrams significantly improve clarity of knock-in and knock-out mechanics compared to traditional static spreadsheets.

---

## Assumptions

- **Target User Personas**: Users are financial sales specialists, relationship managers, and wealth management clients seeking intuitive understanding of derivative payoffs.
- **Stateless Session Scope**: Users understand that scenario adjustments are ephemeral for privacy; if they refresh or close the tab, the uploaded termsheet must be reloaded or re-entered.
- **Supported Formats**: Initial support covers PDF documents and clean image scans (PNG/JPEG) of termsheets in English.
- **Pricing vs. Payoff Boundary**: The tool focuses on structural payoff mechanics, contractual formula evaluation, and scenario simulation at maturity/observation dates, rather than live intraday option pricing or secondary market mark-to-market valuations.
- **Product Archetypes**: Scope for version 1 is strictly bounded to Dual Currency Investments (DCI), Equity Autocall Options, Equity Autocall Swaps, and Equity Autocall Notes (FCN, Twin-Win, Step-Up, Step-Down).
