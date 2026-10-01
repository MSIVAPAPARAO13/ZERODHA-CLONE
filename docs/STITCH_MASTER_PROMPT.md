# GOOGLE STITCH — MASTER UI DESIGN PROMPT FOR TRADEFLOW

```text
================================================================================
STITCH PROJECT SPECIFICATION: TRADEFLOW (v2.0 PRODUCTION)
Institutional-Grade Trading Simulation, Market Intelligence & Quantitative Platform
================================================================================
```

## 1. PROJECT CONTEXT & DESIGN MANDATE

You are designing the complete frontend UI for **TradeFlow**, an enterprise-grade financial SaaS application built for paper trading simulation, market intelligence, quantitative strategy research, and behavioral coaching.

### Core Design Objective
Transform an existing full-stack MERN platform into a visually stunning, coherent, dark-mode first **Modern Financial SaaS Terminal**.

### Crucial Constraints & Behavioral Rules
1. **DO NOT invent imaginary pages or features**: Design ONLY the 22 real functional views supported by the existing Express/MongoDB backend.
2. **DO NOT copy consumer brokerage clones (e.g. basic Zerodha/Robinhood)**: TradeFlow is a sophisticated analytical workstation combining real-time market data, multi-hop catalyst cascade graphs, quantitative walk-forward backtesters, and Gemini-grounded research agents.
3. **DO NOT use fake or arbitrary data**: Use realistic Indian equity instruments (NIFTY50, RELIANCE, TCS, INFY, HDFCBANK, TATAMOTORS, ICICIBANK) and realistic mathematical metrics (Sharpe ratio 1.84, Max Drawdown -8.2%, Win Rate 64.2%).
4. **All order entry screens must prominently display**: `PAPER TRADING SIMULATION` to reinforce educational safety.
5. **Enforce unified design token consistency** across every generated screen using the TradeFlow Design System tokens defined below.

---

## 2. DESIGN SYSTEM & TOKEN SPECIFICATION

```css
/* Color Palette */
--bg-canvas: #090d16;           /* Root canvas background */
--bg-surface: #0f172a;          /* Card & panel surface */
--bg-surface-elevated: #1e293b; /* Hover rows, modal containers */
--bg-surface-subtle: #172033;   /* Table headers & badge backings */
--border-subtle: #1e293b;       /* Dividers */
--border-default: #334155;      /* Card & input borders */
--border-focus: #38bdf8;        /* Sky-blue active focus */

--text-primary: #f8fafc;        /* High-contrast headers */
--text-secondary: #cbd5e1;      /* Table data & body copy */
--text-muted: #64748b;          /* Metadata & timestamps */

--accent-primary: #0284c7;      /* TradeFlow Sky-600 */
--financial-positive: #10b981;  /* Emerald-500 (Profits, BUY, Upward delta) */
--financial-negative: #f43f5e;  /* Rose-500 (Losses, SELL, Drawdowns) */
--financial-warning: #f59e0b;   /* Amber-500 (Alert triggers, near-misses) */
--intel-ai: #8b5cf6;            /* Violet-500 (AI Grounded Evidence) */

/* Typography */
--font-sans: 'Inter', -apple-system, sans-serif;
--font-mono: 'Roboto Mono', 'JetBrains Mono', monospace;
```

> **Typography Requirement**: Every numerical financial value (Prices, P&L, Quantities, Percentages, Ratios) MUST use `--font-mono` with `font-variant-numeric: tabular-nums`.

---

## 3. GLOBAL APP SHELL & NAVIGATION HIERARCHY

### 3.1 Persistent Layout Structure
- **Left Navigation Rail** (220px fixed, collapsible to 64px icon rail):
  - Brand Logo: TradeFlow icon + `SIMULATION` micro-badge.
  - Section 1: **TradeFlow**: Overview (`/`), Daily Insights (`/insights`).
  - Section 2: **Market**: Scanner (`/scanner`), Market Events (`/events`), Cascade Graph (`/cascade`).
  - Section 3: **Research**: Research Copilot (`/research`), Strategy Lab (`/strategy-lab`), AI Analyst (`/ai-analyst`).
  - Section 4: **Portfolio**: Holdings (`/holdings`), Positions (`/positions`), Orders (`/orders`), Scenario Planner (`/stress-studio`), Capital & Funds (`/funds`).
  - Section 5: **Learning & Edge**: Journal (`/journal`), Playbooks (`/playbooks`), Behavioral Edge (`/behavior-insights`), Alerts (`/alerts`).
  - Bottom Footer: User Avatar, Virtual Cash Pill (`₹100,000.00`), Logout Trigger.
- **Top Command Header** (56px sticky bar):
  - Global Search Command Bar (`Ctrl+K`) with placeholder "Search instruments, strategies, or research theses...".
  - Live Market Indices: NIFTY 50 (`22,147.90 -0.24%`), SENSEX (`73,042.38 -0.21%`).
  - Quick Action Buttons: "+ Quick Order" (triggers Order Modal), Notifications bell, Theme toggle.
- **Right Watchlist Dock** (300px collapsible drawer):
  - Search input with autocomplete.
  - Instrument list (RELIANCE, TCS, INFY, HDFCBANK) with mini sparklines, LTP, and day percentage change.
  - Action buttons on row hover: [B] Buy, [S] Sell, [C] Chart, [X] Remove.

---

## 4. DETAILED SCREEN SPECIFICATIONS (PROMPTS FOR STITCH)

### Screen 1: Executive Command Center (`/`)
- **Layout**: 3-column modular grid.
- **Top Row**: 4 KPI Hero Cards:
  1. Total Portfolio Wealth (`₹1,24,850.00` | `+24.85%` all-time return with mini area sparkline).
  2. Today's Simulated P&L (`+₹1,550.20` | `+1.26%` Emerald badge).
  3. Market Regime Indicator (`VOLATILITY CONTRACTION` | Nifty VIX: `13.40` | Status: `NORMAL LIQUIDITY`).
  4. Available Virtual Margin (`₹38,240.00` unencumbered cash).
- **Middle Main Area**:
  - Left (65%): "What Changed Today" intelligence feed summary card with 3 top market catalyst items (Earnings, technical breakouts, macro rates) with direct "Investigate in Copilot" links.
  - Right (35%): Portfolio Concentration breakdown (Herfindahl Index gauge + Top 3 asset weights).
- **Bottom Row**: Recent simulated order execution table and active alert watch items.

### Screen 2: Holdings & Portfolio Analytics (`/holdings`)
- **Layout**: Full-width data workstation.
- **Header**: Summary bar displaying Invested Capital (`₹86,609.80`), Current Valuation (`₹1,24,850.00`), Unrealized Gain (`+₹38,240.20`, `+44.15%`).
- **Main Data Grid**:
  - Columns: Instrument (with logo avatar), Shares Held, Average Cost, LTP, Current Value, Unrealized P&L (₹ and %), Day Change %, Actions (Quick Sell / Add More).
  - Row Hover: Highlights row with subtle Slate-800 elevated background.
- **Right Side Panel**: Sector diversification donut chart (IT: 42%, Energy: 28%, Banking: 18%, Auto: 12%).

### Screen 3: Orders & Execution Ledger (`/orders`)
- **Layout**: Tabbed data table (All Orders, Filled, In-Flight, Rejected).
- **Table Columns**: Order ID / Idempotency Key, Timestamp, Symbol, Action (BUY badge in green, SELL badge in rose), Product (CNC / MIS), Quantity, Executed Price, Total Rupees, Status (`FILLED` green dot), Action (View Execution Audit).
- **Filter Bar**: Search by symbol, date picker, status dropdown, Export to CSV button.

### Screen 4: Market Scanner & Opportunity Discovery (`/scanner`)
- **Layout**: Two-column split workspace.
- **Left Panel (35% width)**:
  - Preset Selector Pills: Momentum, Trend Alignment, Breakout, Volume Spike, Oversold RSI, Relative Strength.
  - Universe Selector: `NIFTY 50` / `NIFTY BANK` / `CUSTOM SYMBOLS`.
  - Condition Builder Cards with interactive threshold inputs: `RSI(14) > 55`, `SMA(20) > SMA(50)`, `Volume > 1.5x 20-Day SMA`.
  - Primary CTA: "Run Institutional Scan".
- **Right Panel (65% width)**:
  - Header: Matches found (`7 of 50 Instruments Matched`).
  - Candidate Grid: Symbol cards showing exact condition values, match score bar (e.g. 100% strict match), and action toolbar: [Add to Watchlist], [Set Alert], [Send to Strategy Lab], [Explain Match with AI].
  - Slide-Over Drawer: Displays detailed multi-timeframe condition breakdown on candidate click.

### Screen 5: Research Copilot & Grounded Agent (`/research`)
- **Layout**: 3-pane institutional research terminal.
- **Left Rail (20% width)**: Past research session history list with timestamps and focus symbols (`TCS Q2 Margin Contraction`, `Reliance Green Energy Capex`).
- **Center Canvas (55% width)**:
  - Top: Research query input bar with "Synthesize Evidence" CTA.
  - Tab Bar: (1) Executive Synthesis, (2) Verified Evidence (7 citations), (3) Knowledge Graph, (4) Research Gaps.
  - Document View: Structured research dossier featuring verified facts, identified downside risks, falsifiable thesis takeaway, and tool provenance citations.
- **Right Dock (25% width)**: Real-time company quote, valuation ratios (P/E, EV/EBITDA), sector peers, and direct "Simulate Paper Order" card.

### Screen 6: Strategy Lab & Quantitative Backtester (`/strategy-lab`)
- **Layout**: Quantitative research suite.
- **Top Control Bar**: Strategy preset picker (`Dual Moving Average Momentum`), Initial Capital (`₹100,000`), Commission & Slippage inputs (`0.10%`), Date Range (`2023-01-01 to 2025-12-31`).
- **Tabbed Views**: (1) Backtest Engine, (2) Parameter Optimization Matrix, (3) Train/Test Out-of-Sample Split, (4) Walk-Forward Stability.
- **KPI Metrics Ribbon**: CAGR (`24.2%`), Sharpe Ratio (`1.85`), Sortino (`2.40`), Max Drawdown (`-9.4%`), Win Rate (`62.8%`), Profit Factor (`2.10`).
- **Visuals**:
  - Interactive Equity Curve Chart with highlighted drawdown underwater zones.
  - Monthly Returns Heatmap table (Jan-Dec returns per year).
  - Trade Ledger table with entry/exit dates, durations, and net return per trade.

### Screen 7: Scenario Planner & Stress Studio (`/stress-studio`)
- **Layout**: Portfolio Risk Cockpit.
- **Top Controls**: Preset Shock Scenarios (`IT Sector Correction -15%`, `Bank Nifty Liquidity Squeeze -10%`, `Crude Oil Surge +25%`), Custom Shock Slider (-50% to +50%).
- **Center Visualization**:
  - Baseline Portfolio Value (`₹1,24,850.00`) vs Stressed Simulated Value (`₹1,14,360.00`).
  - Net Potential Rupee Drawdown (`-₹10,490.00` | `-8.40%`).
  - Waterfall Attribution Chart illustrating individual holding loss contributions (TCS contributes -₹6,200, INFY contributes -₹4,290).
- **Bottom Section**: Holding-level shock sensitivity table with estimated beta and recovery timeframe.

### Screen 8: Trade & Decision Journal (`/journal`)
- **Layout**: Chronological timeline of journaled trades.
- **Summary Header**: Total Logged Trades (42), Trades with Stop Risk (95%), Average Trader Confidence (4.2 / 5 Stars), Discipline Index (88%).
- **Journal Cards**: Each card displays Symbol avatar, Entry Date, Trade Side (BUY/SELL), Strategy Tag, Entry Price, Target Price, Stop Loss, Confidence Stars, Emotional Mindset Tag (`DISCIPLINED` / `FOMO`), and "Replay Trade" button.

### Screen 9: Trade Replay & Post-Mortem (`/replay/:id`)
- **Layout**: Split post-mortem view.
- **Left (50% width)**: Interactive candlestick chart marking exact Entry price arrow (Green) and Exit price arrow (Rose), with profit target and stop levels drawn as horizontal dashed lines.
- **Right (50% width)**:
  - Original Pre-Trade Thesis card (user's hypothesis before trade).
  - Outcome Realization card (Actual R:R achieved, holding duration).
  - Gemini AI Post-Mortem card: Identified cognitive biases, adherence to pre-trade rules, and key lesson learned.

### Screen 10: Behavioral Edge & Learning Coach (`/behavior-insights`)
- **Layout**: Cognitive performance dashboard.
- **Header**: Analysis Window Dropdown (`Last 30 Days` / `Last 90 Days`).
- **Visual Cockpit**:
  - Radial Gauge: Trader Discipline Score (`84 / 100` | `EXCELLENT ADHERENCE`).
  - Behavioral Warning Flags: Overtrading Index (`LOW - 1.2 trades/day`), Revenge Trading (`ZERO DETECTED`), Holding Winners vs Losers (`Winners held 4.2x longer than losers`).
- **Coaching Card**: AI personalized reflection with 3 actionable psychological guardrails for upcoming trading sessions.

### Screen 11: Market Cascade Intelligence (`/cascade`)
- **Layout**: Interactive relational graph canvas.
- **Top Bar**: Event selector (`Infosys Lowers FY26 Guidance`), Contagion Depth slider (1 to 4 hops), View Mode toggle (Graph vs Chronological Timeline).
- **Center Canvas**: Interactive node network with curved directed edges connecting Origin Catalyst $\to$ Primary Tier (Tier-1 IT Peers) $\to$ Secondary Tier (Staffing & Real Estate) $\to$ Portfolio Vulnerability Node.
- **Right Inspector Panel**: Node impact details, correlation coefficient, and "Generate AI Thesis Review" card.

### Screen 12: Paper Order Execution Modal (`BuyActionWindow`)
- **Layout**: Clean 3-tab modal dialog (Width: 540px).
- **Header**: Symbol Ticker, Live LTP, "PAPER TRADING SIMULATION" banner in sky blue.
- **Tab 1: Order Details**: Segmented BUY (Emerald) / SELL (Rose) toggle, Product selector (CNC Long Term / MIS Intraday), Quantity stepper, Price input, Estimated Total (`₹12,450.00`), Available Virtual Balance (`₹38,240.00`).
- **Tab 2: Discipline Checklist**: Active Playbook checklist rules with mandatory verification checkboxes before placement is allowed.
- **Tab 3: Pre-Trade Thesis**: Target price, stop risk price, strategy reason tag, expected holding timeframe.
- **Footer**: "Execute Simulated Order" CTA button in solid emerald green.

### Screen 13: Price Alerts (`/alerts`)
- **Layout**: Split layout.
- **Left (40% width)**: Quick Alert Creator with symbol search autocomplete, Condition trigger (CROSSES ABOVE / CROSSES BELOW), Target price with quick offset buttons (+2%, +5%, -3%), "Create Alert" button.
- **Right (60% width)**: Active and Triggered alert cards with live price progress bar showing distance to target.

### Screen 14: Virtual Funds & Financial Ledger (`/funds`)
- **Layout**: Ledger cockpit.
- **Hero Card**: Total Simulated Capital (`₹100,000.00`), Available Margin (`₹38,240.00`), Utilized in Positions (`₹61,760.00`), Reset Account button.
- **Ledger Table**: Double-entry transaction history with Transaction ID, Timestamp, Type (DEBIT/CREDIT), Linked Order ID, Amount, Balance Before, Balance After.

### Screen 15: Interview Demo Walkthrough (`/demo`)
- **Layout**: Interactive guided presentation console.
- **Top Banner**: Educational simulation disclosure with platform architecture overview.
- **Interactive 13-Step Stepper**: Visual stepper tracking the trader lifecycle from Authentication $\to$ Daily Feed $\to$ Market Event $\to$ Copilot Research $\to$ Scenario Stress $\to$ Strategy Backtest $\to$ Idempotent Paper Trade $\to$ Journal Post-Mortem.
- **Live Action Buttons**: "Execute Step", "Inspect Architecture", "Reset Demo Environment".

### Screen 16: Authentication (`/login` & `/register`)
- **Layout**: Two-column split screen.
- **Left (45% width)**: High-contrast TradeFlow brand showcase, terminal architecture preview screenshot, simulated capital feature highlights.
- **Right (55% width)**: Minimalist login/registration card with clean input fields, password toggle, error alert container, and instant sign-in CTA.

---

## 5. MOBILE & RESPONSIVE BEHAVIOR SPECIFICATION

1. **Breakpoints**: Desktop (> 1200px), Laptop (992px - 1199px), Tablet (768px - 991px), Mobile (< 768px).
2. **Mobile Navigation**: Left sidebar collapses into a persistent bottom navigation bar (Home, Market, Portfolio, Research, More).
3. **Watchlist on Mobile**: Sliders out as a bottom sheet drawer when tapping a floating action button.
4. **Data Tables on Mobile**: Automatically transform into stacked summary cards with key metrics displayed in a 2x2 grid.
5. **Modal Windows**: Full-screen sheets on mobile with swipe-to-dismiss gesture.

---

## 6. ACCESSIBILITY & DESIGN QUALITY STANDARDS

- **Contrast Ratios**: All text against background meets WCAG 2.1 AA standard (minimum 4.5:1 for body copy, 3:1 for large headers).
- **Non-Color Indicators**: Every positive/negative financial value includes a directional prefix (`+` or `-`) and an icon arrow so meaning is not conveyed by color alone.
- **Focus Rings**: All interactive controls display high-visibility focus borders (`2px solid var(--border-focus)`).
- **Zero Layout Shifts**: Metric containers and table rows reserve fixed heights to avoid cumulative layout shift (CLS) during real-time data refreshes.
