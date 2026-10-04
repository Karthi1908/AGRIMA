# Research

## 1. Monte Carlo & Path Simulation Engine
**Decision:** Implement the simulation engine in Python using `numpy` within the FastAPI backend.
**Rationale:** FR-031 dictates a single source of truth for all payoff logic to ensure the interactive view, server analytics, and exported reports agree identically. By keeping the Monte Carlo engine in the backend, we guarantee deterministic, reproducible results (given a seed) across all consumption points. The frontend will pass assumptions (volatility, drift, etc.) to the backend and render the results.
**Alternatives considered:** Doing Monte Carlo in the frontend using JavaScript or WebAssembly. Rejected because it risks divergence from the backend logic, making cross-platform consistency harder and potentially freezing the browser UI for high path counts.

## 2. PDF Generation for Advisor-Ready Output
**Decision:** Use a frontend-based PDF generation approach (e.g., `jspdf` and `html2canvas`).
**Rationale:** The PDF requires visual charts (P&L distributions, stress test overlays) that are already rendered beautifully in the frontend (as per Constitution Principle III). Generating the PDF in the browser avoids the need to recreate these charts in the backend (e.g., via `matplotlib`), ensuring the export looks exactly like the advisor's interactive view. It also strictly enforces Principle I (Zero-Retention), as the PDF is generated locally on the client's device and never persists on or even passes through the server.
**Alternatives considered:** Backend generation via `reportlab` or `weasyprint`. Rejected because it duplicates chart-rendering logic and introduces server-side temporary file management, which complicates statelessness.

## 3. Google Agent Development Kit (ADK) Orchestration
**Decision:** Implement ADK orchestration natively using the `google-genai` SDK's function calling and structured outputs (via Pydantic).
**Rationale:** Constitution Principle IV mandates formal input/output schemas and clear execution boundaries, prohibiting ad-hoc prompt chaining. The new `google-genai` SDK provides native support for `response_schema` and tool/function calling, which serves as the foundation for the Agent Development Kit pattern. We will wrap the Gemini models in discrete "Skills" (e.g., Extractor Agent, Validator Agent) that communicate via strictly typed Pydantic contracts.
**Alternatives considered:** Using heavyweight frameworks like LangChain. Rejected because they add unnecessary abstraction and can obfuscate the strict schema boundaries required by the constitution. Native `google-genai` is cleaner and fully GCP-aligned.

## 4. Field Provenance Data Model
**Decision:** Wrap all extracted financial terms in a generic `ProvenanceField[T]` model.
**Rationale:** FR-007 and FR-009 require every field to track whether it is Found, Inferred, Missing, or User-Supplied, and require confirmation for Inferred/Missing fields. A wrapper class (e.g., `value: T, status: ProvenanceStatus, source_text: str | None, confirmed: bool`) ensures this metadata is inherently tied to the value throughout the application, preventing accidental silent defaults.
**Alternatives considered:** Keeping parallel structures (e.g., `terms` and `terms_provenance`). Rejected because it is error-prone and easy for the UI to read a value without checking its provenance status.

## 5. Cloud Native Deployment (Google Cloud)
**Decision:** Architect, containerize, and deploy the application natively on Google Cloud Platform (GCP). The Python backend will be deployed as a stateless service on Google Cloud Run, utilizing Google Cloud Secret Manager for API keys, and interacting directly with Vertex AI / Gemini API endpoints. The frontend will be served statically (e.g., via Firebase Hosting or Cloud Storage + Cloud CDN).
**Rationale:** Constitution Principle V explicitly mandates a Gemini Foundation and Google Cloud Native Deployment. Furthermore, Cloud Run's serverless, ephemeral nature inherently enforces Principle I (Zero-Retention Client Privacy), ensuring that no user scenarios or documents can persist between requests.
**Alternatives considered:** Traditional stateful servers (Compute Engine) or other cloud providers. Rejected because they violate Constitution Principle V and introduce compliance risks regarding state persistence (Principle I).

## 6. Correlation Matrix Validity (Basket Options)
**Decision:** Implement Higham's algorithm (or a similar nearest positive semi-definite projection via `numpy.linalg.eigh`) when the user-supplied correlation matrix is not mathematically valid.
**Rationale:** Private-wealth users may input arbitrary correlation matrices for worst-of baskets (up to 5 underlyings). These inputs might not be positive semi-definite, which would cause Cholesky decomposition to fail during correlated path generation. Computing the nearest valid matrix ensures the simulation can gracefully handle edge-case inputs without crashing (CHK005).

## 7. LLM Reliability & Fallbacks
**Decision:** Enforce JSON schema retry fallbacks, rate-limit backoffs (HTTP 429), and strict PII heuristics. 
**Rationale:** To guarantee trust, the LLM extractor agent must handle Vertex AI downtime or hallucinated schemas gracefully. We mandate exponential backoff for rate limits, JSON parsing fallbacks for output drift, and a hard "Conflict" UI state for contradictory terms to prevent silent failures. PII extraction is contained purely in-memory and heavily redacted before any client-side PDF export (CHK008, CHK011).
