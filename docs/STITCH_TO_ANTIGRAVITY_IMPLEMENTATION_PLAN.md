# STITCH TO ANTIGRAVITY IMPLEMENTATION PLAN

**Target**: Production UI Redesign Implementation  
**Status**: SPECIFICATION ONLY — NO CODE MODIFICATION UNTIL STITCH APPROVAL  
**Guiding Architecture Principle**: Zero backend changes. Zero API contract changes. Zero business logic alterations. Only presentational UI polish.

---

## 1. Migration Protocol & Guardrails

1. **API Contracts are Immutable**: All existing Express endpoints, request headers, payload shapes, and response structures (`success`, `data`, `error`) remain 100% untouched.
2. **Business Logic Preserved**: Idempotency locking, MongoDB ACID transaction workflows, weighted-average holding calculations, and risk attribution engines remain identical.
3. **Component Refactoring Over Replacement**: Existing state hooks, `useEffect` fetch logic, and API calls are retained inside components while upgrading JSX markup and CSS stylesheets.
4. **Zero Regressions**: All 40 existing backend test suites must pass continuously before and after frontend styling integration.

---

## 2. Page-by-Page Implementation Specifications

---

### Page 1: App Shell & Global Layout
- **Current Page**: Global layout shell
- **Current Route**: All authenticated routes (`/*`)
- **Current Components**: `Home.js`, `Menu.js`, `WatchList.js`, `index.css`
- **Current APIs**: `GET /api/v1/watchlist`, `POST /api/v1/watchlist`, `DELETE /api/v1/watchlist/:symbol`, `GET /api/v1/market/search`
- **Stitch Target**: Stitch Screen #2 (Global App Shell)
- **Components to Modify**:
  - `Home.js`: Integrate sticky top command bar with `Ctrl+K` search modal and index chips.
  - `Menu.js`: Add collapsible rail toggle state (`expanded` vs `mini` mode).
  - `WatchList.js`: Transform into collapsible slide-over drawer with toggle button.
- **Components to Create**: `CommandBar.js` (quick search dialog).
- **Components to Remove**: Legacy fixed index strip in `Home.js`.
- **API Changes Required**: **NONE**.
- **Risk**: Low (structural layout only).
- **Test Plan**: Verify navigation links route properly; verify watchlist search and add/remove work in collapsed dock.

---

### Page 2: Executive Command Center
- **Current Page**: Overview / Summary
- **Current Route**: `/`
- **Current Components**: `Summary.js`
- **Current APIs**: Currently hardcoded; to be wired to existing `portfolioService.getHoldings()`, `accountService.getBalance()`, `insightsService.getToday()`.
- **Stitch Target**: Stitch Screen #3 (Executive Command Center)
- **Components to Modify**:
  - `Summary.js`: Replace crude colored boxes and hardcoded strings with 4 KPI cards, "What Changed Today" catalyst summary, concentration gauge, and live order feed.
- **Components to Create**: None (implemented inside `Summary.js`).
- **Components to Remove**: Hardcoded static margin text.
- **API Changes Required**: **NONE** (Uses existing endpoints).
- **Risk**: Low.
- **Test Plan**: Verify live balance and holdings are fetched on mount; verify clicking catalyst card navigates to `/research`.

---

### Page 3: Holdings & Portfolio Analytics
- **Current Page**: Holdings
- **Current Route**: `/holdings`
- **Current Components**: `Holdings.js`, `VerticalGraph.js`
- **Current APIs**: `GET /api/v1/portfolio/holdings`
- **Stitch Target**: Stitch Screen #4 (Holdings & Portfolio Analytics)
- **Components to Modify**:
  - `Holdings.js`: Add column sorting, P&L badge styling, and sector allocation breakdown.
  - `VerticalGraph.js`: Upgrade Chart.js palette from pink to theme series colors.
- **Components to Create**: `AllocationDonut.js` (clean SVG sector donut).
- **Components to Remove**: None.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Verify P&L calculations match backend; verify clicking "Sell" button opens `BuyActionWindow` in SELL mode.

---

### Page 4: Positions & Intraday Exposure
- **Current Page**: Positions
- **Current Route**: `/positions`
- **Current Components**: `Positions.js`
- **Current APIs**: `GET /api/v1/portfolio/positions`
- **Stitch Target**: Stitch Screen #5 (Positions & Exposure)
- **Components to Modify**:
  - `Positions.js`: Add product filter tabs (MIS/CNC), net exposure banner, and one-click closeout trigger.
- **Components to Create**: None.
- **Components to Remove**: None.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Verify open positions render properly; verify P&L highlights green/red accurately.

---

### Page 5: Orders & Execution History
- **Current Page**: Orders
- **Current Route**: `/orders`
- **Current Components**: `Orders.js`
- **Current APIs**: `GET /api/v1/orders`
- **Stitch Target**: Stitch Screen #6 (Orders & Execution Ledger)
- **Components to Modify**:
  - `Orders.js`: Wire `orderService.getOrders()` and build the complete orders data table with status badges and CSV export.
- **Components to Create**: None.
- **Components to Remove**: Static "You haven't placed any orders today" empty card.
- **API Changes Required**: **NONE** (Backend API already exists and returns complete order documents).
- **Risk**: Very Low.
- **Test Plan**: Place paper order in modal; verify new order appears immediately in Orders table with `FILLED` badge.

---

### Page 6: Paper Order Placement Modal
- **Current Page**: Order Execution Modal
- **Current Route**: Modal trigger across app (`GeneralContext`)
- **Current Components**: `BuyActionWindow.js`, `BuyActionWindow.css`
- **Current APIs**: `POST /api/v1/orders/new`, `GET /api/v1/account/balance`, `GET /api/v1/playbooks`
- **Stitch Target**: Stitch Screen #12 (Paper Order Execution Modal)
- **Components to Modify**:
  - `BuyActionWindow.js`: Convert tall vertical scrolling form into 3 structured tabs (Order Specs, Playbook Rules, Thesis). Add prominent "PAPER TRADING SIMULATION" banner.
- **Components to Create**: None.
- **Components to Remove**: Unstyled checkbox list.
- **API Changes Required**: **NONE**.
- **Risk**: Medium (Financial execution flow).
- **Test Plan**: Verify idempotency key is generated and sent in headers; verify insufficient funds triggers error toast; verify successful order updates balance and closes modal.

---

### Page 7: Daily Insights ("What Changed Today")
- **Current Page**: Daily Insights Feed
- **Current Route**: `/insights`
- **Current Components**: `Insights.js`, `Insights.css`
- **Current APIs**: `GET /api/v1/insights/today`, `PATCH /api/v1/insights/:id/dismiss`
- **Stitch Target**: Stitch Screen #8 (Daily Insights)
- **Components to Modify**:
  - `Insights.js`: Add executive market regime hero banner, category filter pills (All, Earnings, Volatility, Macro), and streamlined investigation links.
- **Components to Create**: None.
- **Components to Remove**: None.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Verify events render grouped by category; verify dismissing an event removes it from feed.

---

### Page 8: Market Scanner & Opportunity Discovery
- **Current Page**: Market Scanner
- **Current Route**: `/scanner`, `/market-scanner`
- **Current Components**: `MarketScanner.js`, `MarketScanner.css`
- **Current APIs**: `POST /api/v1/scanners/run`, `POST /api/v1/scanners/explain`, `POST /api/v1/scanners/stress`
- **Stitch Target**: Stitch Screen #9 (Market Scanner)
- **Components to Modify**:
  - `MarketScanner.js`: Refactor layout into clean two-column split view (left preset & condition panel, right candidate results table with condition match bars).
- **Components to Create**: None.
- **Components to Remove**: None.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Select preset; run scan; verify candidate list matches backend response; open candidate drawer for AI explanation.

---

### Page 9: Market Events & Cascade Contagion
- **Current Pages**: Market Events & Cascade Graph
- **Current Routes**: `/events`, `/cascade`
- **Current Components**: `Events.js`, `Events.css`, `MarketCascade.js`, `MarketCascade.css`
- **Current APIs**: `GET /api/v1/events`, `POST /api/v1/events/evaluate`, `GET /api/v1/market-events/:id/cascade`
- **Stitch Targets**: Stitch Screen #10 (Events Timeline) & Stitch Screen #11 (Cascade Graph)
- **Components to Modify**:
  - `Events.js`: Chronological timeline layout with severity iconography (Flame/Bolt/Eye).
  - `MarketCascade.js`: Refine interactive node network styling with zoom/pan controls and clean right-side thesis note drawer.
- **Components to Create**: None.
- **Components to Remove**: None.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Adjust depth slider; verify multi-hop nodes update dynamically; verify node impact metrics display properly.

---

### Page 10: Research Copilot & Agent
- **Current Page**: Research Copilot
- **Current Route**: `/research`
- **Current Components**: `ResearchCopilot.js`, `ResearchCopilot.css`
- **Current APIs**: `POST /api/v1/research/investigate`, `POST /api/v1/research/deeper`, `GET /api/v1/research/sessions`
- **Stitch Target**: Stitch Screen #12 (Research Copilot)
- **Components to Modify**:
  - `ResearchCopilot.js`: 3-pane research workstation layout (collapsible session history rail, center structured report with citation tooltips, right company quote and quick order dock).
- **Components to Create**: None.
- **Components to Remove**: None.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Submit question; verify agent report renders with verified evidence citations; verify deeper research updates document.

---

### Page 11: Strategy Lab & Backtesting
- **Current Page**: Strategy Lab
- **Current Route**: `/strategy-lab`, `/strategies`
- **Current Components**: `StrategyLab.js`, `StrategyLab.css`
- **Current APIs**: `GET /api/v1/strategies`, `POST /api/v1/strategies/backtest/run`, `POST /api/v1/strategies/backtest/optimize`
- **Stitch Target**: Stitch Screen #13 (Strategy Lab)
- **Components to Modify**:
  - `StrategyLab.js`: Quantitative research layout with top preset banner, KPI ribbon (Sharpe, Drawdown, CAGR), interactive equity curve, and monthly returns heatmap.
- **Components to Create**: None.
- **Components to Remove**: None.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Select preset; run backtest; verify equity curve renders; toggle parameter optimizer.

---

### Page 12: Scenario Planner & Stress Studio
- **Current Page**: Scenario Planner
- **Current Route**: `/stress-studio`, `/scenarios`
- **Current Components**: `StressStudio.js`, `StressStudio.css`
- **Current APIs**: `GET /api/v1/scenarios`, `POST /api/v1/scenarios/run`
- **Stitch Target**: Stitch Screen #14 (Stress Studio)
- **Components to Modify**:
  - `StressStudio.js`: Risk cockpit layout with interactive shock dials, waterfall loss attribution chart, and holding-level sensitivity metrics.
- **Components to Create**: None.
- **Components to Remove**: None.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Adjust shock slider; run scenario; verify baseline vs stressed value and waterfall attribution render correctly.

---

### Page 13: Journaling, Replay & Behavioral Coaching
- **Current Pages**: Trade Journal, Trade Replay, Behavioral Edge, Playbooks
- **Current Routes**: `/journal`, `/replay/:id`, `/behavior-insights`, `/playbooks`
- **Current Components**: `TradeJournal.js`, `TradeReplay.js`, `BehaviorInsights.js`, `Playbooks.js`
- **Current APIs**: `GET /api/v1/journal`, `GET /api/v1/journal/:id/replay`, `GET /api/v1/analytics/behavior`, `GET /api/v1/playbooks`
- **Stitch Targets**: Stitch Screens #16, #17, #18, #19
- **Components to Modify**:
  - `TradeJournal.js`: Timeline card view with emotion tags and confidence stars.
  - `TradeReplay.js`: Candlestick chart marking entry/exit arrows alongside Gemini post-mortem review.
  - `BehaviorInsights.js`: Radial discipline score gauge and radar chart for cognitive strengths.
  - `Playbooks.js`: Card grid with slide-over editor drawer.
- **Components to Create**: None.
- **Components to Remove**: Native browser `prompt`/`alert` calls in `Playbooks.js`.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Verify journal loads trades; verify replay chart displays; verify AI reflections generate and render cleanly.

---

### Page 14: System, Funds, Demo & Authentication
- **Current Pages**: Alerts, Funds, Demo, Login, Register, Apps
- **Current Routes**: `/alerts`, `/funds`, `/demo`, `/login`, `/register`, `/apps`
- **Current Components**: `Alerts.js`, `Funds.js`, `InterviewDemo.js`, `Login.js`, `Register.js`, `Apps.js`
- **Current APIs**: `GET /api/v1/alerts`, `GET /api/v1/account/balance`, `GET /api/v1/demo`, `POST /api/v1/demo/reset`, `POST /api/v1/auth/*`
- **Stitch Targets**: Stitch Screens #20, #21, #22, #23
- **Components to Modify**:
  - `Alerts.js`: Split layout with quick percentage offset buttons.
  - `Funds.js`: Paper trading capital cockpit with virtual balance reset button and transaction audit ledger.
  - `InterviewDemo.js`: Interactive 13-stage guided demonstration stepper.
  - `Login.js` & `Register.js`: Two-column split layout with terminal branding.
  - `Apps.js`: Redirect to `/insights`.
- **Components to Create**: None.
- **Components to Remove**: Misleading UPI and commodity account copy in `Funds.js`.
- **API Changes Required**: **NONE**.
- **Risk**: Low.
- **Test Plan**: Test alert creation; test demo reset; test user login/logout; verify session persistence.

---

## 3. Implementation Plan Sign-Off

- **Total Existing Components Modified**: 18
- **New Reusable Utility Components**: 2 (`CommandBar.js`, `AllocationDonut.js`)
- **Components Removed / Deprecated**: 1 (`Apps.js` redirected)
- **Backend API Endpoints Changed**: **0 (ZERO)**
- **Business Logic Alterations**: **0 (ZERO)**
- **Verification Rule**: Full automated test regression (`40/40 test suites`) will be run after each batch of visual component updates.
