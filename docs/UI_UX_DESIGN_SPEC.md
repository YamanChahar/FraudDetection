# TRACE — UI/UX Design System & Interface Specification

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Product Discovery & System Architecture  
**Status:** Approved for Review  
**Product Codename:** TRACE (Transaction Risk & Fraud Analysis Platform)  
**Design Persona:** Senior FinTech Product Designer & Design Systems Architect  

---

## 1. Design Philosophy & FinTech Ergonomics

TRACE is designed for fraud analysts, risk leads, and compliance investigators who operate in high-consequence environments. In financial investigations, cognitive fatigue leads to missed fraud or unwarranted customer account blocks.

### 1.1 Guiding Principles
1. **Utilitarian Elegance Over Decorative Flash:** Zero neon gradients, zero glassmorphism blurs, and zero decorative "AI sparkles." Every pixel serves data legibility and operational speed.
2. **High Information Density with High Breathing Room:** Financial tables and charts must present rich multidimensional data without feeling claustrophobic.
3. **Calm, Authoritative Visual Hierarchy:** An intentional Warm Ivory and Charcoal aesthetic grounded by tactile stone borders and a measured Terracotta accent.
4. **Instant Semantic Recognition:** Status indicators use carefully balanced natural mineral tones (Sage Olive for low risk, Ochre Amber for review, Rust Terracotta for critical risk).
5. **Tabular Numerals Everywhere:** Financial amounts, timestamps, risk scores, and percentages are formatted with monospace or tabular-num typography (`font-variant-numeric: tabular-nums`) to ensure strict vertical alignment in columns.

---

## 2. Design System Tokens & Color Palette

### 2.1 The TRACE Strict Color Palette

| Token Name | Hex Code | Semantic Role & Usage |
| :--- | :--- | :--- |
| `bg-primary` | `#F5F2EA` | **Warm Ivory:** The primary canvas background across all main application workspaces. Reduces eye strain compared to harsh stark white. |
| `surface-sidebar` | `#25251F` | **Deep Charcoal:** The persistent left navigation sidebar. Provides grounding contrast and structural framing. |
| `surface-card` | `#FCFAF6` | **Warm White:** Primary surface for cards, data tables, modals, and metric panels. Crisp, clean, and distinct against Warm Ivory. |
| `surface-subtle` | `#EFECE3` | **Subtle Sand:** Secondary container fills, table header rows, input background defaults, and pill badges. |
| `text-primary` | `#1B1B18` | **Deep Charcoal:** Primary headings, active values, monetary figures, and high-emphasis labels. |
| `text-secondary` | `#5C5A53` | **Muted Umber:** Supporting descriptions, table column headers, metadata timestamps, and inactive tab labels. |
| `text-muted` | `#8C897E` | **Stone Grey:** Placeholder text, disabled controls, breadcrumb separators, and subtle helper captions. |
| `border-stone` | `#DDD7CD` | **Muted Stone:** 1px borders dividing cards, table rows, and input fields. Defines structure without harsh visual noise. |
| `border-dark` | `#3A3A32` | **Charcoal Stone:** Subtle dividers and active hover states inside the dark sidebar. |
| `accent-terracotta`| `#B65D3A` | **Terracotta:** The primary interactive brand accent. Used sparingly for primary CTA buttons, active route indicators, and key focus states. |
| `accent-hover` | `#9F4E2F` | **Dark Terracotta:** Hover and active press state for primary interactive elements. |

### 2.2 Semantic Status Indicators (Non-Blue, Non-Purple Protocol)

> **Strict Rule:** Traditional SaaS blue (`#2563EB`) and generic AI purple (`#7C3AED`) are **strictly prohibited**. TRACE uses natural mineral tones that harmonize with the Warm Ivory and Charcoal base:

| Status / Risk Tier | Foreground Color | Background Tint | Border Tint | Usage in Interface |
| :--- | :--- | :--- | :--- | :--- |
| **Low Risk / Approved** | `#2E5A36` (Sage Forest) | `#EEF5F0` | `#C6DEC9` | Approved transactions, healthy system state, low risk scores (0-30). |
| **Medium Risk / Review** | `#8F5D18` (Ochre Amber) | `#FDF6E9` | `#F2DCAC` | Under review, moderate risk scores (31-70), manual verification needed. |
| **High / Critical Risk** | `#A83824` (Rust Terracotta) | `#FBEBE8` | `#F3BEB5` | Flagged transactions, high/critical risk (71-100), active fraud alerts. |
| **Neutral / Informational**| `#4A4842` (Dark Slate) | `#EFECE3` | `#DDD7CD` | Closed cases, dismissed alerts, inactive baseline metrics. |

---

## 3. Typography Hierarchy

TRACE standardizes on **Inter** (with optional support for **Manrope**) paired with monospace tabular figures for financial data.

- **Display / Page Heading:** Inter, Semi-Bold (600), 24px / line-height 32px, Letter-spacing: -0.02em, Color: `text-primary` (`#1B1B18`).
- **Section Heading / Card Title:** Inter, Medium (500), 16px / line-height 24px, Letter-spacing: -0.01em, Color: `text-primary` (`#1B1B18`).
- **Data / Metric Large:** Inter, Semi-Bold (600), 32px / line-height 38px, `font-variant-numeric: tabular-nums`, Letter-spacing: -0.03em.
- **Body Regular:** Inter, Regular (400), 14px / line-height 20px, Color: `text-primary` (`#1B1B18`).
- **Metadata / Column Headers:** Inter, Medium (500), 12px / line-height 16px, Uppercase, Letter-spacing: 0.05em, Color: `text-secondary` (`#5C5A53`).
- **Financial / Numerical Figures:** JetBrains Mono or Inter Tabular, Regular (400), 13px / line-height 18px, `font-variant-numeric: tabular-nums`.

---

## 4. Layout Architecture & Navigation Shell

The application layout is structured as a two-column viewport with a fixed-width dark sidebar and a responsive main workspace:

```
┌──────────────┬────────────────────────────────────────────────────────┐
│ TRACE        │ Top Utility Bar (Breadcrumbs, Model Badge, Profile)    │
│              ├────────────────────────────────────────────────────────┤
│ Overview     │                                                        │
│ Fraud Lab    │                                                        │
│ Transactions │                                                        │
│ Alerts (3)   │ Main Content Workspace                                 │
│ Models       │ (Warm Ivory Canvas #F5F2EA)                            │
│ Batch Test   │                                                        │
│ Settings     │                                                        │
│              │                                                        │
│ ──────────── │                                                        │
│ User Profile │                                                        │
└──────────────┴────────────────────────────────────────────────────────┘
```

- **Sidebar (Width: 260px, Background: `#25251F`):**
  - Brand header: Bold geometric TRACE wordmark in Warm Ivory (`#F5F2EA`) with a small Terracotta (`#B65D3A`) dot.
  - Primary Navigation Links with 18px SVG outline icons, 12px text padding, and subtle active background (`#313129`) with a 3px left Terracotta indicator bar.
  - Live Alert Counter badge on "Fraud Alerts" rendered in Rust Terracotta.
  - Active Model Status pill at bottom showing model name (`RF v1.0.0`) and healthy ping status.
- **Top Utility Header (Height: 56px, Background: `#FCFAF6`, Border-Bottom: `#DDD7CD`):**
  - Left: Contextual breadcrumbs (`Workspace / Fraud Testing Lab`).
  - Right: Environment badge (`DEVELOPMENT` / `STAGING` / `PRODUCTION`), system connection status pills, and user avatar dropdown.
- **Main Workspace Canvas (Background: `#F5F2EA`):**
  - Max content width: `1440px` with responsive padding (`px-6 py-6` to `px-10 py-8`).

---

## 5. Comprehensive Page-Level Specifications

### 5.1 Page 1: Overview
- **Purpose:** Central operational dashboard providing immediate visibility into recent transaction risk trends, active alerts requiring triage, and model health.
- **Main Actions:**
  - Filter timeline (Last 24 Hours, 7 Days, 30 Days).
  - Quick-action buttons: "Launch Fraud Lab", "Review Urgent Alerts", "Upload Batch Dataset".
  - Click any high-risk transaction in the live feed to open its inspector drawer.
- **Information Displayed:**
  - 4 Key Metric Cards: Total Transactions Evaluated, High-Risk Flagged Count, Pending Alert Reviews, 30-Day False Positive Rate.
  - Transaction Volume & Risk Distribution timeline chart (stacked bar chart: Low, Medium, High).
  - Urgent Triage Queue table (top 5 unassigned high-risk alerts).
  - Model Infrastructure Status widget (Node Gateway, Python FastAPI, PostgreSQL status).
- **Components Required:** `MetricCard`, `RiskDistributionChart`, `RecentTransactionsTable`, `SystemStatusPill`.
- **Backend APIs:** `GET /api/v1/analytics/overview`.
- **States:**
  - *Loading:* Skeleton rectangular pulses for metric cards and chart area.
  - *Empty:* Calm empty state: "No transactions recorded in this time window."
  - *Error:* Non-blocking error banner with "Retry Connection" button.
  - *Success:* Clean metric display with subtle fade-in transition.

---

### 5.2 Page 2: Fraud Testing Lab (Flagship Core Feature)
- **Purpose:** Interactive testing workbench allowing risk analysts and model engineers to simulate transactions, evaluate multi-dimensional risk scores, inspect local SHAP explainability drivers, and adjust transaction attributes.
- **Main Actions:**
  - **Load Sample Benchmark:** Select from a dropdown of curated real-world scenarios ("Legitimate Morning Coffee", "Cross-Border High-Value Transfer", "Midnight Velocity Spike", "Card-Not-Present Luxury Retail").
  - **Manual Parameter Input:** Adjust amount, currency, merchant category, customer ID, channel, and PCA feature vectors (`V1` - `V28`).
  - **Execute Risk Analysis:** Primary Terracotta CTA button (`POST /fraud-testing/analyze`).
  - **Toggle Persistence:** Checkbox: "Persist transaction into historical ledger".
  - **Reset Form:** Clear inputs back to baseline defaults.
- **Information Displayed:**
  - **Left Panel (Transaction Configuration):** Form with grouped sections (Basic Details, Customer & Channel, Risk Feature Vectors).
  - **Right Panel (Inference & Explainability Results):**
    - **Risk Score Gauge:** Prominent semi-circular meter (0 to 100) color-coded by risk tier with tabular numeric display.
    - **Operational Recommendation Badge:** `APPROVE`, `REVIEW`, or `DECLINE`.
    - **Model Probability & Latency:** Raw probability (e.g., `0.8942`) and model compute duration (e.g., `28ms`).
    - **Feature Attribution Breakdown (SHAP):** Waterfall/horizontal bar chart showing top factors driving risk up (Rust Terracotta bars) versus factors lowering risk (Sage Forest bars).
    - **Plain-Language Factor Translation:** Clear explanatory text for each major driver.
- **Components Required:** `ScenarioSelector`, `TransactionForm`, `RiskScoreGauge`, `RecommendationBadge`, `ShapWaterfallChart`, `FeatureFactorList`.
- **Backend APIs:** `GET /api/v1/fraud-testing/samples`, `POST /api/v1/fraud-testing/analyze`.
- **States:**
  - *Idle / Initial:* Clean form with helper prompt: "Load a benchmark scenario or enter parameters to simulate fraud scoring."
  - *Loading:* Primary button displays spinning indicator; right panel shows subtle shimmer over score gauge.
  - *Error:* Inline form validation highlights invalid fields in Rust Terracotta; server errors display banner with error details.
  - *Success:* Smooth animation of risk gauge needle settling on calculated score; feature attribution bars expand horizontally.

---

### 5.3 Page 3: Transaction Explorer
- **Purpose:** Full searchable ledger of all historical and simulated transactions for auditing, data validation, and trend discovery.
- **Main Actions:**
  - Global search by Transaction ID, Customer ID, or Merchant.
  - Filter by Date Range, Risk Tier, Status, and Amount thresholds.
  - Sort by any column header (Timestamp, Amount, Risk Score).
  - Click row to slide open detailed Transaction Detail Drawer.
  - Export filtered ledger to CSV.
- **Information Displayed:**
  - High-density data table: Timestamp, Transaction ID, Customer ID, Merchant Category, Amount, Risk Score Pill, Operational Status Badge, Actions.
  - Server-side pagination controls (Records per page: 25, 50, 100).
- **Components Required:** `DataTable`, `FilterToolbar`, `PaginationControls`, `TransactionDetailDrawer`.
- **Backend APIs:** `GET /api/v1/transactions`, `GET /api/v1/transactions/:id`.
- **States:**
  - *Loading:* 10 rows of table skeleton shimmers.
  - *Empty:* "No transactions found matching the selected filters. Clear filters to view full ledger."
  - *Error:* Table replaced with warning banner and reload button.

---

### 5.4 Page 4: Fraud Alerts & Case Management
- **Purpose:** Dedicated triage queue for flagged transactions requiring human investigator review, disposition updates, and escalation notes.
- **Main Actions:**
  - Filter queue by status (`PENDING_REVIEW`, `UNDER_INVESTIGATION`, `CONFIRMED_FRAUD`, `FALSE_POSITIVE`).
  - Assign alert to self or team member.
  - Update alert disposition with mandatory resolution notes.
  - View full chronological investigation audit history.
- **Information Displayed:**
  - Triage summary banner (Pending Count, Critical Alerts Count, Average Resolution Time).
  - Alert Queue list cards with severity pill, transaction snapshot, trigger reason, and time in queue.
  - Detail pane showing transaction evidence, customer profile, and linked SHAP explanation.
  - Add Note & Disposition Action Bar.
- **Components Required:** `AlertQueueList`, `SeverityBadge`, `DispositionModal`, `InvestigationAuditTimeline`.
- **Backend APIs:** `GET /api/v1/alerts`, `PATCH /api/v1/alerts/:id/status`.
- **States:**
  - *Loading:* Skeleton cards in queue list.
  - *Empty:* "All alerts resolved. No transactions currently pending investigation."
  - *Success:* Toast notification confirming alert status update; queue counter decreases.

---

### 5.5 Page 5: Model Performance Analytics
- **Purpose:** Detailed machine learning governance dashboard tracking model accuracy, discrimination metrics, and holdout validation reports.
- **Main Actions:**
  - Switch model evaluation views (Active Random Forest Champion vs. Challenger XGBoost).
  - Adjust decision threshold preview slider to inspect theoretical precision-recall trade-offs.
  - Export model evaluation report.
- **Information Displayed:**
  - Active Model Specification Banner (Algorithm, Version Tag, Holdout Test Size: 56,962 transactions).
  - Primary Metric Tiles: PR-AUC (0.8462), Recall (0.8469), Precision (0.7217), F1-Score (0.7793), ROC-AUC (0.9735).
  - 2x2 Confusion Matrix Card (True Negatives: 56,832, False Positives: 32, False Negatives: 15, True Positives: 83).
  - Precision-Recall Curve chart and ROC Curve chart.
  - Global Feature Importance bar chart.
- **Components Required:** `MetricTileGrid`, `ConfusionMatrixGrid`, `PrCurveChart`, `FeatureImportanceChart`.
- **Backend APIs:** `GET /api/v1/models/active`, `GET /api/v1/models/metrics`.
- **States:**
  - *Loading:* Chart and metric skeletons.
  - *Success:* High-contrast crisp charts rendered with customized warm charcoal and terracotta color scales.

---

### 5.6 Page 6: Dataset Testing (Batch Analysis)
- **Purpose:** Portfolio stress-testing allowing risk leads to upload transaction files (CSV/JSON), track batch evaluation jobs, and inspect aggregate risk exposure.
- **Main Actions:**
  - Drag-and-drop file upload zone (supports CSV/JSON up to 50MB / 50,000 records).
  - Preview file headers and map columns to expected schema.
  - Launch Batch Job.
  - Download enriched results CSV.
- **Information Displayed:**
  - Upload dropzone with format requirements and downloadable template CSV.
  - Active & Past Batch Jobs Table (Job ID, File Name, Total Records, Flagged Count, Status, Created At).
  - Real-time Progress Bar (`Processing 14,200 of 25,000 records...`).
  - Batch Results Summary: High-Risk Total Volume ($), Risk Tier Distribution Bar, Mean Risk Score.
- **Components Required:** `FileDropzone`, `JobProgressBar`, `BatchSummaryCard`, `BatchJobHistoryTable`.
- **Backend APIs:** `POST /api/v1/batch-jobs/upload`, `GET /api/v1/batch-jobs/:id`.
- **States:**
  - *Upload Drag Over:* Border transitions to Terracotta dashed stroke with Warm White fill.
  - *Processing:* Polling progress bar updating every 2 seconds.
  - *Error:* Highlights specific row errors in uploaded CSV (e.g., "Row 412: Amount must be numeric").
  - *Complete:* Summary card with download button enabled.

---

### 5.7 Page 7: Settings & Administration
- **Purpose:** Operational parameter configuration, alert threshold tuning, system health diagnostics, and user account management.
- **Main Actions:**
  - Calibrate global operational alert threshold slider (default: 70).
  - Test connectivity of backend services (Node, Python ML, PostgreSQL).
  - Manage user accounts and RBAC permissions (Admin only).
  - Update personal credentials.
- **Information Displayed:**
  - System Configuration panel (Alert Threshold, Default Currency, Timeout Limits).
  - Infrastructure Health diagnostic cards with latency pings.
  - User Management table (Name, Email, Role, Status, Last Login).
- **Components Required:** `ThresholdSlider`, `ServiceHealthDiagnosticCard`, `UserManagementTable`.
- **Backend APIs:** `GET /api/v1/settings`, `PATCH /api/v1/settings/threshold`, `GET /api/v1/users`.
- **States:**
  - *Success:* Toast: "System configuration saved successfully."

---

## 6. Micro-Interactions, Feedback & Transitions

1. **Button Hover & Active States:** Buttons subtly darken by 10% on hover (`#9F4E2F` for Terracotta) with a 150ms linear transition. Active click applies a slight scale down (`transform: scale(0.98)`).
2. **Table Row Hover:** Table rows transition to Warm Ivory (`#F5F2EA`) on hover with cursor pointer, signaling clickability.
3. **Modal & Drawer Overlays:** Dim background overlay uses semi-transparent Charcoal (`rgba(37, 37, 31, 0.45)`) with a clean slide-in transition from right for detail drawers.
4. **Toast Notifications:** Pinned to top-right viewport; styled with Stone borders, Warm White background, and appropriate mineral indicator dot.
