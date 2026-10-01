# TRADEFLOW — EXISTING FRONTEND PAGE & COMPONENT INVENTORY

**Audit Date**: October 2026  
**Scope**: `dashboard/src/` — All Pages, Routed Views, Persistent Shell Elements, and Modals  
**Audit Purpose**: Complete evidence-based inventory of existing UI implementation to drive Google Stitch visual redesign without inventing or deleting functionality.

---

## 1. Executive Summary & Inventory Counts

- **Total Frontend Routes Configured**: 26 routes (in `index.js` and `Dashboard.js`)
- **Total Unique Functional Views / Pages**: 22 functional views
- **Total Persistent Shell Components**: 4 (`Menu.js` / Sidebar, `Home.js` / Index Strip, `WatchList.js` / Side Drawer, `BuyActionWindow.js` / Order Modal)
- **Authentication Protected Views**: 20
- **Public Views**: 2 (`/login`, `/register`)

---

## 2. Complete Page-by-Page Inventory

### 2.1 Public Authentication Views

#### Page 1: Login
- **Route**: `/login`
- **Component**: `pages/Login.js`
- **Purpose**: Authenticate existing users and issue JWT token into `localStorage`.
- **User Type**: Public / Unauthenticated
- **API Endpoints**: `POST /api/v1/auth/login`
- **Main Components**: Header branding, Email input, Password input, Submit button, Link to `/register`.
- **Primary CTA**: "Log in"
- **Secondary Actions**: "Don't have an account? Sign up"
- **Data Displayed**: Form validation errors, authentication error toasts.
- **Interactions**: Form submission, redirection on success to `/`.
- **Current Problems**: Basic unstyled HTML card, stark white background, generic blue button, lack of modern financial branding or simulation disclosures.
- **UI Improvement Required**: Polished two-column split layout with TradeFlow brand showcase, feature highlights (Simulation Engine, Research Copilot), and refined input states.

#### Page 2: Register
- **Route**: `/register`
- **Component**: `pages/Register.js`
- **Purpose**: Create a new user account with initial simulated ₹100,000 virtual balance.
- **User Type**: Public / Unauthenticated
- **API Endpoints**: `POST /api/v1/auth/register`
- **Main Components**: Name input, Email input, Password input, Confirm Password input, Submit button, Link to `/login`.
- **Primary CTA**: "Create account"
- **Secondary Actions**: "Already have an account? Log in"
- **Data Displayed**: Password strength requirements, validation error toasts.
- **Interactions**: Form submission, auto-login or redirect to `/login`.
- **Current Problems**: Bare-bones styling, no password visibility toggles, lacks welcoming onboarding visuals.
- **UI Improvement Required**: Clean modern card with progress indicator, explicit disclosure of paper-trading virtual capital allocation.

---

### 2.2 Core Overview & Portfolio Views

#### Page 3: Dashboard Overview / Summary
- **Route**: `/`
- **Component**: `components/Summary.js`
- **Purpose**: High-level snapshot of user account, portfolio value, market intelligence banners, and quick links.
- **User Type**: Authenticated Trader / Researcher
- **API Endpoints**: Currently static/mocked in UI; backend supports `GET /api/v1/portfolio/summary`, `GET /api/v1/account/balance`, `GET /api/v1/insights/today`.
- **Main Components**: Username banner, 4 feature alert cards (Market Cascade, Stress Studio, Strategy Lab, Market Scanner), Equity balance card, Holdings summary card.
- **Primary CTA**: Quick navigation to feature labs (`/cascade`, `/stress-studio`, `/strategy-lab`, `/scanner`).
- **Secondary Actions**: Toggle portfolio metrics.
- **Data Displayed**: Available margin, margins used, opening balance, current value, total investment, P&L.
- **Interactions**: Clickable feature cards.
- **Current Problems**: High severity UX issue: Numbers are hardcoded strings ("3.74k Margin", "31.43k Current Value") copied from legacy Zerodha clone mockup; feature cards use crude colored inline borders.
- **UI Improvement Required**: Replace hardcoded values with live `/api/v1/portfolio/summary` metrics; create an executive command dashboard with market regime indicator, "What Changed Today" widget, and portfolio health cards.

#### Page 4: Holdings
- **Route**: `/holdings`
- **Component**: `components/Holdings.js`
- **Purpose**: Detailed breakdown of long-term CNC stock holdings, valuation, and individual P&L.
- **User Type**: Authenticated Trader
- **API Endpoints**: `GET /api/v1/portfolio/holdings`
- **Main Components**: Table header, Holdings table (Instrument, Qty, Avg cost, LTP, Cur val, P&L, Net chg, Day chg, Action), Summary stats row (Investment, Value, P&L), `VerticalGraph` chart.
- **Primary CTA**: "Sell" button per holding row (triggers `BuyActionWindow` in SELL mode).
- **Secondary Actions**: Sorting by column, chart inspection.
- **Data Displayed**: Stock ticker, share count, weighted cost basis, current market quote, unrealized profit/loss, daily return.
- **Interactions**: Clicking "Sell" opens modal pre-filled with symbol and position size.
- **Current Problems**: Table styling is cramped, chart below table is basic Chart.js bar chart with jarring pink colors, lacks sector filtering and allocation donut.
- **UI Improvement Required**: Modern data table with sticky headers, color-coded P&L chips, integrated sector breakdown badges, and clean performance sparklines.

#### Page 5: Positions
- **Route**: `/positions`
- **Component**: `components/Positions.js`
- **Purpose**: Real-time view of open intraday / derivative simulation positions.
- **User Type**: Authenticated Trader
- **API Endpoints**: `GET /api/v1/portfolio/positions`
- **Main Components**: Positions table (Product, Instrument, Qty, Avg, LTP, P&L, Chg, Action).
- **Primary CTA**: "Sell" / Square off position.
- **Secondary Actions**: Filter by product (MIS/CNC/NRML).
- **Data Displayed**: Product type, instrument name, quantity, average fill price, current price, unrealized P&L.
- **Interactions**: "Sell" triggers order execution modal.
- **Current Problems**: Lacks square-off all CTA, no net delta or exposure calculation, plain table styling.
- **UI Improvement Required**: Segmented product tabs, net exposure card, one-click closeout with confirmation drawer.

#### Page 6: Orders & Execution History
- **Route**: `/orders`
- **Component**: `components/Orders.js`
- **Purpose**: Historical log of placed, filled, and rejected paper orders.
- **User Type**: Authenticated Trader
- **API Endpoints**: Currently stubbed in component; backend supports `GET /api/v1/orders`.
- **Main Components**: Empty state container with link to `/`.
- **Primary CTA**: "Get started"
- **Secondary Actions**: None.
- **Data Displayed**: Static text "You haven't placed any orders today".
- **Current Problems**: Critical UX gap: The component is an empty placeholder even though backend `orderService.getOrders()` has full data.
- **UI Improvement Required**: Implement complete orders data table with columns: Timestamp, Symbol, Type (BUY/SELL), Quantity, Execution Price, Status (COMPLETED/REJECTED), and Idempotency Key reference.

#### Page 7: Virtual Funds & Ledger
- **Route**: `/funds`
- **Component**: `components/Funds.js`
- **Purpose**: Display available simulated cash balance, margin utilization, and ledger history.
- **User Type**: Authenticated Trader
- **API Endpoints**: `GET /api/v1/account/balance`
- **Main Components**: Action buttons ("Add funds", "Withdraw"), Available cash card, Margin allocation table.
- **Primary CTA**: Simulated cash reset / deposit.
- **Secondary Actions**: View transaction ledger.
- **Data Displayed**: Available virtual cash, opening balance, collateral.
- **Current Problems**: Confusing copy referencing real UPI transfers and commodity accounts from Zerodha clone template; lacks visual transaction history ledger.
- **UI Improvement Required**: Clear "Paper Trading Capital" header, balance reset button (`POST /api/v1/demo/reset`), deposit simulation modal, and embedded transaction audit table.

---

### 2.3 Market Intelligence & Surveillance Views

#### Page 8: Daily Insights ("What Changed Today")
- **Route**: `/insights`
- **Component**: `components/Insights.js`
- **Purpose**: Signature intelligence feed presenting categorized daily market events, regime shifts, and portfolio impact.
- **User Type**: Trader / Market Researcher
- **API Endpoints**: `GET /api/v1/insights/today`, `PATCH /api/v1/insights/:id/dismiss`
- **Main Components**: Header with date badge, Summary KPI strip, Event sections grouped by category (EARNINGS, VOLATILITY, REGIME, MACRO), Event cards with severity badges, "Investigate" CTA.
- **Primary CTA**: "Investigate in Research Copilot"
- **Secondary Actions**: "Dismiss from feed", "Ask Research Question".
- **Data Displayed**: Symbol, event title, severity (CRITICAL, SIGNIFICANT, WATCH, INFO), description, timestamp, impact attribution.
- **Interactions**: Click card to expand details; click investigate to navigate to `/research?symbol=...`.
- **Current Problems**: Text-dense cards, inconsistent spacing between category groups, lacks a visual market regime meter.
- **UI Improvement Required**: Executive summary banner with market regime indicator (BULLISH/DEFENSIVE/VOLATILE), impact tags connecting events to portfolio holdings, and clean collapsible cards.

#### Page 9: Market Scanner & Opportunity Discovery
- **Route**: `/scanner`, `/market-scanner`
- **Component**: `components/MarketScanner.js`
- **Purpose**: Deterministic rule-based market scanner across NIFTY50 / custom symbols with multi-indicator conditions.
- **User Type**: Quantitative Researcher / Active Trader
- **API Endpoints**: `POST /api/v1/scanners/run`, `POST /api/v1/scanners/backtest`, `POST /api/v1/scanners/stress`, `POST /api/v1/scanners/explain`
- **Main Components**: Preset selector pills (Momentum, Trend, Breakout, Volume, Oversold, Rel Strength), Universe dropdown, Condition builder, "Run Scan" button, Results candidate grid, Inspection drawer.
- **Primary CTA**: "Run Scan"
- **Secondary Actions**: "Explain with AI", "Send to Strategy Lab", "Add to Watchlist", "Set Alert".
- **Data Displayed**: Matching symbols, condition pass/fail evidence, indicator values (RSI, SMA, Volume multiplier), market breadth.
- **Interactions**: Select preset, adjust threshold, click candidate row to slide open inspection drawer.
- **Current Problems**: 1,000+ line monolithic component; visual density is overwhelming; condition cards are visually heavy; inspection drawer covers main table awkwardly on smaller screens.
- **UI Improvement Required**: Streamlined two-column layout: left configuration panel with collapsible presets; right results table with badge chips, match strength progress bar, and floating action toolbar.

#### Page 10: Market Events Feed
- **Route**: `/events`
- **Component**: `components/Events.js`
- **Purpose**: Live surveillance feed of corporate announcements, volume spikes, and technical breakouts.
- **User Type**: Active Trader / Surveillance Officer
- **API Endpoints**: `GET /api/v1/events`, `PATCH /api/v1/events/:id/read`, `PATCH /api/v1/events/read-all`, `POST /api/v1/events/evaluate`
- **Main Components**: Toolbar with "Run Evaluation" and "Mark All Read", Severity filter pills (ALL, CRITICAL, SIGNIFICANT, WATCH), Event list cards, Detail modal/drawer.
- **Primary CTA**: "Evaluate Market State" (forces backend rule evaluation).
- **Secondary Actions**: "Mark as read", "Investigate in Copilot".
- **Data Displayed**: Event title, symbol, timestamp, severity, raw telemetry metrics.
- **Interactions**: Filter by severity, click to view detail, trigger evaluation.
- **Current Problems**: Visual hierarchy is flat; cards look like basic bootstrap alert boxes; lacks symbol avatar chips.
- **UI Improvement Required**: Timeline layout with distinct severity iconography (Flame for Critical, Lightning for Significant), unread indicator dots, and direct watchlist integration.

#### Page 11: Market Cascade Intelligence
- **Route**: `/cascade`, `/market-events`
- **Component**: `components/MarketCascade.js`
- **Purpose**: Multi-hop catalyst propagation modeling showing how an event in one stock or sector cascades to suppliers, competitors, and portfolio holdings.
- **User Type**: Fundamental Researcher / Macro Analyst
- **API Endpoints**: `GET /api/v1/market-events`, `GET /api/v1/market-events/:id/cascade`, `POST /api/v1/market-events/:id/ai-explain`
- **Main Components**: Catalyst event selector, Depth slider (1 to 5 hops), View toggle (Graph vs Timeline), Cascade node tree, Node impact inspector, AI explanation box.
- **Primary CTA**: "Generate Cascade Analysis"
- **Secondary Actions**: "AI Explain Cascade", "Submit Thesis Review".
- **Data Displayed**: Origin event, 1st hop affected suppliers/competitors, 2nd hop sector contagion, portfolio exposure risk.
- **Interactions**: Selecting nodes highlights relationship links; depth slider re-queries cascade API.
- **Current Problems**: Custom CSS graph visualization can be hard to read; text overlaps on complex node clusters.
- **UI Improvement Required**: Clean interactive node graph with zoom/pan controls, structured left sidebar for catalyst inputs, right sidebar for node impact metrics and thesis notes.

---

### 2.4 Research & Quantitative Strategy Views

#### Page 12: Research Copilot & Agent
- **Route**: `/research`
- **Component**: `components/ResearchCopilot.js`
- **Purpose**: Structured institutional research workspace synthesizing technical, fundamental, and event evidence with Gemini AI grounding.
- **User Type**: Financial Analyst / Serious Researcher
- **API Endpoints**: `POST /api/v1/research/investigate`, `POST /api/v1/research/deeper`, `GET /api/v1/research/sessions`, `GET /api/v1/research/sessions/:id`
- **Main Components**: Research question input, Symbol badge, Recent sessions sidebar, Tab bar (Executive Report, Verified Evidence, Knowledge Graph, Research Gaps), Deepen Investigation input.
- **Primary CTA**: "Investigate" / "Run Research Agent"
- **Secondary Actions**: "Synthesize Deeper Risks", Load past session, Copy synthesis.
- **Data Displayed**: Multi-tool evidence cards with sources, confidence scores (1-100), key facts, risk factors, falsifiable thesis, and research gaps.
- **Interactions**: Type question, submit to agent, switch tabs, drill down into evidence citations.
- **Current Problems**: Layout is cramped when viewing evidence table; session sidebar consumes horizontal real estate awkwardly; lacks export to PDF/Markdown button.
- **UI Improvement Required**: Clean 3-pane research terminal: left session drawer (collapsible), center rich document editor with structured evidence accordions, right side quick data dock (live quote, financials, alerts).

#### Page 13: Strategy Lab & Backtesting
- **Route**: `/strategy-lab`, `/strategies`
- **Component**: `components/StrategyLab.js`
- **Purpose**: Systematic strategy development, parameter optimization, out-of-sample walk-forward testing, and quantitative risk metrics.
- **User Type**: Quantitative Trader / Systems Developer
- **API Endpoints**: `GET /api/v1/strategies`, `POST /api/v1/strategies/backtest/run`, `POST /api/v1/strategies/backtest/optimize`, `POST /api/v1/strategies/backtest/split-test`
- **Main Components**: Tab selector (Backtest, Parameter Optimizer, Train/Test Split, Walk-Forward), Strategy preset dropdown (Momentum SMA, RSI Reversal, Breakout), Parameter configuration form (Capital, Slippage, Sizing), Run button, Performance KPI cards (CAGR, Sharpe, Max Drawdown, Win Rate), Equity curve chart, Trade log table.
- **Primary CTA**: "Run Quantitative Backtest"
- **Secondary Actions**: "Optimize Parameters", "Ask AI to Explain Drawdown", "Export Strategy".
- **Data Displayed**: Sharpe Ratio, Sortino Ratio, Profit Factor, Total Trades, Max Drawdown %, Win/Loss ratio, trade-by-trade ledger.
- **Interactions**: Toggling tabs, running backtest, inspecting trade table pagination.
- **Current Problems**: 800+ lines; performance metric cards lack visual polish; equity curve chart needs interactive hover tooltips for drawdown underwater periods.
- **UI Improvement Required**: Professional quant research layout: top strategy banner with preset pill badges, side-by-side config and equity curve, split view for trade log with profit/loss color shading.

#### Page 14: Scenario Planner & Stress Studio
- **Route**: `/stress-studio`, `/scenarios`
- **Component**: `components/StressStudio.js`
- **Purpose**: Deterministic macro and sector stress testing of simulated holdings against historical or custom market shocks.
- **User Type**: Risk Manager / Portfolio Manager
- **API Endpoints**: `GET /api/v1/scenarios`, `POST /api/v1/scenarios/run`, `POST /api/v1/scenarios/compare`, `POST /api/v1/scenarios/ai-explain`
- **Main Components**: Preset scenario selector (IT Sector Correction, Bank Nifty Crash, Rate Hike Shock), Custom Shock Builder (slider from -50% to +50%), What-If Position Simulator, Impact summary card (Simulated Portfolio P&L ₹ and %), Holding-level attribution table, Methodology modal.
- **Primary CTA**: "Run Stress Scenario"
- **Secondary Actions**: "What-If Position Addition", "Compare Scenarios", "AI Explain Risk".
- **Data Displayed**: Portfolio baseline value vs stressed value, net rupee loss, beta sensitivity, individual holding loss attribution.
- **Interactions**: Slider adjustments, preset selection, clicking a holding shows granular shock calculation.
- **Current Problems**: Large monolithic component; What-If inputs are separated from the main results; shock attribution table has small typography.
- **UI Improvement Required**: Clean risk cockpit: prominent gauge showing potential portfolio drawdown, waterfall chart illustrating which positions contribute most to loss, interactive shock sliders.

---

### 2.5 Journaling, Coaching & Behavioral Learning Views

#### Page 15: Trade Journal & Decision Log
- **Route**: `/journal`
- **Component**: `components/TradeJournal.js`
- **Purpose**: Document simulated trades with pre-trade theses, target prices, stop-loss risk prices, and confidence ratings.
- **User Type**: Disciplined Trader / Student
- **API Endpoints**: `GET /api/v1/journal`, `PATCH /api/v1/journal/:id`, `DELETE /api/v1/journal/:id`
- **Main Components**: Summary metrics strip (Total Journaled, Trades With Target, Trades With Risk, Avg Confidence), Journal table (Date, Symbol, Side, Strategy, Entry, Target, Risk, Confidence, Actions), Link to Trade Replay.
- **Primary CTA**: "Replay Trade"
- **Secondary Actions**: Edit journal entry, delete entry, filter by symbol.
- **Data Displayed**: Trade date, stock symbol, BUY/SELL side, strategy tag, entry price, target price, risk stop, star confidence (1-5).
- **Interactions**: Click "Replay" to open `/replay/:id`.
- **Current Problems**: Basic HTML table, lacks inline filtering by emotion or outcome, lacks rich text markdown editor for thesis notes.
- **UI Improvement Required**: Card/timeline toggle view, tags for emotional state (CALM, FOMO, GREED, DISCIPLINED), R:R ratio indicator badges, and quick search.

#### Page 16: Trade Replay & Post-Mortem
- **Route**: `/replay/:id`
- **Component**: `components/TradeReplay.js`
- **Purpose**: In-depth trade post-mortem reviewing entry execution against subsequent price action with AI trade review.
- **User Type**: Disciplined Trader
- **API Endpoints**: `GET /api/v1/journal/:id/replay`, `GET /api/v1/ai/trade-review/:id`
- **Main Components**: Back link, Trade summary header, Original thesis card, Outcome metrics card (P&L, Holding time, Exit price), AI Post-Mortem analysis card, "Generate AI Review" button.
- **Primary CTA**: "Generate AI Post-Mortem Review"
- **Secondary Actions**: "Back to Journal"
- **Data Displayed**: Entry price, exit price, realization, trade discipline score, AI-identified strengths and cognitive errors.
- **Interactions**: Triggering AI analysis, reading trade verdict.
- **Current Problems**: Stark cards with basic gray borders, lacks an overlaid candlestick chart showing entry and exit arrows.
- **UI Improvement Required**: Visual trade post-mortem with candle chart marking exact entry/exit points, discipline scorecard widget, and key lessons callout.

#### Page 17: Behavioral Edge & Learning Coach
- **Route**: `/behavior-insights`
- **Component**: `components/BehaviorInsights.js`
- **Purpose**: Identify trader behavioral biases (overtrading, revenge trading, loss aversion) and provide actionable coaching.
- **User Type**: Trader seeking improvement
- **API Endpoints**: `GET /api/v1/analytics/behavior`, `GET /api/v1/ai/behavior-review`
- **Main Components**: Window period dropdown (7d, 30d, 90d, all), KPI cards (Discipline Score, Win Rate, Overtrading Index, Revenge Trading Detected), AI Reflection card, "Generate AI Reflection" button.
- **Primary CTA**: "Generate AI Behavioral Reflection"
- **Secondary Actions**: Change analysis time window.
- **Data Displayed**: Discipline score out of 100, average hold time for winners vs losers, overtrading flags, coaching recommendations.
- **Interactions**: Changing dropdown re-fetches analytics and clears previous review.
- **Current Problems**: Text-heavy cards, raw percentage displays without visual benchmarks or progress arcs.
- **UI Improvement Required**: Radial score dial for Discipline Score, radar chart for cognitive strengths, structured coaching timeline.

#### Page 18: Trading Playbooks & Rule Sets
- **Route**: `/playbooks`
- **Component**: `components/Playbooks.js`
- **Purpose**: Create and enforce pre-trade checklists and execution rules to prevent emotional mistakes.
- **User Type**: Disciplined Trader
- **API Endpoints**: `GET /api/v1/playbooks`, `POST /api/v1/playbooks`, `PATCH /api/v1/playbooks/:id`, `DELETE /api/v1/playbooks/:id`, `GET /api/v1/ai/playbook-review`
- **Main Components**: Header with "Create Playbook" button, Playbook cards grid, Rule list per playbook, "AI Playbook Review" button, Create modal/form.
- **Primary CTA**: "Create New Playbook"
- **Secondary Actions**: Add rule to playbook, delete playbook, trigger AI review.
- **Data Displayed**: Playbook name, description, list of mandatory and optional checklist rules, rule count.
- **Interactions**: Form submission, rule toggle, delete confirmation.
- **Current Problems**: Basic border cards, rules are plain bullet points, creation form uses native `prompt`/`alert` dialogs.
- **UI Improvement Required**: Modern card grid with rule badges, drag-and-drop rule reordering, dedicated drawer for playbook editing, and visual integration with order modal.

#### Page 19: Portfolio AI Analyst
- **Route**: `/ai-analyst`
- **Component**: `components/PortfolioAnalyst.js`
- **Purpose**: On-demand AI portfolio diagnostics covering risk concentration, diversification, daily debriefs, and pattern detection.
- **User Type**: Portfolio Manager / Active Investor
- **API Endpoints**: `GET /api/v1/ai/portfolio-review`, `GET /api/v1/ai/what-changed-today`, `GET /api/v1/ai/daily-debrief`, `GET /api/v1/ai/pattern-review`
- **Main Components**: 4 Diagnostic Action Cards (Portfolio Review, What Changed Today, Daily Debrief, Pattern Review), Action buttons, Results display containers with verified portfolio facts and takeaways.
- **Primary CTA**: "Generate Diagnostic" per card.
- **Secondary Actions**: Refresh diagnostic.
- **Data Displayed**: Executive summary, bulleted portfolio facts, identified risks, actionable takeaways.
- **Interactions**: Button triggers API, shows loading state, renders result inside card.
- **Current Problems**: Purple borders look dated; results are raw unformatted text blocks; cards stack vertically with repetitive buttons.
- **UI Improvement Required**: Tabbed diagnostic dashboard with structured key metric callouts, formatted bullet points, and source data disclosures.

---

### 2.6 System & Evaluation Views

#### Page 20: Price Alerts
- **Route**: `/alerts`
- **Component**: `components/Alerts.js`
- **Purpose**: Create and manage symbol price condition alerts (ABOVE, BELOW, PERCENT_CHANGE).
- **User Type**: Active Trader
- **API Endpoints**: `GET /api/v1/alerts`, `POST /api/v1/alerts`, `PATCH /api/v1/alerts/:id`, `DELETE /api/v1/alerts/:id`, `GET /api/v1/market/search`
- **Main Components**: Symbol search autocomplete input, Condition dropdown, Target price input, "Create Alert" button, Active alerts list, Triggered alerts list.
- **Primary CTA**: "Create Alert"
- **Secondary Actions**: Toggle alert active state, delete alert.
- **Data Displayed**: Symbol, condition string, target price, current price distance, active/triggered status badge.
- **Interactions**: Type symbol to see search results dropdown, submit form, delete alert.
- **Current Problems**: Autocomplete dropdown flickers; table layout is plain; lacks audio or browser notification permission prompts.
- **UI Improvement Required**: Modern split layout: left quick-alert creator with quick percentage offset buttons (+2%, +5%, -3%), right active alerts feed with trigger status badges.

#### Page 21: Interview Demo Walkthrough
- **Route**: `/demo`
- **Component**: `components/InterviewDemo.js`
- **Purpose**: Interactive demonstration console illustrating the complete 18-stage end-to-end TradeFlow capabilities for presentations and hiring interviews.
- **User Type**: Interviewer / Evaluator / Presenter
- **API Endpoints**: `GET /api/v1/demo`, `POST /api/v1/demo/reset`
- **Main Components**: Platform metadata banner (Simulation mode disclosure), Capability cards grid (8 core features with status and links), 13-stage workflow progression list, "Reset Demo Environment" button.
- **Primary CTA**: "Launch Demo Workflow"
- **Secondary Actions**: "Reset Demo State", Direct links to feature hubs.
- **Data Displayed**: Product version, architecture capabilities, step-by-step trader lifecycle flow, simulation disclosures.
- **Interactions**: Resetting state, clicking capability links.
- **Current Problems**: Simple styled container, lacks an interactive live stepper guiding the user through the 13 steps sequentially.
- **UI Improvement Required**: Interactive guided tour modal with step progression, click-to-execute simulations, and architecture callout sidebars.

#### Page 22: Apps (Placeholder)
- **Route**: `/apps`
- **Component**: `components/Apps.js`
- **Purpose**: Legacy placeholder from original Zerodha clone template.
- **User Type**: N/A
- **API Endpoints**: None.
- **Main Components**: `<h1>Apps</h1>`
- **Primary CTA**: None.
- **Current Problems**: Unused dead stub.
- **UI Improvement Required**: Repurpose or redirect to `/insights` or `/scanner`; do not leave a blank `<h1>` in the final product.

---

### 2.7 Persistent Global Layout & Modals

#### Component 23: Sidebar Navigation
- **Component**: `components/Menu.js`
- **Purpose**: Global application navigation with grouped sections (TradeFlow, Market, Research, Portfolio, Learning) and user profile dropdown.
- **Main Components**: Brand logo, 5 grouped category lists, Active indicator pip, User avatar with initials, Logout button.
- **Current Problems**: Sidebar is fixed width (240px) without collapsed mini-mode; profile dropdown uses basic absolute div; mobile toggle is missing.
- **UI Improvement Required**: Collapsible sidebar with icon-only compact mode, keyboard navigation shortcuts, and active route highlight pills.

#### Component 24: Watchlist & Quick Quote Dock
- **Component**: `components/WatchList.js`
- **Purpose**: Persistent right-side market surveillance dock with symbol search, real-time prices, percentage changes, and quick Buy/Sell triggers.
- **API Endpoints**: `GET /api/v1/watchlist`, `POST /api/v1/watchlist`, `DELETE /api/v1/watchlist/:symbol`, `GET /api/v1/market/search`
- **Main Components**: Search input, Symbol list, Mini donut chart, Quick action buttons (Buy, Sell, Chart, Analytics, Delete).
- **Current Problems**: Consumes ~380px fixed width on all screens, crowding out the main content area on laptops; mini donut chart takes excessive vertical space.
- **UI Improvement Required**: Collapsible dock that can be pinned or minimized into a slide-over drawer, quick tab groups (Favorites, Top Gainers, My Portfolio), and refined row hover actions.

#### Component 25: Paper Order Execution Window
- **Component**: `components/BuyActionWindow.js`
- **Purpose**: Modal dialog for placing simulated paper trades with pre-trade playbook checklist verification and trade journal logging.
- **API Endpoints**: `POST /api/v1/orders/new`, `GET /api/v1/account/balance`, `GET /api/v1/playbooks`
- **Main Components**: Header with symbol and price, Buy/Sell segmented toggle, Quantity input, Price input, Pre-trade playbook checklist, "Add to Trade Journal" expandable form, Estimated cost display, Available virtual balance display, "Execute Paper Order" CTA.
- **Current Problems**: Modal styling feels outdated; checklist and journal inputs make the modal very tall, requiring internal scrolling.
- **UI Improvement Required**: Tabbed or accordion layout: Tab 1 "Order Details", Tab 2 "Discipline Checklist", Tab 3 "Pre-Trade Thesis". Clear estimated margin calculation and prominent "SIMULATION" watermark.

---

## 3. Inventory Sign-Off

All 22 functional views and 4 persistent layout elements have been inventoried with exact component files, routes, data models, and identified UX gaps. This directly guides the Stitch design specification in Phase 30.
