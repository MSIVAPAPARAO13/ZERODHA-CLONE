# Development Roadmap

## MVP 0: Repository Audit + Documentation (Current Phase)
- Analyze existing structure.
- Generate PRD, Architecture, and Gap Analysis docs.

## MVP 1: Architecture + Codebase Cleanup
- Restructure backend into `controllers/`, `services/`, `routes/`, `middleware/`.
- Setup `.env` configuration and centralized error handling.
- Setup basic API request validation.

## MVP 2: Authentication + Authorization
- Create `User` model.
- Implement JWT-based login/register flow.
- Add authentication middleware to protect routes.

## MVP 3: Core Trading Domain
- Update `Holdings`, `Positions`, and `Orders` models to reference a `User`.
- Implement API endpoints for fetching user-specific portfolio data.
- Refactor frontend to use authenticated requests.

## MVP 4: Paper Trading Engine
- Add `virtualBalance` to the `User` model.
- Implement logic in order placement to check balance, deduct funds, and update holdings/positions accordingly.
- Create `Transaction` model for accounting history.

## MVP 5: Market Data Abstraction
- Create a `MarketDataProvider` service abstraction.
- Implement a robust MockProvider.
- Update the frontend to poll or fetch real-time simulated prices.

## MVP 6: Watchlists + Search
- Create a `Watchlist` model linked to `User`.
- Implement dynamic search for instruments.
- Allow users to add/remove instruments from their watchlist.

## MVP 7: Alerts + Notifications
- Implement basic in-app notifications for order execution.
- Create UI for toast notifications.

## MVP 8: Portfolio Analytics
- Improve the Dashboard UI to show historical portfolio value.
- Add advanced charting.

## MVP 9: Trading Journal
- Allow users to add notes and tags to specific executed orders.

## MVP 10: Backtesting
- Basic UI and backend engine to simulate a strategy over historical mock data.

## MVP 11: AI-Powered Explanations
- Integrate an LLM provider.
- Add a "Summarize my day" button that feeds portfolio data to the AI for analysis.

## MVP 12: SaaS Capabilities
- Add user settings, profile management, and mock subscription tiers.

## MVP 13: Admin Dashboard
- Basic view for admins to monitor total active users and system health.

## MVP 14: Production Hardening
- UI/UX polish (loading skeletons, empty states, error boundaries).
- Security audit (Helmet, CORS, rate limiting).
- Comprehensive testing.

## MVP 15: Deployment
- Deploy to Vercel/Render/MongoDB Atlas.

## MVP 32: Market Impact Intelligence
- External market event ingestion and normalization.
- Direct portfolio, watchlist, and strategy intersection matching.

## MVP 33: Market Event Cascade & Thesis Impact Engine
- Multi-hop evidence-backed relationship graph (Event → Entity → Sector → Portfolio → Strategy → Thesis → Research Question).
- Bounded depth controls, loop protection, and edge deduplication.
- Zero fabricated relationships with deterministic confidence states.
- Thesis drift detection, assumption diffs, user-confirmed review workflow, and thesis versioning.
- Grounded research question synthesis and decision timeline integration.
- Historical cascades with strict look-ahead protection.

## MVP 34: Advanced Scenario & Stress Studio
- What-if scenario analysis and deterministic stress testing for paper portfolios.
- Single asset, multi-asset, sector, index, and custom shock support.
- Multiplicative shock combination preventing additive double-counting.
- Mathematical holding attribution summing exactly to 100% of modeled portfolio loss.
- Strategy exposure mapping and thesis review linking (`SCENARIO REQUIRES REVIEW`).
- What-if position simulator (hypothetical ADD/REMOVE positions without trade execution).
- Side-by-side scenario comparison matrix (Scenario A vs B vs Baseline).
- Methodology transparency modal exposing formulas, version, and snapshot hash.
- Zero financial ledger side effects and strictly enforced user isolation.

## MVP 35: Strategy Research & Backtesting 2.0
- Deterministic rule DSL and technical indicator calculations (SMA, EMA, RSI, Breakout).
- Strict zero look-ahead protection (Bar T signal -> Bar T+1 execution).
- Simulation ledger, position sizing, realistic transaction costs, and symmetric slippage models.
- Auditable trade ledger, equity curve, max drawdown, win rate, and safe profit factor math.
- Parameter Lab & Grid Experiments with parameter sensitivity classification (LOW, MEDIUM, HIGH).
- Overfitting risk disclosures and warnings.
- Train / Test split validation with data leakage prevention and walk-forward rolling optimization.
- Cross-engine bridges: Backtest Strategy -> Stress Studio exposure simulation -> Thesis review -> Grounded AI explanation.
- Immutable ledger isolation: zero side effects on real paper trading balance or positions.

## MVP 36: Intelligent Market Scanner & Opportunity Discovery Engine
- Deterministic market scanning with structured JSON AST rule DSL (SMA, EMA, RSI, PRICE_CHANGE, VOLUME_SMA, DONCHIAN_BREAKOUT, RELATIVE_STRENGTH).
- Bounded universe evaluation: NIFTY 50, user watchlists, and custom symbol baskets.
- Dual match modes: STRICT (100% condition compliance) and NEAR (partial match for exploratory research).
- Transparent "Why Did This Match?" candidate drawer detailing exact indicator values vs condition thresholds.
- Real-time market breadth metrics (Advancing, Declining, Above SMA20, Above SMA50) and verified sector breakdowns.
- Seamless analytical bridges:
  - Discovery Candidate -> Watchlist (`+ Watchlist`)
  - Discovery Candidate -> Alert (`Create Alert`)
  - Scanner Rules -> Strategy Lab Backtest (`Backtest This Scan`)
  - Candidate Basket -> Stress Studio (`Stress Selected`)
  - Grounded AI Explainer strictly segmented into OBSERVED DATA, MATCH EXPLANATION, RESEARCH INTERPRETATION, LIMITATIONS, and UNKNOWNS.
- Data Quality and auditability panel disclosing bar count, data delay status, provider tier, and reproducible result hash.
- Zero financial ledger mutations; zero buy/sell stock tips.

## MVP 37: Research Copilot & Evidence Workspace
- Grounded, multi-source research dossiers synthesizing real quotes, historical indicators, scanner rules, backtest simulations, scenario stress, user watchlist, and trade thesis.
- Controlled Tool Registry: zero `eval()`, zero dynamic AI database queries, strict read-only execution.
- Deterministic Intent Planner supporting Security, Scanner, Strategy, Portfolio, Stress, Comparison, and Alert research.
- Full Evidence Taxonomy (`OBSERVED`, `DERIVED`, `INTERPRETED`, `UNKNOWN`, `LIMITATION`) with strict provider data provenance and timestamps.
- Grounded AI report strictly partitioned into 8 fact-checked sections; missing fundamentals labeled UNAVAILABLE; zero buy/sell stock tips.
- Visual directed evidence graph and 6-dimension empirical research gap detector.
- Deterministic SHA-256 `researchHash` for complete auditability.

## MVP 38: Market Event Intelligence Engine
- Continuous event detection beyond simplistic threshold alerts: `PRICE_MOVE`, `VOLUME_SURGE`, `VOLATILITY_CHANGE`, `TECHNICAL_BREAKOUT`, `TECHNICAL_BREAKDOWN`, `SCANNER_ENTRY`, `ALERT_TRIGGERED`.
- Transparent mathematical severity classification (`INFO`, `WATCH`, `SIGNIFICANT`, `CRITICAL`).
- Event Correlation & Clustering Engine: co-occurring signals on the same asset clustered into unified `CORRELATED_EVENT` with elevated severity.
- Deterministic SHA-256 hourly time-bucket deduplication preventing loop and alert spam.
- One-click `[🔬 Investigate]` bridge pre-populating Research Copilot with empirical inquiry.

## MVP 39: "What Changed Today?" Personalized Research Feed
- Single backend orchestration endpoint `GET /api/v1/insights/today` evaluating user portfolio, watchlist, active alerts, and research history.
- Contextual section grouping (`PORTFOLIO`, `WATCHLIST`, `ALERT`, `SCANNER`, `RESEARCH`, `MARKET`).
- Deterministic prioritization ordering by Severity Weight, Personal Context Bonus, and Recency.
- Factual "Why This Appears" justification on every insight card with zero unsolicited financial advice.
- Soft-dismissal capability preserving underlying audit evidence while cleaning today's active feed.
- Dynamic daily research inquiries synthesized from today's actual detected market events.
- Zero financial ledger mutation verified across all phases.

## MVP 40–50: Portfolio Intelligence, Decision Intelligence & Personal Learning
- MVP-40: Portfolio Health & Exposure Analytics (Herfindahl Index, concentration, sector attribution).
- MVP-41: Market Regime Detection & Volatility State Engine.
- MVP-42: Sector Intelligence & Rotation Studio.
- MVP-43: Market Narrative Synthesizer.
- MVP-44: Strategy Robustness & Parameter Sensitivity Analysis.
- MVP-45: Walk-Forward Validation & Out-of-Sample Overfitting Guards.
- MVP-46: Strategy Research Notebook & Experiment Ledger.
- MVP-47: Structured Decision Journal & Falsifiable Theses.
- MVP-48: Trading Journal Intelligence & Behavioral Pattern Recognition.
- MVP-49: Decision vs Execution Gap Analyzer.
- MVP-50: Personal Research & Discipline Coach (Capstone).

## MVP 51–60: Automation, AI Agents, Collaboration, SaaS & Production
- **MVP 51: Personal Automation Engine** — Recurring research workflows (`DAILY_BRIEF`, `PORTFOLIO_REVIEW`, `STRATEGY_REVIEW`, `JOURNAL_REVIEW`) with zero automated real-money trading.
- **MVP 52: Intelligent Research Agent** — Autonomous 5-stage research cycle (`Question` -> `Plan` -> `Collect Evidence` -> `Analyze` -> `Find Gaps` -> `Follow-up Questions`) bounded by an 11-tool sandbox.
- **MVP 53: Research Workflow Builder** — Persistent, versioned, reusable research pipelines with step reordering and allowlisted tool execution.
- **MVP 54: Intelligent Daily & Weekly Digest** — Evidence-grounded multi-dimensional synthesis across macro regimes, portfolio concentration, critical alerts, strategy experiments, and journal audits.
- **MVP 55: Team / Organization Workspace** — Multi-tenant organization accounts with granular Role-Based Access Control (`OWNER`, `ADMIN`, `RESEARCHER`, `VIEWER`) and strict private financial shielding.
- **MVP 56: Shared Research & Collaboration** — Organizational research sharing, threaded discussions with mentions, first-class counter-evidence tagging (`SUPPORTS_THESIS`, `CONTRADICTS_THESIS`), and diff versioning.
- **MVP 57: Product Usage & Subscription Foundation** — Centralized SaaS tier configuration (`FREE`, `PRO`, `TEAM`), discrete usage event logging, monthly billing period aggregates, and atomic quota enforcement.
- **MVP 58: Admin + Observability Center** — Gated administrative operations center with platform telemetry, error rates, market data provider latencies, and automated secret/PII scrubbing.
- **MVP 59: Production Reliability & Security Hardening** — Cryptographic order idempotency (`Idempotency-Key`), multi-tiered market data fallback hierarchy, and retry prevention on trading operations.
- **MVP 60: Production Deployment + Interview Demo Mode** — Deployment-ready environment configurations, deep health checks (`/api/health/detailed`), Request ID tracking, and 15-step interactive demo control room.

---
**BATCH STATUS: ALL MILESTONES (MVP-1 THROUGH MVP-60) OFFICIALLY PASS. DEVELOPMENT CONCLUDED.**

