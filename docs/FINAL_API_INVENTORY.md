# TRADEFLOW — COMPLETE REST API INVENTORY

**System**: TradeFlow Paper Trading & Market Intelligence API  
**Base URL**: `/api/v1` (Production) | `http://localhost:3002/api/v1` (Development)  
**Total Endpoints Documented**: 48  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)  
**Idempotency**: `Idempotency-Key: <uuid>` on mutating trade endpoints  
**Tracing**: `X-Request-Id: <uuid>` returned on all responses  

---

## 1. Authentication & Identity (`/api/v1/auth`)

| Method | Path | Auth Required | Role | Input (Body / Params) | Output Format | Database Effect | Service Used |
|---|---|---|---|---|---|---|---|
| `POST` | `/auth/register` | None | Public | `{ name, email, password }` | `{ status, user, token }` | Creates `User`, auto-seeds starter portfolio | `authController.js` |
| `POST` | `/auth/login` | None | Public | `{ email, password }` | `{ status, user, token }` | Reads `User`, verifies Bcrypt hash | `authController.js` |
| `GET` | `/auth/me` | Bearer JWT | Any | None | `{ status, user }` | Reads `User` record | `authController.js` |

---

## 2. Paper Trading Engine (`/api/v1/orders`)

| Method | Path | Auth Required | Role | Input (Body / Params) | Output Format | Database Effect | Service Used |
|---|---|---|---|---|---|---|---|
| `POST` | `/orders/buy` | Bearer JWT | Any | `{ symbol, qty, price }` + `Idempotency-Key` | `{ status, order, virtualBalance }` | ACID transaction: updates `User.virtualBalance`, creates `Order`, upserts `Holding`, writes `Transaction` | `tradingService.executeBuy` |
| `POST` | `/orders/sell` | Bearer JWT | Any | `{ symbol, qty, price }` + `Idempotency-Key` | `{ status, order, virtualBalance, realizedPnL }` | ACID transaction: credits `User.virtualBalance`, creates `Order`, decrements/deletes `Holding`, writes `Transaction` | `tradingService.executeSell` |
| `GET` | `/orders` | Bearer JWT | Any | `?limit=50&page=1` | `{ status, orders, total }` | Reads `orders` collection scoped to `user` | `tradingController.getOrders` |
| `GET` | `/orders/execution-quality` | Bearer JWT | Any | None | `{ status, metrics }` | Aggregates slippage vs prevailing quote | `executionService.js` |
| `GET` | `/orders/replay/:orderId` | Bearer JWT | Any | `orderId` in URL | `{ status, replayData }` | Fetches historical price path surrounding execution | `tradingService.getOrderReplay` |

---

## 3. Portfolio & Ledger (`/api/v1/portfolio`, `/api/v1/transactions`)

| Method | Path | Auth Required | Role | Input (Body / Params) | Output Format | Database Effect | Service Used |
|---|---|---|---|---|---|---|---|
| `GET` | `/portfolio/holdings` | Bearer JWT | Any | None | `{ status, holdings, totalInvestment, currentValue, totalPnL }` | Reads `holdings`, enriches with live market prices | `portfolioController.getHoldings` |
| `GET` | `/portfolio/positions` | Bearer JWT | Any | None | `{ status, positions }` | Reads `positions` collection scoped to `user` | `portfolioController.getPositions` |
| `GET` | `/portfolio/funds` | Bearer JWT | Any | None | `{ status, virtualBalance, marginUtilized, availableCash }` | Reads `User.virtualBalance` and holding values | `portfolioController.getFunds` |
| `GET` | `/portfolio/analytics` | Bearer JWT | Any | None | `{ status, sectorAllocation, topPerformers, beta }` | Aggregates holdings risk breakdown | `portfolioController.getAnalytics` |
| `GET` | `/portfolio/risk` | Bearer JWT | Any | None | `{ status, valueAtRisk, beta, volatility }` | Computes parametric 95% VaR | `riskService.js` |
| `POST` | `/portfolio/rebalance` | Bearer JWT | Any | `{ targetWeights, maxTurnover }` | `{ status, proposedTrades, turnover }` | Solves quadratic rebalancing optimization | `rebalanceService.js` |
| `GET` | `/transactions` | Bearer JWT | Any | `?limit=50&page=1` | `{ status, transactions }` | Reads immutable `transactions` audit ledger | `tradingController.getTransactions` |

---

## 4. Market Data Gateway (`/api/v1/market`)

| Method | Path | Auth Required | Role | Input (Body / Params) | Output Format | Database Effect | Service Used |
|---|---|---|---|---|---|---|---|
| `GET` | `/market/quote/:symbol` | None / JWT | Any | `symbol` in URL | `{ symbol, price, change, provider, cached, isStale }` | Caches in-memory TTL; 0 database writes | `marketDataService.getQuote` |
| `GET` | `/market/quotes` | None / JWT | Any | `?symbols=INFY,TCS,RELIANCE` | `{ quotes: [...] }` | Multi-symbol batch quote lookup | `marketDataService.getQuotes` |
| `GET` | `/market/historical/:symbol` | None / JWT | Any | `symbol` in URL, `?days=30` | `{ symbol, series: [OHLCV...] }` | Fetches daily candlestick series | `marketDataService.getHistorical` |
| `GET` | `/market/search` | None / JWT | Any | `?q=query` | `{ results: [...] }` | Symbol search query | `marketDataService.search` |
| `POST` | `/market/scan` | Bearer JWT | Any | `{ conditions: [...] }` | `{ matches: [...] }` | AST-based DSL scanner execution | `marketDataController.scanMarket` |
| `GET` | `/market/events` | Bearer JWT | Any | `?severity=CRITICAL` | `{ events: [...] }` | Reads macro and corporate earnings calendar | `marketDataController.getEvents` |
| `POST` | `/market/contagion` | Bearer JWT | Any | `{ originSector, shockSize }` | `{ shockPath, affectedSectors }` | Graph traversal contagion algorithm | `contagionService.js` |
| `GET` | `/market/correlations` | Bearer JWT | Any | None | `{ matrix, sectors }` | Computes Pearson correlation matrix | `correlationService.js` |
| `GET` | `/market/materiality` | Bearer JWT | Any | None | `{ graphNodes, links }` | Returns cross-asset materiality dependencies | `materialityService.js` |
| `GET` | `/market/digest/daily` | Bearer JWT | Any | None | `{ digest, date, signals }` | Generates multi-asset daily intelligence brief | `digestService.js` |

---

## 5. Watchlists & Real-Time Alerts (`/api/v1/watchlists`, `/api/v1/alerts`)

| Method | Path | Auth Required | Role | Input (Body / Params) | Output Format | Database Effect | Service Used |
|---|---|---|---|---|---|---|---|
| `GET` | `/watchlists` | Bearer JWT | Any | None | `{ status, watchlist }` | Reads `watchlists` scoped to user | `watchlistController.getWatchlist` |
| `POST` | `/watchlists` | Bearer JWT | Any | `{ name, symbol, price }` | `{ status, item }` | Upserts item into user's watchlist | `watchlistController.addToWatchlist` |
| `DELETE` | `/watchlists/:id` | Bearer JWT | Any | `id` in URL | `{ status, message }` | Deletes watchlist item | `watchlistController.removeFromWatchlist` |
| `GET` | `/alerts` | Bearer JWT | Any | None | `{ status, alerts }` | Reads `alerts` collection scoped to user | `alertController.getAlerts` |
| `POST` | `/alerts` | Bearer JWT | Any | `{ symbol, targetPrice, condition }` | `{ status, alert }` | Creates new price alert | `alertController.createAlert` |
| `DELETE` | `/alerts/:id` | Bearer JWT | Any | `id` in URL | `{ status, message }` | Deletes user's alert | `alertController.deleteAlert` |

---

## 6. Research, Strategy Lab & Copilot (`/api/v1/research`, `/api/v1/backtest`, `/api/v1/ai`)

| Method | Path | Auth Required | Role | Input (Body / Params) | Output Format | Database Effect | Service Used |
|---|---|---|---|---|---|---|---|
| `POST` | `/ai/insights` | Bearer JWT | Any | `{ symbol }` | `{ status, insights, educationalNotice }` | Generates grounded Gemini market insights | `aiService.generateDailyInsights` |
| `POST` | `/ai/portfolio-audit`| Bearer JWT | Any | None | `{ status, auditReport, concentrationRisk }` | Grounded portfolio analysis | `aiPortfolioService.auditPortfolio` |
| `POST` | `/research/session` | Bearer JWT | Any | `{ title, initialQuery }` | `{ status, session }` | Creates `ResearchSession` | `researchController.createSession` |
| `POST` | `/research/query` | Bearer JWT | Any | `{ sessionId, query }` | `{ status, answer, citations }` | Multi-turn copilot reasoning with citations | `researchController.querySession` |
| `POST` | `/research/agent/execute` | Bearer JWT | Any | `{ task, goal }` | `{ status, trajectory, finalSummary }` | Sandboxed 11-tool autonomous agent | `researchAgentService.executeTask` |
| `POST` | `/research/workflows/run` | Bearer JWT | Any | `{ workflowId, steps }` | `{ status, workflowResult }` | DAG execution engine | `researchWorkflowService.runWorkflow` |
| `POST` | `/research/narrative` | Bearer JWT | Any | `{ symbol, thesisType }` | `{ status, memo, thesisInvalidate }` | Structured thesis narrative synthesizer | `narrativeService.synthesize` |
| `POST` | `/backtest/run` | Bearer JWT | Any | `{ strategy, symbol, timeframe, params }` | `{ status, performance, equityCurve }` | Deterministic backtesting engine | `backtestService.runBacktest` |
| `POST` | `/backtest/monte-carlo`| Bearer JWT | Any | `{ backtestId, simulations }` | `{ status, confidenceBands, ruinProb }` | Parametric bootstrap simulation | `monteCarloService.runSimulation` |
| `POST` | `/backtest/walk-forward`| Bearer JWT | Any | `{ inSamplePct, steps }` | `{ status, walkForwardEfficiency }` | Train/test split optimization | `walkForwardService.runOptimization` |

---

## 7. Journal, Stress Testing & Automation

| Method | Path | Auth Required | Role | Input (Body / Params) | Output Format | Database Effect | Service Used |
|---|---|---|---|---|---|---|---|
| `GET` | `/journal` | Bearer JWT | Any | `?page=1` | `{ status, journals }` | Reads `decisionjournals` and `tradejournals` | `journalController.getJournals` |
| `POST` | `/journal` | Bearer JWT | Any | `{ symbol, notes, rationale, emotionalState }` | `{ status, entry }` | Creates journal record | `journalController.createEntry` |
| `GET` | `/analytics/biases` | Bearer JWT | Any | None | `{ status, biases: [...] }` | Analyzes overtrading and loss aversion | `behavioralService.analyze` |
| `POST` | `/scenarios/simulate` | Bearer JWT | Any | `{ scenarioType, shockOverrides }` | `{ status, portfolioImpact, drawdown }` | Simulates macro factor shocks | `scenarioEngine.simulateScenario` |
| `POST` | `/decisions/pre-mortem`| Bearer JWT | Any | `{ thesis, risks }` | `{ status, failureScenarios, mitigations }` | Generates decision inversion analysis | `decisionService.preMortem` |
| `GET` | `/automation` | Bearer JWT | Any | None | `{ status, jobs }` | Reads scheduled research pipelines | `automationController.getJobs` |
| `POST` | `/automation` | Bearer JWT | Any | `{ schedule, action, target }` | `{ status, job }` | Registers automated research job | `automationController.createJob` |

---

## 8. Multi-Tenant Organizations & System Admin (`/api/v1/orgs`, `/api/v1/admin`, `/api/health`)

| Method | Path | Auth Required | Role | Input (Body / Params) | Output Format | Database Effect | Service Used |
|---|---|---|---|---|---|---|---|
| `POST` | `/orgs` | Bearer JWT | Any | `{ name }` | `{ status, org, membership }` | Creates `Organization` and OWNER `Membership` | `orgController.createOrg` |
| `POST` | `/orgs/:id/members` | Bearer JWT | OWNER / ADMIN | `{ email, role }` | `{ status, member }` | Scoped RBAC membership assignment | `orgController.addMember` |
| `POST` | `/research/:id/comments` | Bearer JWT | Member | `{ text, counterEvidence }` | `{ status, comment }` | Threaded research comment | `orgController.addComment` |
| `GET` | `/admin/metrics` | Bearer JWT | ADMIN | None | `{ status, totalUsers, totalOrders, uptime }` | Cross-tenant telemetry audit | `adminController.getMetrics` |
| `GET` | `/health` | None | Public | None | `{ status: "ok", timestamp }` | Liveness check | `healthController.js` |
| `GET` | `/health/detailed`| None | Public | None | `{ status, db: { connected, pingMs }, uptime }` | Atlas database ping and provider status | `healthController.js` |
