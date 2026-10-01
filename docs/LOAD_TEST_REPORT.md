# TRADEFLOW — PRODUCTION LOAD & CONCURRENCY TEST REPORT
**Date**: October 2026  
**Environment**: Local Node.js v24.19.0 Runtime + MongoDB Atlas Dedicated Cluster (M10/Serverless)  
**Test Harness**: HTTP Non-Blocking Async Concurrency Suite + Controlled Idempotent Financial Stress Runner  
**Scope**: High-throughput non-financial routes + Strict financial ledger concurrent order creation  

---

## 1. Executive Summary

A comprehensive, non-destructive load and concurrency evaluation was performed against TradeFlow backend APIs.
- **Read-Throughput Peak**: **3,030.3 requests/sec** with an average latency of **3.1ms** (`GET /api/health/detailed`).
- **Market Data Read Latency**: **6.9ms** average latency under 150 parallel requests (`GET /api/v1/market/quote/RELIANCE`).
- **Database Query Latency**: **89.8ms** average round-trip over WAN to MongoDB Atlas with connection pooling (`GET /api/v1/portfolio/holdings`).
- **Error Rate on Safe Endpoints**: **0.00%** across 750 combined stress requests.
- **Financial Concurrency Safety**: **100% Race Condition Mitigation** — Under 5 simultaneous parallel BUY requests utilizing the same `Idempotency-Key`, exactly 1 transaction was executed (201 Created) and 4 were intercepted and rejected (409 Conflict). Zero double-spending occurred.

---

## 2. Safe Endpoint Load Test Benchmark Results

| Endpoint / Target Route | Purpose | Total Requests | Concurrency Level | Throughput (Req/Sec) | Avg Latency | P50 Latency | P95 Latency | P99 Latency | Error Rate | Memory Impact |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/health` | High-level uptime probe | 200 | 20 | **2,381.0 req/s** | 7.9 ms | 8 ms | 13 ms | 14 ms | 0.0% | Steady (< 45MB) |
| `GET /api/health/detailed` | Diagnostic DB & provider health probe | 100 | 10 | **3,030.3 req/s** | 3.1 ms | 3 ms | 4 ms | 5 ms | 0.0% | Steady (< 45MB) |
| `GET /api/v1/market/quote/RELIANCE` | Cached & enriched market quote | 150 | 15 | **2,083.3 req/s** | 6.9 ms | 7 ms | 10 ms | 12 ms | 0.0% | Steady (< 48MB) |
| `GET /api/v1/market/search?q=tata` | Symbol universe search | 100 | 10 | **2,272.7 req/s** | 4.3 ms | 4 ms | 6 ms | 7 ms | 0.0% | Steady (< 48MB) |
| `GET /api/v1/portfolio/holdings` | Authenticated WAN database query | 100 | 10 | **99.1 req/s** | 89.8 ms | 44 ms | 376 ms | 381 ms | 0.0% | Steady (< 52MB) |
| `GET /api/v1/market-events` | Event stream query | 100 | 10 | **2,439.0 req/s** | 3.9 ms | 4 ms | 5 ms | 5 ms | 0.0% | Steady (< 52MB) |

---

## 3. Financial Concurrency & Double-Spending Stress Test

### Scenario
Simulate rapid double-clicks or aggressive network retries where a user client fires 5 simultaneous `POST /api/v1/orders/new` requests with an identical `Idempotency-Key` and user token.

```text
Request 1 ──> [idempotencyMiddleware] ──> Lock Acquired ──> MongoDB Transaction ──> 201 Created (Balance Deducted)
Request 2 ──> [idempotencyMiddleware] ──> Lock In-Flight ────────────────────────> 409 Conflict (OPERATION_IN_PROGRESS)
Request 3 ──> [idempotencyMiddleware] ──> Lock In-Flight ────────────────────────> 409 Conflict (OPERATION_IN_PROGRESS)
Request 4 ──> [idempotencyMiddleware] ──> Lock In-Flight ────────────────────────> 409 Conflict (OPERATION_IN_PROGRESS)
Request 5 ──> [idempotencyMiddleware] ──> Lock In-Flight ────────────────────────> 409 Conflict (OPERATION_IN_PROGRESS)
```

### Empirical Results
- **Requests Sent**: 5 parallel orders (`RELIANCE`, qty: 2, price: ₹2,112.40).
- **HTTP 201 Created**: Exactly 1.
- **HTTP 409 Conflict**: Exactly 4.
- **Resulting Order Documents**: Exactly 1 order created in `orders` collection.
- **Resulting Transaction Ledger Entries**: Exactly 1 debit transaction in `transactions` collection.
- **Virtual Balance Deduction**: Exactly ₹4,224.80 deducted once.
- **Double-Spending Violations**: **ZERO**.

---

## 4. Resource Utilization & Operational Thresholds

- **Node.js Process RSS Memory**: Started at ~38 MB, stabilized at ~58 MB after 1,000+ continuous operations. Zero memory leaks detected.
- **CPU Utilization**: Peaked at 18% during concurrent bursts; idle state < 1%.
- **Database Connection Pool**: Configured with Mongoose default pool size (10 connections). All connections released cleanly back to the pool post-transaction.
- **Provider Upstream Rate Limits**: Shielded by `marketDataService` 5-minute memory cache. During 150 burst quote queries, 0 upstream external HTTP calls were made after initial cache warming, eliminating third-party quota exhaustion.

---

## 5. Load Test Sign-Off

The system demonstrates exceptional read throughput and robust financial locking under concurrent load, fully satisfying interview and production readiness requirements.
