# Concept: Structured Product Payoff Visualization & Scenario Comprehension

- **Slug**: structured-product-payoff-explainer
- **Created**: 2026-09-27
- **Recommended option**: Option B — Smart Termsheet Scanner & Interactive Client Explainer

## Options

### Option A — Template-Driven Payoff Sandbox (Manual Parameter Entry)
- **Sketch**: Sales specialists select a standard product template (e.g., Autocallable, Reverse Convertible, Capital Protected Note) from a catalog and manually input 5–8 key deal parameters (underlying asset, initial fix, barrier percentages, coupon rate, observation frequency). The system instantly renders a dynamic payoff diagram with interactive price sliders, barrier highlight zones (knock-in, knock-out), and a chronological observation schedule. Clients and advisors can manipulate market price trajectories to see whether barriers trigger and what payout occurs at maturity.
- **Appetite**: Small (1–2 weeks)
- **Trade-offs**: 
  - *Wins*: Fast to build, deterministic calculation logic, zero document-parsing error risk, zero external AI extraction dependencies.
  - *Sacrifices*: Does not solve the friction of parsing dense termsheets; sales specialists must still spend time locating, interpreting, and re-keying parameters manually from PDF/paper documents during or prior to meetings.
- **Rabbit holes**: Expanding the template catalog into endless exotic payoff structures instead of perfecting the 3–4 standard archetypes that represent 80%+ of retail/wealth volume.

### Option B — Smart Termsheet Scanner & Interactive Client Explainer
- **Sketch**: An advisor or client uploads a termsheet (PDF or image). The system extracts key economic parameters (underlyings, coupon structure, knock-in / knock-out barriers, observation dates, capital protection terms) and presents a clear side-by-side extraction verification view. Once confirmed, it generates an intuitive, client-friendly explanation interface featuring interactive payoff curves, deterministic market path sliders, knock-in / knock-out event simulations, and plain-English payoff summaries across bull, neutral, and bear scenarios. Both sales teams and clients can test hypothetical price moves together or export a clean, visual scenario summary sheet.
- **Appetite**: Medium (3–5 weeks)
- **Trade-offs**:
  - *Wins*: Solves both ends of the core problem: eliminates manual termsheet reading friction and provides immediate, high-impact visual scenario simulation. Directly addresses client comprehension and sales presentation bottlenecks.
  - *Sacrifices*: Requires a human-in-the-loop parameter confirmation step to ensure document extraction accuracy before presenting scenarios to clients; requires handling diverse termsheet layouts across different issuing banks.
- **Rabbit holes**: Trying to achieve 100% autonomous, zero-human-review termsheet parsing across unstructured scans without confirmation; attempting to build continuous Monte Carlo stochastic pricing models instead of focusing on clear, scenario-based payoff path evaluations.

### Option C — Enterprise Multi-Issuer Marketplace & Risk Analytics Platform
- **Sketch**: A comprehensive institutional platform that directly integrates with multi-dealer pricing engines and RFQ platforms (e.g., Contineo, Luma, Simon), ingests live syndication termsheets, performs real-time secondary market pricing, historical backtesting, and full Monte Carlo risk modeling, coupled with formal compliance suitability checks and digital client signature sign-offs.
- **Appetite**: Large (3–6 months)
- **Trade-offs**:
  - *Wins*: Complete institutional coverage across the entire pre-trade to post-trade lifecycle with automated dealer feeds and compliance audit trails.
  - *Sacrifices*: Prohibitive development time and cost; heavy multi-dealer API licensing and security hurdles; shifts focus away from the core UI/UX comprehension problem into enterprise plumbing.
- **Rabbit holes**: Proprietary multi-dealer connectivity, complex basket correlation modeling ("worst-of" multi-asset drift), regulatory suitability validation workflows.

## Recommendation

**Option B (Smart Termsheet Scanner & Interactive Client Explainer)** is recommended.

It strikes the ideal balance between product impact and execution feasibility. By pairing termsheet extraction (with a rapid verification step) with an interactive, visual scenario simulator, it directly targets the stated problem: eliminating the static Excel spreadsheet barrier and empowering sales specialists and clients to intuitively simulate knock-in and knock-out mechanics in real time. Option A fails to eliminate document ingestion friction, while Option C introduces unnecessary enterprise infrastructure bloat and integration delays.

## Out of Scope (for the recommended option)

- Fully automated, unreviewed document extraction (a quick confirmation/edit UI step is mandatory to guarantee financial precision).
- Live secondary market pricing, real-time option volatility surfaces, or Greeks risk calculations.
- Live order execution, trade routing, or booking into custody / settlement backends.
- Formally providing personalized investment advice or regulatory product suitability sign-offs.
- Highly exotic, custom-engineered bespoke derivatives outside mainstream structured note archetypes (e.g., standard autocallables, reverse convertibles, and barrier growth notes).

## Assumptions to Validate

- Standard termsheets from major issuing banks contain reasonably identifiable economic fields (issuer, underlying, strikes, barrier percentages, coupon schedule, maturity) that can be reliably extracted into structured parameters.
- Users (sales specialists) are willing to perform a 15–30 second visual confirmation / sanity check of extracted terms before launching the client presentation view.
- A deterministic scenario simulator (allowing users to scrub underlying spot prices, inspect barrier trigger breaches, and view step-by-step observation dates) provides sufficient fidelity to give clients complete clarity without needing complex stochastic Monte Carlo simulations.
- Major target use cases center on single-underlying and "worst-of" multi-underlying barrier notes (Autocallables and Reverse Convertibles).
