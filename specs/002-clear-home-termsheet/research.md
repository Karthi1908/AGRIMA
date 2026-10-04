# Phase 0 Research: Clear Termsheet Home & Dedicated Details View

**Feature**: `002-clear-home-termsheet`
**Date**: 2026-10-02

## Technical Context & Decisions

### 1. UX Navigation & View State Management
- **Decision**: Manage view state via a top-level discriminator in React state (`activeView: 'UPLOAD_LANDING' | 'TERMSHEET_DETAILS'`) backed by an optional secondary toggle (`showSimulator: boolean`).
- **Rationale**:
  - Eliminates routing library overhead while guaranteeing instant, flicker-free, 60fps transitions.
  - Ensures clean separation of concerns: initial state renders strictly the termsheet intake interface; upon upload or sample selection, the view switches to the dedicated `TermsheetDetails` presentation.
  - Complies with Constitution Principle I (ephemeral client-side RAM, zero browser local storage persistence).
- **Alternatives Considered**:
  - *React Router URL routing (`/` and `/details`)*: Rejected because browser history or bookmarks could persist product state or create invalid empty states on refresh, violating the ephemeral privacy model.
  - *Single-page stacked layout (upload on top, details in middle, simulation on bottom)*: Rejected because the user explicitly requested: "make the home page clear . Just ask for the users termsheet and show only the termsheet details." Stacking reintroduces visual clutter.

### 2. Component Architecture for Termsheet Details
- **Decision**: Create a dedicated, modular component `frontend/src/components/TermsheetDetails.tsx` accompanied by clean CSS styling.
- **Rationale**:
  - Encapsulates termsheet presentation logic cleanly without polluting `App.tsx` or coupling to the simulation canvas.
  - Directly maps the verified `StructuredProductDefinition` schema (underlyings, barrier schedule, DCI parameters, coupon rates) into scannable editorial cards.
  - Implements responsive tables and barrier badges for both single-asset and multi-asset structures.
- **Alternatives Considered**:
  - *Reusing `VerificationDrawer` in place*: Rejected because `VerificationDrawer` is a slide-over modal meant for ephemeral JSON/input editing, whereas `TermsheetDetails` is the primary main-screen dashboard view.

### 3. Handling Sample Termsheets on Clean Home State
- **Decision**: Provide subtle, discrete text buttons on the clean upload landing page (e.g., "Or try a sample termsheet: 3-Stock FCN | Dual Currency DCI | Step-Down Autocall").
- **Rationale**:
  - Solves the cold-start problem for users or evaluators who do not have a PDF/image termsheet file immediately available.
  - Keeps the primary visual focus on the file dropzone while avoiding a dead end.
- **Alternatives Considered**:
  - *Completely removing samples*: Rejected because automated tests and demo evaluations require instant one-click termsheet inspection without having to synthesize mock PDFs.

### 4. Privacy & Counterparty Sanitization Verification
- **Decision**: Enforce an explicit client-side sanitization badge and guarantee that no bank logos, counterparty names, or trade IDs appear in `TermsheetDetails`.
- **Rationale**: Adheres directly to Constitution Principle II (Anonymized Termsheet Extraction) and Principle I (Zero-Retention Client Privacy).

---

## Technical Stack Confirmation

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript | React 18.3, TS 5.7 | UI rendering and state management |
| **Bundler** | Vite | Vite 6.1 | Fast HMR dev server and production builds |
| **Styling** | Vanilla CSS + Design Tokens | Custom Theme (`theme.css`) | Warm editorial aesthetic (terracotta, cream, charcoal) |
| **Icons** | Lucide React | 0.475 | Crisp, accessible iconography |
| **Payoff Engine** | ClientPayoffEngine (TS) | In-repo | Deterministic client-side derivative calculations |
| **Backend** | FastAPI + Python 3.11 | Python 3.11 | Ephemeral PDF/image OCR & Gemini structured extraction |

---

## Research Questions & Resolution

- **Q1: What should be displayed if an extracted termsheet has no periodic barriers (e.g., a simple DCI)?**
  - **Resolution**: `TermsheetDetails` adapts its layout dynamically. If `barrier_schedule` contains only 1 final maturity fixing (or `archetype === 'DCI'`), it displays a dedicated Currency Pair & Strike Fixings card instead of a multi-row autocall barrier table.
- **Q2: How should users switch between reviewing details and simulating market prices?**
  - **Resolution**: The Termsheet Details view displays an optional action button ("Open Interactive Simulator") in its header. Clicking it toggles open the interactive payoff charts and sliders below the details cards. The default initial view shows only the termsheet details.
