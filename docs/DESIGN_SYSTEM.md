# TRADEFLOW DESIGN SYSTEM SPECIFICATION (v2.0)

**Product**: TradeFlow  
**Positioning**: Enterprise-Grade Trading Simulation, Market Intelligence & Quantitative Research Platform  
**Target Design Tool**: Google Stitch & Production React Client  
**Aesthetic Theme**: Modern Financial SaaS Terminal / Dark-Mode First Analytics Platform  

---

## 1. Brand & Visual Personality

TradeFlow bridges serious institutional market analytics with safe paper-trading simulation. 
The visual personality is:
- **Professional & Technical**: High data density, sharp geometric hierarchy, clear informational contrast.
- **Intelligent & Trustworthy**: Grounded data provenance, prominent source tags, zero speculative hype.
- **Modern & Data-Driven**: Tabular lining numerals, subtle neutral borders, refined micro-surfaces.

### Anti-Patterns Strictly Prohibited
- **NO** flashy crypto "degen" aesthetics (no rainbow neon borders, no pulsating cyberpunk buttons).
- **NO** generic purple-dominated "ChatGPT clone" AI themes.
- **NO** amateurish gradient soup or excessive glassmorphic blur filters.
- **NO** misleading real-money brokerage cues (all order forms prominently state `SIMULATED`).

---

## 2. Color System & Semantic Tokens

TradeFlow features a refined dual-mode (Dark / Light) color architecture optimized for financial charts, data tables, and extended analytical sessions.

### 2.1 Dark Mode Palette (Primary Experience)

```css
:root[data-theme="dark"] {
  /* Surfaces & Backgrounds */
  --bg-canvas: #090d16;          /* Deep obsidian root background */
  --bg-surface: #0f172a;         /* Card & panel surface (Slate 900) */
  --bg-surface-elevated: #1e293b;/* Hover states, active rows, modals (Slate 800) */
  --bg-surface-subtle: #172033;  /* Secondary containers & table headers */

  /* Borders & Dividers */
  --border-subtle: #1e293b;      /* Baseline element dividers */
  --border-default: #334155;     /* Card outlines & input borders */
  --border-focus: #38bdf8;       /* Active input and tab focus indicator (Sky 400) */

  /* Typography Colors */
  --text-primary: #f8fafc;       /* Highest contrast headers and metrics (Slate 50) */
  --text-secondary: #cbd5e1;     /* Body labels, table cells (Slate 300) */
  --text-muted: #64748b;         /* Timestamps, footnotes, captions (Slate 500) */
  --text-inverse: #0f172a;       /* Text on bright badges */

  /* Primary Brand Accents */
  --accent-primary: #0284c7;     /* TradeFlow Cyan-Blue (Sky 600) */
  --accent-primary-hover: #0369a1;
  --accent-primary-subtle: rgba(2, 132, 199, 0.15);

  /* Semantic Financial Colors */
  --financial-positive: #10b981;        /* Profit, BUY, Upward delta (Emerald 500) */
  --financial-positive-subtle: rgba(16, 185, 129, 0.12);
  --financial-negative: #f43f5e;        /* Loss, SELL, Drawdown (Rose 500) */
  --financial-negative-subtle: rgba(244, 63, 94, 0.12);
  --financial-warning: #f59e0b;         /* Risk alerts, near-triggers (Amber 500) */
  --financial-warning-subtle: rgba(245, 158, 11, 0.12);
  --financial-info: #3b82f6;            /* Neutral macro events, announcements (Blue 500) */
  --financial-info-subtle: rgba(59, 130, 246, 0.12);

  /* Intelligence & AI Indicators */
  --intel-ai: #8b5cf6;                  /* Grounded AI copilot tags (Violet 500) */
  --intel-ai-subtle: rgba(139, 92, 246, 0.15);
  --intel-quant: #06b6d4;               /* Quantitative & backtest badges (Cyan 500) */

  /* Chart & Visualization Palette */
  --chart-series-1: #38bdf8;     /* Sky */
  --chart-series-2: #10b981;     /* Emerald */
  --chart-series-3: #a855f7;     /* Purple */
  --chart-series-4: #f59e0b;     /* Amber */
  --chart-series-5: #ec4899;     /* Pink */
  --chart-grid: #1e293b;
}
```

### 2.2 Light Mode Palette (Secondary / High-Contrast Mode)

```css
:root[data-theme="light"] {
  --bg-canvas: #f8fafc;          /* Slate 50 */
  --bg-surface: #ffffff;         /* Pure white */
  --bg-surface-elevated: #f1f5f9;/* Slate 100 */
  --bg-surface-subtle: #f8fafc;
  --border-subtle: #e2e8f0;      /* Slate 200 */
  --border-default: #cbd5e1;     /* Slate 300 */
  --border-focus: #0284c7;

  --text-primary: #0f172a;       /* Slate 900 */
  --text-secondary: #334155;     /* Slate 700 */
  --text-muted: #64748b;         /* Slate 500 */
  --text-inverse: #ffffff;

  --accent-primary: #0284c7;
  --accent-primary-hover: #0369a1;
  --accent-primary-subtle: rgba(2, 132, 199, 0.08);

  --financial-positive: #059669; /* Emerald 600 */
  --financial-positive-subtle: #ecfdf5;
  --financial-negative: #e11d48; /* Rose 600 */
  --financial-negative-subtle: #fff1f2;
  --financial-warning: #d97706;  /* Amber 600 */
  --financial-warning-subtle: #fffbeb;
  --financial-info: #2563eb;     /* Blue 600 */
  --financial-info-subtle: #eff6ff;
}
```

---

## 3. Typography Hierarchy & Rules

Typography uses **Inter** for clean semantic interfaces and **Roboto Mono** / **JetBrains Mono** for all numerical financial metrics.

| Token | Family | Weight | Size | Line Height | Letter Spacing | Primary Usage |
|---|---|---|---|---|---|---|
| `font-display` | Inter | 700 (Bold) | 32px | 38px | -0.02em | Hero values, Total Portfolio Wealth |
| `font-h1` | Inter | 600 (SemiBold) | 24px | 30px | -0.015em | Top Page Headers, Strategy Lab Title |
| `font-h2` | Inter | 600 (SemiBold) | 20px | 26px | -0.01em | Card section titles, Modal headers |
| `font-h3` | Inter | 600 (SemiBold) | 16px | 22px | 0 | Sub-panel headers, Table group titles |
| `font-body` | Inter | 400 (Regular) | 14px | 20px | 0 | Descriptions, AI synthesis text, form labels |
| `font-body-medium` | Inter | 500 (Medium) | 14px | 20px | 0 | Interactive labels, Tab text, Button text |
| `font-caption` | Inter | 400 (Regular) | 12px | 16px | +0.01em | Field captions, source timestamps |
| `font-table-header`| Inter | 600 (SemiBold) | 11px | 14px | +0.05em | Uppercase table headers (`TEXT-TRANSFORM: UPPERCASE`) |
| `font-metric-lg` | Roboto Mono | 600 (SemiBold) | 22px | 26px | 0 | Sharpe Ratio, Net P&L Rupee value |
| `font-metric-md` | Roboto Mono | 500 (Medium) | 14px | 18px | 0 | Table price cells, Quantities, LTP |
| `font-metric-sm` | Roboto Mono | 400 (Regular) | 12px | 16px | 0 | Mini percentage deltas, Sparkline labels |

> **Critical Rule**: All numbers, prices, ratios, percentages, and quantities MUST enforce `font-variant-numeric: tabular-nums` to ensure exact column alignment and zero visual jumping during live updates.

---

## 4. Spacing, Grid & Layout System

TradeFlow uses an 8-point baseline grid system:

```css
--space-1: 4px;   /* Micro offsets, tight badge padding */
--space-2: 8px;   /* Standard compact gap, icon margins */
--space-3: 12px;  /* Table cell padding, card inner margins */
--space-4: 16px;  /* Standard component padding */
--space-5: 20px;  /* Card padding, container gaps */
--space-6: 24px;  /* Section gutters, page margins */
--space-8: 32px;  /* Hero padding, modal spacing */
--space-10: 40px; /* Major page break spacing */
```

### Layout Shell Architecture
- **App Max Width**: 1600px fluid container with 24px side gutters.
- **Sidebar**:
  - Expanded: 220px fixed width with grouped categories.
  - Collapsed Rail: 64px width with icon tooltips on hover.
- **Top Command Bar**: 56px height, sticky top, containing:
  - TradeFlow Logo + "SIMULATION" pill.
  - Command Search Bar (`Ctrl + K` or `Cmd + K`) for instant symbol & feature discovery.
  - Live NIFTY50 & SENSEX ticker chips with green/red deltas.
  - Virtual Balance quick chip: `₹100,000.00`.
  - Notification Bell with unread dot.
  - User Avatar initials with flyout menu.
- **Workspace Canvas**: Fluid remaining width.
- **Watchlist Dock**:
  - Right-docked slide-over panel (320px).
  - Can be pinned open on ultra-wide screens (> 1440px) or minimized into a floating toggle button.

---

## 5. Reusable Component Specifications

### 5.1 Buttons
- **Primary Action**: Solid Cyan-Blue (`#0284c7`), white text, 8px radius, height 36px, `font-weight: 500`.
- **Secondary Action**: Bordered Slate (`#1e293b`), text Slate-200, hover background Slate-800.
- **Financial BUY**: Solid Emerald (`#10b981`), white text, high contrast.
- **Financial SELL**: Solid Rose/Crimson (`#f43f5e`), white text.
- **Ghost / Icon Button**: Transparent background, text Slate-400, hover background rgba(255,255,255,0.06).

### 5.2 Form Inputs & Controls
- **Height**: 36px standard, 32px compact (in table filters).
- **Background**: `var(--bg-surface)` with `var(--border-default)`.
- **Focus**: Border turns `var(--border-focus)` with subtle outer glow `0 0 0 2px rgba(56, 189, 248, 0.2)`.
- **Number Inputs**: Right-aligned monospace numbers with clear increment/decrement controls.

### 5.3 Data Tables
- **Header**: Height 36px, background `var(--bg-surface-subtle)`, text uppercase 11px semi-bold with sort direction arrows.
- **Rows**: Height 44px, border-bottom `1px solid var(--border-subtle)`.
- **Hover**: Background `var(--bg-surface-elevated)` with smooth 150ms transition.
- **Numeric Alignment**: Text columns left-aligned, all financial metrics right-aligned.

### 5.4 Badges & Status Chips
- **Format**: 20px height, 4px border-radius, font-size 11px, font-weight 600.
- **Positive P&L / BUY**: Green background (`var(--financial-positive-subtle)`), text `var(--financial-positive)`. Prefix with `+`.
- **Negative P&L / SELL**: Red background (`var(--financial-negative-subtle)`), text `var(--financial-negative)`. Prefix with `-`.
- **Simulation Tag**: `background: rgba(2, 132, 199, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3)`. Text: `PAPER TRADING`.

### 5.5 Modals & Slide-Over Drawers
- **Backdrop**: `rgba(0, 0, 0, 0.65)` with subtle 2px backdrop blur.
- **Modal Surface**: Border `1px solid var(--border-default)`, radius 12px, shadow `0 20px 25px -5px rgba(0, 0, 0, 0.5)`.
- **Header**: Clear title, close icon button (`Esc` shortcut indicator).
- **Sticky Footer**: Action buttons anchored at the bottom with border-top separator.

---

## 6. Design System Sign-Off

This design system establishes a cohesive, institutional visual language for all 22 TradeFlow views, ensuring that Stitch screen generation maintains uniform visual standards across every phase.
