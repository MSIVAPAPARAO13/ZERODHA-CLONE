# MVP-37 RESEARCH — TRADEFLOW RESEARCH COPILOT & EVIDENCE WORKSPACE

## 1. Executive Summary

Modern active trading and quantitative analytics platforms are undergoing an architectural paradigm shift. In prior generations, platforms maintained isolated silos:
1. Screener / Scanner
2. Watchlists & Price Alerts
3. Backtesting Studio
4. Stress Testing & Risk Factor Modeling
5. Trading Journal & Thesis Tracker
6. Generic AI Chatbot / Assistant

When traders use fragmented systems, they endure excessive cognitive friction. A trader finds a breakout candidate in a scanner, then manually copies the symbol into a separate charting window, copies it again into an alert modal, guesses whether similar criteria worked in the past without running an integrated backtest, manually navigates to a risk engine to measure sector vulnerability, and pastes the setup into an external LLM chat prompt. When queried, generic LLMs frequently hallucinate prices, invent unsupported earnings dates, and utter fabricated "Buy" recommendations without data provenance.

TradeFlow MVP-37 introduces the **Research Copilot & Evidence Workspace**. It is neither a generic chatbot nor a stock-tipping prediction engine. It is a **grounded cross-engine research workspace** that orchestrates TradeFlow's existing market data, scanner ASTs, backtest simulations, scenario stress models, alert triggers, watchlists, trade journals, and thesis models into a single evidence-driven investigation interface.

---

## 2. Industry Analysis & Competitive Landscape

| Platform | Capabilities | Limitations | TradeFlow Differentiation |
|---|---|---|---|
| **TradingView** | Charting, technical scanner, Pine Script backtest, alerts, community ideas | Tools operate in independent panels; no unified multi-hop thesis tracking; generic Pine Script requires manual coding; no native stress testing studio. | TradeFlow unifies Scanner, Strategy Lab, Stress Studio, Journal, and Theses with automated cross-engine investigation. |
| **Trendlyne** | Forecaster scores, DVM ratings, technical screener, SWOT analysis, AI screener query | Opaque proprietary scoring formulas ("DVM Score"); black-box fundamentals; no isolated simulation ledger or parameter walk-forward lab. | TradeFlow outputs transparent, deterministic condition evidence with zero black-box weights or proprietary scores. |
| **StockEdge** | Sector scans, fundamental ratios, investor portfolios, stock notes | Siloed view between technicals and notes; no algorithmic backtesting; no portfolio stress testing. | Direct link from scanner candidate to historical backtest and sector shock modeling. |
| **Tickertape** | Screener, scorecard, watchlist, basic thesis notes | Consumer-oriented UI; no quantitative rule ASTs; no what-if position stress testing; no grounded AI audit trail. | Evidence-backed research reports with reproducible SHA-256 result hashes and data quality provenance. |
| **Generic LLM Chatbots (ChatGPT / Perplexity)** | Broad conversational fluency, macro summarization | **High hallucination risk**; invents prices, volumes, and financial indicators; zero connection to user's real paper trading ledger or active alerts. | **Grounded AI Contract**: LLM acts strictly as reasoning & synthesis layer over deterministic API evidence. Zero fabricated numbers. |

---

## 3. The Core Problem: Analytical Fragmentation

Prior to MVP-37, TradeFlow possessed best-in-class individual modules:
- MVP-36: Intelligent Market Scanner (Rule AST, market breadth, "Why Did This Match?" drawer)
- MVP-35: Strategy Research & Backtesting 2.0 (Walk-forward, overfitting warnings, simulation ledger)
- MVP-34: Advanced Scenario & Stress Studio (Multiplicative factor shocks, loss attribution)
- MVP-33: Market Event Cascade & Thesis Impact Engine (Multi-hop relationship graphs, thesis drift)
- MVP-6 / MVP-7: Watchlists & Price Alerts
- MVP-9 / MVP-10: Trade Journal & Playbooks

However, a user investigating a candidate like **TCS** had to manually query each module separately. MVP-37 solves this by introducing a **Research Planner & Evidence Orchestrator** that executes a targeted evidence plan, synthesizes facts across all engines, and renders an auditable research dossier.

---

## 4. Architecture of the Research Copilot

```text
User Question / One-Click Investigate
               ↓
    [ Intent Classification ]
    (SECURITY, SCANNER, STRATEGY, PORTFOLIO, STRESS, THESIS, COMPARISON)
               ↓
       [ Research Planner ]
    (Generates bounded evidence checklist)
               ↓
    [ Controlled Tool Registry ]
  ┌────────────┬─────────────┬─────────────┐
  ↓            ↓             ↓             ↓
MarketData  ScannerRun   BacktestEngine  ScenarioEngine
  ↓            ↓             ↓             ↓
Watchlists   Alerts      Journals        Theses
  └────────────┴─────────────┴─────────────┘
               ↓
   [ Evidence Normalization ]
  (OBSERVED, DERIVED, INTERPRETED, UNKNOWN, LIMITATION)
               ↓
    [ Cross-Engine Synthesis ]
  - Research Timeline
  - Evidence Graph
  - Research Gap Detector
  - Deterministic SHA-256 Research Hash
               ↓
    [ Grounded AI Explainer ]
  (OBSERVED DATA, DERIVED METRICS, HISTORICAL EVIDENCE,
   STRESS EVIDENCE, RESEARCH INTERPRETATION, LIMITATIONS, UNKNOWNS)
               ↓
 [ Interactive Research Dossier ]
```

---

## 5. Evidence Classification Taxonomy

To prevent ambiguity, every data point ingested by the copilot is normalized into a strict taxonomy:

1. **OBSERVED**:
   - Directly reported by a market data provider or user database without modification.
   - Examples: Latest daily close price (₹3,412.00), RSI value (61.4), Watchlist presence (`true`), Alert threshold (`₹3,480.00`), Stored journal thesis.
2. **DERIVED**:
   - Calculated deterministically from observed series.
   - Examples: 20-day price return (+4.2%), historical backtest return (-2.5%), modeled stress drawdown (-₹11,980.50), market breadth advancing ratio (32/50).
3. **INTERPRETED**:
   - Logical conclusions confirming rule compliance.
   - Examples: Scanner condition `SMA(20) > SMA(50)` was satisfied; portfolio holding represents 64.8% of IT sector exposure.
4. **UNKNOWN**:
   - Data dimensions requested or relevant to the asset that TradeFlow does NOT possess.
   - Examples: Standardized balance sheet fundamental ratios (P/E, ROE, Debt/Equity) unavailable at current provider tier; insider transaction filings.
5. **LIMITATION**:
   - Methodological constraints governing the analysis.
   - Examples: Historical survivorship bias in index constituents; zero look-ahead bar execution assumption; linear factor correlation limits during extreme stress.

---

## 6. Grounded AI Contract & Anti-Hallucination Guardrails

Generic AI chatbots generate authoritative-sounding falsehoods when asked about financial securities. To guarantee 100% data integrity:
1. **Model Is Not the Data Store**: The LLM is never asked: *"What is TCS's RSI today?"* or *"What is TCS's price target?"*
2. **Deterministic Context Injection**: The backend retrieves verified quotes, backtest trade ledgers, and scenario attributions first, then passes them to the AI formatted as strict JSON evidence.
3. **Prompt Quarantine**: Prompts mandate that the AI:
   - Must ONLY cite facts present in the provided evidence object.
   - Must NEVER produce "BUY", "SELL", "STRONG BUY", or numeric price targets.
   - Must output structured sections: `OBSERVED DATA`, `DERIVED METRICS`, `HISTORICAL EVIDENCE`, `STRESS EVIDENCE`, `RESEARCH INTERPRETATION`, `LIMITATIONS`, `UNKNOWNS`, `NEXT RESEARCH QUESTIONS`.
   - If a requested piece of information is missing, it must output: `NOT AVAILABLE IN TRADEFLOW DATA`.
4. **Deterministic Offline Fallback**: If the external AI service times out, experiences rate limits (429), or is offline, the backend executes an algorithmic fallback synthesizer that formats the exact same structured dossier without failing.

---

## 7. Key Differentiators ("WOW" Features)

### Feature 1: One-Click Investigation Bridge
From any candidate row in the Market Scanner, Watchlist, Portfolio, or Strategy Lab, clicking `[Investigate]` immediately transitions the user to the Research Workspace with the asset symbol, active scanner AST, and current market state pre-loaded.

### Feature 2: Visual Evidence Graph
A directed graph visualizes how the security intersects TradeFlow's analytical modules:
```text
                  TCS (Symbol)
                       │
       ┌───────────────┼───────────────┐
       ↓               ↓               ↓
 Scanner Run      Watchlist        Price Alert
 (Momentum)       (Active)         (₹3,480)
       │               │               │
       ↓               ↓               ↓
Strategy Lab      Portfolio       Trade Journal
(Backtest)        (Holdings)      (IT Thesis)
       │                               │
       └───────────────┬───────────────┘
                       ↓
                 Stress Studio
              (IT -15% Scenario)
```

### Feature 3: Research Gap Detector
Rather than pretending to have complete omniscience, the system explicitly audits what evidence is verified versus what is missing:
- `✓ Verified Technical Indicator Evidence (TwelveData)`
- `✓ Historical Simulation Backtest (Strategy Lab)`
- `✓ Multi-Shock Sector Stress Model (Stress Studio)`
- `⚠ Corporate Balance-Sheet Fundamentals Unavailable (Requires Provider Tier)`
- `⚠ Historical Constituent Membership Unavailable (Survivorship Bias Disclosed)`

---

## 8. Security & Multi-Tenant Isolation

1. **Authentication**: All research routes are protected by `authMiddleware` verifying JWT signatures.
2. **Session Ownership**: Every `ResearchSessionModel` is strictly scoped to `req.user.userId`.
3. **Zero Trust for Body User IDs**: Client-provided `userId` parameters are completely ignored.
4. **Zero Financial Mutation**: The Research Copilot operates 100% in a read-only research sandbox. No mutations occur on `virtualBalance`, `Holdings`, `Positions`, `Orders`, or `Transactions`.

---

## 9. Performance & Latency Budgets

- Intent classification & plan generation: `< 5ms`
- Parallel evidence retrieval across internal models: `< 15ms`
- Deterministic dossier synthesis & result hashing: `< 5ms`
- Total end-to-end backend latency (offline/cached): `< 25ms`
- Cached lookups via `MarketDataService` in-memory store: `0ms`
