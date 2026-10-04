# Implementation Plan: Smart Termsheet Scanner & Interactive Payoff Explainer

**Branch**: `001-termsheet-payoff-explainer` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-termsheet-payoff-explainer/spec.md`

## Summary

Build an agent-driven web application powered by Google Agent Development Kit (ADK) and Gemini models that enables structured product sales specialists and private wealth clients to upload termsheet documents (PDF/image), automatically scrub counterparty identities, verify extracted economic parameters in an interactive drawer, and dynamically simulate knock-in, knock-out, and maturity payoff scenarios with real-time, 60fps interactive charts and plain-language scenario narratives. The system is deployed statelessly on Google Cloud Run with strict zero-retention of user session data.

## Technical Context

**Language/Version**: Python 3.11+ (Backend Agent Services), TypeScript 5.4+ (Interactive Web Client)

**Primary Dependencies**:
- Backend: Google GenAI SDK / ADK (`google-genai`), FastAPI, Uvicorn, Pydantic v2, PyPDF, pdf2image, Pillow, python-multipart
- Frontend: Vite, TypeScript, Canvas / Chart.js for 60fps dynamic financial curves, Lucide icons, modern CSS tokens

**Storage**: None (Strictly stateless; zero-retention in-memory ephemeral evaluation per Constitution Principle I)

**Testing**: `pytest` for deterministic mathematical payoff calculations and Pydantic schema contracts; `vitest` for interactive client component testing

**Target Platform**: Google Cloud Run (Fully managed serverless container service)

**Project Type**: Full-Stack Web Application (Decoupled Python Agent API + Modern TypeScript Single-Page Application)

**Performance Goals**:
- <100ms slider manipulation response time (targeting continuous 60fps interactive exploration)
- <10 seconds end-to-end multimodal termsheet OCR, sanitization, and structured parameter extraction

**Constraints**:
- Absolute zero persistence of user inputs, simulated amounts, or client PII
- Complete redaction and omission of issuing institutions, distribution banks, buyer identities, and account numbers
- Initial support bounded to 4 canonical archetypes: Dual Currency Investment (DCI), Equity Autocall Option, Equity Autocall Swap, Equity Autocall Notes (FCN, Twin-Win, Step-Up, Step-Down)
- Default to European maturity observation with dynamic detection of American continuous monitoring
- Automated rejection of password-protected PDFs and unrecognized non-structured product documents
- Deterministic alphabetical tie-breaking for identical worst-of asset performance

**Scale/Scope**: Ephemeral concurrent client sessions, responsive desktop and tablet/mobile viewports

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Gate 1: Zero-Retention Client Privacy (Principle I)**: **PASS**. The architecture provisions no database, cache, or persistent disk storage. Uploaded files and simulation states exist strictly in transient RAM buffers and evaporate upon session close.
- **Gate 2: Anonymized Termsheet Ingestion (Principle II)**: **PASS**. `TermsheetIngestionAgent` actively scrubs issuer, buyer, and account metadata. The Pydantic schema strictly restricts extracted payloads to financial instrument mechanics.
- **Gate 3: Dynamic & Visually Stunning UI/UX (Principle III)**: **PASS**. High-performance client-side simulation engine pairs with custom canvas/charting components and modern dark/light glassmorphic styling, delivering 60fps slider reactivity.
- **Gate 4: Agent-Driven Architecture via Google ADK (Principle IV)**: **PASS**. The backend is structured into four cooperative agent roles orchestrated under Google ADK supervisor patterns.
- **Gate 5: Gemini Foundation & Google Cloud Native (Principle V)**: **PASS**. Multimodal ingestion and scenario narratives utilize Gemini 2.5 Flash and Pro models; deployment targets Google Cloud Run.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-termsheet-payoff-explainer/
├── plan.md              # This file (Implementation Plan)
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Normalized data entities & Pydantic schemas
├── quickstart.md        # Local environment run & end-to-end validation guide
├── contracts/
│   ├── api-contract.yaml       # OpenAPI 3.0 REST endpoint contracts
│   └── adk-agent-contract.md   # Google ADK agent specifications & tools
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code Layout

```text
backend/
├── src/
│   ├── agents/
│   │   ├── supervisor.py              # ADK workflow supervisor
│   │   ├── ingestion_agent.py         # TermsheetIngestionAgent (multimodal OCR + PII redaction)
│   │   ├── structuring_agent.py       # EconomicStructuringAgent (schema mapping & confidence)
│   │   └── narrative_agent.py         # ClientNarrativeAgent (Best/Base/Worst scenario summaries)
│   ├── engine/
│   │   └── payoff_calculator.py       # Deterministic mathematical payoff evaluation
│   ├── models/
│   │   └── schemas.py                 # Pydantic v2 data models & validation rules
│   ├── api/
│   │   └── routes.py                  # FastAPI route controllers
│   └── main.py                        # App factory & CORS/middleware configuration
└── tests/
    ├── test_payoff_calculator.py      # Mathematical unit tests for derivative formulas
    ├── test_structuring_agent.py      # Schema contract & extraction validation
    └── test_sanitization.py           # Verification that PII and issuer names are stripped

frontend/
├── src/
│   ├── components/
│   │   ├── UploadZone.tsx             # Drag-and-drop termsheet scanner & upload
│   │   ├── VerificationDrawer.tsx     # Parameter review drawer with amber warning indicators
│   │   ├── PayoffCanvas.tsx           # High-performance 2D interactive payoff diagram
│   │   ├── MultiAssetSliders.tsx      # Independent sliders per asset with worst-of indicators
│   │   ├── DciControls.tsx            # Specific controls for Dual Currency Investments
│   │   └── NarrativeCards.tsx         # Best, Base, and Worst case plain-language cards
│   ├── engine/
│   │   └── client_payoff_engine.ts    # In-browser zero-latency 60fps scenario evaluation
│   ├── types/
│   │   └── index.ts                   # TypeScript interfaces matching OpenAPI schema
│   ├── styles/
│   │   └── theme.css                  # Curated financial color tokens & glassmorphism styles
│   ├── App.tsx                        # Main application shell
│   └── main.tsx                       # Entrypoint
├── package.json
└── vite.config.ts

Dockerfile                             # Unified multi-stage container for Google Cloud Run
cloudbuild.yaml                        # Automated build and deployment to Google Cloud Run
```

**Structure Decision**: A decoupled web application architecture combining an ephemeral Python backend (housing the Google ADK agents and Gemini integrations) and an ultra-fast modern TypeScript frontend (handling instant 60fps client-side chart interactions). Packaged into a single container for Google Cloud Run deployment.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | Standard decoupled architecture | Architecture directly fulfills all Constitution principles without bloat. |
