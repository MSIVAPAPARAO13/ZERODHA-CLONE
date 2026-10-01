# MVP-32 Implementation Plan: Market Impact Intelligence

## 1. Architecture
- **MarketEventProvider**: Extends the existing `MarketDataService` abstraction to fetch news/corporate actions from configured APIs (e.g., Alpha Vantage / Twelve Data).
- **EventNormalizer**: Converts disparate API JSON schemas into a unified TradeFlow `MarketEvent` schema.
- **ImpactMatchEngine**: Queries user models (`Position`, `Watchlist`, `Playbook`, `Alert`, `Journal`) searching for symbol intersections against the normalized event.

## 2. Methodology
- **Temporal Correctness**: Event timestamp must be evaluated strictly against the Portfolio Snapshot state AT THAT EXACT TIMESTAMP to prevent Look-Ahead bias (claiming an event impacted a position opened a week later).
- **Impact Categorization**: `DIRECT` (held in portfolio), `INDIRECT` (held sector overlap), `WATCHLIST`, `STRATEGY-RELATED` (Playbook condition), `THESIS-RELATED` (Journal tag).

## 3. Caching & Limits
Global market events are cached heavily (e.g., `market-event:TCS:date`) to minimize external provider hits. Private impact intersections are scoped strictly to the user but calculated deterministically on read to avoid database bloat.

## 4. API Boundaries
New endpoints:
- `GET /api/v1/market-events`
- `GET /api/v1/market-events/:id/impact`
