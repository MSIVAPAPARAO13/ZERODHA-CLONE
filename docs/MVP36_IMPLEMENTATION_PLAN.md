# MVP-36 Implementation Plan: Intelligent Market Scanner & Opportunity Research Engine

## 1. Architectural Overview

MVP-36 builds the discovery layer upon TradeFlow's data, backtest, stress, and intelligence services:

```text
                  MARKET SCANNER UI (Frontend)
                             │
                             ▼
                 SCANNER REST CONTROLLER
             (/api/v1/scanners, /run, /history)
                             │
                             ▼
                   MARKET SCANNER SERVICE
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
RULE EVALUATION       MARKET BREADTH        RESULT EXPLAINER
(DSL & Indicators)   (Sector & Breadth)     (Exact Values & Why)
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             ▼
                    MARKET DATA SERVICE
                 (Quotes & Daily OHLCV)
                             │
       ┌───────────┬─────────┴─────────┬───────────┐
       ▼           ▼                   ▼           ▼
   WATCHLIST    ALERTS           STRATEGY LAB    STRESS STUDIO
  (MVP-6 API) (MVP-7 API)       (MVP-35 Engine) (MVP-34 Engine)
```

---

## 2. Scanner Model Schema (`ScannerModel.js`)

Persists user-authored scans with versioning, universe, and structured rule DSLs.

```javascript
const ConditionSchema = new Schema({
  indicator: {
    type: String,
    enum: ['SMA', 'EMA', 'RSI', 'PRICE_CHANGE', 'VOLUME_SMA', 'DONCHIAN_BREAKOUT', 'RELATIVE_STRENGTH'],
    required: true
  },
  period: { type: Number, default: 20 },
  operator: {
    type: String,
    enum: ['GREATER_THAN', 'LESS_THAN', 'CROSS_ABOVE', 'CROSS_BELOW', 'GREATER_THAN_MULTIPLE'],
    required: true
  },
  threshold: { type: Schema.Types.Mixed, default: null },
  compareTo: {
    indicator: { type: String, enum: ['SMA', 'EMA', 'PRICE', 'BENCHMARK', null] },
    period: { type: Number }
  }
}, { _id: false });

const ScannerSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  universe: { type: String, default: 'NIFTY50' }, // NIFTY50, WATCHLIST, CUSTOM
  customSymbols: { type: [String], default: [] },
  matchMode: { type: String, enum: ['STRICT', 'NEAR'], default: 'STRICT' },
  conditionGroup: { type: String, enum: ['AND', 'OR'], default: 'AND' },
  conditions: [ConditionSchema],
  version: { type: Number, default: 1 },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });
```

---

## 3. Curated Scanner Research Templates

1. **Momentum Research**:
   - `SMA(20) > SMA(50)`
   - `RSI(14) > 55`
   - `PriceChange(1) > 0`
2. **Breakout Research**:
   - `Close > 20-Day High (DONCHIAN_BREAKOUT)`
   - `Volume > 1.2x Volume SMA(20)`
3. **Trend Alignment**:
   - `Price > EMA(20)`
   - `EMA(20) > EMA(50)`
4. **Volume Expansion**:
   - `Volume > 1.5x Volume SMA(20)`
   - `PriceChange(1) > 1.0%`
5. **Oversold Mean-Reversion Research**:
   - `RSI(14) < 35`
   - `Price < SMA(20)`
6. **Relative Strength Outperformance**:
   - `RelativeStrength(20) > 0%` (Outperforming benchmark over 20 sessions)

---

## 4. Fundamental Data Availability Audit

- Current active provider credentials (TwelveData & AlphaVantage free tier / standard quote APIs) provide robust OHLCV, volume, technical indicators, and sector registries, but do NOT provide standardized corporate balance sheet ratios (PE, ROE, ROCE, Debt-to-Equity).
- **Rule of Integrity**: TradeFlow will **NOT** fabricate fake fundamental data. Technical screening is fully supported in MVP-36; fundamental scanning will display: *"Fundamental metrics: PLANNED / Requires fundamental data provider tier."*

---

## 5. Result Explanation ("Why Did This Match?")

Every scanned symbol returns a granular `ruleBreakdown` array detailing:
- Condition name & formula.
- Computed numerical value (e.g. `RSI = 61.4`, `SMA20 = ₹3,412`).
- Target comparison value (e.g. `Threshold = 55`, `SMA50 = ₹3,280`).
- Boolean pass/fail status.
- Exact statement: *"✓ SMA(20) [₹3,412.00] > SMA(50) [₹3,280.00]"*.

---

## 6. Cross-Engine Workflow Bridges

1. **Scanner $\to$ Watchlist**:
   - Calls `watchlistService.addSymbol(userId, symbol)` to append candidate directly to the user's paper trading watchlist.
2. **Scanner $\to$ Alert**:
   - Calls `alertService.createAlert(userId, symbol, condition, targetPrice)` to monitor key price trigger levels.
3. **Scanner $\to$ Strategy Lab Backtest**:
   - Converts compatible scanner rules into a `StrategyModel` configuration and immediately triggers `backtestEngine.runBacktest()`.
4. **Scanner $\to$ Stress Studio**:
   - Pipes selected candidate symbols directly into `scenarioEngine.runScenario()` to test hypothetical factor drawdowns.
5. **Scanner $\to$ Research Question**:
   - Synthesizes 5-element structured research queries connecting the scan's technical criteria with historical regime behavior.
6. **Scanner $\to$ Grounded AI**:
   - Sends deterministic scan payload to `aiAnalystService.generateAnalysis()` with strict partitioning (`OBSERVED DATA`, `MATCH EXPLANATION`, `RESEARCH INTERPRETATION`, `LIMITATIONS`, `UNKNOWNS`).

---

## 7. Performance & Rate Limiting Strategy

- Bounded universes: `NIFTY50` (50 symbols), user watchlist, or custom lists ($\le 100$ symbols).
- In-memory 5-minute TTL caching of candidate indicators and market quotes.
- Single historical retrieval per symbol satisfies all indicator evaluations (SMA, EMA, RSI, Breakout, Volume) simultaneously.

---

## 8. Verification & Test Plan (`test_mvp36.js`)

Implement minimum 39 automated tests:
1. Scanner creation & validation
2. User ownership & authorization
3. Scanner versioning increment
4. Rule DSL validation
5. SMA condition evaluation
6. EMA condition evaluation
7. RSI condition evaluation
8. Volume multiple condition evaluation
9. Breakout condition evaluation
10. Relative strength evaluation
11. Compound AND rules logic
12. Compound OR rules logic
13. Strict match mode (100% coverage)
14. Near match mode (partial condition coverage)
15. Invalid symbol handling
16. Missing data graceful handling
17. Insufficient history handling (does not default to 0)
18. Real provider retrieval via MarketDataService
19. Mock provider retrieval
20. Provider 429 rate limit isolation
21. Provider 500 server error isolation
22. In-memory cache hit verification
23. Rate-limit protection & batching
24. Scan reproducibility & SHA-256 result hashing
25. Watchlist integration bridge
26. Alert integration bridge
27. Strategy Lab conversion bridge
28. Backtest simulation execution bridge
29. Stress Studio scenario simulation bridge
30. Research question synthesis
31. Grounded AI explanation formatting
32. Multi-tenant user isolation
33. Verification of zero hardcoded results
34. Verification of zero arbitrary code execution (no eval)
35. Market breadth calculation (Advancing/Declining)
36. Sector breakdown accuracy
37. Zero financial ledger mutation verification
38. High-volume performance benchmark (10 to 100 symbols)
39. Full MVP-1 $\to$ MVP-35 regression suite verification
