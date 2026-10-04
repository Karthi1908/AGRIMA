# Implementation Plan: 004-risk-analytics-trust

**Branch**: `004-risk-analytics-trust` | **Date**: 2026-10-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-risk-analytics-trust/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add path-based simulation for risk analytics, trusted provenance for termsheet extraction, and advisor-ready PDF generation. The implementation will unify payoff logic in the Python backend, orchestrate extraction via the Google Agent Development Kit using `google-genai`, and generate stateless PDFs entirely in the frontend.

## Technical Context

**Language/Version**: Python 3.11+, TypeScript, React

**Primary Dependencies**: FastAPI, `numpy`, `google-genai`, Vite, React, `jspdf`, `html2canvas`, Google Cloud Secret Manager, Vertex AI

**Storage**: Stateless (None - enforced by Google Cloud Run ephemeral instances)

**Testing**: `pytest` (Backend), `vitest`/`jest` (Frontend)

**Target Platform**: Google Cloud Platform (GCP) - Google Cloud Run (Backend), Firebase Hosting / Cloud CDN (Frontend)

**Project Type**: Web application

**Performance Goals**: <5s simulation, <10s PDF export, 60fps UI

**Constraints**: Strict statelessness, zero data retention, strict PII redaction

**Scale/Scope**: Private-bank advisors and HNW clients

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Zero-Retention)**: Passed. PDF generation shifted to frontend to guarantee no server footprint. All analytics run ephemerally in memory.
- **Principle II (Anonymized Extraction)**: Passed. Provenance data model strictly types the extraction and avoids assumptions.
- **Principle III (Dynamic UI)**: Passed. Path logic runs on backend, UI remains lightweight for rendering.
- **Principle IV (ADK Orchestration)**: Passed. Extractor and validator agents use `google-genai` function calling with strict Pydantic schemas.
- **Principle V (Gemini on GCP)**: Passed. The backend is containerized for Google Cloud Run, ensuring statelessness, with credentials managed by GCP Secret Manager and LLM calls routed to Vertex AI.

## Project Structure

### Documentation (this feature)

```text
specs/004-risk-analytics-trust/
├── plan.md              # This file
├── research.md          # Technical decisions and design choices
├── data-model.md        # Provenance, Simulation, and Reporting models
├── quickstart.md        # Steps for validation
├── contracts/           # API interface definition between frontend and backend
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)
```text
backend/
├── src/
│   ├── api/
│   ├── agents/      # Google ADK skills using google-genai
│   ├── models/      # Pydantic schemas (Provenance, SimulationResult, etc.)
│   └── services/    # Simulator (numpy path generation), Valuator
└── tests/
    └── unit/

frontend/
├── src/
│   ├── components/  # RiskAnalyticsPanel (assumption inputs), PrintLayout (A4 report), Compare charts
│   ├── pages/       # Export preview
│   └── utils/       # pdf_generator.ts (jspdf/html2canvas export logic)
└── tests/
```

### As-Built Notes (Phase 12 Convergence)

- **Assumption inputs (FR-001/003/004)**: `RiskAnalyticsPanel.tsx` exposes volatility, risk-free rate, dividend yield, path count (capped at 100,000), seed and method. Drift defaults to risk-free minus dividend with a labelled override. Invalid values are rejected, never clamped. Changing any input marks results stale until re-run.
- **Advisor PDF (FR-025/026/027)**: `PrintLayout.tsx` renders an off-screen A4-width report (terms with provenance, assumptions, distribution, valuation, risk lens, stress tests, disclaimer, client name/date/signature lines). Branding (firm name, colour, logo, disclaimer) is component state only. `pdf_generator.ts` snapshots it client-side and paginates; export is blocked while results are stale.
- **Basket correlation (FR-028)**: a required full correlation matrix (N x N) appears for products with up to 5 underlyings and is labelled an assumption in outputs. The backend accepts a full correlation matrix (`SimulationAssumptions.correlation: list[list[float]]`) and computes the nearest valid positive semi-definite matrix if needed.
- **Known limits**: the risk panel renders only for `EQUITY_ACCUMULATOR`; backend support for `method = "historical"` is unverified; a full correlation matrix is deferred.
- **Recent Clarifications (Phase 13)**: Backend strictly controls payoff simulation (no native JS path logic) with linear interpolation percentiles. Worst-of baskets support up to 5 underlyings. Historical replay defaults to a 3-year lookback. PII is redacted locally in the UI before export. Termsheets are processed strictly transiently in memory without third-party training. Provenance gains a 4th "Conflict" state for contradictory extractions, and editing any confirmed field reverts the product back to "Unverified". Advisor branding session state is explicitly managed via `sessionStorage`.

**Structure Decision**: Web application (Option 2). The backend holds the simulation engine and ADK agents. The frontend manages the UI state and generates the PDF locally.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | N/A        | N/A                                 |
