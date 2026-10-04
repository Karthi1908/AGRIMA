# Feature Specification: Clear Termsheet Home & Dedicated Details View

**Feature Branch**: `002-clear-home-termsheet`

**Created**: 2026-10-02

**Status**: Draft

**Input**: User description: "make the home page clear . Just ask for the users termsheet and show only the termsheet details."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean Minimalist Termsheet Ingestion Landing (Priority: P1)

As a structured product specialist or prospective investor arriving at the platform, I want to see a clear, uncluttered landing page that simply and directly asks for my termsheet (via PDF/image upload, drag-and-drop, or sample selection), so that I am not distracted or confused by pre-loaded charts, synthetic sliders, or dense mock calculations before I have provided any document.

**Why this priority**: First impressions and cognitive clarity are critical. Currently, loading the application immediately renders complex payoff graphs, multiple asset sliders, return scenario cards, and mock tickers for an unrequested sample note. A clean, purpose-driven landing state lets users immediately understand the tool's purpose and start with their own termsheet.

**Independent Test**: Can be tested independently by loading the root URL in a fresh session and verifying that:
1. The landing screen displays only a refined brand header, a clear invitation to upload a termsheet, a prominent dropzone/upload area, and privacy assurances.
2. No simulation graphs, asset price sliders, or scenario return metrics are displayed until a termsheet is provided.

**Acceptance Scenarios**:

1. **Given** a new or reset browser session, **When** the user opens the home page, **Then** the page displays a clean, focused termsheet intake view with a prominent file dropzone, supported format badges (PDF, PNG, JPEG), and zero pre-loaded simulation widgets.
2. **Given** the clean landing state, **When** the user drags a termsheet document onto the dropzone or clicks to select a file, **Then** the system initiates extraction with an immediate, elegant visual scanning feedback state.
3. **Given** the clean landing state, **When** the user examines the interface, **Then** a privacy banner prominently reinforces Principle I (Zero-Retention: in-memory stateless parsing).

---

### User Story 2 - Dedicated Termsheet Economic Details Presentation (Priority: P1)

As a user who has submitted a termsheet, I want the system to transition smoothly to a dedicated Termsheet Details view that cleanly displays only the verified economic terms and contractual architecture of that termsheet, so that I can quickly inspect and confirm the key terms of the product without visual distraction.

**Why this priority**: Users need direct, unambiguous confirmation of extracted contract parameters (underlyings, initial fixings, strike levels, barrier levels, coupon rates, observation dates, and maturity mechanics) organized cleanly in high-readability editorial cards and tables.

**Independent Test**: Can be tested independently by submitting a termsheet (e.g. FCN, DCI, or Autocall Note) and verifying that the view transitions into a structured Termsheet Details display showing:
- Product Overview (Archetype, Title, Currency, Notional)
- Linked Underlyings table (Symbol, Name, Initial Fixing Spot, Strike/Barrier relative levels)
- Schedule & Barrier Architecture (Observation dates, Knock-Out barriers, Knock-In barriers, Coupon barriers & rates, Memory feature)
- Summary of Payoff Mechanics (Plain-language rules for coupon qualification, early autocall, and maturity capital redemption)

**Acceptance Scenarios**:

1. **Given** an uploaded termsheet with extracted parameters, **When** extraction completes and is confirmed, **Then** the homepage displays the dedicated Termsheet Details view formatted as clean, structured information cards.
2. **Given** the Termsheet Details view, **When** the user reviews the details, **Then** all issuer identities, banking logos, and investor account numbers remain strictly scrubbed and redacted in accordance with Constitution Principle II.
3. **Given** the Termsheet Details view, **When** reviewing multi-underlying products (e.g. 3-stock FCN), **Then** all underlying assets are presented in a clean comparative table highlighting initial fixing prices and respective barrier levels.

---

### User Story 3 - Reset and Change Termsheet (Priority: P2)

As a user reviewing termsheet details, I want an obvious, immediate action to "Upload Another Termsheet" or "Reset", so that I can easily analyze a different termsheet without reloading the browser or leaving persistent state behind.

**Why this priority**: Users frequently compare multiple termsheets sequentially. Providing a one-click return to the clean home state ensures a seamless multi-document advisory workflow.

**Independent Test**: Can be tested independently by clicking "Upload Another Termsheet" or "Reset Session" from the Termsheet Details view and verifying that the UI returns to the clean, empty landing state with memory cleared.

**Acceptance Scenarios**:

1. **Given** an active Termsheet Details view, **When** the user clicks "Upload Another Termsheet" or "Reset", **Then** the screen returns to the clean landing state.
2. **Given** a reset action, **When** the transition occurs, **Then** all in-memory termsheet parameters from the prior session are discarded completely.

---

### User Story 4 - Seamless Sample Termsheet Inspection (Priority: P3)

As a prospective user or evaluator without an immediate termsheet file on hand, I want an understated, secondary option on the landing page to load a sample termsheet, so that I can explore the termsheet details layout without being forced to locate a physical PDF.

**Why this priority**: Prevents a dead-end for first-time visitors or sales demonstrators who want to see how termsheet details are rendered before uploading proprietary documents.

**Independent Test**: Can be tested independently by clicking a sample termsheet option (e.g., "Try sample: 3-Stock FCN" or "Dual Currency DCI") on the clean landing page and verifying that it loads directly into the Termsheet Details view.

**Acceptance Scenarios**:

1. **Given** the clean landing state, **When** the user selects a discreet sample termsheet link, **Then** the system immediately loads the selected sample into the Termsheet Details view.
2. **Given** the clean landing state, **When** viewed on both mobile and desktop screens, **Then** sample termsheet links remain subtle and secondary to the primary upload dropzone.

---

### Edge Cases

- **Empty / Non-Termsheet Uploads**: What happens when an uploaded file cannot be parsed or is not a termsheet? The system stays on the landing screen, displays an inline, non-intrusive alert explaining the issue, and allows immediate re-upload without page refresh.
- **Large Multi-Underlying Baskets**: How does the Termsheet Details view render products with 4 or more underlyings? The table uses responsive horizontal scrolling or wrapped cards to preserve clean readability without breaking editorial alignment.
- **Missing or Irregular Barrier Schedule**: How does the view handle termsheets that lack periodic observation dates (e.g., a simple European DCI or pure growth certificate)? The observation schedule card gracefully collapses or adapts to show only the relevant final fixing parameters instead of empty rows.
- **Session Refresh**: What happens if the user refreshes the browser while viewing termsheet details? In strict adherence to Principle I (Zero-Retention Ephemeral RAM), the session resets cleanly to the initial upload landing state.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present a clean, distraction-free landing view on initial page load, containing only the header, a primary termsheet upload/intake component, and privacy indicators.
- **FR-002**: System MUST NOT render pre-loaded simulation canvases, underlying price sliders, or scenario return metrics on the initial landing screen.
- **FR-003**: System MUST provide an intuitive dropzone accepting PDF and common image formats (PNG, JPEG) with clear file drag-and-drop and file-picker support.
- **FR-004**: System MUST provide a subtle, non-intrusive option to load a pre-configured sample termsheet (e.g., FCN Autocall or DCI) for demonstration and testing purposes.
- **FR-005**: Upon completion of termsheet extraction, the system MUST transition to a dedicated Termsheet Details view that displays the contractual and economic parameters of the active termsheet.
- **FR-006**: The Termsheet Details view MUST include:
  - Product archetype badge and descriptive product title.
  - Core parameters: denomination currency, notional amount, issue date, and maturity date.
  - Underlying assets summary: ticker/symbol, name, initial fixing price, and currency.
  - Barrier architecture: knock-out (autocall) barrier %, knock-in barrier % (with European vs. American tag), coupon barrier %, and capital protection %.
  - Coupon terms: coupon rate %, coupon payment frequency, and memory coupon indicator.
  - Payoff summary: plain-language explanation of how returns and capital redemption are determined.
- **FR-007**: The Termsheet Details view MUST provide a prominent, one-click action to "Upload Another Termsheet" or "Change Termsheet", returning the interface to the clean initial landing state.
- **FR-008**: System MUST enforce strict counterparty data redaction (issuer names, distribution bank branding, investor identity) on the Termsheet Details view per Constitution Principle II.
- **FR-009**: System MUST support an optional, secondary toggle or action button within the Termsheet Details view ("Explore Interactive Simulator") for users who wish to proceed from reviewing details into interactive price simulation, while keeping the default view focused strictly on the termsheet details.
- **FR-010**: All session data in the Termsheet Details view MUST remain strictly in-memory (ephemeral) per Constitution Principle I.

### Key Entities

- **TermsheetDocument**: Represents the uploaded file (name, size, MIME type, ephemeral memory buffer) scrubbed of all persistent storage references.
- **ExtractedTermsheetDetails**: Structured representation of economic terms, including:
  - `product_title`: string
  - `archetype`: string (e.g., `FCN_AUTOCALL_NOTE`, `DCI`, `STEP_DOWN_AUTOCALL_NOTE`, `TWIN_WIN_NOTE`)
  - `denomination_currency`: string (e.g., `USD`, `EUR`)
  - `notional_amount`: number
  - `issue_date`: ISO date string
  - `maturity_date`: ISO date string
  - `underlyings`: list of `UnderlyingAsset` (symbol, name, initial_fixing, currency)
  - `barrier_schedule`: list of observation dates, knock-out %, knock-in %, coupon %, memory flag
  - `payoff_rules_summary`: plain-language breakdown of redemption logic
- **ViewModeState**: UI navigation state representing whether the user is on the `LANDING_UPLOAD` state or the `TERMSHEET_DETAILS` state.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Initial page load renders in under 1 second with zero extraneous simulation widgets or unrequested demo calculations.
- **SC-002**: 100% of first-time users can immediately identify where and how to upload their termsheet within 3 seconds of viewing the homepage.
- **SC-003**: Upon uploading a valid termsheet, the system presents the extracted Termsheet Details view within 5 seconds.
- **SC-004**: 100% of confidential counterparty identifiers (issuer institution, account numbers, client names) are absent from the rendered Termsheet Details view.
- **SC-005**: Users can return from the Termsheet Details view to the clean upload state with a single click, taking under 100ms with zero persistent session residue.

---

## Assumptions

- **Clean Default View**: Users prioritize understanding their specific termsheet parameters before (or instead of) engaging in deep scenario simulations; the simulation tools remain accessible as a secondary on-demand option rather than an overwhelming default.
- **Discreet Sample Option**: Including small, subtle links to sample termsheets benefits users exploring the system without files while maintaining the clean, focused aesthetic.
- **Stateless Session Scope**: No server-side persistence or user account storage is implemented, fully respecting Constitution Principle I.
- **Supported Formats**: Standard PDF files and standard scan images (PNG, JPEG) remain the primary ingestion formats.
