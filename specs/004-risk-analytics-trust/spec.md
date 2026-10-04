# Feature Specification: Path-Based Risk Analytics, Trusted Extraction & Advisor-Ready Output

**Feature Branch**: `004-risk-analytics-trust`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Path-based simulation (Monte Carlo / historical replay: knock-out probability, expected shares, P&L distribution, worst 5% outcome). Extraction you can trust (never default silently; mark fields found/inferred/missing; require confirmation; benchmark 30–50 termsheets and publish accuracy). Fair value and cost (embedded margin/fee). Explicit risk lens (maximum loss, margin/collateral impact, capped-gain/unbounded-loss statement, stress tests for 2008, 2020, single-stock gap). Compare mode (accumulator vs FCN vs holding the stock). Advisor-ready one-click branded PDF/one-pager with disclaimers. Multi-underlying (worst-of baskets, daily/weekly accumulators). Fix the build to match its own rules (wire TermsheetDetails, resolve ADK rule, single shared payoff source of truth)."

## Clarifications

### Session 2026-10-03

- Q: Where should the 30–50 benchmark termsheets come from? → A: A mix of publicly available prospectuses/termsheets and anonymised termsheets supplied by the product owner, topped up with clearly-labelled synthetic termsheets if the corpus falls short.
- Q: How is volatility/history market data obtained? → A: By default fetched from a public market-data source (instrument identifier only, no client data), with every fetched value shown and editable by the user.
- Q: Agent orchestration rule (constitution Principle IV)? → A: Resolved as an assumption: amend the constitution with documented justification if the rule cannot be satisfied (see FR-032).
- Q: What average price trend (drift) is the default for simulated paths? → A: Risk-free rate minus dividend yield for both the P&L distribution and fair value, with a visible user override.
- Q: How is embedded cost defined, especially for zero-cost accumulators? → A: Priced notes: issue price minus fair value. Zero-cost contracts: the value given up to the issuer, shown as % of notional and as a strike-discount equivalent.
- Q: What is the client sign-off block on the exported document? → A: A printable block with client name, date and signature lines, filled by hand or typed in-session only; nothing stored, no in-app e-signature.
- Q: How close must results agree across interactive view, server and exported document? → A: Deterministic payoffs identical to 0.01 currency units; path-simulation statistics identical when run with the same seed.

### Session 2026-10-04

- Q: What are the precise numerical parameters for the "2008-style crash" and "2020-style crash" stress scenarios? (FR-020) → A: 2008: -50% spot, +200% vol over 1 year. 2020: -30% spot, +100% vol over 1 month.
- Q: What are the exact sensitivity bounds for the "low-high range" of fair value? (FR-015) → A: +/- 10% on volatility, +/- 50bps on risk-free rate, +/- 50bps on dividend yield.
- Q: What should be the default minimum path count for the Monte Carlo simulation to ensure statistical significance? (FR-001) → A: 10,000 paths.
- Q: Which knock-out observation style should the system support for its pricing simulation? (FR-006) → A: Discrete daily close observation only.
- Q: How should the system respond if the user-supplied correlation matrix for a basket product is not positive semi-definite? (FR-028) → A: Automatically compute the nearest valid matrix and display a warning.
- Q: What should be the default rolling lookback window duration for the historical replay simulation? (FR-004) → A: 3 years.
- Q: What statistical convention should be used for calculating the P&L percentiles (5th, 50th, 95th) from the simulated path distribution? (FR-002) → A: Linear interpolation (numpy default).
- Q: If the LLM extraction service inadvertently captures Personally Identifiable Information (PII) from an uploaded termsheet, how should the system handle it to ensure compliance with the Zero-Retention policy? (FR-033) → A: Mask or redact detected PII locally in the UI before rendering or export.
- Q: If a user edits a previously confirmed field on a product that has achieved "User-Verified" status, how should the system handle the overall verification status? (FR-010) → A: Revert the product to "Unverified" and require re-confirmation of the edited field.
- Q: How should the uploaded termsheet document be handled by the backend extraction service to comply with the Zero-Retention policy? (FR-033) → A: Process transiently in memory, strictly prohibit third-party model training, and delete immediately after extraction.
- Q: How precisely should a "session" be defined regarding the temporary retention of advisor branding and sign-off details? (FR-027) → A: Survives page refreshes but is cleared when the browser tab is fully closed (using sessionStorage).
- Q: How should the system handle and present a "Conflict" in provenance (e.g., when two parts of an uploaded termsheet provide contradictory values for the same field)? (FR-007) → A: Add "Conflict" as a distinct 4th state. The UI displays both contradictory source texts and forces the user to resolve it.
- Q: How strict should the "seeded simulation statistics identical" requirement be across different computing environments (e.g., Python backend vs. JS browser, different CPU architectures)? (FR-031) → A: Compute all payoffs in the backend only (never in JS) to guarantee strict consistency natively.
- Q: What should be the maximum supported basket size (number of underlyings) for correlation and worst-of simulation? (FR-028) → A: 5 underlyings.
- Q: How should we resolve the conflict between the backend-only simulation requirement (FR-031) and the 60fps real-time UI feedback requirement (Principle III)? → A: Strictly enforce backend-only math and accept network latency (using debounced sliders), officially amending Principle III to remove the 60fps real-time constraint for complex simulations.
- Q: In plan.md, the backend is defined to accept a single uniform correlation float, but tasks.md (T050) mandates computing the nearest valid full correlation matrix. Which approach should we take for worst-of baskets containing up to 5 underlyings? → A: Support a full correlation matrix (N x N) for precise basket modeling. Update plan.md to reflect this.
- Q: tasks.md T018 blocks simulation for "Missing" or "Inferred" fields but does not explicitly mention the newly added "Conflict" state. Should we update T018 to ensure a "Conflict" field also blocks simulation and export until the user manually resolves it? → A: Yes, treat "Conflict" exactly like "Missing", forcing a hard block until the user manually selects which contradictory text is correct. Update T018 to reflect this.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Path-Based Risk Distribution (Priority: P1)

An advisor or investor loads any supported product (e.g. the NVDA accumulator) and wants to know not just "what happens at one price" but "what is likely to happen over the life of the contract". The system simulates many possible price paths and shows the probability of early knock-out, the expected and worst-case number of shares transacted, the distribution of final profit/loss, and the loss in the worst 5% of outcomes.

**Why this priority**: The current single-price snapshot ignores time and path (knock-out date, days of 1x vs 2x fills), so share counts and P&L can be materially wrong. Path-based results are the core differentiator and fix a correctness gap.

**Independent Test**: Load the sample accumulator, run the simulation with a fixed seed, and verify that knock-out probability, expected shares, P&L distribution summary and the worst-5% figure are displayed, are reproducible with the same seed, and respond to changes in volatility and drift assumptions.

**Acceptance Scenarios**:

1. **Given** an accumulator with stated daily shares, tenor and knock-out barrier, **When** the user runs a path simulation, **Then** the system reports the probability of early knock-out, expected total shares, 5th/50th/95th percentile P&L, and the average P&L of the worst 5% of paths.
2. **Given** the same product, assumptions and random seed, **When** the simulation is re-run, **Then** results are identical.
3. **Given** a user-supplied volatility, **When** volatility is increased, **Then** knock-out probability and the worst-5% loss change in a financially sensible direction and the change is visible without leaving the page.
4. **Given** a historical-replay option, **When** the user selects a historical window for the underlying, **Then** the product is replayed over rolling start dates and results are shown alongside the simulated results, clearly labelled by method.
5. **Given** a path result, **When** the user selects a single representative path (e.g. median, worst), **Then** the day-by-day accumulation, knock-out date (if any) and running P&L are shown.

---

### User Story 2 - Trustworthy Extraction with Field Provenance (Priority: P1)

A user uploads a termsheet. For every extracted field, the system shows whether it was **Found** (explicit in the document), **Inferred** (derived from other terms), or **Missing** (not present). The system never fills missing values silently; the user must confirm or supply each inferred or missing field before any simulation, valuation or report is produced.

**Why this priority**: Wrong or invented terms produce confident but false numbers, which is the largest trust and compliance risk in the product.

**Independent Test**: Upload a termsheet with a deliberately omitted barrier; verify the field is marked Missing, no default value is used, and simulation is blocked until the user supplies it.

**Acceptance Scenarios**:

1. **Given** an uploaded termsheet, **When** extraction completes, **Then** every field shows a provenance status (Found / Inferred / Missing) and, for Found/Inferred, a reference to the source text.
2. **Given** one or more Missing or Inferred fields, **When** the user attempts to simulate or export, **Then** the system blocks the action and lists exactly which fields need confirmation.
3. **Given** the user confirms or edits a field, **When** all required fields are resolved, **Then** the product is marked "User-Verified" and analytics unlock; the edited fields are flagged as user-supplied in all outputs.
4. **Given** the extraction service fails or is unavailable, **When** the upload completes, **Then** the system never fabricates a placeholder underlying, price or term; it shows a clear failure message and allows manual entry.
5. **Given** a published benchmark set of 30–50 real or anonymised termsheets, **When** the benchmark is run, **Then** per-field accuracy, overall exact-match rate, and Missing-detection rate are produced and published in a human-readable report.

---

### User Story 3 - Fair Value and Embedded Cost (Priority: P1)

An advisor wants to tell a client "you are paying roughly X% for this payoff". The system estimates a fair value for the structured payoff using stated assumptions and compares it with the client's price (par/issue price or quoted price), showing the implied embedded margin or fee in percent and in currency.

**Why this priority**: Cost transparency is what makes advisors and clients care and is the natural complement to risk analytics.

**Independent Test**: Provide a product with an issue price and assumptions; verify an estimated fair value, implied margin %, and a sensitivity range are displayed with the assumptions listed.

**Acceptance Scenarios**:

1. **Given** a verified product and market assumptions, **When** the user opens the valuation view, **Then** the system shows estimated fair value, implied embedded cost (% and currency), and a low–high range based on assumption sensitivity.
2. **Given** a change to volatility, rate or dividend assumptions, **When** applied, **Then** fair value and implied cost update and the range remains visible.
3. **Given** any valuation output, **When** displayed or exported, **Then** it is labelled as an indicative estimate (not a quote), with all assumptions listed.

---

### User Story 4 - Explicit Risk Lens and Stress Tests (Priority: P1)

An investor sees a plain-language **risk panel** for the product: maximum possible loss, the shape of gain versus loss (e.g. "gain capped at X, loss up to Y"), indicative margin or collateral impact, and results under named stress scenarios: a 2008-style crash, a 2020-style crash, and a single-stock overnight gap.

**Why this priority**: Accumulator and FCN losses in the real world came from exactly these tail effects; making them explicit is the product's investor-protection value.

**Independent Test**: For the sample accumulator, verify the panel states a maximum loss figure, an explicit capped-gain / unbounded-or-large-loss statement, an indicative margin figure, and results for all three stress scenarios.

**Acceptance Scenarios**:

1. **Given** any supported product, **When** the risk panel is shown, **Then** it states maximum loss (or "not bounded below the stated floor") and an explicit statement of the form "gain capped at X, loss up to Y".
2. **Given** a leveraged product (e.g. accumulator under 2x gearing), **When** a stress scenario is applied, **Then** the system shows shares transacted, cash required, and P&L under that scenario.
3. **Given** the user supplies margin/collateral assumptions, **When** a stress scenario is applied, **Then** the system flags whether a margin call would be triggered and its indicative size.
4. **Given** a single-stock gap scenario with user-chosen size and direction, **When** applied, **Then** the system shows its impact including the effect on knock-out and gearing triggers.

---

### User Story 5 - Compare Mode (Priority: P2)

An advisor selects up to three alternatives (for example an accumulator, an FCN, and simply holding the stock) and views them side by side under the same scenarios and the same paths, with aligned metrics (expected return, probability of loss, worst-5% outcome, maximum loss, upfront cost).

**Why this priority**: Clients decide between alternatives, not in isolation; comparison under identical scenarios is the clearest persuasion and suitability tool.

**Independent Test**: Select an accumulator, an FCN and "hold stock" for the same underlying; verify identical scenario/path inputs are used and metrics are shown in a single comparable table and overlaid chart.

**Acceptance Scenarios**:

1. **Given** two or three selected alternatives on a common underlying, **When** compare mode runs, **Then** the same price paths and stress scenarios are applied to every alternative.
2. **Given** compare results, **When** displayed, **Then** a table shows expected return, probability of loss, worst-5% outcome, maximum loss and estimated cost per alternative, and an overlaid payoff/distribution chart highlights differences.
3. **Given** alternatives on different underlyings, **When** the user tries to compare, **Then** the system explains they are not comparable and offers to align the underlying.

---

### User Story 6 - Advisor-Ready One-Click PDF (Priority: P2)

An advisor clicks "Export" and receives a branded one-pager (or short report) summarising product terms (with provenance flags), risk distribution, fair value/cost, risk lens and stress tests, plus mandatory disclaimers and a client acknowledgement/sign-off block.

**Why this priority**: This is the revenue-bearing artefact and the bridge from analysis to the advisor's real workflow, but it depends on Stories 1–4 content.

**Independent Test**: With a verified product, click Export; verify a document is produced containing all required sections, the firm's branding, disclaimers and signature block, within the performance target.

**Acceptance Scenarios**:

1. **Given** a User-Verified product with completed analytics, **When** the advisor exports, **Then** a document is produced with: product terms and provenance, risk distribution, fair value/cost, risk lens, stress tests, assumptions, disclaimers and a client acknowledgement block.
2. **Given** an unverified product, **When** export is attempted, **Then** export is blocked with the list of unresolved fields.
3. **Given** firm branding inputs (name, logo, colours, disclaimer text) supplied for the session, **When** exported, **Then** they appear in the document and are not stored after the session.
4. **Given** the exported document, **When** inspected, **Then** it contains no issuer, distributor or client identity beyond what the advisor entered for the session branding and sign-off block.

---

### User Story 7 - Multi-Underlying and Granular Accumulators (Priority: P2)

A user analyses a worst-of basket (e.g. 3-stock FCN) and accumulators that accrue daily or weekly. Path simulation correlates the underlyings and applies worst-of logic, while accumulators honour their stated accrual frequency.

**Why this priority**: Real products are often multi-stock and non-daily; single-stock-only limits adoption.

**Independent Test**: Run a 3-stock worst-of FCN with a stated correlation and verify the knock-in probability differs from the independent case; run a weekly accumulator and verify shares accrue only on weekly dates.

**Acceptance Scenarios**:

1. **Given** a worst-of basket with a stated or assumed correlation, **When** the simulation runs, **Then** worst-of performance is evaluated per path and knock-in/coupon outcomes reflect correlation.
2. **Given** an accumulator with weekly accrual, **When** simulated, **Then** shares accrue on weekly observation dates only, and knock-out is evaluated per the stated observation frequency.
3. **Given** a product whose correlation is not stated, **When** simulation is requested, **Then** the user is asked to supply or confirm it and it is labelled as an assumption.

---

### User Story 8 - Build Integrity and Single Source of Truth (Priority: P3)

The product team and maintainers need the application to follow its own rules: the termsheet details view is actually presented to users, agent orchestration conforms to the project constitution, and the same payoff logic produces identical results wherever it is used (browser, server, report).

**Why this priority**: Internal consistency and trust; not directly user-visible, but prevents silent divergence in financial numbers and governance violations.

**Independent Test**: Run a cross-check suite comparing results from every place payoff is computed for a library of canonical products and scenarios; verify identical outputs, and verify that the termsheet details view appears after upload.

**Acceptance Scenarios**:

1. **Given** a successfully verified product, **When** the user proceeds, **Then** the termsheet details view is displayed before/alongside the simulator.
2. **Given** a library of canonical products and scenario inputs, **When** results are computed in each location (interactive view, server, exported report), **Then** deterministic payoffs agree to within 0.01 currency units and seeded simulation statistics are identical.
3. **Given** the project constitution, **When** agent behaviour is reviewed, **Then** the agent orchestration approach is either compliant with it or the constitution has been formally amended with documented justification.

---

### Edge Cases

- **Insufficient or odd inputs**: zero or negative volatility, correlation outside [-1, 1], non-positive spot — system rejects with clear messages; no silent clamping. If a user-supplied correlation matrix is not positive semi-definite, the system MUST automatically compute the nearest valid matrix and display a warning.
- **Very high path counts**: user requests a path count that would exceed responsiveness limits — system caps and explains, or runs progressively with partial results.
- **Knock-out on day one / during guaranteed days**: path logic honours guaranteed days and records knock-out date correctly.
- **Gap through barrier**: a gap move jumps across a barrier; observation frequency decides whether the knock-out/trigger is recognised.
- **Historical data gaps**: missing history or shorter history than the product tenor — system warns and restricts replay windows.
- **Provenance conflicts**: two source passages disagree on a term — field marked Inferred/Conflict and requires confirmation.
- **Extraction partially fails**: some fields extracted, others not — extracted ones keep provenance, missing ones are blocked, nothing invented.
- **Compare with incompatible products**: different underlyings, currencies or tenors — explained, with offered alignment.
- **Fair value unavailable**: required assumptions missing — valuation shows "cannot estimate" rather than a default number.
- **Export while analytics stale**: assumptions changed after last run — export is blocked or forces re-run so the report never shows stale numbers.
- **Privacy**: session branding, advisor name and sign-off details must never persist beyond the session.

## Requirements *(mandatory)*

### Functional Requirements

**Path-based simulation**

- **FR-001**: System MUST simulate many possible price paths (defaulting to 10,000 paths) for the underlying(s) over the product's life using user-visible volatility, drift and (for baskets) correlation assumptions. The default drift MUST be the risk-free rate minus the dividend yield for both the P&L distribution and fair value, displayed prominently and overridable by the user; any override MUST be labelled in all outputs.
- **FR-002**: System MUST report, per product: probability of early termination/knock-out, expected and percentile (5th/50th/95th) total shares transacted where applicable, distribution of final P&L, expected P&L, probability of loss, and the average loss within the worst 5% of paths. All percentiles MUST be calculated using linear interpolation.
- **FR-003**: System MUST make simulation reproducible via a visible seed, and MUST state the number of paths used.
- **FR-004**: System MUST support a historical-replay method that applies the product over rolling historical windows (defaulting to a 3-year lookback duration), and MUST label every result with its method (simulated vs historical).
- **FR-005**: System MUST let the user inspect individual representative paths (e.g. median, worst, a knock-out example) with day-by-day accumulation and running P&L.
- **FR-006**: System MUST honour guaranteed days, observation frequency (daily/weekly), and knock-out observation style (discrete daily close only) when evaluating each path.

**Trusted extraction**

- **FR-007**: System MUST assign every extracted field a provenance status of Found, Inferred, Missing, or Conflict, and show the supporting source text for Found, Inferred, and Conflict fields (displaying all contradictory texts for a Conflict to force user resolution).
- **FR-008**: System MUST NOT substitute default or placeholder values for Missing, Inferred, or Conflict fields; unresolved fields remain unresolved.
- **FR-009**: System MUST require explicit user confirmation or entry for all Inferred, Missing, and Conflict required fields before simulation, valuation, comparison or export.
- **FR-010**: System MUST mark user-supplied or edited fields and carry that marking into all outputs. If a user edits a previously confirmed field on a "User-Verified" product, the system MUST revert the product to "Unverified" until the edit is explicitly confirmed.
- **FR-011**: System MUST, when extraction fails entirely, present a clear failure and manual-entry option rather than any fabricated product.
- **FR-012**: System MUST provide a repeatable benchmark that evaluates extraction on a set of 30–50 real or anonymised termsheets and produces a published report with per-field accuracy, overall exact-match rate, and missing-field detection rate.
- **FR-013**: The benchmark corpus MUST combine publicly available prospectuses/termsheets and anonymised termsheets supplied by the product owner; if fewer than 30 are available, clearly-labelled synthetic termsheets MAY fill the gap, and the published report MUST state the proportion of each source type.

**Fair value and cost**

- **FR-014**: System MUST estimate an indicative fair value of the product payoff from stated market assumptions and compute implied embedded cost. For priced notes, cost = issue (or quoted) price minus fair value. For zero-cost contracts (e.g. accumulators/decumulators), cost = the value given up to the issuer, expressed both as a percentage of notional and as an equivalent strike discount/premium. All cost figures are shown in percent and currency.
- **FR-015**: System MUST show a low–high range for fair value and implied cost reflecting assumption sensitivity (+/- 10% on volatility, +/- 50bps on risk-free rate, +/- 50bps on dividend yield).
- **FR-016**: System MUST label all valuation outputs as indicative estimates (not executable quotes) and list the assumptions used.
- **FR-017**: System MUST refuse to show a valuation when required assumptions are missing, instead of defaulting silently.

**Risk lens and stress tests**

- **FR-018**: System MUST present a plain-language risk panel stating maximum loss, an explicit "gain capped at X, loss up to Y" statement, and where loss is not bounded below a stated floor, MUST say so clearly.
- **FR-019**: System MUST provide indicative margin/collateral impact based on user-supplied assumptions and flag whether a margin call is triggered under each stress scenario.
- **FR-020**: System MUST provide named stress scenarios (2008-style crash: -50% spot, +200% vol over 1 year; 2020-style crash: -30% spot, +100% vol over 1 month; user-defined single-stock gap) and show shares transacted, cash required and P&L under each.
- **FR-021**: System MUST show how each stress scenario interacts with barrier and gearing triggers.

**Compare mode**

- **FR-022**: System MUST allow selecting up to three alternatives, including "hold the stock", on a common underlying and apply identical paths and stress scenarios to all.
- **FR-023**: System MUST present a side-by-side table and overlaid chart of expected return, probability of loss, worst-5% outcome, maximum loss, and estimated cost.
- **FR-024**: System MUST detect and explain non-comparable selections and offer alignment.

**Advisor-ready output**

- **FR-025**: System MUST generate, in one action, a branded printable document containing product terms with provenance, risk distribution, fair value/cost, risk lens, stress tests, assumptions, mandatory disclaimers, and a client acknowledgement block consisting of client name, date and signature lines that can be completed by hand or typed in-session. The system MUST NOT capture electronic signatures or store any entered sign-off details.
- **FR-026**: System MUST block export while required fields are unresolved or analytics are stale.
- **FR-027**: System MUST accept session-only branding inputs (firm name, logo, colours, disclaimer text) and MUST NOT persist them after the session (defined as surviving page refreshes but cleared when the browser tab is closed via `sessionStorage`).

**Multi-underlying and granularity**

- **FR-028**: System MUST support worst-of baskets of up to 5 underlyings with user-confirmed correlation and apply worst-of logic per path.
- **FR-029**: System MUST support accumulator/decumulator accrual frequencies of daily and weekly, with knock-out evaluated per the stated frequency.

**Build integrity**

- **FR-030**: System MUST present the termsheet details view to users after extraction/verification, showing provenance flags.
- **FR-031**: System MUST compute payoff results centrally on the backend (never natively in JS) so that every place results appear (interactive view, server analytics, exported document) agrees for a library of canonical products: deterministic payoffs to within 0.01 currency units and seeded simulation statistics identically, verified by an automated cross-check.
- **FR-032**: System MUST make agent orchestration consistent with the project constitution; if the existing orchestration rule cannot be satisfied, the constitution MUST be amended with documented justification and version increment before release.
- **FR-033**: All new capabilities MUST comply with Constitution Principle I (zero-retention: no storage of client scenarios, branding, sign-off details or documents) and Principle II (no issuer/distributor/client identity in extracted or exported data). If PII is inadvertently extracted, it MUST be masked or redacted locally in the UI before rendering or export. Uploaded termsheets MUST be processed transiently in memory by the extraction service, strictly prohibiting third-party model training, and deleted immediately.

### Key Entities

- **Field Provenance**: status (Found/Inferred/Missing/User-Supplied), source text reference, confirmation state.
- **Simulation Assumptions**: volatility, drift/rate, dividend yield, correlation, path count, seed, method (simulated/historical).
- **Simulation Result**: probabilities, percentiles, distribution summary, worst-5% average, representative paths, method label.
- **Valuation Estimate**: fair value, implied cost (% and currency), low–high range, assumptions.
- **Risk Profile**: maximum loss, gain/loss shape statement, margin/collateral assumptions and result.
- **Stress Scenario**: name, shock definition, per-product outcome.
- **Comparison Set**: selected alternatives, common underlying, shared paths and scenarios, metric table.
- **Advisor Report**: sections, branding inputs (session-only), disclaimers, acknowledgement block.
- **Benchmark Report**: corpus description, per-field accuracy, exact-match rate, missing-detection rate, date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user receives path-based risk results (knock-out probability, expected shares, P&L distribution, worst-5% outcome) for a sample product within 5 seconds of requesting them.
- **SC-002**: Re-running with the same assumptions and seed yields identical results in 100% of runs.
- **SC-003**: 0% of outputs (screens and exported documents) contain a value the user has not seen labelled as Found, Inferred-and-confirmed, or User-Supplied.
- **SC-004**: On the published benchmark set, at least 90% of Found fields are extracted exactly, and at least 95% of genuinely absent fields are flagged Missing rather than filled.
- **SC-005**: Advisors can go from a verified product to a downloaded client-ready document in one action and under 10 seconds.
- **SC-006**: In a usability session with at least 5 advisors, at least 80% can correctly state the product's maximum loss and implied cost after viewing the risk and valuation panels, without assistance.
- **SC-007**: Compare mode shows up to three alternatives under identical scenarios, and 100% of compared metrics are derived from the same paths.
- **SC-008**: Cross-check across all places payoff is calculated agrees for 100% of canonical products and scenarios: deterministic payoffs within 0.01 currency units and seeded simulation statistics identical.
- **SC-009**: 100% compliance with zero-retention: an audit finds no persisted client scenarios, branding, sign-off details or generated documents.
- **SC-010**: At least 3 of 5 interviewed private-bank advisors say they would use the exported document with a client (validation gate for continuing the product).

## Assumptions

- Target users are private-bank advisors and sophisticated retail/HNW investors; the output is indicative, educational and decision-support, not investment advice or an executable quote.
- Market assumptions: by default, volatility, rates, dividends and price history are fetched from a public market-data source using only the instrument identifier (no client, portfolio or scenario data is sent). Every fetched value is displayed and can be overridden by the user; if fetching fails, the user must enter values (no silent defaults). Correlation is user-confirmed or derived from fetched history and shown as editable. Fetched data is used in-session only and not stored.
- Historical replay uses historical price series supplied for the session or from an approved public source; no client data is sent with such requests.
- Fair value is an indicative model estimate based on stated assumptions and will differ from issuer pricing; it is presented with ranges and disclaimers.
- Margin/collateral impact uses user-supplied assumptions (e.g. margin rate, collateral value) and is indicative only.
- Disclaimer wording is supplied by the advisor/firm for the session; the system provides a default minimum template that must be reviewed by compliance before real-world use.
- Zero-retention (Constitution Principle I) is preserved: no accounts, no stored scenarios, no stored documents; generated documents exist only in the user's session/device.
- Agent orchestration: if the Google Agent Development Kit requirement in the constitution cannot be met within this feature's scope, the constitution will be amended (MINOR/MAJOR as per governance policy) rather than left in silent violation.
- Scope covers products already supported (accumulator, decumulator, FCN/autocall, DCI where relevant, twin-win) to the extent paths and valuation apply; DCI may be limited to the risk lens and comparison in v1.
- Out of scope: execution/trading, client accounts, issuer price feeds, regulatory certification of the document.
