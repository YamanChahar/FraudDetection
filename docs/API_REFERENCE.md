# TRACE — API Reference Specification

All versioned endpoints are prefixed with `/api/v1` and follow standard JSON response envelopes.

---

## 1. Response Envelope Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-27T19:20:00.000Z",
    "requestId": "uuid-v4",
    "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      { "field": "amount", "message": "Amount must be a positive number" }
    ]
  },
  "meta": {
    "timestamp": "2026-10-27T19:20:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

---

## 2. Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new analyst account.
- **Request Body:**
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@trace.local",
    "password": "Password123!",
    "role": "ANALYST"
  }
  ```
- **Response:** `201 Created` with user profile and initial access/refresh token pair.

### `POST /api/v1/auth/login`
Authenticates user credentials.
- **Request Body:**
  ```json
  {
    "email": "lead@trace.local",
    "password": "Password123!"
  }
  ```
- **Response:** `200 OK` with user profile and tokens.

### `POST /api/v1/auth/refresh`
Rotates access and refresh tokens.
- **Request Body:** `{ "refreshToken": "string" }`
- **Response:** `200 OK` with new access and refresh token.

### `POST /api/v1/auth/logout`
Revokes active session refresh token.
- **Request Body:** `{ "refreshToken": "string" }`
- **Response:** `200 OK`.

---

## 3. Transaction Endpoints (`/api/v1/transactions`)

### `POST /api/v1/transactions`
Creates a transaction and orchestrates real-time ML scoring.
- **Headers:** `Authorization: Bearer <JWT>`
- **Request Body:**
  ```json
  {
    "externalTransactionId": "TX-90214",
    "accountId": "ACC-4491",
    "amount": 420.50,
    "currency": "USD",
    "channel": "ONLINE",
    "merchantCategory": "ELECTRONICS",
    "features": {
      "Time": 86400,
      "Amount": 420.50,
      "V14": -3.8,
      "V4": 2.4
    }
  }
  ```
- **Response:** `201 Created` with transaction, prediction, SHAP attribution, and auto-generated alert (if risk >= 71).

### `GET /api/v1/transactions`
Lists transactions with filtering and pagination.
- **Query Parameters:** `page`, `limit`, `channel`, `riskLevel`, `search`
- **Response:** `200 OK` with array of transactions and pagination metadata.

### `GET /api/v1/transactions/:id`
Retrieves single transaction details and associated predictions.

---

## 4. Alert Endpoints (`/api/v1/alerts`)

### `GET /api/v1/alerts`
Retrieves fraud alert queue.
- **Query Parameters:** `status`, `severity`, `page`, `limit`
- **Response:** `200 OK` with alert list.

### `PATCH /api/v1/alerts/:id/status`
Updates alert status.
- **Allowed Roles:** `INVESTIGATOR`, `LEAD`, `ADMIN`
- **Request Body:** `{ "status": "IN_REVIEW" }`
- **Allowed Statuses:** `OPEN`, `IN_REVIEW`, `ESCALATED`, `RESOLVED`, `DISMISSED`

### `POST /api/v1/alerts/:id/investigate`
Records human investigation findings.
- **Allowed Roles:** `INVESTIGATOR`, `LEAD`, `ADMIN`
- **Request Body:**
  ```json
  {
    "findings": "Cardholder verified unauthorized POS transaction.",
    "decision": "CONFIRMED_FRAUD",
    "isFraud": true,
    "resolution": "Card frozen and chargeback initiated"
  }
  ```
- **Response:** `201 Created`.

---

## 5. Batch Testing Endpoints (`/api/v1/batch`)

### `POST /api/v1/batch/jobs`
Submits an asynchronous batch testing job (up to 25,000 records).
- **Allowed Roles:** `INVESTIGATOR`, `LEAD`, `ADMIN`
- **Request Body:**
  ```json
  {
    "datasetName": "Q4_Portfolio_Stress_Test.csv",
    "records": [ { "Time": 100, "Amount": 50.0, "V1": 0.1, ... } ]
  }
  ```
- **Response:** `202 Accepted` with initial queued job entity.

### `GET /api/v1/batch/jobs/:id`
Queries batch progress, completion state, and risk distribution breakdown.

---

## 6. Internal Machine Learning API (FastAPI Port 8000)

### `POST /internal/v1/predict`
Single transaction scoring and SHAP decomposition.
- **Headers:** `X-Internal-Service-Key: <SECRET_KEY>`
- **Request Body:**
  ```json
  {
    "features": { "Time": 100, "Amount": 25.0, "V14": -2.1 }
  }
  ```

### `POST /internal/v1/batch-predict`
Vectorized batch inference.
- **Headers:** `X-Internal-Service-Key: <SECRET_KEY>`
- **Request Body:**
  ```json
  {
    "transactions": [ { "Time": 100, "Amount": 25.0 } ]
  }
  ```

### `GET /internal/v1/model/metadata`
Returns champion model parameters, algorithm, and candidate evaluation benchmarks.
