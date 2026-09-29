# MVP-20: Counterfactual Lab Implementation Plan

## 1. Problem
Traders often wonder how their session would have performed if they had strictly followed their rules. However, traditional "backtesting" implies future prediction. We need a deterministic, historical reconstruction tool.

## 2. Counterfactual Engine
The `counterfactualLabService` accepts a `sessionId` and a `scenarioType` (e.g., `PLANNED_ONLY`, `MAX_TRADE_LIMIT`). It fetches the `SessionDecisionModel` (the Decision Twin) and all executed `Orders` linked to that session.

## 3. Scenarios
- **PLANNED_ONLY**: Filters out all trades tagged as deviations in MVP-16.
- **PLANNED_SYMBOLS_ONLY**: Filters out trades on symbols not in the pre-session Watchlist snapshot.
- **MAX_TRADE_LIMIT**: Sorts trades chronologically and aggregates P&L for only the first `N` trades, where `N` is the `maxTrades` constraint from the Decision Twin.

## 4. Output
The API returns a comparison payload containing `actual` metrics vs `counterfactual` metrics, along with an explicit list of `includedTrades` and `excludedTrades` for absolute transparency.

## 5. Security & Financial Integrity
All calculations are strictly READ-ONLY. They never mutate `virtualBalance`, `Positions`, or historical `Order` logs. The query strictly isolates data by `req.user.userId`.

## 6. AI Explanation
AI parses the mathematical difference (e.g. "Scenario X yielded +$500 while actual yielded -$200") but is strictly forbidden from claiming causality or promising future results.
