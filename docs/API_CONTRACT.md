# TRACE — API Contract & Specification

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Product Discovery & System Architecture  
**Status:** Approved for Review  
**Product Codename:** TRACE (Transaction Risk & Fraud Analysis Platform)  

---

## 1. Global API Standards

### 1.1 Base URLs
- **External Public API (Node.js Gateway):** `http://localhost:4000/api/v1`
- **Internal Microservice API (Python FastAPI):** `http://localhost:8000/internal/v1` (Not exposed to the public internet)

### 1.2 Uniform Response Envelope
Every endpoint in TRACE returns a consistent top-level JSON envelope:

#### Successful Response:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_5a1e8c9b2f",
    "timestamp": "2026-10-26T02:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 25,
      "totalRecords": 1042,
      "totalPages": 42
    }
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Transaction with ID trx_99214 not found",
    "details": [],
    "requestId": "req_5a1e8c9b2f",
    "timestamp": "2026-10-26T02:00:00.000Z"
  }
}
```

### 1.3 Standard Error Codes
| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Syntax error, malformed JSON, or missing headers. |
| `401` | `UNAUTHORIZED` | Missing, invalid, or expired JWT bearer token. |
| `403` | `FORBIDDEN` | Valid token, but user lacks necessary role permissions. |
| `404` | `RESOURCE_NOT_FOUND` | Target entity does not exist. |
| `409` | `CONFLICT` | Unique key violation (e.g. duplicate transaction ID). |
| `422` | `VALIDATION_ERROR` | Schema validation failure (bad parameters, out of bounds). |
| `429` | `RATE_LIMIT_EXCEEDED` | Request frequency exceeded configured threshold. |
| `502` | `BAD_GATEWAY` | Downstream Python ML service returned invalid response. |
| `503` | `SERVICE_UNAVAILABLE`| Downstream Python ML service unreachable or timed out. |
| `500` | `INTERNAL_SERVER_ERROR`| Unhandled server exception. |

---

## 2. Node.js Gateway REST Endpoints (Frontend <-> Node.js)

### 2.1 Authentication & Session
#### `POST /auth/login`
- **Purpose:** Authenticates user credentials and issues tokens.
- **Auth:** None (Public)
- **Request Body:**
  ```json
  {
    "email": "investigator@trace-risk.com",
    "password": "SecurePassword123!"
  }
  ```
- **Validation:** `email` must be valid email format; `password` min 8 characters.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "7f8b9c...",
      "user": {
        "id": "e2a1b4c6-...",
        "email": "investigator@trace-risk.com",
        "firstName": "Sarah",
        "lastName": "Vance",
        "role": "INVESTIGATOR"
      }
    }
  }
  ```

#### `POST /auth/refresh`
- **Purpose:** Exchanges a valid refresh token for a fresh access token.
- **Auth:** None
- **Request Body:**
  ```json
  {
    "refreshToken": "7f8b9c..."
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```

#### `GET /auth/me`
- **Purpose:** Returns authenticated user profile and active permissions.
- **Auth:** `Bearer <JWT>`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "e2a1b4c6-...",
      "email": "investigator@trace-risk.com",
      "firstName": "Sarah",
      "lastName": "Vance",
      "role": "INVESTIGATOR"
    }
  }
  ```

---

### 2.2 Fraud Testing Lab (Core Interactive Feature)

#### `GET /fraud-testing/samples`
- **Purpose:** Fetches pre-configured benchmark scenario transactions for one-click testing.
- **Auth:** `Bearer <JWT>`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "sample_legit_coffee",
        "title": "Low-Risk Retail POS Transaction",
        "description": "Standard recurring merchant category, daylight hours, normal velocity.",
        "payload": {
          "amount": 4.50,
          "currency": "USD",
          "merchantId": "merch_starbucks_481",
          "merchantCategory": "fast_food",
          "customerId": "cust_992144",
          "channel": "POS_CHIP",
          "rawFeatures": {
            "v1": -0.42, "v2": 0.15, "v3": 1.20, "v4": -0.85
          }
        }
      },
      {
        "id": "sample_high_risk_cnp",
        "title": "High-Risk Card-Not-Present Sudden Spike",
        "description": "Cross-border e-commerce transaction, midnight hours, 8x user median amount.",
        "payload": {
          "amount": 1850.00,
          "currency": "USD",
          "merchantId": "merch_crypto_global_99",
          "merchantCategory": "crypto_exchange",
          "customerId": "cust_110821",
          "channel": "ONLINE_CNP",
          "rawFeatures": {
            "v1": -4.85, "v2": 3.92, "v3": -6.10, "v4": 4.75
          }
        }
      }
    ]
  }
  ```

#### `POST /fraud-testing/analyze`
- **Purpose:** Submits transaction parameters to the ML engine for real-time risk scoring, classification, and SHAP explanation.
- **Auth:** `Bearer <JWT>`
- **Request Body:**
  ```json
  {
    "persistTransaction": true,
    "transaction": {
      "amount": 1450.00,
      "currency": "USD",
      "merchantId": "merch_lux_watch_12",
      "merchantCategory": "jewelry_luxury",
      "customerId": "cust_381902",
      "channel": "ONLINE_CNP",
      "ipAddress": "198.51.100.42",
      "location": "Lagos, NG",
      "rawFeatures": {
        "v1": -3.12, "v2": 2.85, "v3": -4.20, "v4": 3.95,
        "v10": -2.85, "v12": -3.40, "v14": -5.10, "v17": -4.80
      }
    }
  }
  ```
- **Validation Rules:**
  - `amount`: number, strictly > 0.
  - `currency`: string, exactly 3 characters.
  - `merchantId`: non-empty string.
  - `customerId`: non-empty string.
  - `channel`: one of `["ONLINE_CNP", "POS_CHIP", "POS_CONTACTLESS", "ATM", "WIRE"]`.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "transactionId": "d9e8f7a6-...",
      "timestamp": "2026-10-26T02:05:12.421Z",
      "scoringResult": {
        "fraudProbability": 0.8942,
        "riskScore": 89,
        "riskTier": "HIGH",
        "decisionThreshold": 0.5000,
        "isFraudPredicted": true,
        "recommendation": "DECLINE",
        "modelVersion": "v1.0.0-rf",
        "latencyMs": 42
      },
      "explanations": {
        "baseValue": 0.0017,
        "topRiskDrivers": [
          { "feature": "v14", "value": -5.10, "impact": 0.385, "direction": "ESCALATES_RISK", "description": "Abnormal transaction behavior pattern (PCA V14)" },
          { "feature": "v10", "value": -2.85, "impact": 0.241, "direction": "ESCALATES_RISK", "description": "High deviation in merchant risk vector (PCA V10)" },
          { "feature": "amount", "value": 1450.00, "impact": 0.152, "direction": "ESCALATES_RISK", "description": "Amount is 7.2x customer 30-day average" }
        ],
        "topTrustStabilizers": [
          { "feature": "channel", "value": "ONLINE_CNP", "impact": -0.045, "direction": "LOWERS_RISK", "description": "Customer IP recognized from prior 90-day sessions" }
        ]
      },
      "alertCreated": true,
      "alertId": "a1b2c3d4-..."
    }
  }
  ```

---

### 2.3 Transactions Ledger

#### `GET /transactions`
- **Purpose:** Retrieves paginated transaction history with multi-faceted filtering.
- **Auth:** `Bearer <JWT>`
- **Query Parameters:**
  - `page` (integer, default: 1)
  - `limit` (integer, default: 25, max: 100)
  - `search` (string: matches customer ID, merchant ID, or external transaction ID)
  - `riskTier` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `status` (`APPROVED`, `FLAGGED`, `REJECTED`, `UNDER_REVIEW`)
  - `minAmount`, `maxAmount` (numeric)
  - `startDate`, `endDate` (ISO 8601 timestamps)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "d9e8f7a6-...",
        "externalTransactionId": "trx_ext_881920",
        "timestamp": "2026-10-26T01:45:00.000Z",
        "amount": 1450.00,
        "currency": "USD",
        "merchantCategory": "jewelry_luxury",
        "customerId": "cust_381902",
        "channel": "ONLINE_CNP",
        "status": "FLAGGED",
        "prediction": {
          "riskScore": 89,
          "riskTier": "HIGH",
          "recommendation": "DECLINE"
        }
      }
    ],
    "meta": {
      "pagination": { "page": 1, "limit": 25, "totalRecords": 1, "totalPages": 1 }
    }
  }
  ```

#### `GET /transactions/:id`
- **Purpose:** Retrieves complete granular detail for a single transaction.
- **Auth:** `Bearer <JWT>`
- **Success Response (200 OK):** Full transaction model including linked prediction, raw features, and linked alert record.

---

### 2.4 Fraud Alerts & Case Management

#### `GET /alerts`
- **Purpose:** Retrieves alert queue for triage and investigation.
- **Auth:** `Bearer <JWT>`
- **Query Parameters:**
  - `status` (`PENDING_REVIEW`, `UNDER_INVESTIGATION`, `CONFIRMED_FRAUD`, `FALSE_POSITIVE`, `DISMISSED`)
  - `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `assignedTo` (`me` or UUID)
  - `page`, `limit`
- **Success Response (200 OK):** Array of alert items joined with transaction summary and risk scores.

#### `PATCH /alerts/:id/status`
- **Purpose:** Updates the triage or investigation disposition status of an alert.
- **Auth:** `Bearer <JWT>` (Requires `INVESTIGATOR`, `LEAD`, or `ADMIN`)
- **Request Body:**
  ```json
  {
    "status": "CONFIRMED_FRAUD",
    "notes": "Verified fraudulent account takeover with cardholder. Compromised credentials reported."
  }
  ```
- **Success Response (200 OK):** Updated alert object and created investigation audit entry.

---

### 2.5 Batch Dataset Testing

#### `POST /batch-jobs/upload`
- **Purpose:** Accepts CSV/JSON file upload for asynchronous portfolio testing.
- **Auth:** `Bearer <JWT>` (Requires `LEAD` or `ADMIN`)
- **Content-Type:** `multipart/form-data` (Field: `dataset`)
- **Success Response (202 Accepted):**
  ```json
  {
    "success": true,
    "data": {
      "jobId": "job_9f8e7d6c-...",
      "fileName": "q3_historical_transactions.csv",
      "fileSizeBytes": 4819200,
      "totalRecords": 25000,
      "status": "QUEUED",
      "createdAt": "2026-10-26T02:08:00.000Z"
    }
  }
  ```

#### `GET /batch-jobs/:id`
- **Purpose:** Polls progress and retrieves completed metrics summary of a batch test.
- **Auth:** `Bearer <JWT>`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "jobId": "job_9f8e7d6c-...",
      "status": "COMPLETED",
      "processedRecords": 25000,
      "totalRecords": 25000,
      "fraudDetectedCount": 118,
      "summary": {
        "meanRiskScore": 14.2,
        "highRiskVolumeUsd": 184500.00,
        "tierBreakdown": {
          "LOW": 24200,
          "MEDIUM": 682,
          "HIGH": 95,
          "CRITICAL": 23
        }
      }
    }
  }
  ```

---

### 2.6 Model Performance Analytics

#### `GET /models/active`
- **Purpose:** Fetches metadata, algorithms, and evaluation metrics for the active champion model.
- **Auth:** `Bearer <JWT>`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "modelName": "Random Forest Fraud Champion",
      "algorithm": "RandomForestClassifier",
      "versionTag": "v1.0.0-rf",
      "decisionThreshold": 0.5000,
      "metrics": {
        "prAuc": 0.8462,
        "rocAuc": 0.9735,
        "recall": 0.8469,
        "precision": 0.7217,
        "f1Score": 0.7793,
        "confusionMatrix": {
          "trueNegatives": 56832,
          "falsePositives": 32,
          "falseNegatives": 15,
          "truePositives": 83
        }
      }
    }
  }
  ```

---

## 3. Python FastAPI Internal ML Service Endpoints (Node.js -> Python)

The Python service is hosted on internal port 8000 and requires the header:  
`X-Internal-Service-Key: <SHARED_SECRET>`

### 3.1 `GET /internal/v1/health`
- **Purpose:** Probes ML service readiness and confirms models are preloaded in memory.
- **Response (200 OK):**
  ```json
  {
    "status": "HEALTHY",
    "activeModel": "v1.0.0-rf",
    "preprocessorLoaded": true,
    "uptimeSeconds": 14820
  }
  ```

### 3.2 `POST /internal/v1/predict`
- **Purpose:** Performs single transaction feature transformation, model inference, risk calibration, and SHAP feature attribution.
- **Request Body:**
  ```json
  {
    "amount": 1450.00,
    "currency": "USD",
    "channel": "ONLINE_CNP",
    "rawFeatures": {
      "v1": -3.12, "v2": 2.85, "v3": -4.20, "v4": 3.95,
      "v10": -2.85, "v12": -3.40, "v14": -5.10, "v17": -4.80
    }
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "fraudProbability": 0.8942,
    "riskScore": 89,
    "riskTier": "HIGH",
    "decisionThreshold": 0.5000,
    "isFraudPredicted": true,
    "recommendation": "DECLINE",
    "latencyMs": 28,
    "shapAttributions": {
      "baseValue": 0.0017,
      "topDrivers": [
        { "feature": "v14", "value": -5.10, "impact": 0.385, "direction": "ESCALATES_RISK" },
        { "feature": "v10", "value": -2.85, "impact": 0.241, "direction": "ESCALATES_RISK" },
        { "feature": "amount", "value": 1450.00, "impact": 0.152, "direction": "ESCALATES_RISK" }
      ]
    }
  }
  ```

### 3.3 `POST /internal/v1/batch-predict`
- **Purpose:** High-throughput vectorized inference for chunks of up to 500 transactions (omits computationally expensive individual SHAP explanations to maximize throughput).
- **Request Body:**
  ```json
  {
    "transactions": [
      { "recordId": 1, "amount": 12.50, "rawFeatures": { ... } },
      { "recordId": 2, "amount": 950.00, "rawFeatures": { ... } }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "processedCount": 2,
    "latencyMs": 14,
    "predictions": [
      { "recordId": 1, "fraudProbability": 0.0021, "riskScore": 2, "riskTier": "LOW", "isFraudPredicted": false },
      { "recordId": 2, "fraudProbability": 0.7812, "riskScore": 78, "riskTier": "HIGH", "isFraudPredicted": true }
    ]
  }
  ```
