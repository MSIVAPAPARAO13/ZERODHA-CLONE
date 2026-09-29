# MVP-24 Walkthrough: Production Market Data

## 1. Provider Independence
TradeFlow is no longer bound to static data. By changing `MARKET_DATA_PROVIDER=twelvedata` in the `.env` file and providing a valid key, the entire platform lights up with real market data. The UI displays a subtle indicator: `Data source: Twelve Data (Historical)`.

## 2. Real Quotes and Charts
Searching for "RELIANCE" now queries the provider. The Watchlist updates with real quotes. The Market Overview page renders authentic historical OHLCV charts based on the normalized `getHistoricalBars` backend contract.

## 3. Safe Abstraction
The React frontend has zero knowledge of how Twelve Data or Alpha Vantage works. It only knows the TradeFlow `/api/v1/market/quote` and `/api/v1/market/history` endpoints. If a rate limit is hit, the backend safely translates the 429 into a clean UI error: "Market data rate limited. Please try again."

## 4. Researching Real Data
When you open the Strategy Validation Lab (MVP-22) and run a hypothesis, the system can now pull real historical bars to validate against. The validation report permanently marks that it used `twelvedata` data, ensuring absolute traceability of the research.

## 5. Zero Financial Mutation
Even though real prices are streaming into the app, your Virtual Balance, historical Journal entries, and past Orders remain mathematically sealed. The market data is analytical; the trading ledger remains authoritative.
