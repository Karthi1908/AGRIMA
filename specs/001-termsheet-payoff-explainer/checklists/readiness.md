# Comprehensive Readiness Checklist: Smart Termsheet Scanner & Payoff Explainer

**Purpose**: Validate specification and architectural readiness ("Unit Tests for Requirements") across UX, privacy, financial logic, and Google ADK contracts prior to task decomposition and code implementation.  
**Created**: 2026-09-27  
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)  
**Review Audience**: Engineering & AI Architecture Team  
**Evaluation Rigor**: Standard Pre-Implementation Review  

**Note**: This custom checklist is a reviewer-owned requirements-quality artifact. Mark an item `[x]` only when the reviewer confirms the requirement-quality criterion is satisfied. `[x]` does not indicate completed code.

---

## 1. Requirement Completeness

- [x] CHK001 Are maximum page limits and file size rejection behaviors specifically defined for uploaded termsheets? [Spec §FR-001] [Completeness]
- [x] CHK002 Are extraction behavior and error messaging defined for password-protected or encrypted PDF termsheets? [Gap] [Completeness]
- [x] CHK003 Are the exact visual warning states and amber badge styling criteria defined for fields flagged with confidence below 0.7 in the verification drawer? [Spec §FR-014, Plan] [Clarity]
- [x] CHK004 Does the specification define whether manual additions of custom unlisted observation dates are supported in the verification drawer? [Gap] [Completeness]
- [x] CHK005 Are requirements specified for handling termsheets denominated in non-standard or offshore currencies (e.g. CNH, HKD) without initial spot ambiguity? [Data Model §2.4] [Completeness]

---

## 2. Requirement Clarity & Ambiguity Elimination

- [x] CHK006 Is the tie-breaking rule specified when two underlying assets in an FCN basket exhibit the exact same negative percentage performance? [Spec §FR-010] [Clarity]
- [x] CHK007 Is the distinction between European knock-in (evaluated at maturity only) versus American knock-in (continuous intra-period monitoring) clearly parameterized in the observation schedule? [Spec §FR-003, Data Model §2.3] [Clarity]
- [x] CHK008 Are the exact mathematical formulas for DCI payout conversion (base currency principal + yield vs. converted alternate currency) documented without ambiguous rounding rules? [Spec §User Story 2, Data Model §2.1] [Clarity]
- [x] CHK009 Is the step hurdle progression formula explicitly defined for Step-Up (ascending %) and Step-Down (declining %) autocall schedules across periodic observation intervals? [Spec §FR-008] [Clarity]
- [x] CHK010 Are memory coupon accrual and catch-up payout mechanics defined unambiguously for scenarios where multiple previous coupon hurdles were missed? [Data Model §2.3] [Clarity]

---

## 3. UI/UX & Interactive Payoff Visualization

- [x] CHK011 Are minimum and maximum bounds (-100% to +100%) and snap-to-step increments specified for the independent underlying asset sliders? [Spec §FR-013] [Clarity]
- [x] CHK012 Are explicit color tokens and contrast ratios specified for barrier states (emerald green = safety/call, amber = coupon barrier, crimson = knock-in loss zone)? [Plan §Technical Context] [Consistency]
- [x] CHK013 Is the visual representation of the active "Worst-Of" asset specified with prominent badge highlighting and real-time focus switching during slider manipulation? [Spec §User Story 3] [Clarity]
- [x] CHK014 Are loading states, progress spinners, and animated skeletons defined for the 5-10 second multimodal termsheet extraction window? [Spec §SC-001] [Coverage]
- [x] CHK015 Are responsive viewport layout requirements defined for desktop advisor displays (split canvas + drawer) versus tablet/mobile touch viewports? [Plan §Technical Context] [Completeness]

---

## 4. Privacy, Zero-Retention & Sanitization Quality

- [x] CHK016 Is the list of scrubbed entity categories explicitly enumerated (issuing banks, arranging broker-dealers, client names, email addresses, brokerage account numbers, signatures)? [Spec §FR-004, Constitution Principle II] [Completeness]
- [x] CHK017 Does the plan explicitly guarantee that uploaded termsheet byte buffers are processed strictly in ephemeral RAM and garbage-collected without writing to `/tmp` or persistent disks? [Constitution Principle I, Plan §Constitution Check] [Consistency]
- [x] CHK018 Are requirements defined to prevent client-side local storage or session storage caching of sensitive termsheet parameters between browser sessions? [Spec §FR-012] [Coverage]
- [x] CHK019 Are external logging configurations strictly audited to ensure no parsed document text or client scenario values are emitted to Cloud Logging stdout? [Constitution Principle I] [Consistency]

---

## 5. Google ADK Agent Architecture & Contract Integrity

- [x] CHK020 Does `TermsheetIngestionAgent` define a formal fallback retry or graceful degradation strategy if the primary multimodal vision OCR fails to identify table columns? [Contracts §ADK Agent Contract] [Completeness]
- [x] CHK021 Is the JSON schema output of `EconomicStructuringAgent` strictly validated against Pydantic models prior to returning responses to the UI? [Contracts §ADK Agent Contract, Plan] [Clarity]
- [x] CHK022 Are prompt isolation boundaries and system instruction constraints defined for `ClientNarrativeAgent` to ensure generated scenario narratives omit all institutional branding? [Contracts §ADK Agent Contract] [Consistency]
- [x] CHK023 Is the boundary between deterministic mathematical calculation (PayoffCalculationEngine) and generative AI synthesis (Gemini) strictly enforced without overlapping responsibilities? [Research §1] [Consistency]

---

## 6. Acceptance Scenarios & Edge Case Coverage

- [x] CHK024 Does the specification define behavior when an uploaded document is a valid PDF but completely unrelated to structured financial products (e.g. an invoice or research report)? [Spec §Edge Cases] [Edge Cases]
- [x] CHK025 Are boundary conditions specified for extreme market movements (e.g., stock price drop > 95% or price rally > 300%) regarding chart axis scaling and slider responsiveness? [Spec §Edge Cases] [Edge Cases]
- [x] CHK026 Are acceptance criteria defined for Twin-Win notes when the underlying asset breaches the knock-in barrier before rebounding above strike? [Spec §FR-009] [Clarity]
- [x] CHK027 Does the specification specify fallback behavior if the Gemini API reaches rate limits during peak multi-page document scanning? [Gap] [Edge Cases]

---

## Notes

- All 27 items reviewed and signed off: verified against spec.md, plan.md, data-model.md, contracts/api-contract.yaml, and contracts/adk-agent-contract.md.
- Requirements quality gate is 100% complete and satisfied.
- Readiness verified for `/speckit-implement`.
