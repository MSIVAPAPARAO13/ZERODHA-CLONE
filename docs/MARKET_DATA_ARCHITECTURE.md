# TRADEFLOW — MARKET DATA ARCHITECTURE & PROVIDER INTEGRATION

**System**: TradeFlow Market Intelligence & Paper Execution Gateway  
**Date**: October 2026  
**Status**: **VERIFIED & OPERATIONAL (4-Tier Resilient Gateway)**

---

## 1. Architectural Overview

TradeFlow implements a unified market data gateway that insulates the application from third-party vendor outages, rate limiting, and pricing changes. The gateway decouples the frontend and domain engines from concrete market-data providers through an abstract adapter interface.

```text
┌────────────────────────────────────────────────────────┐
│             Frontend UI & Domain Services              │
│       (Watchlists, Quotes, Scanners, Backtesting)      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              MarketDataService (Gateway)               │
│  - In-memory 5-minute TTL Quote Cache                  │
│  - Rate-limit tracking & failover orchestration       │
│  - Provider health diagnostics                         │
└───────────┬───────────────────────────────┬────────────┘
            │                               │
            ▼ (Primary Provider)            ▼ (Secondary Fallback)
┌──────────────────────────┐    ┌──────────────────────────┐
│    TwelveDataProvider    │    │  AlphaVantageProvider    │
│  - Real-time NSE / Global│    │  - Global Equity Quotes  │
│  - WebSocket / REST feeds│    │  - Technical Indicators  │
└───────────┬──────────────┘    └───────────┬──────────────┘
            │ (Rate limit or error)         │
            └───────────────┬───────────────┘
                            ▼ (Failover Tier)
┌────────────────────────────────────────────────────────┐
│               MockMarketDataProvider                   │
│  - Deterministic stochastic price simulation           │
│  - Historical series generator                         │
│  - Transparent provenance tagging                      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Integrated Market Data Providers

### 2.1 Twelve Data (`TwelveDataProvider.js`)
- **Role**: Primary real-time and historical quote provider.
- **Protocols**: REST API (`https://api.twelvedata.com`).
- **Endpoints Utilized**:
  - `/quote`: Real-time bid, ask, last price, volume, day change.
  - `/time_series`: Historical daily OHLCV candlestick series.
  - `/symbol_search`: Asset symbol lookup.
- **Authentication**: `TWELVE_DATA_API_KEY` passed via HTTP query parameter or authorization header.
- **Failover Trigger**: Network timeout (> 5000ms), HTTP 429 (Rate Limit Exceeded), or HTTP 5xx.

### 2.2 Alpha Vantage (`AlphaVantageProvider.js`)
- **Role**: Secondary failover provider and quantitative technical indicator engine.
- **Protocols**: REST API (`https://www.alphavantage.co/query`).
- **Endpoints Utilized**:
  - `GLOBAL_QUOTE`: Current pricing and volume.
  - `TIME_SERIES_DAILY`: Historical daily prices.
  - `RSI`, `SMA`, `EMA`: Technical indicator series for quantitative scanner and strategy lab.
- **Authentication**: `ALPHA_VANTAGE_API_KEY`.
- **Formatting**: Symbol mapping automatically translates Indian equities (e.g. `RELIANCE` $\to$ `RELIANCE.BSE`).
- **Rate Limit Handling**: Free-tier limits (5 requests/minute, 500/day). Detects `Note` and `Information` API throttling payloads and gracefully triggers fallback.

### 2.3 Mock Market Data Provider (`MockMarketDataProvider.js`)
- **Role**: High-availability resilience provider and offline testing feed.
- **Features**:
  - Covers NIFTY 50 and global benchmark equities.
  - Stochastic random-walk tick generation bounded by historical volatility.
  - Deterministic OHLCV bars for backtesting when external keys are unconfigured or throttled.
  - Strict ticker validation: rejects invalid/unknown symbols (`UNKNOWN`, `INVALID`, `XYZ`) with HTTP 404 errors matching real provider semantics.

---

## 3. Caching & Resilience Strategy

1. **In-Memory TTL Caching**:
   - Live quotes are cached in-memory with a 5-minute (300,000ms) Time-To-Live.
   - Prevents duplicate requests when multiple components (Watchlist, Summary, Command Center) render concurrently.
2. **Graceful Degradation & Provenance Metadata**:
   - When a primary provider fails, `MarketDataService` attempts the secondary provider.
   - If all external APIs are throttled or offline, the system serves the cached quote (tagged with `isStale: true`) or falls back to `MockMarketDataProvider`.
   - Every quote response includes provider attribution metadata:
     ```json
     {
       "symbol": "RELIANCE",
       "price": 2980.50,
       "provider": "twelvedata",
       "cached": false,
       "providerNotice": null
     }
     ```
     Or on fallback:
     ```json
     {
       "symbol": "RELIANCE",
       "price": 2980.50,
       "provider": "mock",
       "cached": false,
       "providerNotice": "SERVED_VIA_FALLBACK_PROVIDER"
     }
     ```
3. **Frontend API Protection**:
   - Zero third-party API keys are exposed to the client browser.
   - All external requests originate strictly from backend services.

---

## 4. Empirical Performance & Latency Metrics

Load test results from `docs/LOAD_TEST_REPORT.md`:
- **Cached Quote Latency**: **6.9ms** average response time.
- **Peak Throughput**: **3,030.3 requests/second**.
- **Failover Execution Latency**: < 12ms from primary timeout to fallback response.
