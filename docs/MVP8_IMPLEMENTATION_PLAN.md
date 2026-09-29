# MVP-8 Implementation Plan: Real Market API Integration & Market Intelligence Foundation

## 1. Current MVP-5 Architecture
- `MarketDataService` currently uses a hardcoded fallback logic to `MockMarketDataProvider` if `MARKET_DATA_PROVIDER` is set to `'mock'` or unknown.
- The `MockMarketDataProvider` implements `getQuote`, `getQuotes`, and `searchSymbols`.
- The current `.env` contains keys for `TWELVE_DATA_API_KEY` and `ALPHA_VANTAGE_API_KEY`.

## 2. External Providers to be Integrated
- **Twelve Data Provider:** Handles quotes, time series, and symbol search.
- **Alpha Vantage Provider:** Handles quotes, historical time series, technical indicators (SMA, EMA, RSI, MACD), and news & sentiment.

## 3. Provider Interface & Normalized Format
Each provider will implement (or gracefully omit) methods:
- `getQuote(symbol)`
- `getQuotes(symbols)`
- `searchSymbols(query)`
- `getHistoricalData(symbol, options)`
- `getTechnicalIndicators(symbol, indicator, options)`
- `getNewsSentiment(symbol, options)`

**Normalized Quote Format:**
```json
{
    "symbol": "TCS",
    "name": "Tata Consultancy Services",
    "price": 3500,
    "open": 3475,
    "high": 3520,
    "low": 3460,
    "previousClose": 3480,
    "change": 20,
    "changePercent": 0.57,
    "volume": 1200000,
    "timestamp": "2023-10-25T10:00:00Z",
    "source": "alphavantage",
    "dataStatus": "available"
}
```

## 4. Provider Factory
A `marketDataProviderFactory.js` (or inline within `MarketDataService`) will select the provider:
- `MARKET_DATA_PROVIDER=mock` -> `MockMarketDataProvider`
- `MARKET_DATA_PROVIDER=twelvedata` -> `TwelveDataProvider`
- `MARKET_DATA_PROVIDER=alphavantage` -> `AlphaVantageProvider`

If a selected real provider lacks its API key, it will throw an error on startup to prevent silent failure. If the provider fails dynamically (rate limits/timeout), it will bubble up a standardized error to the client instead of crashing or silently using mock data.

## 5. API Key Handling
- Only stored in the backend `.env`.
- `.env.example` will have empty placeholders.

## 6. Endpoints
Extend `marketRoutes.js` and `marketController.js` to include:
- `GET /api/v1/market/history/:symbol`
- `GET /api/v1/market/technical/:symbol`
- `GET /api/v1/market/news/:symbol`
- `GET /api/v1/market/intelligence/:symbol` (combines all supported data for a symbol).

## 7. Rate Limit & Timeout Handling
- Providers will use standard fetch/axios with timeouts (e.g., 5000ms).
- Errors from external APIs (429 Rate Limit) will be translated into normalized `{ success: false, error: { code: 'MARKET_DATA_RATE_LIMITED' } }`.

## 8. Fallback Strategy
- Production uses configured provider. If the configured real provider fails, return a rate-limit or unavailable error to the UI. Do not silently fall back to mock data unless explicitly configured to use mock. 

## 9. Frontend Impact
- Watchlist and Alerts already use `MarketDataService` via `marketController` APIs, so they will automatically get real data when the environment variable changes.
- Market data dashboard will show the provider and status.
- We will add "Market Intelligence" views if time permits, but primary focus is API integration.

## 10. Testing Strategy
- Create `test_mvp8.js` to test all providers through the factory, handling mock, TwelveData (if key exists), and AlphaVantage (if key exists). Check rate limit formats and normalized responses.
- Regression test MVP-1 to MVP-7.

## 11. Explicit Non-Goals
- Real-time WebSockets / Streaming.
- Changing trading execution (virtualBalance, BUY/SELL) to use real prices instead of the isolated mock data in MVP-4.
- AI Stock screener / recommendations.
