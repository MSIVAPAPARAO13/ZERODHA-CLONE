# TRADEFLOW — COMPLETE SYSTEM ARCHITECTURE REFERENCE

**System**: TradeFlow Institutional Simulation & Market Intelligence SaaS  
**Version**: 1.0.0 Production Release  
**Architecture Style**: Layered Domain-Driven Micro-Monolith with Provider Abstractions  
**Date**: October 2026  

---

## 1. High-Level System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      Client Layer (React 18 SPA)                       │
│  - Unified Dark Institutional Theme (#090d16 canvas, #0f172a cards)   │
│  - Persistent Telemetry Dock (Watchlist, Alerts, Quick Buy/Sell)      │
│  - Modular Screens (Overview, Scanner, Stress Studio, Copilot, Lab)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JWT + Idempotency-Key)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     API Gateway & Middleware Layer                     │
│  - Helmet HTTP Security Headers (CSP, HSTS, X-Content-Type)           │
│  - CORS Verification & Origin Whitelisting                             │
│  - Telemetry & Tracing (Universal X-Request-Id UUID)                   │
│  - Express Rate Limiting (Auth & Computationally Heavy AI routes)      │
│  - JWT Authentication (HMAC-SHA256 signature validation)               │
│  - Joi Input Validation (Schema enforcement & type coercion)          │
│  - Idempotency Reservation Lock (Atomic MongoDB locking)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Controller & Routing Layer                       │
│  - 30 REST Express Routers (/api/v1/auth, /orders, /portfolio, etc.)   │
│  - Standardized JSON Response Envelopes ({ status: "success", data })  │
│  - HTTP Status Code Alignment (200, 201, 400, 401, 403, 404, 409, 500) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Domain Service Layer                          │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │    TradingService     │ │   MarketDataService   │ │BacktestService│ │
│  │ (ACID BUY/SELL engine)│ │  (4-tier gateway)     │ │(Quant Lab)    │ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │     ScenarioEngine    │ │  ResearchAgentService │ │BehaviorService│ │
│  │ (Factor Stress Studio)│ │(11-tool sandboxed LLM)│ │(Bias coaching)│ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
                    ▼                               ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│        Provider Adapter Layer        │ │     Data Persistence Layer    │
│  - TwelveDataProvider (REST feeds)   │ │  - MongoDB Atlas Replica Set  │
│  - AlphaVantageProvider (Indicators) │ │  - Multi-Document ACID Txns   │
│  - MockMarketDataProvider (Failover) │ │  - Mongoose Models & Indexes  │
│  - Google Gemini API (AI Reasoning)  │ │  - Double-Entry Cash Ledger   │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

---

## 2. Core Subsystems

### 2.1 Trading & Execution Engine (`tradingService.js`)
- **ACID Transactions**: Every order execution is wrapped in a MongoDB transaction session.
- **Double-Entry Ledger**: Tracks cash debits, credits, unit costs, and realized/unrealized P&L.
- **Concurrency & Idempotency**: Prevents double orders using user-scoped idempotency reservations.

### 2.2 Market Data Gateway (`marketDataService.js`)
- **Provider Decoupling**: Abstract interface supporting Twelve Data, Alpha Vantage, and Mock Feeds.
- **Resilience**: 5-minute TTL in-memory caching with automatic multi-tiered failover.
- **Data Provenance**: Explicit `provider` and `providerNotice` tagging on every quote.

### 2.3 Research Copilot & Autonomous Agent (`researchAgentService.js`)
- **Grounded Prompts**: Injects real-time quotes, technical indicators, and portfolio holdings into LLM context.
- **Tool Sandbox**: Bounded to 11 allowlisted read-only analytical functions with a 5-step loop limit.
- **Zero Financial Hallucination**: Distinguishes facts, AI reasoning, and legal disclaimers.

### 2.4 Quantitative Strategy Lab & Backtesting (`backtestService.js`)
- **Deterministic Simulation**: Simulates historical equity curves, trade logs, and risk metrics (Sharpe, Sortino, Max Drawdown).
- **Advanced Validation**: Monte Carlo parametric bootstrapping and out-of-sample walk-forward optimization.

### 2.5 Multi-Tenant Organization Workspaces (`orgController.js`)
- **Tenant Scoping**: All user queries are strictly bound to `{ user: req.user.userId }`.
- **RBAC**: Multi-user organization collaboration with OWNER, ADMIN, RESEARCHER, and VIEWER roles.

---

## 3. Technology Stack Reference

- **Backend**: Node.js v24, Express.js v5.1.0, Mongoose v8.16.0, Helmet v8.3.0, Joi v18.2.9, JWT v9.0.3, BcryptJS v3.0.3.
- **Frontend**: React 18, React Router v6, Axios, Recharts, Lucide Icons, Pure Vanilla CSS (zero Tailwind dependency).
- **Database**: MongoDB Atlas Distributed Replica Set (M0 free cluster / production dedicated).
- **External Integrations**: Google Gemini API, Twelve Data API, Alpha Vantage API.
