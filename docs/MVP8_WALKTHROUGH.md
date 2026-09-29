# MVP-8 Walkthrough: Real Market API Integration

## 1. Introduction & Strategy
MVP-8 transitions TradeFlow from a purely theoretical environment backed by a deterministic mock data set (built in MVP-5) into a live, configurable market intelligence platform. Crucially, the internal domain constraints were not broken: Trading calculations remain stable while real-time data ingestion is safely localized within a resilient Service boundary. 

## 2. MarketDataService Refactor & Provider Factory
Instead of hardcoding a mock lookup, `MarketDataService` now operates as a dynamic **Provider Factory**. 
It inspects `process.env.MARKET_DATA_PROVIDER`. 
- `mock` -> `MockMarketDataProvider`
- `twelvedata` -> `TwelveDataProvider` 
- `alphavantage` -> `AlphaVantageProvider`

The app startup evaluates the presence of `.env` API keys and explicitly rejects mounting invalid providers to avoid silent runtime failure states.

## 3. Normalized Response Contract
Whether TradeFlow asks Twelve Data or Alpha Vantage for `TCS`, the frontend consistently receives the identical object schema:
```json
{
  "symbol": "TCS",
  "price": 3194.80,
  "changePercent": -0.25,
  "source": "alphavantage",
  "dataStatus": "available"
}
```
This guarantees the entire UI—Orders, Watchlist, Portfolio Analytics—requires zero logic branching to support new providers.

## 4. Expanding Capabilities (Historical, News, Technicals)
To transform TradeFlow into a Market Intelligence platform, we expanded the provider contract beyond single quotes.
Where supported (Alpha Vantage), the provider dynamically exposes:
- **Historical Data**: E.g. `TIME_SERIES_DAILY` for plotting charts.
- **News/Sentiment**: Aggregated market sentiment indexing for the asset.
- **Technical Indicators**: Calculations like `RSI`, `MACD`, etc.

To optimize frontend ingestion, a unified endpoint `/api/v1/market/intelligence/:symbol` was created, enabling one HTTP call to retrieve Quote + History + Tech + News in a single payload.

## 5. Security & Rate-Limit Resilience
- API Keys are strictly confined to the backend process `.env`.
- External HTTP requests are configured with a `timeout: 5000` to prevent socket hanging.
- Given free-tier limitations (especially Alpha Vantage's 5 requests/minute), when a 429 status is detected, the Provider cleanly catches and throws an application-level `MARKET_DATA_RATE_LIMITED`. The controller translates this into a standard JSON `{ error }` payload, which the frontend can handle gracefully, rather than presenting raw Axios tracebacks to the client.

## 6. Integration Impact
Because we architected MVP-6 (Watchlists) and MVP-7 (Alerts) on top of the `marketDataService` rather than tying them strictly to Mock data, flipping the `MARKET_DATA_PROVIDER` toggle globally and instantaneously switches the entire TradeFlow ecosystem—Alerts trigger on real prices, Watchlists display live quotes, without modifying a single line of React.
