# TradeFlow — Institutional Paper Trading, Quantitative Strategy & Research Intelligence Platform

> **Important Disclosure**: TradeFlow is an educational paper-trading, quantitative strategy validation, and research copilot platform. It **does NOT execute real-money trades** and contains zero real-world brokerage order routing. All portfolio values, transactions, and balances represent paper simulations.

---

## 1. Platform Overview

**TradeFlow** is a modern, production-grade paper trading and research intelligence platform engineered for market participants, quants, and active traders. It bridges the critical divide between static charting software and ungrounded AI chatbots by fusing a transactional double-entry paper ledger with deterministic market data providers, multi-asset event cascades, factor risk scenario studios, and grounded AI copilots.

```text
Discovery & Scanners  ──▶  Evidence Research  ──▶  Scenario Stress Testing  ──▶  Idempotent Paper Execution  ──▶  Trade Journal & Autopsy  ──▶  AI Behavioral Coach
```

---

## 2. Visual Platform Tour & Features

Every view within TradeFlow is designed around an institutional dark terminal aesthetic (`#090d16` canvas, `#0f172a` cards, `#1e293b` borders, Inter and JetBrains Mono typography) with zero layout shifting and persistent right-docked watchlist telemetry.

### 2.1 Executive Command Center (Overview)
Real-time simulation status, live market regime state (India VIX & IV Rank), total virtual wealth, unrealized P&L, available margin progress, and rapid action hub.
![Executive Command Center](screenshots/01_Overview_Enhanced.png)

### 2.2 Daily Market Insights & Catalyst Surveillance
Automated morning briefing synthesizing overnight index gaps, macroeconomic news, and portfolio factor drift with source verification.
![Daily Market Insights](screenshots/02_Daily_Insights.png)

### 2.3 Quantitative Market Scanner
Controlled Domain-Specific Language (DSL) for multi-factor technical scans (SMA crossovers, RSI thresholds, volume expansion multipliers) across the NIFTY 50 universe.
![Quantitative Market Scanner](screenshots/03_Market_Scanner.png)

### 2.4 Macro Events Feed
Event classification categorized by severity (`CRITICAL`, `SIGNIFICANT`, `WATCH`) tracking corporate earnings, policy shifts, and interest rate decisions.
![Macro Events Feed](screenshots/04_Market_Events.png)

### 2.5 Market Cascade & Systemic Contagion
Multi-hop contagion modeling mapping how sector shocks propagate through supply chains, commodities, and credit markets.
![Market Cascade](screenshots/05_Market_Cascade.png)

### 2.6 Deep Research Copilot & Grounded Evidence Workspace
Multi-turn grounded AI investigation engine bounded strictly by allowlisted analytical tools, live market quotes, and verifiable SEC/NSE corporate filings.
![Deep Research Copilot](screenshots/06_Research_Copilot.png)

### 2.7 Backtesting Strategy Lab
Quantitative backtesting engine with walk-forward parameter sweeps, sensitivity matrices, and out-of-sample stress testing.
![Strategy Lab](screenshots/07_Strategy_Lab.png)

### 2.8 AI Portfolio Analyst
Grounded LLM portfolio auditor analyzing asset concentration, factor tilt, correlation clusters, and daily thesis validation.
![AI Portfolio Analyst](screenshots/08_AI_Analyst.png)

### 2.9 Portfolio Holdings & Asset Allocation
Real-time valuation of simulated equities enriched with live NSE/BSE feeds, weighted average cost basis, and multi-sector attribution.
![Portfolio Holdings](screenshots/09_Holdings.png)

### 2.10 Open Trading Positions
Intraday open derivatives and equity positions tracking unrealized tick-by-tick returns and stop-loss boundaries.
![Open Positions](screenshots/10_Positions.png)

### 2.11 Execution Order Book & Audit Ledger
Immutable double-entry transaction ledger with cryptographic `Idempotency-Key` verification preventing duplicate execution loops.
![Execution Order Book](screenshots/11_Orders.png)

### 2.12 Macro Scenario Planner & Stress Studio
Historical factor shock simulation engine testing portfolio resilience against historical shocks (e.g. 2008 GFC, 2020 Liquidity Crunch, Rate Hikes).
![Macro Scenario Planner](screenshots/12_Stress_Studio.png)

### 2.13 Capital & Margin Funds
Virtual wallet management with configurable paper capital buffers, margin allocation telemetry, and reset mechanisms.
![Capital & Margin Funds](screenshots/13_Funds.png)

### 2.14 Execution Trade Journal
Disciplined trade logger recording pre-trade hypotheses, entry/exit executions, Maximum Favorable Excursion (MFE), and Maximum Adverse Excursion (MAE).
![Trade Journal](screenshots/14_Trade_Journal.png)

### 2.15 Institutional Strategy Playbooks
Playbook library establishing rules-based trading frameworks, invalidation triggers, and execution discipline checklists.
![Strategy Playbooks](screenshots/15_Playbooks.png)

### 2.16 Edge & Behavioral Trader Psychology
Trader psychology audit engine identifying cognitive biases such as revenge trading, loss aversion, over-leverage, and disposition effect.
![Edge & Behavioral Learning](screenshots/16_Edge_Learning.png)

### 2.17 Algorithmic Risk Alerts
Customizable price, volume, and volatility alert monitors evaluated continuously with instant visual notifications.
![Algorithmic Risk Alerts](screenshots/17_Alerts.png)

---

## 3. What Makes TradeFlow Different?

- **ACID Double-Entry Ledger**: Every BUY/SELL executes inside a MongoDB atomic transaction session with strict balance checking, weighted average cost accounting, and full transaction history continuity.
- **Financial Idempotency Protection**: Zero double-charging or duplicate orders upon connection drops or aggressive UI double-clicks, secured by cryptographic `Idempotency-Key` tracking.
- **Grounded Research Copilot**: AI responses are bounded by an allowlisted evidence builder that pulls real quotes, indicators, and macro regime classifications. The AI never accesses MongoDB directly or executes arbitrary code.
- **Multi-Tenant SaaS Architecture**: Complete tenant isolation, granular RBAC (OWNER, ADMIN, RESEARCHER, VIEWER), and quota management.
- **Multi-Tier Market Data Gateway**: Transparent 4-tier fallback: Primary Provider (TwelveData) $\to$ Secondary Provider (AlphaVantage with BSE formatting) $\to$ In-Memory Timestamped Cache with Stale Disclosures $\to$ Explicit `DATA_UNAVAILABLE` terminal state.

---

## 4. Architecture Overview

```text
+-------------------------------------------------------------------------------+
|                             REACT 18 DASHBOARD                                |
|        (Chart.js + Material UI + Context API + React Router + Axios)          |
+---------------------------------------+---------------------------------------+
                                        | (HTTPS / Bearer JWT / Idempotency-Key)
                                        v
+-------------------------------------------------------------------------------+
|                             EXPRESS API GATEWAY                               |
|        Helmet Security | CORS | Morgan Dev Logger | X-Request-Id Tracing       |
+-------------------+-------------------+-------------------+-------------------+
                    |                   |                   |
                    v                   v                   v
+-----------------------+   +-----------------------+   +-----------------------+
|  AUTH & RBAC ENGINE   |   |   TRADING ENGINE      |   |  MARKET DATA GATEWAY  |
|  Bcrypt Password Hash |   |   MongoDB Transactions|   |  AlphaVantage / 12Data|
|  JWT Verification     |   |   Balance Check/Holdings  |   |  5-Min Memory Cache   |
|  Tenant Scoping       |   |   Idempotency Lock    |   |  Stale Disclosures    |
+-----------------------+   +-----------------------+   +-----------------------+
                    |                   |                   |
                    +-------------------+-------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                         RESEARCH & INTELLIGENCE ENGINES                       |
|   Scenario Studio | Backtest Engine | Regime Classifier | Evidence Workspace  |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                         MONGODB ATLAS STORAGE LAYER                           |
|       Users | Orders | Holdings | Positions | Transactions | Journals         |
+-------------------------------------------------------------------------------+
```

---

## 5. Technology Stack

- **Frontend**: React 18, React Router v6, Chart.js, React-ChartJS-2, Axios, Emotion / Material UI, React Hot Toast.
- **Styling**: Tailored Dark Institutional CSS Tokens (`#090d16`, `#0f172a`, `#1e293b`), Inter & JetBrains Mono typography, custom scrollbars, and flex layout docking.
- **Backend**: Node.js, Express.js, Mongoose (v8.24.4), Helmet, CORS, Morgan, Crypto.
- **Database**: MongoDB Atlas (Replica Set with multi-document ACID transactions).
- **Authentication**: JSON Web Tokens (JWT) + Bcrypt with persistent session storage.
- **Market Data Providers**: AlphaVantage (Primary / BSE equities), TwelveData (Secondary), Mock In-Memory Gateway (Circuit Breaker Fallback).
- **Testing**: Native Node.js Assert + Async Concurrency Load Testing Harness + Headless Chrome CDP Visual Capture Engine.

---

## 6. Getting Started Locally

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB instance (MongoDB Atlas free tier recommended for transaction support)
- Git

### Installation & Execution

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MSIVAPAPARAO13/ZERODHA-CLONE.git
   cd ZERODHA-CLONE
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Configure your environment variables in .env (MONGO_URL, JWT_SECRET, PORT=3002)
   npm start
   ```
   *The backend starts at `http://localhost:3002`.*

3. **Dashboard Setup**:
   ```bash
   cd ../dashboard
   npm install
   npm start
   ```
   *The dashboard compiles and opens at `http://localhost:3000`.*

4. **1-Click Demo Access**:
   - Access `http://localhost:3000/login`
   - Click **⚡ Launch Demo Terminal** or use credentials `demo@tradeflow.com` / `password123`.
   - Click **⚡ Seed Demo Data** in the top navigation strip to instantly populate real Indian market assets, historical orders, and trading positions.

---

## 7. Automated Testing & Verification

TradeFlow includes **40 automated test suites** covering all aspects of security, accounting, and intelligence:

```bash
cd backend

# Run the complete test suite runner across all modules:
node -e "
const { execSync } = require('child_process');
const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.startsWith('test_') && f.endsWith('.js')).sort();
files.forEach(f => {
  process.stdout.write('Running ' + f + '... ');
  execSync('node ' + f, { stdio: 'pipe' });
  console.log('PASSED');
});
"
```

---

## 8. License

This project is licensed under the MIT License — see the LICENSE file for details.
