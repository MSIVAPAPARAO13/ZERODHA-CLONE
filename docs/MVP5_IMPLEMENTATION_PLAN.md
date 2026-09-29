# MVP-5 Implementation Plan: Market Data Provider Abstraction

## 1. Current State
The frontend currently uses a hardcoded array (`watchlist`) exported from `dashboard/src/data/data.js` to render stock prices in the WatchList component.
The backend has no concept of a market data provider.

## 2. Abstraction Design
We will introduce a provider interface:
- **Provider Layer:** `MockMarketDataProvider.js` will act as a deterministic mock provider.
- **Service Layer:** `marketDataService.js` will wrap the provider. The active provider is determined by `process.env.MARKET_DATA_PROVIDER`.
- **Controller/API Layer:** `marketController.js` and `marketRoutes.js` will expose `GET /api/v1/market/quote/:symbol`, `GET /api/v1/market/quotes`, and `GET /api/v1/market/search`.

## 3. MockProvider Behavior
The Mock provider will store a static object of realistic market data (RELIANCE, TCS, INFY, etc.). It will deterministically return this data rather than randomizing on every request, ensuring consistent testability and UX.

## 4. API Endpoints
- `GET /api/v1/market/quote/:symbol`: Returns a single quote. 404 if unknown.
- `GET /api/v1/market/quotes`: Returns all supported mock quotes (for the watchlist).
- `GET /api/v1/market/search?q=...`: Filters symbols by query string.

## 5. Frontend Integration
- Add `marketService` to `api.js`.
- Modify `WatchList.js` to load its initial state from the backend `/market/quotes` endpoint rather than the local static `data.js` file.

## 6. Trading Engine Safety
We will NOT blindly wire the market data into the trading execution logic (`tradingService.js`) in this MVP. The MVP-4 accounting system and average price rules remain strictly untouched. The purpose of MVP-5 is strictly observational data provision.

## 7. Migration & Env
- Create a `.env` entry: `MARKET_DATA_PROVIDER=mock`.
- Ensure no real APIs (Twelve Data / Alpha Vantage) are implemented.

## 8. Testing Strategy
- Unit test `test_mvp5.js` checking: single quote, multiple quotes, search functionality, and 404 for unknown symbols. Verify MVP-1 to MVP-4 flows remain intact.
