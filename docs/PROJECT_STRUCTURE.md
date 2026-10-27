# TRACE — Monorepo Architecture & Directory Structure Specification

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Product Discovery & System Architecture  
**Status:** Approved for Review  
**Product Codename:** TRACE (Transaction Risk & Fraud Analysis Platform)  

---

## 1. Monorepo Organization Strategy

TRACE is organized as an enterprise monorepo housing the three core application tiers alongside shared documentation, configuration, and end-to-end test suites.

```
trace-platform/
├── apps/
│   ├── web/                    # React.js + Vite Client Application
│   └── api/                    # Node.js + Express.js Main Backend Gateway
├── services/
│   └── ml-service/             # Python + FastAPI Machine Learning Inference Microservice
├── docs/                       # Architectural Specifications, PRDs & Design Systems
├── tests/                      # End-to-End & Integration Test Suites
├── docker/                     # Container Definitions & Orchestration
├── package.json                # Root workspace configuration (npm / pnpm / yarn)
└── README.md                   # Repository overview and developer onboarding
```

---

## 2. Exhaustive Directory & File Tree

```
trace-platform/
│
├── docs/                                   # Architecture & Product Specifications
│   ├── PRODUCT_REQUIREMENTS.md             # PRD, user personas, workflows, NFRs
│   ├── SYSTEM_ARCHITECTURE.md              # System design, boundaries, auth, logging
│   ├── DATABASE_DESIGN.md                  # Normalized schema, ERD, Prisma model
│   ├── API_CONTRACT.md                     # REST API schemas, headers, error contracts
│   ├── ML_INTEGRATION_PLAN.md              # ML lifecycle, algorithms, SHAP, metrics
│   ├── UI_UX_DESIGN_SPEC.md                # Design system tokens, pages, component states
│   ├── PROJECT_STRUCTURE.md                # Monorepo directory map and responsibility
│   ├── DEVELOPMENT_ROADMAP.md              # Structured phase-by-phase execution plan
│   └── ACCEPTANCE_CRITERIA.md              # Formal Given-When-Then verification criteria
│
├── apps/
│   ├── web/                                # FRONTEND: React + Vite + Tailwind CSS
│   │   ├── index.html                      # Single page entry HTML
│   │   ├── package.json                    # Frontend dependencies & scripts
│   │   ├── vite.config.js                  # Vite bundler configuration & proxy setup
│   │   ├── tailwind.config.js              # Custom Warm Ivory & Terracotta palette config
│   │   ├── src/
│   │   │   ├── main.jsx                    # React application bootstrap
│   │   │   ├── App.jsx                     # Root router and global state provider
│   │   │   ├── index.css                   # Global styles & design system CSS tokens
│   │   │   │
│   │   │   ├── assets/                     # Static vectors, icons, branding marks
│   │   │   │
│   │   │   ├── components/                 # Reusable Presentation & Layout Components
│   │   │   │   ├── layout/                 # Structural shell components
│   │   │   │   │   ├── AppShell.jsx        # Fixed dark sidebar + header + content frame
│   │   │   │   │   ├── Sidebar.jsx         # 260px Charcoal navigation bar
│   │   │   │   │   ├── Header.jsx          # Top utility bar with status and breadcrumbs
│   │   │   │   │   └── Footer.jsx          # Audit metadata & version footer
│   │   │   │   │
│   │   │   │   ├── ui/                     # Design system primitive atomic components
│   │   │   │   │   ├── Button.jsx          # Primary Terracotta, secondary, ghost buttons
│   │   │   │   │   ├── Card.jsx            # Warm White card surface with Stone borders
│   │   │   │   │   ├── Input.jsx           # Form text, number, and search inputs
│   │   │   │   │   ├── Select.jsx          # Dropdown selector with keyboard nav
│   │   │   │   │   ├── Badge.jsx           # Risk tier and status mineral pills
│   │   │   │   │   ├── Modal.jsx           # Accessible dialog overlay
│   │   │   │   │   ├── Drawer.jsx          # Slide-out detail drawer for transactions
│   │   │   │   │   ├── Skeleton.jsx        # Data shimmer loading placeholders
│   │   │   │   │   └── Table.jsx           # High-density financial data table
│   │   │   │   │
│   │   │   │   ├── fraud-lab/              # Fraud Testing Lab specific components
│   │   │   │   │   ├── ScenarioSelector.jsx# Curated benchmark scenario picker
│   │   │   │   │   ├── TransactionForm.jsx # Manual parameter entry form
│   │   │   │   │   ├── RiskGauge.jsx       # 0-100 calibrated risk meter
│   │   │   │   │   ├── RecommendationCard.jsx # Action advice (Approve/Review/Decline)
│   │   │   │   │   └── ShapWaterfall.jsx   # Top feature drivers bar chart
│   │   │   │   │
│   │   │   │   └── charts/                 # Data visualization widgets
│   │   │   │       ├── VolumeTrendChart.jsx# Transaction volume time series
│   │   │   │       ├── PrCurveChart.jsx    # Precision-Recall curve visualizer
│   │   │   │       └── ConfusionMatrix.jsx # 2x2 confusion matrix grid
│   │   │   │
│   │   │   ├── pages/                      # Application Route Views
│   │   │   │   ├── Overview.jsx            # Main dashboard overview
│   │   │   │   ├── FraudTestingLab.jsx     # Interactive transaction testing lab
│   │   │   │   ├── TransactionExplorer.jsx # Full searchable transaction ledger
│   │   │   │   ├── FraudAlerts.jsx         # Alert triage & investigation queue
│   │   │   │   ├── ModelPerformance.jsx    # Model validation & accuracy analytics
│   │   │   │   ├── DatasetTesting.jsx      # Batch file upload & portfolio testing
│   │   │   │   ├── Settings.jsx            # Threshold calibration & system settings
│   │   │   │   ├── Login.jsx               # User authentication view
│   │   │   │   └── NotFound.jsx            # 404 error fallback view
│   │   │   │
│   │   │   ├── hooks/                      # Custom React State & Data Hooks
│   │   │   │   ├── useAuth.js              # Authentication state, login, logout, user
│   │   │   │   ├── useTransactions.js      # Paginated ledger data fetching
│   │   │   │   ├── useFraudScoring.js      # Fraud testing lab inference hook
│   │   │   │   └── useAlerts.js            # Alert queue management & status mutations
│   │   │   │
│   │   │   └── services/                   # API Client Layer
│   │   │       ├── api.js                  # Axios instance with interceptors & JWT refresh
│   │   │       ├── authService.js          # Authentication endpoint bindings
│   │   │       ├── fraudService.js         # Fraud lab & scoring API bindings
│   │   │       ├── transactionService.js   # Transaction ledger API bindings
│   │   │       └── batchService.js         # Batch file upload & polling bindings
│   │
│   └── backend/                            # MAIN BACKEND: Node.js + Express.js + Mongoose
│       ├── package.json                    # Backend dependencies & run scripts
│       ├── legacy_prisma_archive/          # Archived historical PostgreSQL schema & migrations
│       │   ├── schema.prisma               # Legacy PostgreSQL schema definition
│       │   └── migrations/                 # Versioned SQL migration histories
│       │
│       ├── src/
│       │   ├── server.js                   # HTTP server entrypoint & port binding
│       │   ├── app.js                      # Express application assembly & middleware stack
│       │   │
│       │   ├── config/                     # Environment & Service Configuration
│       │   │   ├── env.js                  # Validated environment variables (Zod)
│       │   │   └── database.js             # Resilient Mongoose connection manager
│       │   │
│       │   ├── models/                     # Mongoose Schema & Model Definitions
│       │   │   ├── User.model.js
│       │   │   ├── RefreshToken.model.js
│       │   │   ├── Transaction.model.js
│       │   │   ├── ModelVersion.model.js
│       │   │   ├── Prediction.model.js
│       │   │   ├── FraudAlert.model.js
│       │   │   ├── InvestigationRecord.model.js
│       │   │   ├── DatasetTestingJob.model.js
│       │   │   └── AuditLog.model.js
│       │   │
│       │   ├── repositories/               # Encapsulated Mongoose Query Layer
│       │   │   ├── userRepository.js
│       │   │   ├── transactionRepository.js
│       │   │   ├── modelRepository.js
│       │   │   ├── predictionRepository.js
│       │   │   ├── fraudAlertRepository.js
│       │   │   ├── investigationRepository.js
│       │   │   ├── datasetJobRepository.js
│       │   │   └── auditRepository.js
│       │   │
│       │   ├── middleware/                 # Request Pipeline Middleware
│       │   │   ├── auth.js                 # JWT verification & claims attachment
│       │   │   ├── rbac.js                 # Role-based access control enforcer
│       │   │   ├── validator.js            # Generic Zod request schema validator
│       │   │   ├── errorHandler.js         # Centralized error mapping & standard envelope
│       │   │   ├── correlationId.js        # Request tracking ID injector
│       │   │   └── rateLimiter.js          # Rate limit enforcement
│       │   │
│       │   ├── routes/                     # REST Route Declarations
│       │   │   ├── index.js                # Master route aggregator (`/api/v1`)
│       │   │   ├── authRoutes.js           # `/auth/*`
│       │   │   ├── fraudRoutes.js          # `/fraud-testing/*`
│       │   │   ├── transactionRoutes.js    # `/transactions/*`
│       │   │   ├── alertRoutes.js          # `/alerts/*`
│       │   │   ├── batchRoutes.js          # `/batch-jobs/*`
│       │   │   ├── modelRoutes.js          # `/models/*`
│       │   │   └── analyticsRoutes.js      # `/analytics/*`
│       │   │
│       │   ├── controllers/                # Request Orchestration Controllers
│       │   │   ├── authController.js       # Handles login, refresh, profile requests
│       │   │   ├── fraudController.js      # Handles single transaction scoring requests
│       │   │   ├── transactionController.js# Handles ledger querying & details
│       │   │   ├── alertController.js      # Handles alert triage & disposition changes
│       │   │   ├── batchController.js      # Handles batch uploads & job status polling
│       │   │   └── modelController.js      # Handles model performance metadata queries
│       │   │
│       │   ├── services/                   # Core Business Logic & External Integrations
│       │   │   ├── mlClientService.js      # HTTP client calling Python FastAPI microservice
│       │   │   ├── fraudScoringService.js  # Orchestrates scoring, saving & alert triggers
│       │   │   ├── transactionService.js   # Prisma queries for transactions ledger
│       │   │   ├── alertService.js         # Alert creation, assignment, and audit records
│       │   │   └── batchProcessorService.js# Asynchronous chunked batch processor
│       │   │
│       │   └── schemas/                    # Zod Validation Schemas
│       │       ├── authSchemas.js          # Login & register validation rules
│       │       ├── transactionSchemas.js   # Transaction payload validation rules
│       │       └── alertSchemas.js         # Status update & notes validation rules
│
└── services/
    └── ml-service/                         # ML INFERENCE SERVICE: Python + FastAPI
        ├── requirements.txt                # Python ML dependencies (scikit-learn, xgboost, shap)
        ├── main.py                         # FastAPI application entrypoint & lifespan events
        │
        ├── app/
        │   ├── core/                       # Service Configuration & Constants
        │   │   ├── config.py               # Pydantic Settings configuration
        │   │   └── security.py             # Internal shared API key validator
        │   │
        │   ├── schemas/                    # Pydantic Request & Response Schemas
        │   │   ├── transaction.py          # Input feature tensor models
        │   │   └── prediction.py           # Calibrated risk & explanation models
        │   │
        │   ├── api/                        # Internal REST Endpoints
        │   │   ├── router.py               # Master internal router (`/internal/v1`)
        │   │   ├── health.py               # Health & model readiness endpoints
        │   │   ├── predict.py              # Single & batch prediction endpoints
        │   │   └── metadata.py             # Active model parameters & metrics endpoint
        │   │
        │   └── ml/                         # ML Inference & Explainability Logic
        │       ├── loader.py               # Model & transformer serialization loader
        │       ├── preprocessor.py         # Feature transformation & alignment pipeline
        │       ├── engine.py               # Estimator inference execution
        │       ├── calibrator.py           # Probability to 0-100 risk score calibration
        │       └── explainer.py            # SHAP TreeExplainer attribution computer
        │
        ├── models/                         # Serialized Model Artifacts
        │   ├── random_forest_champion.joblib # Frozen Random Forest model binary
        │   ├── preprocessor.joblib         # Frozen feature scaler & encoder
        │   └── model_metadata.json         # Feature list, classes, and hyperparameters
        │
        └── reports/                        # Authoritative Evaluation Reports
            └── model_comparison.json       # Authoritative benchmark results & metrics
```

---

## 3. Directory Responsibilities & Engineering Boundaries

1. **`apps/web` (Client Tier):**
   - Strictly responsible for presentation, user interaction, client-side routing, and rendering data.
   - Contains **no direct database credentials** or internal ML service endpoints. All network traffic routes exclusively through `apps/api`.
2. **`apps/api` (Application & Orchestration Tier):**
   - The authoritative backend gateway for authentication, authorization, business rules, relational persistence, and external reporting.
   - Serves as the single client interacting with PostgreSQL via Prisma.
   - Encapsulates the downstream Python ML service behind robust HTTP timeouts, retries, and error handling.
3. **`services/ml-service` (Machine Learning Tier):**
   - Pure, stateless inference engine. Contains zero user management, zero SQL schemas, and zero web routing for public clients.
   - Exposes internal endpoints designed for sub-100ms mathematical feature transformation, model inference, risk calibration, and SHAP calculations.
