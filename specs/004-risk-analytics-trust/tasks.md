# Tasks: 004-risk-analytics-trust

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure updates

- [x] T001 Add `numpy` and `google-genai` to `backend/requirements.txt`
- [x] T002 Add `jspdf` and `html2canvas` to `frontend/package.json`
- [x] T003 [P] Ensure Vertex AI and Secret Manager API accesses are configured in backend environment variables (`backend/.env.example`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create foundational Pydantic models for Analytics (`SimulationAssumptions`, `SimulationResult`) in `backend/src/models/analytics.py`
- [x] T005 [P] Create foundational Pydantic models for Trust (`ProvenanceStatus`, `ProvenanceField`) in `backend/src/models/provenance.py`
- [x] T006 Setup the Google ADK Agent orchestrator base class in `backend/src/agents/orchestrator.py`
- [x] T007 Register FastAPI routers for extraction, simulation, and comparison in `backend/src/api/routes.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Path-Based Risk Distribution (Priority: P1) 🚀 MVP

**Goal**: Simulate price paths to report knock-out probability, expected shares, and P&L distribution.

**Independent Test**: Send a valid set of assumptions to `/api/simulate` and verify reproducibility when the same seed is used.

### Implementation for User Story 1

- [x] T008 [P] [US1] Create the core numpy-based path simulation engine in `backend/src/services/simulator.py`
- [x] T009 [P] [US1] Implement historical data fetching and replay generator logic in `backend/src/services/historical_replay.py`
- [x] T010 [US1] Create the `/api/simulate` endpoint logic in `backend/src/api/simulate.py` (depends on T008)
- [x] T011 [US1] Create React components for Path-Based Results (Knock-out probability, Expected Shares) in `frontend/src/components/SimulationResults.tsx`
- [x] T012 [US1] Create a representative single-path inspection chart component (day-by-day P&L) in `frontend/src/components/PathInspector.tsx`
- [x] T013 [US1] Implement loading skeleton states for the risk panels while the Monte Carlo simulation runs in `frontend/src/components/LoadingSkeletons.tsx`
- [x] T014 [US1] Integrate frontend to call `/api/simulate` and populate UI in `frontend/src/pages/RiskAnalyticsPage.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Trustworthy Extraction with Field Provenance (Priority: P1)

**Goal**: Extract termsheet fields using Gemini ADK with explicit provenance (Found/Inferred/Missing).

**Independent Test**: Run the backend extraction benchmark script over a sample termsheet and verify provenance flags are correct.

### Implementation for User Story 2

- [x] T015 [P] [US2] Implement the `ExtractorAgent` using `google-genai` in `backend/src/agents/extractor.py`
- [x] T016 [P] [US2] Create the `/api/extract` endpoint to parse uploads and invoke `ExtractorAgent` in `backend/src/api/extract.py`
- [x] T017 [US2] Create the `TermsheetDetails` React component showing provenance flags (Found, Inferred, Missing) in `frontend/src/components/TermsheetDetails.tsx`
- [x] T018 [US2] Implement the frontend logic to block simulation if Missing/Inferred/Conflict fields are unconfirmed in `frontend/src/pages/RiskAnalyticsPage.tsx`
- [x] T019 [US2] Implement empty/failure states and a manual entry fallback form when extraction fails completely in `frontend/src/components/ManualEntryFallback.tsx`
- [x] T020 [US2] Write the extraction benchmark script in `backend/scripts/run_benchmark.py`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Fair Value and Embedded Cost (Priority: P1)

**Goal**: Estimate fair value and implied embedded cost of the product.

**Independent Test**: Validate the `/api/simulate` response contains the `ValuationEstimate` object with correct range sensitivities.

### Implementation for User Story 3

- [x] T021 [P] [US3] Create `ValuationEstimate` Pydantic model in `backend/src/models/analytics.py`
- [x] T022 [P] [US3] Implement the fair value and implied cost pricing logic in `backend/src/services/valuator.py`
- [x] T023 [US3] Extend `/api/simulate` to append the valuation logic response in `backend/src/api/simulate.py`
- [x] T024 [US3] Create the Valuation React component in `frontend/src/components/ValuationPanel.tsx`

**Checkpoint**: All P1 stories should now be functional.

---

## Phase 6: User Story 4 - Explicit Risk Lens and Stress Tests (Priority: P1)

**Goal**: Provide maximum loss statements and scenario stress tests (2008, 2020, single-stock gap).

**Independent Test**: Trigger a simulation and verify the Risk Profile panel displays the explicit bounded/unbounded statement and stress test impacts.

### Implementation for User Story 4

- [x] T025 [P] [US4] Create `RiskProfile` and `StressScenarioOutcome` models in `backend/src/models/analytics.py`
- [x] T026 [P] [US4] Implement stress scenario shocks and margin impact logic in `backend/src/services/stress_tests.py`
- [x] T027 [US4] Extend `/api/simulate` to append risk profile logic in `backend/src/api/simulate.py`
- [x] T028 [US4] Create the Risk Lens React component in `frontend/src/components/RiskPanel.tsx`

---

## Phase 7: User Story 5 - Compare Mode (Priority: P2)

**Goal**: Compare accumulator, FCN, and direct stock holding side by side.

**Independent Test**: Select multiple products and verify they execute under identical seed/path paths in a single API call.

### Implementation for User Story 5

- [x] T029 [P] [US5] Create `/api/compare` endpoint with validation logic to detect and reject non-comparable product selections in `backend/src/api/compare.py`
- [x] T030 [US5] Implement the frontend Compare UI state, side-by-side tables, and prompts to align mismatched underlyings in `frontend/src/pages/CompareMode.tsx`
- [x] T031 [US5] Create overlaid distribution charts for comparison in `frontend/src/components/CompareCharts.tsx`

---

## Phase 8: User Story 6 - Advisor-Ready One-Click PDF (Priority: P2)

**Goal**: Export a branded one-pager PDF directly from the browser to ensure zero retention.

**Independent Test**: Click Export and verify a downloaded PDF contains the charts and disclaimers without making any backend network requests.

### Implementation for User Story 6

- [x] T032 [P] [US6] Create the PDF generation service using `jspdf` and `html2canvas` in `frontend/src/services/pdfExport.ts`
- [x] T033 [P] [US6] Implement fallback UI rendering if `html2canvas` fails, gracefully handle browser OOM errors, and manage visual degradation for older mobile browsers in `frontend/src/services/pdfExport.ts`
- [x] T034 [US6] Create printable HTML layout with explicit margins (e.g., A4), branding dimensions, and disclaimers in `frontend/src/components/PrintLayout.tsx`
- [x] T035 [US6] Wire the "Export PDF" button and implement validation to block export if simulation assumptions are stale or provenance flags are unconfirmed in `frontend/src/components/ExportControls.tsx`

---

## Phase 9: User Story 7 - Multi-Underlying and Granular Accumulators (Priority: P2)

**Goal**: Add support for correlation across worst-of baskets and weekly accrual features.

**Independent Test**: Run a multi-asset basket simulation and verify correlation modifies knock-in outcomes.

### Implementation for User Story 7

- [x] T036 [P] [US7] Update `SimulationAssumptions` to include correlation matrix support in `backend/src/models/analytics.py`
- [x] T037 [US7] Refactor the simulation engine (`simulator.py`) to process multivariate normal distributions for price paths
- [x] T038 [US7] Update observation logic in the engine to conditionally skip daily evaluations if the product is weekly

---

## Phase 10: User Story 8 - Build Integrity and Single Source of Truth (Priority: P3)

**Goal**: Ensure deterministic correctness across all output methods.

**Independent Test**: Run the python integration tests and verify deterministic payoffs agree exactly.

### Implementation for User Story 8

- [x] T039 [P] [US8] Create `tests/integration/test_cross_check.py` to validate parity across interactive payoffs and simulation logic.
- [x] T040 [US8] Verify ADK Agent configuration complies strictly with the project constitution.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T041 Run `quickstart.md` validation scripts to ensure MVP E2E functionality.
- [x] T042 Perform code cleanup and remove old mock data from previous iterations.
- [x] T043 Review frontend UI against the "Dynamic & Visually Stunning" Constitution principle (Principle III) to ensure 60fps animations.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories.
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion. User stories can proceed mostly in parallel or sequentially by priority (US1 -> US4 first).
- **Polish (Phase 11)**: Depends on user stories being complete.

### User Story Dependencies

- **US1**: Foundation -> US1
- **US2**: Foundation -> US2
- **US3**: Foundation -> US3 (Can run in parallel with US1/US2)
- **US4**: Foundation -> US4 (Can run in parallel with US1/US2)
- **US5**: Depends on US1 (requires working simulation first)
- **US6**: Depends on US1-US4 (needs data to render the PDF)
- **US7**: Depends on US1 (updates the simulation engine)
- **US8**: Depends on US1 (needs the payoff engine to be testable)

### Parallel Opportunities

- Foundational backend models and routes can run concurrently.
- US1, US2, US3, and US4 backend services can be written concurrently.
- Frontend tasks can run in parallel with their respective backend endpoints.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Simulation Engine)
4. **STOP and VALIDATE**: Verify the core value proposition works independently.

### Incremental Delivery

1. Setup + Foundational -> Ready
2. Add US1 (Simulation) -> Deploy MVP
3. Add US2 (Trust Extraction) -> Deploy
4. Add US3 (Valuation) -> Deploy
5. Add US4 (Risk Lens) -> Deploy
6. Add P2 features (Compare, Export, Baskets) -> Deploy
7. Add P3 validations -> Finalize

## Phase 12: Convergence

- [x] T044 Expose simulation assumptions (drift, volatility, dividend yield, historical method, seed) as user inputs in UI per FR-001, FR-003, FR-004 (partial)
- [x] T045 Create `PrintLayout.tsx` and PDF export logic with disclaimers/branding and signature block per FR-025, FR-027 (missing)
- [x] T046 Add correlation matrix input in UI for multi-underlying baskets per FR-028 (partial)

## Phase 13: Follow-ups (post-convergence)

**Purpose**: Gaps found while updating the plan after Phase 12. Phases 1-12 are preserved unchanged.

- [x] T047 [US1] Implement real historical replay (with default 3-year lookback) in `backend/src/services/historical_replay.py` per FR-004, or disable the option in UI until it works
- [x] T048 [P] [US8] Add `correlation` and `persona` to the `/api/simulate` request schema in `specs/004-risk-analytics-trust/contracts/`
- [x] T049 [US7] Extend the risk panel to basket products (worst-of FCN) by lifting the `EQUITY_ACCUMULATOR` restriction in `frontend/src/components/RiskAnalyticsPanel.tsx`, and add a backend basket test in `backend/tests/unit/test_simulator.py`
- [x] T050 [P] [US7] Support worst-of baskets up to 5 underlyings, including computing nearest valid correlation matrix (positive semi-definite) in `backend/src/services/simulator.py` and UI per FR-028
- [x] T051 [P] [US6] Pass real provenance (Found/Inferred/User-Supplied per field) into `frontend/src/components/PrintLayout.tsx` instead of the drift/correlation list, per FR-010 and SC-003
- [x] T052 [P] Fix existing TypeScript errors in `frontend/src/components/PathInspector.tsx` (tooltip formatter type) and `frontend/src/components/UploadZone.tsx` (unused imports)
- [x] T053 [P] Update `backend/src/services/stress_tests.py` and `backend/src/services/simulator.py` to enforce the clarified parameters (2008/2020 crash magnitudes, 10,000 default paths, and discrete daily close observation)

## Phase 14: Phase 13 Clarification Sync

**Purpose**: Execute the 10 additional clarifications from the latest review cycles.

- [x] T054 [P] [US1] Update `backend/src/services/simulator.py` to calculate P&L percentiles using linear interpolation (numpy default)
- [x] T055 [P] [US6] Update `frontend/src/components/PrintLayout.tsx` and export logic to redact PII locally before rendering or export, and explicitly manage advisor branding via `sessionStorage`
- [x] T056 [P] [US2] Update `backend/src/agents/extractor.py` to enforce strictly in-memory transient extraction processing (no training, immediate deletion)
- [x] T057 [P] [US2] Update `backend/src/models/provenance.py` and `frontend/src/components/TermsheetDetails.tsx` to support the new "Conflict" state (displaying all contradictory texts to force user resolution)
- [x] T058 [P] [US2] Update verification state in `frontend/src/pages/RiskAnalyticsPage.tsx` so editing a confirmed field reverts the product back to "Unverified"
- [x] T059 [P] [US8] Audit frontend components to ensure NO native JS payoff path logic exists (enforce backend-only math)

## Phase 15: LLM & Agent Reliability Hardening

**Purpose**: Tasks derived from `llm_agent_reliability.md` to harden extraction and handle edge cases.

- [x] T060 [P] [US2] Update `backend/scripts/run_benchmark.py` to support explicit numeric tolerance thresholds for extraction, measure false positives (hallucinations), and handle generation of synthetic termsheets.
- [x] T061 [P] [US2] Implement strict system prompt guardrails and semantic conflict thresholds in `backend/src/agents/extractor.py` to prevent output drift.
- [x] T062 [P] [US2] Implement JSON-parsing retry logic and unparseable-schema fallbacks in `backend/src/agents/extractor.py`.
- [x] T063 [P] [US2] Implement handling for Vertex AI rate limits (HTTP 429) using exponential backoff in `backend/src/agents/extractor.py`.
- [x] T064 [P] [US2] Configure explicit maximum latency/timeout bounds for LLM extraction requests in `backend/src/api/extract.py`.
- [x] T065 [US2] Update `frontend/src/components/ManualEntryFallback.tsx` to display specific UX states for LLM timeouts and service-unreachable scenarios.
- [x] T066 [P] [US6] Enforce strictly in-memory boundaries in `backend/src/api/extract.py` (zero raw payload logging) and explicitly enumerate PII regex patterns for client-side redaction in `frontend/src/services/pdfExport.ts`.
