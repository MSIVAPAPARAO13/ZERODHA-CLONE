# GOOGLE STITCH — SCREEN GENERATION PLAN & SEQUENCING

**Project**: TradeFlow v2.0 Production  
**Execution Strategy**: Systematic Dependency-Ordered Batch Generation  
**Rule**: Generate foundational design tokens and shells first to prevent visual drift, then proceed through analytical workspaces.

---

## 1. Generation Strategy & Batch Architecture

To ensure 100% visual coherence, screens must NOT be generated independently in random order.
Screen generation is structured into **5 sequential phases**:

```text
Phase 1: Foundation & Shell (Tokens, App Shell, Global Navigation, Watchlist Dock)
   ↓
Phase 2: Core Trading & Portfolio Workspaces (Executive Command Center, Holdings, Positions, Orders, Order Modal)
   ↓
Phase 3: Market Intelligence & Surveillance (Daily Insights / What Changed Today, Market Scanner, Events, Cascade Graph)
   ↓
Phase 4: Quantitative Research & Analytical Studios (Research Copilot, Strategy Lab, Scenario Stress Studio, AI Analyst)
   ↓
Phase 5: Journaling, Coaching, System & Access (Trade Journal, Replay Post-Mortem, Behavioral Edge, Playbooks, Alerts, Funds, Demo, Auth)
```

---

## 2. Detailed Screen Generation Sequence

### Phase 1: Foundation & Global App Shell

#### Step 1: Design System & Token Canvas (`DESIGN.md`)
- **Stitch Target**: Master Design System Canvas.
- **Dependencies**: None.
- **Elements to Establish**: Dual-mode palette (obsidian canvas, slate cards, emerald profit, rose loss), Inter + Roboto Mono typography scale, button styles, input fields, badge pills, and tabular numeral rules.
- **Verification Rule**: Verify all subsequent screens inherit these exact variables without introducing rogue colors.

#### Step 2: Global App Shell & Navigation Layout
- **Stitch Target**: App Shell Layout (Desktop 1440px + Tablet + Mobile).
- **Components Included**:
  - Collapsible Left Navigation Rail (`Menu.js`) with 5 grouped sections.
  - Sticky Top Command Bar (`Ctrl+K` search, NIFTY/SENSEX live index chips, virtual balance chip).
  - Right Collapsible Watchlist Dock (`WatchList.js`) with mini price sparklines.
  - Central Fluid Content Workspace.
- **Acceptance Criteria**: Fluid content resizing when watchlist or sidebar is toggled.

---

### Phase 2: Core Trading & Portfolio Workspaces

#### Step 3: Executive Command Center (`/`)
- **Existing Component**: `components/Summary.js`
- **Focus**: Transform crude inline-styled boxes and hardcoded strings into an institutional executive overview.
- **Widgets**: Portfolio Total Value Card, Day P&L Chip, Market Regime Pill, "What Changed Today" catalyst summary, concentration gauge, recent execution list.

#### Step 4: Holdings & Portfolio Analytics (`/holdings`)
- **Existing Component**: `components/Holdings.js`
- **Focus**: High-density financial data table with sticky headers, color-coded P&L chips, sector breakdown donut chart, and row-level SELL triggers.

#### Step 5: Positions & Intraday Exposure (`/positions`)
- **Existing Component**: `components/Positions.js`
- **Focus**: Segmented product tabs (MIS Intraday vs CNC Overnight), net exposure banner, and one-click square-off actions.

#### Step 6: Orders & Execution History (`/orders`)
- **Existing Component**: `components/Orders.js`
- **Focus**: Replace empty stub with a full audit data table displaying Order ID, Idempotency key, execution price, quantity, status badge, and CSV export.

#### Step 7: Paper Order Placement Modal (`BuyActionWindow`)
- **Existing Component**: `components/BuyActionWindow.js`
- **Focus**: Clean 3-tab modal dialog (Order Parameters, Pre-Trade Playbook Checklist, Thesis Documentation) with prominent "PAPER TRADING SIMULATION" banner.

---

### Phase 3: Market Intelligence & Surveillance

#### Step 8: Daily Insights ("What Changed Today") (`/insights`)
- **Existing Component**: `components/Insights.js`
- **Focus**: Chronological catalyst intelligence feed, market regime meter, category filters (Earnings, Volatility, Macro), and "Investigate in Copilot" links.

#### Step 9: Market Scanner & Opportunity Discovery (`/scanner`)
- **Existing Component**: `components/MarketScanner.js`
- **Focus**: Two-column split layout (Left filter builder with presets; Right candidate grid with condition evidence match bars and inspection slide-over drawer).

#### Step 10: Market Events Surveillance Feed (`/events`)
- **Existing Component**: `components/Events.js`
- **Focus**: Live timeline feed with distinct severity badges (Critical, Significant, Watch), "Evaluate Market State" button, and quick watchlist additions.

#### Step 11: Market Cascade Contagion Graph (`/cascade`)
- **Existing Component**: `components/MarketCascade.js`
- **Focus**: Interactive directed relationship graph showing multi-hop catalyst contagion from origin corporate event to sector peers and portfolio holdings.

---

### Phase 4: Quantitative Research & Analytical Studios

#### Step 12: Research Copilot & Grounded Agent (`/research`)
- **Existing Component**: `components/ResearchCopilot.js`
- **Focus**: 3-pane research workstation (Past session sidebar, Center structured research report with verified evidence citations and knowledge graph tabs, Right company quote dock).

#### Step 13: Strategy Lab & Backtesting Suite (`/strategy-lab`)
- **Existing Component**: `components/StrategyLab.js`
- **Focus**: Quantitative testing suite with strategy presets, KPI ribbon (Sharpe, Drawdown, CAGR), interactive equity curve, and monthly returns heatmap.

#### Step 14: Scenario Planner & Stress Studio (`/stress-studio`)
- **Existing Component**: `components/StressStudio.js`
- **Focus**: Portfolio risk cockpit with shock presets, interactive shock sliders, waterfall loss attribution chart, and holding-level sensitivity metrics.

#### Step 15: Portfolio AI Diagnostics (`/ai-analyst`)
- **Existing Component**: `components/PortfolioAnalyst.js`
- **Focus**: Tabbed diagnostic dashboard covering Portfolio Review, Daily Debrief, What Changed Today, and Pattern Detection with source data disclosures.

---

### Phase 5: Journaling, Coaching, System & Access

#### Step 16: Trade Journal & Decision Log (`/journal`)
- **Existing Component**: `components/TradeJournal.js`
- **Focus**: Card and timeline view of journaled trades with emotional state tags, target/risk prices, confidence stars, and Replay CTAs.

#### Step 17: Trade Replay & Post-Mortem (`/replay/:id`)
- **Existing Component**: `components/TradeReplay.js`
- **Focus**: Post-mortem view combining candlestick price chart with marked entry/exit arrows and Gemini AI behavioral analysis.

#### Step 18: Behavioral Edge & Learning Coach (`/behavior-insights`)
- **Existing Component**: `components/BehaviorInsights.js`
- **Focus**: Cognitive performance cockpit featuring radial discipline gauge, overtrading/revenge trading flags, and actionable AI coaching prompts.

#### Step 19: Trading Playbooks (`/playbooks`)
- **Existing Component**: `components/Playbooks.js`
- **Focus**: Card grid of discipline rule sets with slide-over editor drawer and direct linking to order execution checklist.

#### Step 20: Price Condition Alerts (`/alerts`)
- **Existing Component**: `components/Alerts.js`
- **Focus**: Split layout with quick alert creator (percentage offset buttons) and active alerts list with live price distance progress bars.

#### Step 21: Virtual Funds & Financial Ledger (`/funds`)
- **Existing Component**: `components/Funds.js`
- **Focus**: Paper trading capital cockpit with balance reset simulation button and double-entry transaction ledger table.

#### Step 22: Interview Demo Console (`/demo`)
- **Existing Component**: `components/InterviewDemo.js`
- **Focus**: Interactive 13-stage guided demonstration stepper showcasing end-to-end platform capabilities and architecture.

#### Step 23: Authentication (Login & Register) (`/login`, `/register`)
- **Existing Components**: `pages/Login.js`, `pages/Register.js`
- **Focus**: Modern two-column split layout with TradeFlow brand showcase, terminal screenshot preview, and refined input forms.

---

## 3. Screen Plan Summary

- **Total Screens in Sequence**: 23 deliberate design steps.
- **Invented Screens**: 0.
- **Removed Features**: 0.
- **Iteration Protocol**: Each batch must be reviewed against `docs/DESIGN_SYSTEM.md` and approved before proceeding to the next batch.
