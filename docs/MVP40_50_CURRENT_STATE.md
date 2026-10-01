# MVP-40 → MVP-50 CURRENT STATE AUDIT & REUSABILITY ANALYSIS

## 1. Executive Summary

This audit assesses TradeFlow's existing codebase (MVP-1 through MVP-39) to plan the development of **MVP-40 through MVP-50** in accordance with Rule 1 (Inspect First) and Rule 2 (No Rebuild).

```text
MARKET DATA & METADATA (MarketDataService, VERIFIED_TAXONOMY)
                             ↓
PORTFOLIO HEALTH & EXPOSURE (MVP-40: portfolioIntelligenceService)
                             ↓
PORTFOLIO SCENARIOS (MVP-41: scenarioEngine reuse)
                             ↓
PORTFOLIO DECISIONS (MVP-42: DecisionJournalModel)
                             ↓
MARKET REGIME & SECTORS (MVP-43 & MVP-44: regime & sector services)
                             ↓
MARKET NARRATIVE (MVP-45: marketNarrativeService)
                             ↓
STRATEGY LAB 2.0 & ROBUSTNESS (MVP-46 & MVP-47: backtestEngine reuse)
                             ↓
STRATEGY NOTEBOOK (MVP-48: StrategyNotebookModel)
                             ↓
JOURNAL INTELLIGENCE (MVP-49: TradeJournalModel extension)
                             ↓
PERSONAL RESEARCH & LEARNING COACH (MVP-50: LearningProfileModel capstone)
```

---

## 2. Capability Audit Matrix

| Domain / Milestone | Existing Service / Model / API | Reusable Assets | Gaps / Required Implementation | Duplicate Risk |
|---|---|---|---|---|
| **MVP-40: Portfolio Health & Exposure** | `HoldingsModel`, `PositionsModel`, `UserModel`, `portfolioController.js`, `marketDataService.js`, `marketMetadata.js` (`VERIFIED_TAXONOMY`) | 100% of holdings, positions, cash balance, and verified sector metadata already exist. | Need `portfolioIntelligenceService.js` to compute concentration (Top 1, Top 3, Top 5, HHI), sector distribution, and deterministic health classifications (`BALANCED`, `CONCENTRATED`, `CASH_HEAVY`). | High risk of re-querying market data; must use cached quotes from `marketDataService`. |
| **MVP-41: Portfolio Scenario Planner 2.0** | `scenarioEngine.js`, `ScenarioModel.js`, `scenarioController.js`, `scenarioRoutes.js` | Full multiplicative shock calculation, portfolio attribution, and presets already implemented in `scenarioEngine.js`. | Extend with what-if custom slider simulations, scenario saving via `ScenarioModel`, and one-click Research Copilot bridge without ledger mutation. | Do NOT create a second scenario engine. |
| **MVP-42: Portfolio Decision Journal** | `TradeJournalModel.js`, `ThesisReviewModel.js`, `ResearchSessionModel.js`, `MarketEventModel.js`, `ScenarioModel.js` | Evidence IDs, session hashes, event clusters, and trade theses exist. | Create `DecisionJournalModel.js` with structured links to Research, Events, Scenarios, and Journal. Add timeline tracking. | Ensure decisions link to evidence references by ID rather than duplicating raw evidence data. |
| **MVP-43: Market Regime Engine** | `marketDataService.js`, `marketScannerService.js` (market breadth & advance/decline metrics) | Real-time quote aggregation, breadth calculations, moving averages. | Create `marketRegimeService.js` with deterministic regime classification (`TRENDING_UP`, `TRENDING_DOWN`, `RANGE_BOUND`, `HIGH_VOLATILITY`, `LOW_VOLATILITY`, `MIXED`) and emit `MARKET_REGIME_CHANGE` to MVP-38. | Avoid black-box AI sentiment scoring; use deterministic indicator thresholds. |
| **MVP-44: Sector Intelligence Engine** | `backend/config/marketMetadata.js` (`VERIFIED_TAXONOMY`), `marketDataService.js`, `marketScannerService.js` | Official NSE/BSE sectors, related entities, multi-symbol quote retrieval. | Create `sectorIntelligenceService.js` to compute sector performance, breadth, and user portfolio exposure cross-linking. Support sector comparisons. | Do not scrape external websites; use verified exchange taxonomy. |
| **MVP-45: Market Narrative Engine** | `marketEventService.js`, `insightsService.js`, `aiAnalystService.js` | Correlated events, daily insight digest, and grounded AI explanation pipeline. | Create `marketNarrativeService.js` and `GET /api/v1/market/narrative` producing evidence-based market summaries with zero fabricated facts. | Never let AI state predictions ("Market will rally"); enforce strictly observed evidence narrative. |
| **MVP-46: Strategy Lab 2.0** | `backtestEngine.js`, `StrategyModel.js`, `strategyController.js` | Full backtesting engine, indicator DSL (SMA, EMA, RSI, Breakout), simulation ledger, slippage, and fee models. | Add deterministic parameter hashing (`parametersHash`), immutable versioning increments, and side-by-side strategy comparison. | Do NOT build a new backtester; extend existing engine. |
| **MVP-47: Strategy Robustness Lab** | `backtestEngine.js` (split-test, walk-forward, optimization methods) | Out-of-sample testing, train/test separation, parameter sensitivity grid. | Create `strategyRobustnessService.js` wrapping multi-period walk-forward, fee sensitivity, slippage sensitivity, and deterministic robustness classifications (`LOW`, `MODERATE`, `HIGHER ROBUSTNESS`). | Prevent data leakage across training and out-of-sample periods. |
| **MVP-48: Strategy Research Notebook** | `StrategyModel.js`, `ResearchSessionModel.js`, `researchCopilotService.js` | Session schemas, hash generation, and research orchestration. | Create `StrategyNotebookModel.js` capturing hypotheses, strategy versions, backtest hashes, limitations, and direct Copilot bridges. | Avoid duplicate experiment logs; use SHA-256 result hashes. |
| **MVP-49: Trading Journal Intelligence** | `TradeJournalModel.js`, `behaviorAnalyticsService.js`, `playbookService.js` | Historical paper trades, checklists, confidence ratings, and review flows. | Create `journalIntelligenceService.js` detecting empirical rule-based patterns (early exits, repeated setup failures, unlinked research, high slippage). | Do not diagnose mental health; surface measurable journal facts only. |
| **MVP-50: Personal Learning Coach** | All services (MVP-1 → MVP-49) | Full audit trails across research sessions, backtests, scenarios, journal entries, and decisions. | Create `LearningProfileModel.js` and `learningCoachService.js` synthesizing empirical knowledge gaps, personalized research inquiries, and closing the full research-to-review loop. | Keep AI strictly confined to reflection and research guidance; never provide financial tips. |

---

## 3. Strict Development Constraints Checklist

- [x] **Zero Financial Mutation**: `virtualBalance`, `Orders`, `Holdings`, `Positions`, `Transactions` remain untouched by all intelligence services.
- [x] **Multi-Tenant User Isolation**: Every endpoint and service query scopes by `req.user.userId`.
- [x] **Provider Abstraction**: All market quotes and historical bars pass through `MarketDataService`.
- [x] **No Fabricated Data**: Missing fields return `UNAVAILABLE` or `LIMITATION`.
- [x] **Deterministic Rules**: No opaque "AI scores"; all metrics and classifications are mathematically transparent.
