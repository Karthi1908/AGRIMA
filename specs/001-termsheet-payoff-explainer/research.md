# Technical Research & Architectural Decisions: Smart Termsheet Scanner & Payoff Explainer

**Feature**: `001-termsheet-payoff-explainer`  
**Date**: 2026-09-27  
**Status**: Completed  

---

## 1. Agent Architecture & Google Agent Development Kit (ADK)

### Context & Goal
The user and Constitution Principle IV require an agent-driven architecture built using Google's Agent Development Kit (ADK), where each agent role is clearly documented, modular, and orchestrated with formal tool and schema boundaries.

### Decision
Structure the backend into four specialized, cooperative agents orchestrated by an ADK Supervisor:

1. **Termsheet Ingestion & Sanitization Agent (`TermsheetIngestionAgent`)**:
   - **Role**: Receives raw uploaded documents (PDFs or image scans), executes multimodal OCR, scrubs confidential counterparty data (issuer names, buyer identities, account numbers), and segments text into financial parameter candidates.
   - **Gemini Model**: `gemini-2.5-flash` (multimodal vision capabilities, low latency, high throughput).
   - **Tools**: `pdf_to_images_converter`, `pii_sanitizer_filter`.

2. **Economic Structuring & Validation Agent (`EconomicStructuringAgent`)**:
   - **Role**: Maps extracted financial parameters to strict structured product schemas (Dual Currency Investment, Equity Autocall Option, Equity Autocall Swap, Equity Autocall Notes: FCN, Twin-Win, Step-Up, Step-Down). Flags ambiguous fields and assigns confidence scores.
   - **Gemini Model**: `gemini-2.5-pro` (complex contract logic, high financial reasoning fidelity).
   - **Tools**: `schema_validator`, `archetype_classifier`.

3. **Deterministic Payoff Simulation Agent (`PayoffCalculationEngine`)**:
   - **Role**: Executes pure mathematical payoff evaluation without LLM hallucination. Computes worst-of asset rankings, observation-date knock-out hurdles, memory coupon accruals, knock-in capital protection boundaries, and FX conversions.
   - **Execution**: Deterministic Python calculation module exposed as a callable tool to ADK agents.

4. **Scenario Narrative & Client Explanation Agent (`ClientNarrativeAgent`)**:
   - **Role**: Translates quantitative simulation outputs and barrier trigger states into plain-language, non-technical explanations for "Best Case", "Base Case", and "Worst Case" scenarios.
   - **Gemini Model**: `gemini-2.5-flash` with suitability framing.
   - **Tools**: `narrative_formatter`.

### Alternatives Considered
- *Single-prompt monolithic LLM extraction and math*: Rejected because LLMs are non-deterministic at calculating exact derivative payoff values and barrier percentages. Pure mathematical logic must be handled deterministically by code tools, while Gemini handles perception, classification, and explanation.
- *LangChain / CrewAI*: Rejected because the Constitution explicitly mandates Google Agent Development Kit (ADK) and native Google Cloud integration.

---

## 2. Gemini Model Selection & Multimodal Document Processing

### Decision
- **`gemini-2.5-flash`** for document visual ingestion, OCR token extraction, and rapid narrative generation. Flash provides native multimodal image and document understanding with sub-second response times.
- **`gemini-2.5-pro`** for deep structural verification of complex legal termsheets when OCR confidence is borderline or when exotic multi-barrier clauses (such as step-down autocalls with memory coupons) require semantic disambiguation.
- **Prompt Isolation & Privacy Redaction**: Document tokens sent to Gemini are processed with explicit system instructions prohibiting retention and instructing immediate omission of institution names, individual investor names, and account numbers.

### Alternatives Considered
- *Standalone Tesseract OCR + Text LLM*: Rejected because Tesseract fails on multi-column financial termsheets, tabular barrier schedules, and low-contrast scanned graphics. Gemini native multimodal vision understands layout, tables, and footnotes in a single pass.

---

## 3. UI/UX, Charting & Interactive Simulation Engine

### Decision
- **Frontend Stack**: Vite + TypeScript + modern component architecture.
- **Visual Design**: High-end modern UI aesthetics: sleek dark mode with glassmorphism overlays, curated financial palettes (emerald green for barrier safety/call-away, amber for coupon threshold, crimson for knock-in capital loss zone), and clean typography (Inter / Outfit).
- **Interactive Charting Engine**: Canvas / SVG hybrid rendering (via Chart.js with custom plugins or lightweight D3 components) ensuring strict 60fps performance during continuous slider dragging (<16ms frame budget).
- **Control Layout**:
  - Independent interactive sliders for each asset in multi-stock baskets (satisfying User Selection Q1: Option B).
  - Real-time indicator displaying the active "worst-of" performer dynamically.
  - Interactive parameter verification drawer pre-filled with extracted data and amber warning badges for low-confidence fields (satisfying User Selection Q2: Option A).

### Alternatives Considered
- *Server-rendered graphs (e.g. Matplotlib / Plotly Python images)*: Rejected because server roundtrips cannot meet the <100ms real-time slider response requirement (SC-003). All interactive graph manipulations must compute client-side using pure JavaScript math once parameters are verified.

---

## 4. Google Cloud Platform (GCP) Deployment Architecture

### Decision
- **Runtime**: **Google Cloud Run** (fully managed serverless container service).
  - Scale-to-zero when idle, zero persistent disk volumes mounted, ensuring 100% ephemeral stateless execution in compliance with Constitution Principle I.
- **AI Integration**: **Vertex AI SDK / Google GenAI SDK** authenticated via Google Cloud Workload Identity / Service Account IAM, eliminating raw API keys in application code.
- **Secrets Management**: **Google Cloud Secret Manager** for securely injecting environment credentials.
- **Containerization**: Multi-stage Dockerfile packaging the Python FastAPI backend and pre-built frontend static assets for unified Cloud Run deployment.

### Alternatives Considered
- *Google Compute Engine (VMs)*: Rejected due to maintenance overhead and persistent storage risks.
- *Google App Engine Standard*: Cloud Run offers superior container portability, HTTP/2 streaming, and faster cold-starts.

---

## 5. Security, Zero-Retention & Privacy Architecture

### Decision
- **In-Memory Upload Processing**: Uploaded PDF and image files are read into temporary memory byte streams (`io.BytesIO`), processed by the ingestion agent, and immediately released from memory upon response completion.
- **No Database / Cache**: No PostgreSQL, MongoDB, Redis, or local disk persistence is provisioned.
- **Client Anonymization Guarantee**: No user accounts or personal profiles are created. The termsheet parser strictly adheres to an allowlist schema of derivative economic properties, discarding all counterparty metadata.
