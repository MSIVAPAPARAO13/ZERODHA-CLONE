# TRADEFLOW — PRODUCTION API REFERENCE (v1)
**Base URL**: `http://localhost:3002/api/v1` (Local) / `https://tradeflow-api.onrender.com/api/v1` (Production)  
**Authentication**: Bearer Token in `Authorization` header (`Bearer <JWT>`)  
**Standard Response Envelope**:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
**Standard Error Envelope**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "requestId": "uuid"
  }
}
```

---

## 1. Health & System Diagnostic APIs

### 1.1 High-Level Uptime Probe
- **Method**: `GET`
- **Path**: `/api/health`
- **Authentication**: None
- **Role**: Public
- **Request**: None
- **Response**:
  ```json
  { "status": "ok" }
  ```
- **Errors**: None (returns 500 only if node process crashes)
- **Rate Limit**: None
- **Data Source**: In-Memory

### 1.2 Deep Diagnostic Health Probe
- **Method**: `GET`
- **Path**: `/api/health/detailed`
- **Authentication**: None
- **Role**: Public
- **Request**: None
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-01T03:50:00.000Z",
    "services": {
      "database": { "status": "HEALTHY" },
      "marketProvider": { "status": "HEALTHY", "provider": "twelvedata" },
      "aiProvider": { "status": "HEALTHY" }
    }
  }
  ```
- **Errors**: Returns `"status": "degraded"` if database connectivity drops.
- **Rate Limit**: 120 req/min
- **Data Source**: Mongoose connection state & Provider readiness checks

---

## 2. Authentication APIs

### 2.1 User Registration
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Authentication**: None
- **Role**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Trader",
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
- **Response** (HTTP 201):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "6abdd...",
        "name": "Jane Trader",
        "email": "jane@example.com",
        "virtualBalance": 100000,
        "role": "USER"
      }
    },
    "error": null
  }
  ```
- **Errors**: `400 EMAIL_ALREADY_EXISTS`, `400 INVALID_CREDENTIALS`
- **Rate Limit**: 10 req/min (Brute-force protection)
- **Data Source**: MongoDB `users`

### 2.2 User Login
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Authentication**: None
- **Role**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
- **Response** (HTTP 200):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": { "id": "...", "name": "Jane Trader", "email": "...", "virtualBalance": 100000, "role": "USER" }
    }
  }
  ```
- **Errors**: `401 INVALID_CREDENTIALS`
- **Rate Limit**: 10 req/min

---

## 3. Paper Trading & Orders APIs

### 3.1 Place Paper Order (BUY / SELL)
- **Method**: `POST`
- **Path**: `/api/v1/orders/new` (or `/api/v1/orders`)
- **Authentication**: Bearer JWT
- **Role**: Authenticated User
- **Headers**:
  - `Idempotency-Key`: UUIDv4 (Required for retry protection)
- **Request Body**:
  ```json
  {
    "name": "RELIANCE",
    "qty": 5,
    "price": 2112.40,
    "mode": "BUY",
    "journal": {
      "strategy": "MOMENTUM",
      "thesis": "Breakout above resistance",
      "confidence": 4
    }
  }
  ```
- **Response** (HTTP 201):
  ```json
  {
    "success": true,
    "data": {
      "_id": "6abdd...",
      "user": "6ab...",
      "name": "RELIANCE",
      "qty": 5,
      "price": 2112.40,
      "mode": "BUY",
      "createdAt": "2026-10-01T03:52:00.000Z"
    },
    "error": null
  }
  ```
- **Replay Response** (HTTP 200 with Header `X-Idempotent-Replay: true`):
  Cached response without re-executing ledger operations.
- **Errors**:
  - `400 Insufficient virtual balance`
  - `400 Insufficient quantity to sell`
  - `409 OPERATION_IN_PROGRESS` (Concurrent duplicate request lock)
  - `422 IDEMPOTENCY_PAYLOAD_MISMATCH`
- **Rate Limit**: 60 req/min
- **Data Source**: MongoDB ACID Transaction (`orders`, `holdings`, `positions`, `transactions`, `users`, `idempotencykeys`)

### 3.2 List Orders
- **Method**: `GET`
- **Path**: `/api/v1/orders`
- **Authentication**: Bearer JWT
- **Role**: Authenticated User
- **Response** (HTTP 200):
  ```json
  {
    "success": true,
    "data": [
      { "_id": "...", "name": "RELIANCE", "qty": 5, "price": 2112.40, "mode": "BUY", "createdAt": "..." }
    ]
  }
  ```
- **Data Source**: MongoDB `orders` (Scoped by `req.user.userId`)

---

## 4. Portfolio & Intelligence APIs

### 4.1 Get Holdings
- **Method**: `GET`
- **Path**: `/api/v1/portfolio/holdings`
- **Authentication**: Bearer JWT
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      { "_id": "...", "name": "RELIANCE", "qty": 5, "avg": 2112.40, "price": 2112.40, "net": "+0.00%", "day": "+1.44%" }
    ]
  }
  ```
- **Data Source**: MongoDB `holdings`

### 4.2 Get Positions
- **Method**: `GET`
- **Path**: `/api/v1/portfolio/positions`
- **Authentication**: Bearer JWT
- **Response**: Returns open intraday/delivery positions.

### 4.3 Portfolio Intelligence & Factor Risk
- **Method**: `GET`
- **Path**: `/api/v1/portfolio/intelligence`
- **Authentication**: Bearer JWT
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "portfolioValue": 10562.00,
      "cashBalance": 89438.00,
      "totalEquity": 100000.00,
      "sectorConcentration": [{ "sector": "Energy", "weight": 1.0 }],
      "factorExposures": { "beta": 1.05, "volatility": 0.18, "momentum": 0.65 },
      "stressResilience": "MODERATE"
    }
  }
  ```

---

## 5. Market Data APIs

### 5.1 Get Single Asset Quote
- **Method**: `GET`
- **Path**: `/api/v1/market/quote/:symbol`
- **Authentication**: Bearer JWT
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "symbol": "RELIANCE",
      "name": "Reliance Industries",
      "price": 2112.40,
      "change": 30.00,
      "changePercent": 1.44,
      "timestamp": "2026-10-01T03:55:00.000Z",
      "source": "mock"
    }
  }
  ```
- **Errors**: `404 Symbol not found` (Explicit `DATA_UNAVAILABLE` error envelope; never fabricates dummy prices)
- **Data Source**: TwelveData -> AlphaVantage -> In-Memory Cache -> Mock Fallback

### 5.2 Search Symbols
- **Method**: `GET`
- **Path**: `/api/v1/market/search?q=tata`
- **Authentication**: Bearer JWT
- **Response**: Returns matching symbols and asset names.

---

## 6. Watchlist & Alerts APIs

### 6.1 Add Watchlist Symbol
- **Method**: `POST`
- **Path**: `/api/v1/watchlist`
- **Authentication**: Bearer JWT
- **Request Body**: `{ "symbol": "TCS" }`
- **Response** (HTTP 201): `{ "success": true, "data": { ...quote } }`
- **Errors**: `400 Symbol already in watchlist`, `400 Unknown symbol`

### 6.2 Create Price Alert
- **Method**: `POST`
- **Path**: `/api/v1/alerts`
- **Authentication**: Bearer JWT
- **Request Body**:
  ```json
  {
    "symbol": "TCS",
    "condition": "ABOVE",
    "targetPrice": 3500
  }
  ```
- **Response** (HTTP 201): Created alert document.

---

## 7. Research Copilot & Agent APIs

### 7.1 Launch Research Investigation
- **Method**: `POST`
- **Path**: `/api/v1/research/investigate`
- **Authentication**: Bearer JWT
- **Request Body**:
  ```json
  {
    "question": "Evaluate tech sector valuation compressions",
    "symbol": "INFY"
  }
  ```
- **Response** (HTTP 200): Returns structured analysis with cited evidence and persisted research session ID.

### 7.2 Run Autonomous Research Agent
- **Method**: `POST`
- **Path**: `/api/v1/research/agent`
- **Authentication**: Bearer JWT
- **Request Body**:
  ```json
  {
    "question": "Find asymmetric risk/reward setups in Nifty 50 energy sector",
    "maxIterations": 5
  }
  ```
- **Response**: Multi-step grounded tool execution log with final synthesis.

---

## 8. Scenario Studio & Strategy Validation APIs

### 8.1 Run Scenario Simulation
- **Method**: `POST`
- **Path**: `/api/v1/scenarios/:id/run` (e.g. `/preset-it-correction/run`)
- **Authentication**: Bearer JWT
- **Response**: Modeled portfolio drawdown and asset shock propagation.

### 8.2 Run Strategy Backtest
- **Method**: `POST`
- **Path**: `/api/v1/strategies/backtest/run`
- **Authentication**: Bearer JWT
- **Request Body**: `{ "strategy": "preset-momentum-sma" }`
- **Response**: Backtest metrics: Total trades, Win rate, Profit factor, Max drawdown, Sharpe ratio.

### 8.3 Evaluate Strategy Robustness
- **Method**: `POST`
- **Path**: `/api/v1/strategies/robustness`
- **Authentication**: Bearer JWT
- **Request Body**: `{ "strategy": "preset-momentum-sma" }`
- **Response**: Monte Carlo robustness score, parameter sensitivity score, and regime resilience.

---

## 9. Decision Journal & Learning Coach APIs

### 9.1 Record Pre-Trade Decision
- **Method**: `POST`
- **Path**: `/api/v1/decisions`
- **Authentication**: Bearer JWT
- **Request Body**:
  ```json
  {
    "title": "Hedge Software Overexposure",
    "symbol": "RELIANCE",
    "decisionType": "PAPER_BUY",
    "thesis": "Energy sector benefits from cyclical commodity uptrend"
  }
  ```
- **Response** (HTTP 201): Created decision journal record.

### 9.2 Get Behavioral Learning Profile
- **Method**: `GET`
- **Path**: `/api/v1/learning/profile`
- **Authentication**: Bearer JWT
- **Response**: Trader cognitive bias analysis (e.g. Revenge trading probability, FOMO tendencies).

---

## 10. Organization & Collaboration APIs

### 10.1 Create Organization Workspace
- **Method**: `POST`
- **Path**: `/api/v1/organizations`
- **Authentication**: Bearer JWT
- **Request Body**: `{ "name": "Alpha Quant Labs" }`
- **Response** (HTTP 201): Created organization with user as `OWNER`.

### 10.2 Share Research Session
- **Method**: `POST`
- **Path**: `/api/v1/collaboration/sessions/:sessionId/share`
- **Authentication**: Bearer JWT
- **Request Body**: `{ "organizationId": "..." }`
- **Response** (HTTP 200): Shared session metadata.

### 10.3 Add Threaded Research Comment
- **Method**: `POST`
- **Path**: `/api/v1/collaboration/sessions/:sessionId/comments`
- **Authentication**: Bearer JWT
- **Request Body**:
  ```json
  {
    "body": "Cross-checked crude oil correlation; thesis holds.",
    "evidenceType": "SUPPORTS_THESIS"
  }
  ```
- **Response** (HTTP 201): Threaded comment record.

---

## 11. Interview Demo & Capabilities Overview

### 11.1 Demo Overview API
- **Method**: `GET`
- **Path**: `/api/v1/demo`
- **Authentication**: Bearer JWT
- **Response**: Complete catalog of 8 core production capabilities and 15-step interactive workflow.
