# TRADEFLOW — UI/UX GAP ANALYSIS & REDESIGN AUDIT

**Audit Date**: October 2026  
**Auditor**: Lead Product Designer & Frontend Architect  
**Scope**: TradeFlow Web Dashboard (`dashboard/src/`)  
**Design Target**: Google Stitch High-Fidelity Modern Financial SaaS Specification

---

## 1. Executive Summary

TradeFlow contains extraordinarily rich domain capabilities (multi-hop cascade graphs, quantitative backtesters, scenario stress engines, grounded AI copilots, behavioral coaching, and double-entry simulated financial ledgers). 

However, because the application evolved incrementally from an initial Zerodha clone across 60 phases, the user interface currently exhibits significant visual fragmentation:
1. **Zerodha Legacy Artifacts**: Hardcoded margins ("3.74k Margin available"), mock UPI fund transfer buttons, commodity account warnings, and an empty `Apps.js` stub.
2. **Visual Inconsistency**: Three conflicting CSS paradigms coexist (`index.css` global styles, component-scoped CSS files like `MarketScanner.css`, and chaotic inline styles in `Summary.js` and `Menu.js`).
3. **Information Density Imbalance**: Views like `MarketScanner.js` (1,035 lines) and `StressStudio.js` (777 lines) are dense and overwhelming, while `Orders.js` is a completely empty stub.
4. **Weak Responsive Design**: A fixed 240px sidebar and a fixed 380px watchlist panel squeeze the main workspace down to less than 700px on typical 13-inch laptop screens (1366x768 or 1440x900), resulting in severe table horizontal overflow.

---

## 2. Global Systemic UI/UX Gaps

### 2.1 Navigation & Layout Architecture
- **Issue**: Dual fixed sidebars (`Sidebar` on the left, `WatchList` on the right) permanently consume ~620px of screen width.
- **Consequence**: Center analytical workspaces (Strategy Lab, Scanner, Research Copilot) are severely cramped.
- **Required Stitch Redesign**:
  - Convert left sidebar into a collapsible navigation rail with expandable flyout tooltips.
  - Convert right watchlist into a toggleable slide-over dock with a persistent mini ticker strip.
  - Implement a global command palette (`Cmd/Ctrl + K`) for instant symbol search and page navigation.

### 2.2 Color & Semantic Financial Palette
- **Issue**: Profit/loss colors vary wildly across components (`#2563eb`, `#16a34a`, `#e74c3c`, `#e11d48`, `#673ab7`). Pink Chart.js bar charts clash with dark theme index chips.
- **Consequence**: Users cannot instantly differentiate between actionable profit, systemic risk, or simple informational chips.
- **Required Stitch Redesign**:
  - Strict semantic token system: Emerald Green (`#10b981`) for positive returns, Crimson Red (`#ef4444`) for losses, Amber Gold (`#f59e0b`) for alerts, and Slate/Indigo for structural elements.
  - Eliminate all harsh saturated neon highlights; adopt soft muted backgrounds with dark border contrast.

### 2.3 Typography & Financial Data Density
- **Issue**: Financial metrics mix proportional sans-serif fonts with unformatted numbers, causing decimal jitter during updates.
- **Consequence**: Difficult to scan large holding tables or compare Sharpe ratios.
- **Required Stitch Redesign**:
  - Implement tabular lining numerals (`font-variant-numeric: tabular-nums`) with `Roboto Mono` or `JetBrains Mono` for all prices, P&L values, quantities, and statistical metrics.
  - Standardize typographical scale (Display 32px, H1 24px, H2 20px, H3 16px, Body 14px, Caption 12px, Micro 10px).

---

## 3. Page-by-Page Detailed Gap Analysis

| Page / Route | Current State Classification | Identified UI/UX Problems | Progressive Disclosure & Structural Remedy |
|---|---|---|---|
| **Overview** (`/`) | **Too Empty & Misleading** | • Hardcoded Zerodha numbers ("3.74k Margin", "31.43k Value")<br>• Four inline-styled colored boxes stacked vertically<br>• Zero real-time market charts | • Replace with Executive Command Center<br>• Live portfolio valuation card<br>• Market regime indicator pill<br>• "What Changed Today" compact widget |
| **Orders** (`/orders`) | **Broken / Empty Stub** | • Static placeholder text: "You haven't placed any orders today"<br>• Completely ignores backend `GET /api/v1/orders` data | • Implement full Order Book data table<br>• Status filter pills (All, Filled, Rejected, In-Flight)<br>• Idempotency key audit badge drawer |
| **Holdings** (`/holdings`) | **Cramped Table & Poor Chart** | • Jarring hot-pink bar chart (`rgba(255, 99, 132, 0.5)`)<br>• Plain HTML table without sorting or column hiding<br>• Lacks sector allocation donut | • Modern financial data grid with sorting<br>• Allocation donut chart alongside KPI summary<br>• Integrated sell action trigger per row |
| **Positions** (`/positions`) | **Basic & Incomplete** | • No net exposure or portfolio delta calculation<br>• Lacks "Square Off All" emergency safety action<br>• Plain border styling | • Segmented product tabs (Intraday MIS vs Overnight CNC)<br>• Prominent gross exposure banner<br>• Quick closeout confirmation modal |
| **Virtual Funds** (`/funds`) | **Misleading Copy** | • References real Indian banking (UPI transfers, Commodity accounts)<br>• Static opening balance numbers | • Rebrand as "Paper Trading Capital & Ledger"<br>• Virtual balance deposit / reset simulation button<br>• Full transaction audit log table |
| **Watchlist** (Side Dock) | **Space Hog** | • Permanently occupies 380px horizontal space<br>• Donut chart pushes symbols below the fold<br>• Search dropdown flickers | • Collapsible drawer with keyboard shortcut (`W`)<br>• Remove redundant donut chart<br>• Compact row items with mini price sparklines |
| **Order Window** (`BuyActionWindow`) | **Vertical Overload** | • Modal extends off-screen when pre-trade checklist and journal are both opened<br>• Unstyled checkbox list | • Tabbed modal: (1) Order Specs, (2) Discipline Rules, (3) Thesis<br>• Prominent "SIMULATED ORDER" banner |
| **Market Scanner** (`/scanner`) | **Severe Information Overload** | • 1,035 lines in one screen<br>• Condition cards take excessive vertical space<br>• Inspection drawer covers candidate results awkwardly | • Two-column split view: Left filter rail (collapsible), Right candidate table<br>• Condition match badges (e.g. `RSI: 62 ✓`)<br>• Floating batch action bar |
| **Research Copilot** (`/research`) | **Disjointed Workflow** | • Session history consumes left 25% permanently<br>• Evidence table text overflows card borders<br>• Lacks export capability | • 3-pane research terminal layout<br>• Collapsible history rail<br>• Rich document editor with citation tooltips<br>• Direct "Simulate Paper Trade" CTA |
| **Strategy Lab** (`/strategy-lab`) | **Dense & Cluttered** | • KPI cards lack visual hierarchy<br>• Equity curve lacks interactive drawdown tooltips<br>• Trade table pagination is clunky | • Top summary banner with preset badges<br>• Side-by-side config form and interactive chart<br>• Shaded profit/loss trade list with export |
| **Stress Studio** (`/stress-studio`) | **Visual Fragmentation** | • What-If simulator is disconnected from results<br>• Holding shock table typography is too small<br>• Sliders lack tick marks | • Risk cockpit layout with interactive shock dials<br>• Waterfall attribution chart<br>• Position shock impact badges |
| **Daily Insights** (`/insights`) | **Card Sprawl** | • Text-dense cards stacked without visual breaks<br>• Lacks market regime summary banner<br>• Redundant dismiss actions | • Executive summary hero with regime meter<br>• Filter tabs: All, Earnings, Volatility, Regime<br>• Direct "Investigate in Copilot" button |
| **Events Feed** (`/events`) | **Flat Hierarchy** | • Looks like bootstrap alert boxes<br>• Severity badges lack distinct color coding<br>• Lacks symbol logo avatars | • Chronological timeline feed<br>• Distinct severity iconography (Flame/Bolt/Eye)<br>• Direct "Add to Watchlist" quick action |
| **Market Cascade** (`/cascade`) | **Complex Graph Clutter** | • Node clusters overlap on high hop depth (> 3)<br>• Node inspector covers part of the graph | • Interactive pan/zoom canvas<br>• Collapsible catalyst configuration drawer<br>• Clean right-side thesis note panel |
| **Trade Journal** (`/journal`) | **Basic Table** | • Plain unstyled table<br>• Lacks emotional state filters (FOMO, Greed, Calm)<br>• No R:R ratio indicator chips | • Card/table view toggle<br>• Emotion tags and confidence stars<br>• Visual P&L outcome chips |
| **Trade Replay** (`/replay/:id`) | **Text Heavy** | • No visual price action chart showing entry/exit<br>• Plain white card boxes | • Candlestick chart with marked entry and exit arrows<br>• Discipline scorecard badge (1-100)<br>• AI key lessons callout |
| **Behavioral Edge** (`/behavior-insights`) | **Uninspiring Visuals** | • Raw percentages in plain text boxes<br>• Lacks benchmark comparisons | • Radial discipline gauge<br>• Radar chart for cognitive biases<br>• Actionable coaching checklist |
| **Playbooks** (`/playbooks`) | **Basic Bullet List** | • Native browser alert/prompt for creation<br>• Rules cannot be reordered | • Card grid with rule count chips<br>• Slide-over playbook editor drawer<br>• Direct integration toggle with order modal |
| **Portfolio AI Analyst** (`/ai-analyst`) | **Dated Purple Aesthetic** | • Four identical purple cards stacked vertically<br>• Raw unformatted text blocks | • Tabbed intelligence dashboard<br>• Key metric callouts with citation tooltips<br>• Structured takeaways with export |
| **Alerts** (`/alerts`) | **Flickering Autocomplete** | • Search dropdown jumps around<br>• Table layout is stark and plain | • Split layout: Left quick-alert builder, Right active alerts feed<br>• Quick percentage offset pills (+2%, +5%, -3%) |
| **Interview Demo** (`/demo`) | **Static Text Container** | • Static list of 13 steps without progression<br>• Simple gray container | • Interactive step-by-step guided stepper<br>• Live click-to-execute demo actions<br>• Architecture callout sidebars |
| **Apps** (`/apps`) | **Dead Placeholder** | • Literally renders `<h1>Apps</h1>` | • Deprecate and redirect to `/insights` or `/scanner` |

---

## 4. UI/UX Gap Audit Sign-Off

Every page and component has been systematically evaluated against modern financial SaaS standards. The identified gaps form the exact requirements for the **TradeFlow Design System** (`docs/DESIGN_SYSTEM.md`) and the **Google Stitch Master Prompt** (`docs/STITCH_MASTER_PROMPT.md`).
