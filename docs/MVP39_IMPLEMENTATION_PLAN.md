# MVP-39 IMPLEMENTATION PLAN — "WHAT CHANGED TODAY?" PERSONALIZED RESEARCH FEED

## 1. Executive Summary

MVP-39 translates raw market events and data shifts from MVP-38 into a curated, high-signal daily briefing: **"What Changed Today?"**.
Instead of flooding the trader with an indiscriminate stream of 100 notifications, the system deterministically evaluates the user's specific portfolio holdings, watchlist, active alerts, and research history, organizes events into clear contextual sections, attaches transparent "Why This Appears" explanations, and generates grounded follow-up research questions directly actionable in the Research Copilot.

```text
USER MONITORED UNIVERSE (Watchlist, Portfolio, Alerts, Research)
                           ↓
               MARKET EVENT ENGINE (MVP-38)
                           ↓
             PERSONALIZATION & RELEVANCE FILTER
                           ↓
       DETERMINISTIC PRIORITIZATION & SORT ENGINE
                           ↓
          "WHY THIS APPEARS" EXPLANATION SYNTHESIS
                           ↓
            DAILY ORCHESTRATION ENDPOINT:
              GET /api/v1/insights/today
                           ↓
    FRONTEND INSIGHTS WORKSPACE (/dashboard/insights)
                           ↓
                 ONE-CLICK INVESTIGATE
```

## 2. Architecture & Reuse Principles

- **Zero Duplication**: `insightsService.js` directly delegates to `marketEventService.js`, `WatchlistModel`, `HoldingsModel`, `AlertModel`, `ResearchSessionModel`, and `marketDataService`.
- **Backend Orchestration**: Frontend React app makes a single call to `GET /api/v1/insights/today` rather than issuing 6 distinct parallel API requests.
- **Zero Ledger Mutation**: Read-only evaluation. No orders, positions, or balances can be changed.
- **Data Provenance**: Every insight traces directly to underlying `MarketEvent` records and provider quotes.

## 3. Daily Feed Structure & Sections

The feed groups events into 7 distinct contextual sections:
1. `MARKET`: Broad market breadth or benchmark movements.
2. `WATCHLIST`: Events on symbols actively monitored in user's watchlist.
3. `PORTFOLIO`: Significant price moves or exposure changes in user's holdings or positions.
4. `SCANNER`: New candidates matching active scanner presets.
5. `ALERT`: Alerts that reached trigger threshold.
6. `RESEARCH`: Symbols investigated in recent Research Copilot sessions experiencing new events.
7. `THESIS`: Changes impacting open trade thesis notes in the Trade Journal.

## 4. Deterministic Prioritization Algorithm

Events within the feed are ordered strictly by:
1. **Severity Rank**:
   - `CRITICAL` (Weight: 400)
   - `SIGNIFICANT` (Weight: 300)
   - `WATCH` (Weight: 200)
   - `INFO` (Weight: 100)
2. **Context Relevance Bonus**:
   - In Portfolio: +50
   - Triggered Alert: +40
   - In Watchlist: +30
   - Multi-Signal Confluence Cluster: +25
3. **Temporal Recency**:
   - Events within last 2 hours prioritized over older events.

Formula:
`PriorityScore = SeverityWeight + ContextBonus + RecencyDecay`

## 5. "Why This Appears" Empirical Explanation Generator

Each major insight card includes a transparent, factual statement answering why it was surfaced:
- *Watchlist Item*: `"[SYMBOL] is in your watchlist. A [EVENT_TYPE] of [CHANGE]% occurred at [TIME]."`
- *Portfolio Holding*: `"[SYMBOL] is an active holding (quantity: [QTY]). The price moved [CHANGE]% today."`
- *Confluence Event*: `"[SYMBOL] generated [COUNT] concurrent signals across price (+4.2%), volume (1.8x), and scanner criteria."`

Zero speculative or unsolicited financial advice.

## 6. API Specification

- `GET /api/v1/insights/today`
  - Returns: `{ date, summary, sections, events, researchQuestions }`
- `GET /api/v1/insights/history`
  - Accepts: `?dateRange=today|yesterday|week&page=1&limit=20`
- `PATCH /api/v1/insights/:id/read`
  - Marks item as read via `marketEventService.markRead()`
- `PATCH /api/v1/insights/:id/dismiss`
  - Soft-dismisses item via `marketEventService.dismissEvent()`

## 7. Frontend Feed UI (`/dashboard/insights`)

- Component: `Insights.js`
- Clean summary metric strip (Critical Alerts, Watchlist Moves, Portfolio Shifts, Scanner Hits).
- Section-based accordion or grouped cards.
- "Why This Appears" explanation block on each card.
- `[View Evidence]` opens raw metric details.
- `[🔬 Investigate]` triggers Research Copilot with pre-populated inquiry.
- `[✕ Dismiss]` removes card from today's feed without deleting underlying audit trail.
- Clean Empty State: *"No significant changes detected. Your monitored market state is unchanged based on current data."*

## 8. Test Plan (`backend/test_mvp39.js`)

1. Today's feed compilation & schema structure
2. User isolation (User B cannot access User A's insights)
3. Personalization by Watchlist items
4. Personalization by Portfolio holdings
5. Personalization by Triggered Alerts
6. Personalization by Scanner candidates
7. Personalization by Recent Research sessions
8. Deterministic prioritization ordering verification
9. "Why This Appears" explanation text accuracy
10. Dynamic Daily Research Question generation
11. Read status update
12. Dismiss status update (soft-hiding)
13. Historical feed with date filtering (today, yesterday, last 7 days)
14. Empty state verification when no events exist
15. Single orchestration endpoint performance (< 100ms)
16. Zero financial ledger mutation verification
17. Full regression: MVP-38 (24/24), MVP-37 (40/40), and core platform
