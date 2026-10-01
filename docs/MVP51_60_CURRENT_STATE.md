# TradeFlow Current State Analysis: MVP-51 through MVP-60

## 1. Executive Starting State
TradeFlow has successfully delivered and verified milestones **MVP-1 through MVP-50**:
- Financial safety & paper trading: 100% read-only separation for all research modules.
- Core intelligence layers:
  - MVP-37: Research Copilot & Evidence Workspace
  - MVP-38: Market Event Intelligence Engine
  - MVP-39: "What Changed Today?" Daily Research Feed
  - MVP-40: Portfolio Health & Exposure Engine
  - MVP-41: Portfolio Scenario Planner 2.0
  - MVP-42: Portfolio Decision Journal
  - MVP-43: Market Regime Engine
  - MVP-44: Sector Intelligence Engine
  - MVP-45: Market Narrative Engine
  - MVP-46: Strategy Lab 2.0 (Versioned Strategies)
  - MVP-47: Strategy Robustness Lab
  - MVP-48: Strategy Research Notebook
  - MVP-49: Trading Journal Intelligence (Rule-based patterns)
  - MVP-50: Personal Research & Learning Coach (Learning loop)

---

## 2. Capabilities Inventory & Reusability Matrix

| Component | Existing Service / Model | Reusability in MVP-51 → MVP-60 |
|---|---|---|
| **Market Data** | `marketDataService.js`, Provider Abstraction (TwelveData / AlphaVantage / Mock) | Primary market data source for all automation & agent tools |
| **Scanner** | `marketScannerService.js`, `ScannerModel.js` | Agent tool `runScanner` and automated scan tasks |
| **Market Events** | `marketEventService.js`, `MarketEventModel.js` | Event digest automation and agent tool `getMarketEvents` |
| **Portfolio Intel** | `portfolioIntelligenceService.js`, `HoldingsModel.js` | Portfolio review automation, agent tool `getPortfolio` |
| **Scenario Planner**| `scenarioEngine.js`, `ScenarioModel.js` | Stress simulation step in workflows & agent tools |
| **Strategy & Backtest** | `backtestEngine.js`, `strategyVersioningService.js` | Backtest & robustness runner in workflows |
| **Strategy Notebook** | `strategyNotebookService.js`, `StrategyNotebookModel.js` | Experiment recording in workflows |
| **Decision Journal** | `decisionJournalService.js`, `DecisionJournalModel.js` | Decision tracking in team collaboration |
| **Journal Intelligence** | `journalIntelligenceService.js`, `TradeJournalModel.js` | Weekly journal reviews and digest generation |
| **Learning Coach** | `learningCoachService.js`, `LearningProfileModel.js` | Meta-research reflection in daily/weekly digests |

---

## 3. Analysis for New Modules (MVP-51 → MVP-60)

### MVP-51: Personal Automation Engine
- **Existing**: No persistent task scheduler model currently exists.
- **Requirement**: `backend/models/AutomationModel.js` for recurring user research tasks (`DAILY_BRIEF`, `PORTFOLIO_REVIEW`, `STRATEGY_REVIEW`, `EVENT_DIGEST`).
- **Safety**: Strictly non-trading. Automated BUY/SELL is forbidden. Manual `/run` endpoint for immediate execution.

### MVP-52: Intelligent Research Agent
- **Existing**: `researchCopilotService.js` (MVP-37) handles structured evidence gathering.
- **Requirement**: Controlled multi-step agent loop (`backend/services/researchAgentService.js`) using a closed tool registry:
  `getQuote`, `getHistoricalData`, `runScanner`, `getMarketEvents`, `getPortfolio`, `runScenario`, `runBacktest`, `runRobustness`, `getJournal`, `getDecision`, `getResearchSession`.
- **Safety**: Max 5 iterations, zero MongoDB direct access, zero code execution (`eval`), prompt injection guardrails.

### MVP-53: Research Workflow Builder
- **Existing**: Users run scanner, backtest, and scenario separately.
- **Requirement**: `backend/models/ResearchWorkflowModel.js` and `backend/services/researchWorkflowService.js` allowing sequential pipelines of allowlisted tools (`Scanner → Backtest → Robustness → Scenario → Report`).

### MVP-54: Intelligent Daily / Weekly Digest
- **Existing**: `insightsService.js` (MVP-39) generates daily feed.
- **Requirement**: `backend/services/digestService.js` synthesizing regime, portfolio concentration, critical events, open decisions, strategy experiments, and unreviewed trades into an evidence-linked executive brief.

### MVP-55: Team / Organization Workspace
- **Existing**: Single-user model (`UserModel.js`).
- **Requirement**: `OrganizationModel.js` and `MembershipModel.js` (roles: `OWNER`, `ADMIN`, `RESEARCHER`, `VIEWER`). Scoped permissions, invite/member lifecycle, strict isolation of private financial data.

### MVP-56: Shared Research & Collaboration
- **Existing**: Single-user research sessions and decisions.
- **Requirement**: Shared sessions, `ResearchCommentModel.js`, counter-evidence tags (`SUPPORTS THESIS`, `CONTRADICTS THESIS`, `NEUTRAL`), and research revision history without leaking private portfolios.

### MVP-57: Product Usage & Subscription Foundation
- **Existing**: Basic user accounts without tier tracking.
- **Requirement**: `planConfig.js` (FREE, PRO, TEAM), `UsageCounterModel.js` tracking quota consumed (AI requests, backtests, workflows, automations). Clean limits without payment processor dependency.

### MVP-58: Admin + Observability Center
- **Existing**: Standard console logging and central error handler.
- **Requirement**: Admin overview endpoints (`/api/v1/admin/overview`, `/providers`, `/system-events`), role-gated to `ADMIN`.

### MVP-59: Production Reliability & Security Hardening
- **Existing**: Basic rate limiter and auth middleware.
- **Requirement**: Helmet headers, CORS policies, provider circuit breakers, idempotent paper trade creation (`Idempotency-Key`), connection pooling check.

### MVP-60: Production Deployment + Interview Demo Mode
- **Existing**: Standard app structure.
- **Requirement**: Production configuration validation, `.env.production.example`, health check `/api/health`, structured request logger, polished end-to-end interview demo route `/api/v1/demo`.

---

## 4. Potential Duplication & Guardrails
- **No Duplicate Engines**: Never create secondary backtest or market data services. All agent and workflow tools wrap existing services.
- **Financial Ledger Mutation**: Real cash balances and active paper positions are strictly protected from automation and collaboration tools.
- **Zero Hallucination / Predictive Claims**: AI outputs are strictly educational summaries over structured evidence.
