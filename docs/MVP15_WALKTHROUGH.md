# MVP-15 Walkthrough: Trade Context Intelligence

## 1. Problem
Users needed immediate evidence-backed context before executing a trade, combining historical performance, daily session metrics, and live market quotes.

## 2. Architecture
The `tradeContextService` acts as an orchestrator, asynchronously querying historical data, the `sessionIntelligenceService`, `marketDataService`, and the `playbookService`.

## 3. Pre-Trade Integration
The `BuyActionWindow` now calls `GET /api/v1/trade-context/:symbol` to fetch context when a user selects a symbol to trade.

## 4. Evidence Provided
- **Historical**: Previous trades on the symbol, win rate, average P&L.
- **Session**: Trades today, session P&L, streaks.
- **Market API**: Provider-agnostic quotes and price changes.
- **Watchlist & Alerts**: Checks if the symbol is planned or has active triggers.

## 5. AI Safety
The AI explains facts ("You have traded this symbol 14 times") rather than diagnosing ("You are revenge trading").

## 6. Financial Isolation
No state is mutated during trade context evaluation.

## 7. Testing
Verified `tradeContextService` aggregation and user isolation.

## 8. Limitations
Time-of-day analytics are bucketed broadly; complex multi-day trend analysis is outside the scope of MVP-15.
