# Implementation Plan: Equity Accumulator & Equity Decumulator Products

**Branch**: `003-equity-accumulator-decumulator` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-equity-accumulator-decumulator/spec.md`

## Summary

Expand the AGRIMA Structured Product Explainer product catalog to support **Equity Accumulators** and **Equity Decumulators**. These non-linear contracts involve periodic daily share purchases (at a discount) or share sales (at a premium), incorporating early cancellation Knock-Out barriers and mandatory **2x gearing** when spot crosses the strike price. This plan outlines the schema updates, multimodal extraction enhancements, deterministic payoff engine algorithms for share accumulation/disposal, and the interactive UI workspace with Dual Display settlement (Physical share commitments vs. Cash mark-to-market P&L).

## Technical Context

**Language/Version**: Python 3.11 (FastAPI backend), TypeScript 5.7.2 (React 18 frontend)
**Primary Dependencies**: Vite 6.1.0, Lucide React 0.475.0, Pydantic v2, Google GenAI SDK (Gemini)
**Storage**: N/A (Stateless, ephemeral client-side & in-memory execution per Constitution Principle I)
**Testing**: Pytest unit tests for analytical accumulator payoff math; frontend TypeScript compilation (`tsc --noEmit`) and Vite build validation
**Target Platform**: Google Cloud Run (containerized backend) + Modern Web Browsers
**Project Type**: Web application (`backend/` + `frontend/`)
**Performance Goals**: 60 fps (under 16ms per frame) during real-time spot slider manipulation
**Constraints**: Zero persistent storage, strictly scrub counterparty identities per Constitution Principle II, single underlying equity asset per contract in v1
**Scale/Scope**: Backend models & structuring agent prompts, backend payoff calculator, frontend types, `ClientPayoffEngine`, `TermsheetDetails`, `AccumulatorWorkspace`, and demo product seeds

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Compliance Analysis | Status |
| :--- | :--- | :--- |
| **I. Zero-Retention Client Privacy** | Accumulator simulation calculations and scenario sliders execute entirely client-side or in-memory ephemeral buffers without saving share holdings. | **PASS** |
| **II. Anonymized Termsheet Extraction** | Accumulator extraction strictly filters financial terms (strike price, daily shares, KO %, gearing) and omits issuer/buyer names. | **PASS** |
| **III. Dynamic & Visually Stunning UI/UX** | Dedicated `AccumulatorWorkspace` with color-coded zones for 1x accumulation, 2x gearing, and Knock-Out boundary, plus Dual Display card. | **PASS** |
| **IV. Agent-Driven ADK Orchestration** | Extends structuring agent tools with structured schemas for `AccumulatorSpecificParams`. | **PASS** |
| **V. Gemini Foundation & Cloud Native** | Extraction prompt incorporates accumulator/decumulator extraction rules using Gemini Flash / Pro models. | **PASS** |

## Project Structure

### Documentation (this feature)

```text
specs/003-equity-accumulator-decumulator/
├── plan.md              # This implementation plan
├── research.md          # Phase 0 research & payoff equations
├── data-model.md        # Phase 1 data models & schemas
├── quickstart.md        # Phase 1 runnable validation scenarios
├── contracts/           # Phase 1 interface contracts
│   └── accumulator-contract.md
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 task breakdown (created by /speckit-tasks)
```

### Source Code Layout

```text
backend/src/
├── models/
│   └── schemas.py              # Add EQUITY_ACCUMULATOR/DECUMULATOR & AccumulatorSpecificParams
├── agents/
│   └── structuring_agent.py    # Update extraction prompt for accumulator terms
└── engine/
    └── payoff_calculator.py    # Add accumulator/decumulator payoff logic & tests

frontend/src/
├── types/
│   └── index.ts                # Add ProductArchetype additions & AccumulatorSpecificParams
├── engine/
│   └── client_payoff_engine.ts # Client-side 60fps calculation for Accumulator/Decumulator
├── components/
│   ├── AccumulatorWorkspace.tsx# NEW: Specialized workspace with dual display & spot slider
│   ├── TermsheetDetails.tsx    # Display accumulator parameters (daily shares, gearing, strike)
│   └── PayoffCanvas.tsx        # Render accumulator kinked P&L curves
└── App.tsx                     # Add DEMO_PRODUCTS.ACCUMULATOR and DECUMULATOR seeds & routing
```

**Structure Decision**: Maintains strict separation between product-specific workspaces (`DciWorkspace`, `AccumulatorWorkspace`, Autocall 2-column workspace) while standardizing the `TermsheetDetails` view across all archetypes.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | No constitutional violations or architectural over-engineering. | N/A |
