# Implementation Plan: Clear Termsheet Home & Dedicated Details View

**Branch**: `002-clear-home-termsheet` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-clear-home-termsheet/spec.md`

## Summary

Refactor the application's root landing experience and termsheet review flow. The current homepage immediately pre-loads and displays a sample multi-asset autocall note with dense 2D payoff canvases, sliders, and outcome cards. This feature establishes a clean, minimalist landing page that prompts the user to upload their termsheet (with subtle sample links for exploration). Once a termsheet is provided or selected, the interface transitions to a dedicated, high-readability `TermsheetDetails` view presenting verified contractual parameters (product overview, underlyings with fixings, barrier & coupon schedule, and payoff logic), with an optional on-demand toggle to access interactive simulation.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 18.3.1
**Primary Dependencies**: Vite 6.1.0, Lucide React 0.475.0, clsx 2.1.1
**Storage**: N/A (Stateless, ephemeral client-side RAM per Constitution Principle I)
**Testing**: Manual component scenario validation via Vite dev server, TypeScript compile check (`tsc --noEmit`), Vite build check (`npm run build`)
**Target Platform**: Modern web browsers (Desktop & Tablet responsive viewports)
**Project Type**: Single-page web application (Frontend in `frontend/`, backend in `backend/`)
**Performance Goals**: Instant initial load (<1s), smooth 60fps view transitions, zero latency reset
**Constraints**: Zero persistent client storage (no localStorage/sessionStorage/cookies for product data), strictly scrub counterparty/bank identities per Constitution Principle II
**Scale/Scope**: Refactoring `frontend/src/App.tsx`, adding `frontend/src/components/TermsheetDetails.tsx`, adding styles in `frontend/src/styles/termsheet-details.css`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Compliance Analysis | Status |
| :--- | :--- | :--- |
| **I. Zero-Retention Client Privacy** | All view transitions and termsheet states reside purely in transient React component state. Resetting or navigating back to upload clears all data from memory with zero persistence. | **PASS** |
| **II. Anonymized Termsheet Extraction** | `TermsheetDetails` displays strictly economic parameters (underlyings, fixings, barriers, coupons, dates). Counterparty, issuer, and buyer information are excluded. | **PASS** |
| **III. Dynamic & Visually Stunning UI/UX** | Follows the established warm editorial design system (`theme.css`), featuring crisp typography, clear barrier badges, responsive tables, and elegant transitions. | **PASS** |
| **IV. Agent-Driven ADK Orchestration** | Extracted parameters and verification flow remain compatible with existing ADK extraction models and schemas. | **PASS** |
| **V. Gemini Foundation & Cloud Native** | Termsheet ingestion utilizes existing FastAPI / Gemini multimodal backend without modification to API contracts. | **PASS** |

## Project Structure

### Documentation (this feature)

```text
specs/002-clear-home-termsheet/
├── plan.md              # This implementation plan
├── research.md          # Phase 0 research & architectural decisions
├── data-model.md        # Phase 1 view state & data model
├── quickstart.md        # Phase 1 runnable validation scenarios
├── contracts/           # Phase 1 UI component contracts
│   └── termsheet-details-contract.md
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 task breakdown (created by /speckit-tasks)
```

### Source Code Layout

```text
frontend/src/
├── components/
│   ├── TermsheetDetails.tsx       # NEW: Dedicated termsheet economic details view
│   ├── UploadZone.tsx             # Existing: Intake dropzone component
│   ├── VerificationDrawer.tsx     # Existing: Verification drawer
│   ├── PayoffCanvas.tsx           # Existing: Payoff curve canvas
│   ├── MultiAssetSliders.tsx      # Existing: Price manipulation sliders
│   ├── NarrativeCards.tsx         # Existing: Best/Base/Worst case cards
│   ├── DciWorkspace.tsx           # Existing: DCI simulation workspace
│   └── DciControls.tsx            # Existing: DCI controls
├── styles/
│   ├── theme.css                  # Existing: Design tokens & global utility classes
│   └── termsheet-details.css      # NEW: Clean editorial card & table styles for details view
├── types/
│   └── index.ts                   # Existing: TypeScript contracts and schemas
└── App.tsx                        # REFACTORED: View state router ('LANDING_UPLOAD' vs 'TERMSHEET_DETAILS')
```

**Structure Decision**: The changes are contained primarily within the frontend client layer, preserving existing backend APIs and engine calculation routines while dramatically improving initial cognitive clarity and UX hierarchy.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | No constitutional violations or architectural over-engineering. | N/A |
