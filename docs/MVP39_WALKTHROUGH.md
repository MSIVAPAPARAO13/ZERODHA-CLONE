# MVP-39 WALKTHROUGH — "WHAT CHANGED TODAY?" PERSONALIZED RESEARCH FEED

## 1. Overview

MVP-39 delivers the capstone experience of the MVP-37 → MVP-38 → MVP-39 research transformation. When a trader opens TradeFlow, the system immediately presents an organized, prioritized, and personalized briefing answering:
> *"What changed today across my holdings, watchlist, and active alerts, why does it matter, and what grounded evidence should I investigate?"*

---

## 2. Architecture & Deliverables

### Backend
1. **`insightsService.js`**:
   - Single orchestration service that synthesizes data from `marketEventService`, `WatchlistModel`, `HoldingsModel`, `AlertModel`, and `ResearchSessionModel`.
   - `getTodayFeed(userId)`: Resolves user context, fetches today's market events, enriches them with priority scores and transparent "Why This Appears" explanations, groups them into sections (`PORTFOLIO`, `WATCHLIST`, `ALERT`, `SCANNER`, `RESEARCH`, `MARKET`), and generates grounded daily research inquiries.
   - `getHistoryFeed(userId, query)`: Supports `dateRange=today|yesterday|week` with pagination.
   - `calculatePriorityScore()`: Deterministic priority weighing severity (`CRITICAL=400`, `SIGNIFICANT=300`, `WATCH=200`, `INFO=100`), context relevance (Portfolio=+50, Triggered Alert=+40, Watchlist=+30, Confluence=+25), and recency.
   - `generateWhyThisAppears()`: Explicit, factual justification (e.g. *"TCS is in your watchlist. Daily price change of +4.20% crossed threshold."*).
2. **`insightsController.js` & `insightsRoutes.js`**:
   - `GET /api/v1/insights/today`
   - `GET /api/v1/insights/history`
   - `PATCH /api/v1/insights/:id/read`
   - `PATCH /api/v1/insights/:id/dismiss`
   - Mounted at `/api/v1/insights` behind `authMiddleware`.
3. **`test_mvp39.js`**:
   - 17/17 automated tests passing.
   - Complete coverage of personalization, isolation, prioritization, explanations, research questions, dismissal, and regression.

### Frontend
1. **`Insights.js` & `Insights.css`**:
   - High-level KPI summary strip (Critical Confluences, Portfolio Moves, Watchlist Signals, Triggered Alerts).
   - Grouped section cards (Your Portfolio, Your Watchlist, Your Alerts, Scanner Matches).
   - Factual "Why This Appears" callout block on each item.
   - Soft-dismiss button (`✕`) removing items from today's feed without deleting underlying audit records.
   - Grounded "Empirical Research Inquiries For Today" chips at the bottom.
   - Direct `[🔬 Investigate]` buttons pre-loading Research Copilot with the relevant symbol and inquiry.
2. **`Dashboard.js` & `Menu.js`**:
   - Mounted `/insights` route.
   - Added `Insights` nav item under the Research group.

---

## 3. End-to-End Workflow Verification

```text
1. User logs in and opens "💡 Insights" (/dashboard/insights).
2. React frontend calls single orchestration endpoint:
   GET /api/v1/insights/today
3. Backend evaluates:
   - User holds INFY (25 shares) -> Confluence Event detected (Price +3.5%, Volume 1.9x)
   - TCS is on Watchlist -> Price move +4.2%
   - RELIANCE triggered price alert -> Alert Triggered event
4. Deterministic prioritizer ranks INFY #1 (Score: 490) as a CRITICAL portfolio event.
5. "Why This Appears" explicitly states:
   "INFY is an active position in your portfolio (25 shares). A multi-signal confluence cluster of 2 indicators converged today."
6. User clicks [🔬 Investigate] on INFY card.
7. System immediately routes to Research Copilot (/dashboard/research):
   Question: "Why did INFY exhibit INFY Momentum Confluence today?"
   Symbol: "INFY"
   Intent: "EVENT_INVESTIGATION"
8. Evidence workspace collects Quote, Historical, Scanner, and Portfolio evidence.
9. Grounded AI summarizes facts with zero buy/sell advice and zero financial ledger mutation.
```
