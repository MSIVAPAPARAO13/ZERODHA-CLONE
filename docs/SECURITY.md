# TRADEFLOW — SECURITY ARCHITECTURE & POLICIES
**Framework Reference**: OWASP Application Security Verification Standard (ASVS 5.0.0 Level 2 Guidance)  
**Security Posture**: Production Ready & Audited  
**Disclaimer**: This document details security controls and verification testing. TradeFlow makes zero claim of official "OWASP Certification" as certifications require third-party accredited audits.  

---

## 1. Authentication Architecture

- **Password Hashing**: User passwords are encrypted using `bcrypt` with a work factor of 10 salt rounds prior to persistence in MongoDB. No plaintext passwords exist in memory dumps, logs, or storage.
- **Session Tokens**: Authentication state is maintained via cryptographically signed JSON Web Tokens (JWT) adhering to RFC 7519.
  - **Algorithm**: HMAC SHA-256 (`HS256`).
  - **Key Storage**: High-entropy 256-bit secret stored in `JWT_SECRET` environment variable.
  - **Payload Structure**: `{ userId: "ObjectId", role: "USER"|"ADMIN", iat, exp }`.
  - **Expiry**: Default 1 day in development, 7 days in production.
- **Header Transmission**: Clients transmit tokens via the standard HTTP `Authorization: Bearer <token>` header. Tokens are never passed via URL query parameters.

---

## 2. Authorization, RBAC & Multi-Tenancy

- **Principal Ownership**: User identity is derived strictly from the server-side decoded JWT (`req.user.userId`). The system rejects any client-supplied `userId` inside request bodies or query parameters.
- **Multi-Tenant Data Scoping**: All database queries for personal assets (Orders, Holdings, Positions, Transactions, Watchlists, Alerts, Journals, Automations) enforce tenant filters (`{ user: req.user.userId }`).
- **Organization RBAC Hierarchy**:
  - `OWNER`: Full tenant administration, billing management, role delegation.
  - `ADMIN`: Member management, shared research review, workflow creation.
  - `RESEARCHER`: Create research sessions, execute backtests, post comments.
  - `VIEWER`: Read-only access to shared organization sessions.
  - *Enforcement*: Server-side validation via `organizationService.js` and `collaborationService.js`.
- **Administrative Functions**: Endpoints under `/api/v1/admin/*` require `req.user.role === 'ADMIN'`. Unauthorized users receive 403 Forbidden.

---

## 3. Financial Ledger Integrity & Concurrency

TradeFlow enforces strict financial controls to ensure zero double-spending, balance corruption, or overselling:

```text
                                CLIENT ORDER REQUEST
                                         │
                                         ▼
                            [idempotencyMiddleware]
                                         │
                       ┌─────────────────┴─────────────────┐
                       │                                   │
              Key Exists & Completed               First Occurrence
                       │                                   │
         Return HTTP 200 Cached Body          Acquire Atomically in Mongo
         (Header: X-Idempotent-Replay)                     │
                                                           ▼
                                               [MongoDB ACID Session]
                                               session.startTransaction()
                                                           │
                                        ┌──────────────────┴──────────────────┐
                                        │                                     │
                                    Order Mode = BUY                      Order Mode = SELL
                                        │                                     │
                             Verify user.virtualBalance             Verify holding.qty >= sellQty
                                        │                                     │
                             Deduct virtualBalance                 Increment virtualBalance
                             Insert OrdersModel                    Insert OrdersModel
                             Insert TransactionModel (debit)       Insert TransactionModel (credit)
                             Upsert HoldingsModel                  Decrement/Delete Holding
                                        │                                     │
                                        └──────────────────┬──────────────────┘
                                                           │
                                               session.commitTransaction()
                                               Update Idempotency Status: COMPLETED
```

- **Rollback Guarantee**: In the event of an unhandled exception or constraint failure, `session.abortTransaction()` reverts all database writes to preserve financial ledger balance.

---

## 4. Input Validation & Defense-in-Depth

- **Schema Validation**: All inbound endpoints are validated using schema validators (Joi and strict Mongoose schemas).
- **Prohibited Payload Values**: Quantities $\le 0$, prices $\le 0$, `NaN`, `Infinity`, and malformed ObjectIds are rejected with HTTP 400.
- **Mass Assignment Defense**: Direct assignment to protected properties (`_id`, `user`, `virtualBalance`, `role`, `organizationId`) is blocked.
- **HTTP Header Hardening**: Express utilizes `helmet()` to configure secure headers:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Strict-Transport-Security` (HSTS)

---

## 5. Rate Limiting & Resource Protection

- **Authentication Endpoints**: Limited to 10 requests/minute to prevent credential stuffing.
- **AI Endpoints**: Guarded by `aiRateLimiter.js` (20 calls/minute per user) to control upstream token costs.
- **Heavy Compute Limits**:
  - Scanner universe clamped to 50 assets.
  - Backtesting period clamped to 500 trading bars.
  - Research agent restricted to a maximum of 5 autonomous tool iterations.

---

## 6. Grounded AI Security & Prompt Injection Defense

- **Isolated Tool Registry**: The Autonomous Research Agent (`researchAgentService.js`) can only execute 11 allowlisted analytical tools (`fetch_quote`, `fetch_technicals`, `run_scenario`, etc.).
- **Zero Raw Execution**: The LLM cannot access MongoDB directly, execute shell commands, or run arbitrary JavaScript.
- **Prompt Grounding**: System instructions explicitly enforce deterministic output schemas and citation of verified evidence.

---

## 7. Secret Management & Observability

- **Zero Hardcoded Secrets**: Zero API keys, Mongo URIs, or JWT secrets are stored in Git. All secrets reside in Git-ignored `.env` files.
- **Audit Logging**: Structured log events include `X-Request-Id`, timestamp, HTTP method, route, duration, and status code.
- **Sanitized Telemetry**: Sensitive tokens, passwords, and authorization headers are scrubbed prior to writing to console or `SystemEventModel`.
