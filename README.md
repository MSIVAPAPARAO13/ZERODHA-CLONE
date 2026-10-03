# TradeFlow — Institutional Paper Trading, Quantitative Strategy & Market Intelligence SaaS

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61dafb.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Replica%20Set-47A248.svg)](https://www.mongodb.com/atlas)
[![Tests](https://img.shields.io/badge/Tests-40%2F40%20Passing-brightgreen.svg)](docs/FINAL_TEST_REPORT.md)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)](docs/FINAL_PRODUCTION_READINESS.md)

> **Important Disclosure**: TradeFlow is an educational simulation, quantitative strategy validation, and research intelligence platform. It **does NOT execute real-money trades** and contains zero real-world brokerage order routing. All portfolio values, transactions, and balances represent paper simulations.

---

## 1. Problem Statement & Solution

### The Problem
Active equity traders and quantitative analysts operate across fragmented, suboptimal tools:
- **Retail brokerages** show charts without explainable macroeconomic context or factor risk attribution.
- **Generic AI chat interfaces** hallucinate stock quotes, PE ratios, and corporate earnings dates.
- **Toy paper trading clones** lack database transactions, oversell protection, and double-entry reconciliation.
- **Spreadsheets** isolate investment theses and decision logic from execution and post-trade autopsy.

### The Solution: TradeFlow
**TradeFlow** unifies the entire investment lifecycle into an integrated institutional SaaS platform:

```text
Discovery & Scanners  ──▶  Evidence Research  ──▶  Scenario Stress Testing  ──▶  Idempotent Paper Execution  ──▶  Trade Journal & Autopsy  ──▶  AI Behavioral Coach
```

---

## 2. Key Capabilities & Technical Highlights

- **ACID Double-Entry Paper Ledger**: Order matching wrapped in MongoDB multi-document transactions (`session.startTransaction()`) with pre-execution balance checks, oversell rejection, weighted average cost accounting, and client idempotency reservation locks (`Idempotency-Key`).
- **4-Tier Resilient Market Data Gateway**: Abstract gateway integrating **Twelve Data** and **Alpha Vantage** with an in-memory 5-minute TTL cache, sub-7ms quote latency, and graceful stochastic fallback feeds with transparent provenance notices.
- **Grounded AI Copilot & Autonomous Agent**: Powered by Google Gemini utilizing an **Evidence Builder Pattern**. The model cites verified market quotes and portfolio weights, sandboxed to an allowlisted registry of 11 analytical tools with a 5-step loop limit to prevent hallucinations.
- **Quantitative Strategy Lab & Backtesting**: Deterministic backtesting engine with walk-forward parameter sweeps, out-of-sample split tests, and 1,000-path Monte Carlo robustness simulations.
- **Factor Stress Studio & Systemic Contagion**: Multi-hop graph contagion engine mapping sector shock transmissions and historical macro stress presets (2008 GFC, 2020 COVID shock).
- **Multi-Tenant SaaS Workspaces**: Strict user data scoping (`{ user: req.user.userId }`), organization workspaces with RBAC (OWNER, ADMIN, RESEARCHER, VIEWER), and collaborative research commentary with counter-evidence tagging.
- **Institutional Dark Terminal UX**: Styled strictly to Google Stitch design specifications (Project `5494479603696995205`) featuring `#090d16` canvas, `#0f172a` cards, `#1e293b` borders, and persistent right-docked watchlist telemetry.

---

## 3. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│              Frontend (React 18 SPA)                   │
│   Institutional Dark Terminal, Recharts, Lucide Icons  │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST (JWT + Idempotency-Key)
                           ▼
┌────────────────────────────────────────────────────────┐
│           Express 5 API Gateway & Middleware           │
│   Helmet Security, CORS, JWT Auth, Joi Validation,     │
│   Idempotency Locks, Telemetry (Universal X-Request-Id)│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Domain Service Layer                  │
│  - TradingService (ACID BUY/SELL, Double-Entry)        │
│  - MarketDataService (4-Tier Resilient Gateway)        │
│  - BacktestService (Historical Engine, Monte Carlo)    │
│  - ScenarioEngine (Factor Stress & Contagion)          │
│  - ResearchAgentService (11-Tool Sandboxed Gemini)     │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐ ┌───────────────────────┐
│     Third-Party Providers    │ │ MongoDB Atlas (M0/Ded)│
│  - Twelve Data REST API      │ │ - Multi-Doc ACID Txns │
│  - Alpha Vantage API         │ │ - 12 Scoped Models    │
│  - Google Gemini API         │ │ - Compound Indexes    │
└──────────────────────────────┘ └───────────────────────┘
```

---

## 4. Tech Stack

- **Frontend**: React 18, React Router v6, Axios, Recharts, Lucide Icons, Pure Vanilla CSS (zero Tailwind dependency).
- **Backend**: Node.js v24, Express.js v5.1.0, Mongoose v8.16.0, Helmet v8.3.0, Joi v18.2.9, JWT v9.0.3, BcryptJS v3.0.3, Morgan.
- **Database**: MongoDB Atlas Distributed Replica Set (M0 free cluster / production dedicated).
- **External Feeds & AI**: Google Gemini 1.5 Pro / Flash, Twelve Data REST API, Alpha Vantage API.
- **Testing & Benchmarks**: Node.js automated test suites (40 suites), autocannon load test harness.

---

## 5. Security & Isolation

- **Authentication & Passwords**: Bcrypt hashing (10 salt rounds), HMAC-SHA256 signed JWTs with 1-day expiry.
- **Multi-Tenant Isolation**: Server-side user identity extracted strictly from `req.user.userId`. Cross-tenant queries return 404 or 403.
- **NoSQL Injection Prevention**: Mongoose ODM with strict schemas and Joi payload validation.
- **Race Condition Prevention**: Client idempotency reservation locks in MongoDB debounce concurrent requests.
- **Secret Protection**: Zero API keys or database credentials committed to git; `.env` strictly ignored.

---

## 6. Local Quickstart

### Prerequisites
- Node.js v18+ (tested on Node.js v24)
- npm v9+
- MongoDB Atlas cluster connection string (or local MongoDB replica set)

### 1. Clone & Configure Environment
```bash
git clone https://github.com/your-username/TradeFlow.git
cd TradeFlow

# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env with your MONGO_URL, JWT_SECRET, and optional API keys
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install dashboard dependencies
cd ../dashboard && npm install
```

### 3. Run Automated Tests
```bash
cd backend
npm test
# Executes all 40 automated test suites with live verification
```

### 4. Start Development Servers
```bash
# Terminal 1: Start Backend (Port 3002)
cd backend
npm run dev

# Terminal 2: Start Frontend Dashboard (Port 3000)
cd dashboard
npm start
```
Open [http://localhost:3000](http://localhost:3000) to access the TradeFlow terminal.

---

## 7. Testing & Quality Assurance

TradeFlow features an exhaustive test suite covering all domains:
- **Authentication**: `test_auth.js`, `test_mvp3.js`
- **Trading & ACID Transactions**: `test_mvp4.js`, `test_mvp9.js`, `test_mvp57.js`, `test_mvp59.js`
- **Market Data Gateway & Caching**: `test_mvp5.js`, `test_mvp8.js`
- **Grounded AI Copilot & Agents**: `test_mvp10.js`, `test_mvp37.js`, `test_mvp39.js`, `test_mvp52.js`
- **Quantitative Strategy & Risk**: `test_mvp34.js`, `test_mvp35.js`, `test_mvp40.js`, `test_mvp41.js`, `test_mvp44.js`, `test_mvp48.js`
- **Multi-Tenant Organizations**: `test_mvp55.js`, `test_mvp56.js`
- **Observability & Diagnostics**: `test_mvp58.js`, `test_mvp60.js`

Run the complete test suite anytime via:
```bash
npm test
```
Result: **40/40 Passing (100% Pass Rate)**.

---

## 8. Deployment Guides

- **Frontend**: Deployable to **Vercel** or **Netlify** via `dashboard/` root with build command `npm run build` and output directory `build`.
- **Backend**: Deployable to **Render** or **Fly.io** via `backend/` root with start command `node index.js`.
- **Database**: Hosted on **MongoDB Atlas** with automated daily snapshots and replica set failover.

For full step-by-step production deployment instructions, see [docs/DEPLOYMENT_GUIDE.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/DEPLOYMENT_GUIDE.md).

---

## 9. Comprehensive Documentation Index

All technical documentation is located in the [docs/](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs) directory:
- [FINAL_MVP1_60_VERIFICATION.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/FINAL_MVP1_60_VERIFICATION.md): Feature-by-feature verification matrix for MVP-1 to MVP-60.
- [FINANCIAL_INTEGRITY_AUDIT.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/FINANCIAL_INTEGRITY_AUDIT.md): Double-entry accounting, ACID transactions, and precision invariants.
- [MARKET_DATA_ARCHITECTURE.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/MARKET_DATA_ARCHITECTURE.md): 4-tier gateway, caching, and provider failover specs.
- [AI_SECURITY_AND_GROUNDING.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/AI_SECURITY_AND_GROUNDING.md): Evidence Builder pattern, tool sandbox, and prompt defense.
- [FINAL_API_INVENTORY.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/FINAL_API_INVENTORY.md): Complete REST endpoint catalog for all 48 routes.
- [SECURITY_AUDIT.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/SECURITY_AUDIT.md): Production security review and OWASP Top 10 evaluation.
- [DATABASE_FINAL_AUDIT.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/DATABASE_FINAL_AUDIT.md): Database schemas, indexes, and live integrity audit metrics.
- [ARCHITECTURE_FINAL.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/ARCHITECTURE_FINAL.md): Complete system architecture diagrams and flow descriptions.
- [INTERVIEW_GUIDE.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/INTERVIEW_GUIDE.md): Technical deep-dive interview preparation guide with Q&As.
- [RESUME_PROJECT_DESCRIPTION.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/RESUME_PROJECT_DESCRIPTION.md): Resume-ready project descriptions (Full, 3-bullet, 1-line).
- [FINAL_REGRESSION_REPORT.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/FINAL_REGRESSION_REPORT.md): Complete regression test execution results.
- [FINAL_PRODUCTION_READINESS.md](file:///c:/Users/msiva/Music/ZERODHA-CLONE/docs/FINAL_PRODUCTION_READINESS.md): Scorecard certifying all 23 production categories.

---

## 10. License

This project is licensed under the ISC License.
