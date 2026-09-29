# MVP-15: Trade Context Intelligence Implementation Plan

## 1. Problem
Before placing a trade, users need to know historical facts about their past performance with a specific symbol, how they are performing today, their playbook completeness, active alerts, and watchlist inclusion without being told *whether* to trade.

## 2. Research & Architecture
We will create a `tradeContextService` that aggregates real deterministic data across multiple existing services. It uses `req.user.userId` to guarantee isolated data.

## 3. Data Sources
- **Historical Symbol**: `Orders`/`Transactions` (Win rate, avg P&L for symbol).
- **Session Context**: Reuses `sessionIntelligenceService` from MVP-14.
- **Playbook Context**: Reuses MVP-13 snapshots.
- **Watchlist**: Reuses MVP-6.
- **Alerts**: Reuses MVP-7.
- **Behavioral Context**: Reuses MVP-12.
- **Market Context**: Reuses `marketDataService` (provider-agnostic).

## 4. API Design
- `GET /api/v1/trade-context/:symbol`: Fetches the aggregated trade context for the active user.

## 5. Security & Isolation
All DB queries will strictly filter on `req.user.userId`.
Financial state remains immutable. No automatic trading.

## 6. AI Explanation
AI parses the context object to explain observations but does not invent stats or predict market movement.

## 7. Frontend
The `BuyActionWindow` is extended with a new "Trade Context" section to display the evidence logically and compactly.
