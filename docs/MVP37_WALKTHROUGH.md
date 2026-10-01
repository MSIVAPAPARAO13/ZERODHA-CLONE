# MVP-37 WALKTHROUGH — TRADEFLOW RESEARCH COPILOT & EVIDENCE WORKSPACE

## 1. Executive Summary

TradeFlow MVP-37 adds the **Research Copilot & Evidence Workspace** — a structured, grounded AI-assisted research environment that unifies all prior TradeFlow analytical engines under a single question-and-evidence interface.

Unlike general-purpose chatbots that generate plausible-sounding market commentary, TradeFlow's Research Copilot is:

- **Evidence-first**: Every answer is backed by deterministic engine output (scan runs, backtest results, stress scenario figures, portfolio data).
- **Intent-driven**: A controlled regex classifier routes questions to the correct sub-engine — no black-box LLM routing.
- **Audit-ready**: Every research session is persisted with a deterministic SHA-256 `researchHash` for full reproducibility.
- **Non-predictive**: Explicitly marks speculation, missing fundamentals, and data limitations rather than fabricating data.

The full research pipeline is:

```
USER QUESTION
      ↓
INTENT CLASSIFIER (SECURITY / SCANNER / STRATEGY / PORTFOLIO / STRESS / COMPARISON)
      ↓
EVIDENCE ORCHESTRATOR
      ├─ MarketDataService (quotes + OHLCV)
      ├─ marketScannerService (run scan)
      ├─ backtestEngine (historical strategy results)
      ├─ scenarioEngine (stress impact)
      ├─ Holdings / Positions / Portfolio (user data)
      ├─ Watchlist / Alert / Thesis (user context)
      └─ PlaybookModel / ThesisReviewModel (research linkage)
      ↓
EVIDENCE BUNDLE (tagged by sourceType, provider, timestamp)
      ↓
GROUNDED AI SYNTHESIS (aiAnalystService.generateResearchCopilotReport)
      ↓
RESEARCH SESSION PERSISTED (ResearchSessionModel + researchHash)
```

---

## 2. Interactive Walkthrough

### Step 1: Open Research Copilot

1. Navigate to the TradeFlow dashboard at `http://localhost:3000/`.
2. Click **Research** in the navigation bar to open the Research Copilot UI (`/research`).
3. You will see:
   - A **Question Input Box** with placeholder: "Ask a research question..."
   - **6 Quick-Start Presets** covering security, scanner, strategy, stress, comparison, and gap detection.
   - A **Session History Panel** on the left (persisted across reloads).

---

### Step 2: Ask a Security Research Question

1. Click preset: **"What does the scanner show for TCS momentum today?"**
2. Intent classifier detects `SECURITY` intent and extracts symbol `TCS`.
3. Evidence Orchestrator fires in parallel:
   - Quote from `MarketDataService`
   - Indicators via `marketScannerService.evaluateSingleSymbol('TCS', ...)`
   - Holdings / Alert / Watchlist / Thesis from user data
4. AI Synthesis returns strictly partitioned response:
   - `OBSERVED DATA`: Price, SMA, RSI, Volume (with source + timestamp)
   - `RESEARCH INTERPRETATION`: Technical context, no forecasting
   - `PORTFOLIO CONTEXT`: Holdings, active alerts
   - `LIMITATIONS & UNKNOWNS`: Fundamentals UNAVAILABLE, look-ahead protected

---

### Step 3: Scanner Research

1. Type: **"Run the momentum scanner and show me what matches."**
2. Intent: `SCANNER`.
3. Orchestrator constructs live momentum scan (SMA20>SMA50, RSI>55, Volume>1.2x).
4. `marketScannerService.runScan(...)` executes across Nifty 15-symbol universe.
5. Evidence includes matched symbols, per-symbol indicator values, match scores, market breadth, and deterministic `scanHash`.

---

### Step 4: Deep Investigation — Backtest Bridge

1. Ask: **"How has the momentum scanner strategy performed historically on TCS?"**
2. Intent: `STRATEGY` + symbol `TCS`.
3. Orchestrator invokes `backtestEngine.runBacktest(...)` with SMA 20/50 crossover, 252-bar history, slippage + brokerage.
4. Evidence includes: Cumulative Return %, Benchmark Return %, Max Drawdown, Trade Count, Profit Factor, full Trade Ledger.
5. Tagged: `sourceType: "BACKTEST"`, `provider: "backtestEngine"`. Zero real ledger mutation.

---

### Step 5: Deep Investigation — Stress Bridge

1. Ask: **"What would happen to my portfolio if IT sector drops 15%?"**
2. Intent: `STRESS` + `PORTFOLIO`.
3. Orchestrator loads holdings from `HoldingsModel`, invokes `scenarioEngine.runScenario(...)`.
4. Evidence includes modelled portfolio impact (Rs and %), per-holding attribution, explicit disclosure: "This is a modelled scenario, not a prediction."

---

### Step 6: Comparison Research

1. Ask: **"Compare TCS vs INFY on momentum and backtest evidence."**
2. Intent: `COMPARISON` + symbols `['TCS', 'INFY']`.
3. Orchestrator runs parallel evidence collection for both symbols.
4. A side-by-side comparison matrix is returned covering price, indicator alignment, backtest returns, drawdown, watchlist, and alert status.

---

### Step 7: Research Gap Detection

1. Ask: **"What gaps exist in my TCS research?"**
2. Gap Detector audits 6 dimensions:
   - Fundamental data (P/E, EPS, ROE) → UNAVAILABLE
   - Macro context → NOT IN SCOPE
   - Historical index correlation → PARTIAL
   - Options/derivatives → NOT APPLICABLE
   - Management guidance → NOT IN SCOPE
   - Sentiment analysis → PLANNED
3. Surfaces explicit audit statuses — never fabricates missing data.

---

### Step 8: Visual Evidence Graph

1. After investigation, click **View Evidence Graph** in the session panel.
2. A directed evidence graph is generated:
   - Nodes: `USER_QUESTION → SECURITY → QUOTE → INDICATORS → PORTFOLIO → THESIS`
   - Directed edges labelled with evidence type and data source
3. Verified: 6 nodes, 5 directed edges for a standard security investigation.

---

### Step 9: Follow-Up Questions

After any investigation, the Copilot synthesizes **5 empirical follow-up questions** grounded in the observed evidence — e.g. historical RSI percentile, volume-price correlation, sector breadth comparison, scenario drawdown depth, and thesis assumption validation.

---

### Step 10: Research Session Persistence & Reproducibility

1. Every investigation creates a persisted `ResearchSession` document:
   - `title`, `question`, `intent`, `evidenceBundle`, `researchHash`, `createdAt`
2. `researchHash` is a SHA-256 deterministic hash of question + intent + evidence IDs.
3. The session appears in the **Session History** sidebar and can be reloaded at any time.
4. Same inputs always produce the same hash — full audit reproducibility.

---

### Step 11: Zero Financial Ledger Mutation Verification

1. Open Orders, Positions, Portfolio pages.
2. Confirm `virtualBalance`, real/paper orders, holdings, and positions remain **100% unchanged**.
3. Research Copilot is strictly **read-only**: writes only to `ResearchSessionModel`.

---

## 3. Product Positioning & Interview Narrative

When asked: *"Your project started as a Zerodha clone. What is actually new in MVP-37?"*

> *"MVP-37 adds a Research Copilot that ties all the prior analytical engines together with a unified question-and-evidence interface. Instead of navigating between the market scanner, strategy lab, stress studio, and portfolio separately, a researcher can ask a single structured question and get a deterministic, evidence-backed answer grounded in real data from all those systems. Every answer is traceable to a specific engine output — no fabricated numbers, no black-box recommendations."*

---

## 4. Architecture Reuse Summary

| Component | Reused From |
|---|---|
| `marketScannerService` | MVP-36 |
| `backtestEngine` | MVP-35 |
| `scenarioEngine` | MVP-34 |
| `aiAnalystService` | MVP-33/36 |
| `marketDataService` | MVP-32 |
| `watchlistService` / `alertService` | MVP-16/17 |
| `HoldingsModel` / `PositionsModel` | MVP-4 |
| `ThesisReviewModel` / `PlaybookModel` | MVP-31/32 |
| `ResearchSessionModel` | **New — MVP-37** |
| `researchCopilotService` | **New — MVP-37** |
| `researchController` / `researchRoutes` | **New — MVP-37** |
