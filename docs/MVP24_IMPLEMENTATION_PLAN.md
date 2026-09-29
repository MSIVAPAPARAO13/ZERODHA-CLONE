# MVP-24: Production Market Data Integration & Historical Intelligence Implementation Plan

## 1. Problem
TradeFlow has relied heavily on Mock data to build out the complex analytical pipelines (MVP-18, MVP-21, MVP-22). Now, we need to inject real external market data (Twelve Data, Alpha Vantage) without breaking the internal normalized contract, exposing API keys, or creating look-ahead bias in validations.

## 2. Architecture
The `MarketDataService` acts as the orchestrator. It uses a `marketDataProviderFactory` that reads `MARKET_DATA_PROVIDER` from `.env`.
Options: `mock`, `twelvedata`, `alphavantage`.
If a provider is missing its respective API key, the factory throws an error instead of silently falling back to mock data.

## 3. Data Normalization
Each provider plugin implements a strict interface:
- `getQuote(symbol)` -> Returns a normalized Quote object.
- `getHistoricalBars(symbol, options)` -> Returns a normalized array of Candle objects.

## 4. Stability & Security
The backend imposes caching (via Node cache), hard timeouts (e.g., 10s), rate-limit mapping (429 handling), and transient retries. The frontend NEVER touches provider APIs directly and never sees the secret keys. 

## 5. Integrations
- **MVP-18 (Research)** & **MVP-22 (Validation)** query the historical API. They log the `source` (e.g., `twelvedata`) to ensure provenance is clear.
- **MVP-6 (Watchlist)** & **MVP-7 (Alerts)** use the real-time normalized quote API.
- **Paper Trading** remains distinct: executing a paper trade does not mutate the historical financial ledgers based on external market ticks, preserving MVP-4 accounting integrity.
