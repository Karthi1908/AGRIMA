# Tasks: Equity Accumulator & Equity Decumulator Products

**Feature**: `003-equity-accumulator-decumulator`
**Date**: 2026-10-02
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify development environment and initialize accumulator demo configurations

- [X] T001 [P] Verify backend test runner and frontend development server environment in `backend/` and `frontend/`
- [X] T002 [P] Configure default seed contracts for NVDA Accumulator and TSLA Decumulator in `frontend/src/App.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema models and engine calculation algorithms required across all user stories

**⚠️ CRITICAL**: No user story work can begin until this foundational phase is complete

- [X] T003 [P] Add `EQUITY_ACCUMULATOR` and `EQUITY_DECUMULATOR` to `ProductArchetype` and define `AccumulatorSpecificParams` in `backend/src/models/schemas.py`
- [X] T004 [P] Add `EQUITY_ACCUMULATOR` and `EQUITY_DECUMULATOR` to `ProductArchetype` and define `AccumulatorSpecificParams` in `frontend/src/types/index.ts`
- [X] T005 Update structuring agent extraction prompt to detect accumulator and decumulator keywords in `backend/src/agents/structuring_agent.py`
- [X] T006 Implement backend analytical payoff calculations for accumulator and decumulator contracts in `backend/src/engine/payoff_calculator.py`
- [X] T007 [P] Create unit test suite for accumulator and decumulator payoff math in `backend/tests/test_accumulator_payoff.py`

**Checkpoint**: Foundation ready — accumulator schemas and core calculation math validated

---

## Phase 3: User Story 1 - Equity Accumulator Payoff Simulation (Priority: P1) 🎯 MVP

**Goal**: Enable users to simulate an Equity Accumulator, visualize 1x accumulation vs. 2x gearing obligations below strike, and review Dual Display settlement (shares + cash P&L)

**Independent Test**: Load an Equity Accumulator contract, adjust spot slider above KO barrier (verify early cancellation), between Strike and KO (verify 1x daily accumulation), and below Strike (verify 2x gearing mandatory purchase and mark-to-market loss).

- [X] T008 [P] [US1] Implement client-side 60fps calculation for `EQUITY_ACCUMULATOR` in `frontend/src/engine/client_payoff_engine.ts`
- [X] T009 [P] [US1] Create the `AccumulatorWorkspace.tsx` component featuring spot price slider and Dual Display cards in `frontend/src/components/AccumulatorWorkspace.tsx`
- [X] T010 [US1] Integrate `AccumulatorWorkspace` rendering for `EQUITY_ACCUMULATOR` into `frontend/src/App.tsx`
- [X] T011 [US1] Render non-linear P&L curve with 2x gearing slope change and Knock-Out step-off in `frontend/src/components/AccumulatorWorkspace.tsx`

**Checkpoint**: User Story 1 fully functional — Equity Accumulator simulation operates independently at 60 fps

---

## Phase 4: User Story 2 - Equity Decumulator Payoff Simulation (Priority: P1)

**Goal**: Enable concentrated equity holders to simulate an Equity Decumulator, visualize premium selling, downside Knock-Out cancellation, and upside 2x gearing delivery obligations

**Independent Test**: Load an Equity Decumulator, verify early cancellation when spot breaches below downside KO barrier, verify 1x sale at premium strike between KO and strike, and verify 2x gearing share delivery obligations when spot surges above strike.

- [X] T012 [P] [US2] Implement client-side 60fps calculation for `EQUITY_DECUMULATOR` in `frontend/src/engine/client_payoff_engine.ts`
- [X] T013 [P] [US2] Extend `AccumulatorWorkspace.tsx` to handle decumulator mechanics (downside KO, premium strike, upside 2x delivery) in `frontend/src/components/AccumulatorWorkspace.tsx`
- [X] T014 [US2] Wire decumulator state routing and active product switching in `frontend/src/App.tsx`

**Checkpoint**: User Stories 1 and 2 both fully functional and independently testable

---

## Phase 5: User Story 3 - Dedicated Termsheet Details & Sample Catalog Adaptation (Priority: P2)

**Goal**: Display tailored accumulator and decumulator economic parameters in `TermsheetDetails` and provide one-click sample exploration

**Independent Test**: Inspect `TermsheetDetails` for an accumulator or decumulator, verifying that Daily Shares, Total Days, Gearing Ratio, and Strike Discount/Premium are displayed cleanly without generic bond coupon clutter.

- [X] T015 [P] [US3] Add specialized Accumulator & Decumulator Parameter Card in `frontend/src/components/TermsheetDetails.tsx`
- [X] T016 [P] [US3] Add "Equity Accumulator" and "Equity Decumulator" sample buttons to the home page sample selector in `frontend/src/App.tsx`
- [X] T017 [US3] Add CSS styles for accumulator parameter tables and gearing badges in `frontend/src/styles/termsheet-details.css`

**Checkpoint**: Termsheet Details view seamlessly presents accumulator-specific contractual parameters

---

## Phase 6: User Story 4 - Plain-Language Narrative Summaries (Priority: P3)

**Goal**: Generate accessible Best Case, Base Case, and Worst Case scenario narratives explaining accumulator 2x gearing risks in plain language

**Independent Test**: Verify that Narrative Cards explicitly explain 2x mandatory share purchases during downturns (for accumulators) or 2x share delivery at capped prices during rallies (for decumulators).

- [X] T018 [P] [US4] Implement plain-language narrative logic for accumulators and decumulators in `backend/src/agents/narrative_agent.py`
- [X] T019 [US4] Display tailored accumulator and decumulator scenario narratives in `frontend/src/components/NarrativeCards.tsx`

**Checkpoint**: All user stories complete with plain-language risk disclosures

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification of performance, privacy, and full test suite execution

- [X] T020 [P] Verify strict Zero-Retention ephemeral execution (no client trade data persisted) in `backend/` and `frontend/`
- [X] T021 [P] Run backend pytest suite to validate analytical payoff equations across all edge cases via `pytest backend/tests/`
- [X] T022 [P] Run frontend TypeScript compilation check and production bundle build via `npm run build` in `frontend/`
- [X] T023 Execute end-to-end scenario verification walkthrough per `specs/003-equity-accumulator-decumulator/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Story 1 (Phase 3 - MVP)**: Depends on Foundational completion.
- **User Story 2 (Phase 4)**: Depends on Foundational completion; shares workspace component with US1.
- **User Story 3 (Phase 5)**: Depends on US1 and US2 components for display testing.
- **User Story 4 (Phase 6)**: Can run after Foundational and US1 completion.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel.
- **Phase 2**: T003, T004, and T007 can be authored in parallel.
- **Phase 3 & 4**: Frontend engine calculation routines (T008 and T012) can be implemented in parallel.
- **Phase 5**: T015 and T016 can run in parallel across separate files.
- **Phase 7**: T020, T021, and T022 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational schemas & backend math).
2. Complete Phase 3 (User Story 1: Equity Accumulator simulation & workspace).
3. **Validate MVP**: Test NVDA accumulator slider across KO, 1x accumulation, and 2x gearing zones.

### Incremental Delivery
1. Foundation Ready: Schemas & backend engine verified.
2. US1 Delivered: Interactive Equity Accumulator simulation functional.
3. US2 Delivered: Equity Decumulator simulation functional.
4. US3 Delivered: Termsheet Details view custom cards & sample links.
5. US4 Delivered: Plain-language narrative scenario explanations.
6. Polish & Verify: End-to-end quickstart validation and build checks.
