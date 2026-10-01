# MVP-36 Research: Intelligent Market Scanner & Opportunity Research Engine

## 1. Executive Summary

Modern trading intelligence platforms (e.g., TradingView, Trendlyne, Screener.in, StockEdge, Chartink, Tickertape) have moved far beyond isolated "stock filter" lists. In institutional and professional retail environments, scanners serve as the **discovery apex of a continuous research pipeline**:
$$\text{Scan} \longrightarrow \text{Explain Why Matched} \longrightarrow \text{Historical Backtest} \longrightarrow \text{Stress Test Exposure} \longrightarrow \text{Synthesize Research Question} \longrightarrow \text{Paper Trade}$$

In contrast, typical retail clones suffer from critical anti-patterns:
1. **Black-box "Buy" Signals**: Labeling candidates as "BUY 94% CONFIDENCE" without mathematical attribution or disclosure of criteria.
2. **Disconnected Utility**: Scanned results are stranded; users cannot backtest the scan's exact criteria or simulate how holding those candidates would impact their current portfolio under macro stress.
3. **Hardcoded or Fabricated Data**: Simulating market breadth or fundamental metrics with fake numbers when live API feeds lack native support.

TradeFlow MVP-36 bridges this gap by establishing an **Intelligent Market Scanner & Opportunity Research Engine** that:
- Evaluates transparent, deterministic rule DSLs against real historical daily candles from `MarketDataService`.
- Strictly explains **WHY** each candidate matched (with actual indicator values vs thresholds).
- Provides dual match modes: **Strict Match** (100% of conditions) and **Near Match** (e.g. 3 of 4 conditions).
- Seamlessly converts scanner rules into Strategy Lab backtests (`StrategyModel` & `backtestEngine.js`) and sends candidate baskets into Stress Studio (`scenarioEngine.js`).
- Never outputs predictions, targets, or BUY/SELL recommendations.

---

## 2. Industry State of the Art & Comparative Analysis

| Feature / Dimension | Chartink | Trendlyne / Screener.in | TradingView Screener | Proposed TradeFlow Intelligent Scanner |
|---|---|---|---|---|
| **Core Paradigm** | Technical query builder (Atlas syntax) | Fundamental + technical composite scores | Multi-factor table filters | Deterministic JSON Rule DSL + Research Pipeline |
| **Output Semantics** | List of passing tickers | Valuation / momentum "DVM" scores | Ticker rows with filter indicators | Transparent Match Badges with actual calculated values |
| **Rule Transparency** | High (shows code) | Medium (proprietary composite formulas) | High (shows columns) | 100% Transparent: reports exact indicator value vs threshold |
| **Partial / Near Match** | No (strict boolean filter) | No | No | Yes: reports Condition Coverage (e.g., 3/4 conditions) |
| **Backtest Conversion** | Limited third-party tools | None | Separate Pine Script rewrite | **1-Click Bridge**: translates scan rules directly to Strategy Lab backtest |
| **Stress Studio Bridge** | None | None | None | **1-Click Bridge**: stresses candidate basket in MVP-34 Stress Studio |
| **Watchlist / Alert Action**| Manual watchlist | Watchlist / alert integration | Alert integration | First-class integration with `WatchlistModel` and `AlertModel` |
| **Market Breadth & Regimes**| Basic sector counts | Sector breadth & momentum | Sector filter only | Market breadth snapshot (Adv/Dec, Above SMA20/50, Sector % match) |
| **Grounded AI Explainer** | None | AI summaries (often predictive) | None | Strict partition: `OBSERVED DATA`, `MATCH EXPLANATION`, `LIMITATIONS`, `UNKNOWNS` |
| **Financial Ledger Mutation**| N/A | None | Paper trading account | **100% Immutable**: zero mutations of paper trading ledger |

---

## 3. Existing TradeFlow Architecture & Reusable Foundations

1. **Market Data Layer (`MarketDataService.js`)**:
   - Central provider router supporting TwelveData, AlphaVantage, and MockMarketDataProvider.
   - Provides daily OHLCV series via `getHistoricalData(symbol, options)` and real-time quotes via `getQuote` and `getQuotes`.
   - In-memory TTL caching and rate-limiting isolation.
2. **Strategy Research & Backtest Engine (`backtestEngine.js`)**:
   - Established deterministic technical indicator calculations: `SMA`, `EMA`, `RSI`, `PRICE_CHANGE`, `VOLUME_SMA`, `DONCHIAN_BREAKOUT`.
   - Rule evaluation algorithms and look-ahead safe execution loops.
3. **Advanced Scenario & Stress Studio (`scenarioEngine.js`)**:
   - Accepts baskets of symbols and simulates deterministic factor shocks (Sector, Index, Asset) with multiplicative combination and 100% loss attribution.
4. **Watchlist & Alerts Services (`watchlistService.js`, `alertService.js`)**:
   - User-isolated watchlist (`WatchlistModel`) and price condition alerts (`AlertModel`).
5. **Grounded AI Service (`aiAnalystService.js`)**:
   - Enforces educational, non-predictive formatting strictly bounded to supplied structured context.
6. **Market Metadata Registry (`marketMetadata.js`)**:
   - Official exchange taxonomy mapping symbols to verified sectors and peer networks without fabrication.

---

## 4. Key Gaps Addressed by MVP-36

1. **Missing Candidate Discovery**:
   - Prior to MVP-36, TradeFlow required users to know which tickers to trade, backtest, or stress-test. Users had no systematic way to discover which stocks currently meet specific technical criteria.
2. **Stranded Screeners in Industry**:
   - Most platforms force users to manually copy/paste scanned symbols into separate backtesting software or spreadsheets. TradeFlow unifies this into a single connected flow.
3. **Predictive Bias in Retail Scanners**:
   - Many apps advertise "Hot Breakout Stocks Today" or "90% Win-Rate Picks". TradeFlow enforces academic and regulatory neutrality: results are factual criteria matches, not predictions.

---

## 5. Technical Rule DSL & Calculation Formulation

### 5.1 Rule DSL Schema
The scanner employs a safe JSON AST structure, preventing any arbitrary code execution (`eval()` is strictly forbidden):
```json
{
  "conditionGroup": "AND",
  "rules": [
    {
      "indicator": "SMA",
      "period": 20,
      "operator": "GREATER_THAN",
      "compareTo": { "indicator": "SMA", "period": 50 }
    },
    {
      "indicator": "RSI",
      "period": 14,
      "operator": "GREATER_THAN",
      "threshold": 55
    },
    {
      "indicator": "VOLUME_SMA",
      "period": 20,
      "operator": "GREATER_THAN_MULTIPLE",
      "threshold": 1.2
    }
  ]
}
```

### 5.2 Mathematical Formulation of Supported Indicators
1. **Simple Moving Average (SMA)**:
   $$\text{SMA}_t(n) = \frac{1}{n} \sum_{i=0}^{n-1} C_{t-i}$$
2. **Exponential Moving Average (EMA)**:
   $$\alpha = \frac{2}{n + 1}, \quad \text{EMA}_t(n) = \alpha C_t + (1 - \alpha) \text{EMA}_{t-1}(n)$$
3. **Relative Strength Index (RSI)**:
   $$\text{RS} = \frac{\text{Wilder Avg Gain}}{\text{Wilder Avg Loss}}, \quad \text{RSI} = 100 - \frac{100}{1 + \text{RS}}$$
4. **Volume Multiple**:
   $$\text{Ratio} = \frac{V_t}{\text{SMA}_t(V, n)}$$
5. **N-Day Breakout**:
   $$\text{IsBreakout} = C_t > \max(H_{t-n}, \dots, H_{t-1})$$
6. **Relative Strength (RS)**:
   $$\Delta_{\text{symbol}} = \frac{C_{\text{symbol}, t} - C_{\text{symbol}, t-n}}{C_{\text{symbol}, t-n}} \times 100\%$$
   $$\Delta_{\text{benchmark}} = \frac{C_{\text{bench}, t} - C_{\text{bench}, t-n}}{C_{\text{bench}, t-n}} \times 100\%$$
   $$\text{Relative Difference} = \Delta_{\text{symbol}} - \Delta_{\text{benchmark}}$$

---

## 6. Methodological Protections & Risks

### 6.1 Look-Ahead & Data Freshness Protections
- All calculations evaluate closed bars or current verified quote timestamps.
- Every result discloses: Data Source (e.g., `TwelveData`, `AlphaVantage`, or `Mock`), Timestamp, and Delayed/Real-Time status.

### 6.2 Survivorship Bias Disclosure
- For index universes (e.g., NIFTY 50), the scanner reports: *"Universe reflects current index membership. Historical constituent turnover is unavailable from provider."*

### 6.3 False-Positive & Over-Fitting Mitigations
- Scanners only report mathematical matches; no quality scores or confidence ratings are invented.
- Dual match modes allow users to examine **Strict Matches** (100% coverage) alongside **Near Matches** (e.g., 3/4 rules passed), highlighting near-boundary dynamics.

### 6.4 Missing Data Handling
- If a security lacks sufficient historical bars to compute an indicator (e.g. fewer than 14 bars for RSI), the engine returns `UNAVAILABLE` rather than defaulting to 0 or inventing dummy data.
