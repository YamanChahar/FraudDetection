# TRACE — Local Setup & Development Guide

This guide provides step-by-step instructions for running the TRACE platform on your local machine.

---

## 1. Prerequisites

Ensure you have the following installed on your system:

- **Node.js:** v20.x or v24.x (`node -v`)
- **npm:** v10.x or higher (`npm -v`)
- **Python:** v3.11, v3.12, or v3.13 (`python --version`)
- **MongoDB:** (Optional in development) MongoDB Community Server 7.0+. If not installed, TRACE automatically starts an embedded memory database.

---

## 2. Repository Cloning & Environment Setup

```bash
git clone https://github.com/your-username/trace-fraud-platform.git
cd trace-fraud-platform
```

### Configure Environment Files
Copy the example environment files for each tier:

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env

# ML Service
cp ml-service/.env.example ml-service/.env
```

---

## 3. Dependency Installation

### Step A: Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step B: Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step C: Python ML Service Virtual Environment
```bash
# Create virtual environment in root
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install ML requirements
pip install -r ml-service/requirements.txt
```

---

## 4. Machine Learning Model Setup

TRACE comes with serialized champion model artifacts in `ml-service/models/`. If you wish to retrain candidate models (Logistic Regression, Random Forest, XGBoost) and benchmark on synthetic data:

```bash
cd ml-service
python -m app.core.trainer
cd ..
```

This generates `ml-service/models/champion_model.joblib` and `champion_metadata.json`.

---

## 5. Starting the Services

Open three separate terminal windows:

### Terminal 1 — Machine Learning Microservice (Port 8000)
```bash
cd ml-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Health Check:* Open `http://localhost:8000/health` in your browser.

### Terminal 2 — Backend API Gateway (Port 4000)
```bash
cd backend
npm run dev
```
*Health Check:* Open `http://localhost:4000/health` in your browser.

### Terminal 3 — Frontend Web Application (Port 5173)
```bash
cd frontend
npm run dev
```
*Access UI:* Navigate to `http://localhost:5173`.

---

## 6. Default User Credentials

You can register an initial account directly through the UI at `http://localhost:5173/register`, or use the built-in development credentials:

- **Email:** `lead@trace.local`
- **Password:** `Password123!`
- **Role:** `ADMIN`

---

## 7. Running the Test Suites

### Backend Tests (50 Test Cases)
```bash
cd backend
npm test
```

### ML Microservice Tests (14 Test Cases)
```bash
cd ml-service
python -m pytest
```

### Frontend Production Build Test
```bash
cd frontend
npm run build
```
