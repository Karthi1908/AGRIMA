# Decision: Structured Product Payoff Visualization & Scenario Comprehension

- **Slug**: structured-product-payoff-explainer
- **Decided**: 2026-09-27
- **Verdict**: go
- **Artifacts reviewed**: problem.md | concept.md

## Scorecard

| Criterion | Rating | Justification |
|-----------|--------|---------------|
| Problem validity | strong | Structured product sales desks face acute communication friction using static termsheets and Excel models for non-linear barrier payoffs. |
| Evidence strength | adequate | Domain problem is well-grounded in direct practitioner workflows and standard capital markets derivative mechanics, though baseline operational metrics remain to be benchmarked. |
| Value vs. inaction | strong | Continuing with static spreadsheets leads to protracted sales cycles, client confusion, lost deal conversion, and suitability/compliance dispute risks. |
| Feasibility / appetite | adequate | Option B (Smart Termsheet Scanner & Interactive Client Explainer) fits a reasonable 3–5 week appetite using modern document extraction and deterministic web visualization. |
| Strategic fit | strong | Directly advances intuitive financial tooling, bridging the gap between dense contractual termsheets and clear client comprehension. |
| Risk posture | adequate | Primary risks (OCR/parsing hallucination and scope creep into exotic pricing) are mitigated by mandatory human-in-the-loop review and strict non-goals. |

## Verdict & Rationale

**Verdict: GO**

The initiative is approved to advance to `/speckit-specify`. The problem addresses a genuine, high-value friction point in structured finance distribution: the inability of static termsheets and spreadsheets to clearly communicate multi-contingent payoff profiles (such as knock-in, knock-out, and observation barriers). Recommended Option B provides a targeted, highly achievable scope that combines document parsing (with a rapid verification step) and an interactive scenario simulator without expanding into cumbersome real-time market-making or full enterprise multi-dealer infrastructure.

## If go — Handoff to `/speckit-specify`

- **Problem**: Sales specialists and private wealth clients struggle to comprehend and evaluate multi-contingent structured product payoffs (knock-in, knock-out) due to dense, static termsheets and rigid spreadsheet configurations.
- **Chosen approach**: Option B — Smart Termsheet Scanner & Interactive Client Explainer (document ingestion with human-in-the-loop verification, paired with dynamic interactive payoff curves, deterministic price sliders, barrier trigger indicators, and plain-language scenario summaries).
- **In scope / out of scope**:
  - *In Scope*: Termsheet upload and structured economic extraction; parameter confirmation/adjustment screen; interactive payoff diagram; dynamic price scenario sliders (knock-in/knock-out event simulation); multi-scenario summary (bull/base/bear); clean client-facing export/share view.
  - *Out of Scope*: Automated trade execution and booking; live multi-dealer RFQ connectivity; real-time Greeks hedging/volatility surfaces; formal regulatory advice generation; unsupported complex exotic structures outside standard autocallables and barrier notes.
- **Success metrics**:
  - Significant reduction in client pitch and termsheet explanation duration.
  - Reduction of termsheet-to-interactive-visualization turnaround to under 2 minutes.
  - Measurable increase in client comprehension of downside barrier and knock-in risk conditions.
- **Carried-forward open questions**:
  - [NEEDS CLARIFICATION: Which structured note archetypes should be supported in v1 (e.g., Autocallables and Reverse Convertibles as priority)?]
  - [NEEDS CLARIFICATION: What termsheet file formats (PDF vs. image scans) must be supported at launch?]
  - [NEEDS CLARIFICATION: Will the tool operate purely as an advisor-led presentation UI or provide authenticated client self-service access?]
  - [NEEDS CLARIFICATION: Are specific regulatory disclaimers or compliance audit records required for client-exported scenario views?]
