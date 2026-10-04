<!--
# Sync Impact Report
- Version change: 1.0.0 -> 1.0.1
- Modified principles: Principle III (Relaxed 60fps real-time constraint to accommodate debounced backend-only math)
- Added sections:
  - Core Principles:
    - I. Zero-Retention Client Privacy (Ephemeral & Stateless Execution)
    - II. Anonymized Termsheet Extraction (Product-Only Scope)
    - III. Dynamic & Visually Stunning UI/UX (Interactive Payoff USP)
    - IV. Agent-Driven Orchestration via Google Agent Development Kit (ADK)
    - V. Gemini Foundation & Google Cloud Native Deployment
  - Security & Data Protection Standards
  - Development Workflow & Quality Gates
  - Governance
- Removed sections: None
- Follow-up TODOs: None
-->

# AGRIMA Structured Product Explainer Constitution

## Core Principles

### I. Zero-Retention Client Privacy (Ephemeral & Stateless Execution)
The platform is designed for simultaneous or independent use by structured product sales specialists and private wealth/retail clients. The system MUST operate entirely statelessly with zero persistence of end-user data. Under no circumstances may client-entered scenario values, portfolio amounts, hypothetical allocations, session inputs, IP addresses, or personal identifiable information (PII) be written to persistent databases, log sinks, or cached storage. All interactive scenario simulations and state calculations MUST remain purely client-side or in-memory for the duration of the active session and evaporate immediately upon session termination.

### II. Anonymized Termsheet Extraction (Product-Only Scope)
Termsheet ingestion (via upload, scan, or text) MUST enforce a strict data boundary. The extraction pipeline MUST parse only financial instrument terms: underlying assets, initial spot levels, strike prices, knock-in / knock-out barrier percentages and observation schedules, coupon rates and memory triggers, observation dates, redemption formulas, and maturity schedules. The system MUST actively redact, filter out, and discard any party identification, including the product issuer, distribution agent, structuring bank, buyer/investor identity, and account or trade execution references.

### III. Dynamic & Visually Stunning UI/UX (Interactive Payoff USP)
The primary Unique Selling Proposition (USP) of this application is delivering an intuitive, state-of-the-art interactive visualization experience that replaces static, uninspiring spreadsheets. Payoff diagrams and scenario simulators MUST feature modern, premium visual design tokens: curated dark/light modes, vibrant harmonious palettes, glassmorphism accents, smooth SVG/Canvas animations, and fluid transitions. Interfaces SHOULD provide fast feedback when manipulating market price sliders, barrier levels, and observation timelines. For complex simulations requiring strict backend consistency, network debouncing is permitted, relaxing the strict 60fps real-time constraint to maintain a single source of mathematical truth.

### IV. Agent-Driven Orchestration via Google Agent Development Kit (ADK)
The entire analytical and interactive workflow MUST be agent-driven, structured around Google's Agent Development Kit (ADK). Multimodal document understanding, termsheet validation, payoff formula derivation, and conversational scenario explanation must be organized as cooperative agent skills and tools under ADK orchestration. Ad-hoc, unstructured LLM prompt chaining is prohibited; all agent capabilities must define formal input/output schemas and clear execution boundaries.

### V. Gemini Foundation & Google Cloud Native Deployment
All generative, multimodal, and reasoning capabilities MUST utilize Google Gemini models (e.g., Gemini Flash for rapid schema parsing and real-time interaction; Gemini Pro for complex termsheet contract parsing and edge-case payoff logic). The entire solution MUST be architected, containerized, and deployed natively on Google Cloud Platform (GCP), utilizing serverless runtime environments (such as Google Cloud Run), Google Cloud Secret Manager for credential safety, and Vertex AI / Gemini API endpoints.

## Security & Data Protection Standards

- **Stateless Architecture**: Application services running on Google Cloud Run must not mount persistent volumes for user sessions. Temporary file processing (e.g., uploaded termsheet PDFs or images) must occur strictly in ephemeral memory buffers (`/tmp` or streaming memory) and must be scrubbed immediately post-processing.
- **Client Anonymity by Design**: No client authentication profiles may track or associate user identities with specific termsheets or simulated payoffs.
- **Data Minimization & Redaction**: The multimodal ingestion agent must validate extracted tokens against a strict allowlist schema of derivative parameters. Any detected entity names, institutional logos, or account coordinates must be omitted from LLM context windows and downstream payloads.
- **Cloud Security**: All API communication with Gemini and GCP services must use IAM authentication and encrypted TLS 1.3 transit. No raw API keys or client credentials may be exposed in client bundles or public repositories.

## Development Workflow & Quality Gates

- **Mathematical Correctness Gate**: Non-linear payoff calculations (autocall redemption, knock-in capital loss, coupon barrier satisfaction) must be accompanied by deterministic automated tests comparing simulation outputs against analytical payoff equations for canonical structured note archetypes.
- **Schema Validation Gate**: Every termsheet parsing workflow must output structured JSON conforming to a versioned Pydantic/Zod schema. Extraction confidence scores must be computed, and missing barrier terms must prompt clarifying user questions rather than hallucinating parameters.
- **Aesthetic & Usability Review**: Every user-facing UI component and payoff visualization must be verified across responsive viewports (desktop advisor presentations and mobile/tablet client views) for fluid performance (60 fps slider animations) and modern aesthetic standards before release.
- **Spec-Driven Discipline**: Features and architectural enhancements must proceed through the Spec Kit lifecycle (specify -> plan -> tasks -> implement).

## Governance

This Constitution represents the non-negotiable operational framework for the AGRIMA Structured Product Explainer project. It supersedes informal implementation decisions, technical short-cuts, or ad-hoc feature requests.

- **Amendment Procedure**: Any proposed amendment to these core principles or constraints requires documented justification, an impact review on user privacy and visual fidelity, and a corresponding version increment.
- **Versioning Policy**:
  - MAJOR version bumps indicate structural changes to core privacy boundaries, architectural orchestration frameworks, or governance rules.
  - MINOR version bumps indicate the addition of new principles, supported product archetypes, or expanded quality gates.
  - PATCH version bumps indicate minor clarifications, wording refinements, or typographical corrections.
- **Runtime Compliance**: Development artifacts (specifications, implementation plans, and pull requests) must explicitly cite compliance with these principles, particularly Zero-Retention (Principle I) and Modern UI/UX (Principle III).

**Version**: 1.0.1 | **Ratified**: 2026-09-27 | **Last Amended**: 2026-10-04
