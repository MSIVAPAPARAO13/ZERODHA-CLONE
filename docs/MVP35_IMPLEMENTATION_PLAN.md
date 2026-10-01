# MVP-35 Implementation Plan: Strategy Research & Backtesting 2.0

## 1. Architectural Overview

MVP-35 builds the Strategy Research & Backtesting 2.0 layer upon TradeFlow's existing data and intelligence services:

```text
                  STRATEGY LAB UI (Frontend)
                             │
                             ▼
                 BACKTEST REST CONTROLLERS
          (/api/v1/strategies, /api/v1/backtests)
                             │
                             ▼
                   BACKTEST ENGINE SERVICE
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
SIGNAL GENERATOR      SIMULATION LEDGER     EXPERIMENT RUNNER
(Indicators & DSL)    (Cash, Trades, DD)    (Grid, Walk-Forward)
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             ▼
                    MARKET DATA SERVICE
                 (Historical Daily OHLCV)
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
SCENARIO STRESS      PLAYBOOK / THESIS      GROUNDED AI
(MVP-34 Engine)     (MVP-33 / Journal)      (Research Explainer)
```

---

## 2. Strategy Definition & Model (`StrategyModel.js`)

A strategy must be versioned, transparent, and reproducible without arbitrary code execution (`eval` is strictly forbidden).

### 2.1 Model Schema
```javascript
const StrategySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  version: { type: Number, default: 1 },
  universe: { type: [String], default: ['NIFTY50'] },
  benchmark: { type: String, default: 'NIFTY50' },
  initialCapital: { type: Number, default: 100000, min: 1000 },
  positionSizing: {
    type: { type: String, enum: ['PERCENT_EQUITY', 'FIXED_AMOUNT', 'FIXED_QUANTITY'], default: 'PERCENT_EQUITY' },
    value: { type: Number, default: 10 } // e.g. 10%
  },
  costs: {
    brokerageRate: { type: Number, default: 0.0003 }, // 0.03%
    flatFeePerTrade: { type: Number, default: 20 },   // ₹20
    slippageRate: { type: Number, default: 0.001 }    // 0.1%
  },
  entryRules: [{
    indicator: { type: String, enum: ['SMA', 'EMA', 'RSI', 'PRICE_CHANGE', 'VOLUME_SMA', 'DONCHIAN_BREAKOUT'] },
    params: { type: Schema.Types.Mixed }, // e.g. { period: 20, slowPeriod: 50 }
    condition: { type: String, enum: ['CROSS_ABOVE', 'CROSS_BELOW', 'GREATER_THAN', 'LESS_THAN'] },
    threshold: { type: Schema.Types.Mixed }
  }],
  exitRules: [{
    type: { type: String, enum: ['SIGNAL', 'STOP_LOSS', 'TAKE_PROFIT', 'MAX_HOLDING_DAYS'] },
    indicator: { type: String },
    params: { type: Schema.Types.Mixed },
    condition: { type: String },
    threshold: { type: Schema.Types.Mixed }
  }],
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });
```

---

## 3. Technical Indicator & Signal DSL Engine

Indicators must be computed deterministically from normalized chronological daily OHLCV bars:
- `SMA(period)`: Simple Moving Average.
- `EMA(period)`: Exponential Moving Average with smoothing multiplier $\alpha = 2 / (n + 1)$.
- `RSI(period)`: 14-period standard Relative Strength Index.
- `PRICE_CHANGE(period)`: Percentage return over $n$ bars.
- `VOLUME_SMA(period)`: Volume average over $n$ bars.
- `DONCHIAN_BREAKOUT(period)`: Highest high and lowest low channels over $n$ prior bars.

### Signal Rules Evaluation
At bar index $t$:
- Indicators are calculated strictly up to bar $t$.
- Entry Rule evaluates to TRUE only if all composed conditions match (AND logic).
- Exit Rule triggers on indicator condition, or if $P_t \le P_{\text{entry}} \times (1 - \text{stopLoss})$, or if $P_t \ge P_{\text{entry}} \times (1 + \text{takeProfit})$, or if holding duration exceeds `maxHoldingDays`.

---

## 4. Simulation Ledger & Execution Logic

### 4.1 Chronological Simulation Loop
1. **Initialize**: $\text{Cash} = \text{initialCapital}$, $\text{Positions} = \{\}$, $\text{Equity} = \text{initialCapital}$, $\text{Trades} = []$.
2. **For each bar $t$ from $0$ to $N-1$**:
   - Check open positions for Exits (Stop Loss, Take Profit, Exit Signals).
   - If exit triggers:
     - Sell at $P_{\text{exec}} = P_{\text{bar}} \times (1 - \text{slippage})$.
     - Deduct costs: $\text{Fee} = \text{flatFee} + (\text{brokerageRate} \times \text{GrossValue})$.
     - Update Cash, close trade record, record P&L, return %, and holding period.
   - Check entry signals for symbols with available cash:
     - Calculate position size according to methodology.
     - Check if $\text{Available Cash} \ge \text{Allocated Value}$. If insufficient, reject or downsize according to rule; never borrow.
     - Buy at $P_{\text{exec}} = P_{\text{bar}} \times (1 + \text{slippage})$.
     - Deduct fee. Update Cash and open position record.
   - Compute bar $t$ mark-to-market equity: $\text{Equity}_t = \text{Cash}_t + \sum (Q_i \times P_{i,t})$.
   - Compute current drawdown from peak equity.
   - Record equity point for Equity Curve.

### 4.2 Metrics Calculation
- Net Profit, Total Return %, Benchmark Return %, Alpha difference.
- Maximum Drawdown % and Peak-to-Trough duration.
- Total Trades, Winning Trades, Losing Trades, Win Rate %.
- Gross Profits, Gross Losses, Profit Factor (returns `"N/A"` if gross loss is 0).
- Average Winner, Average Loser, Largest Winner, Largest Loser.

---

## 5. Parameter Optimization, Train/Test & Walk-Forward

### 5.1 Parameter Experiments
- Evaluate grid combinations (e.g. Fast SMA $\in \{10, 20, 30\}$, Slow SMA $\in \{50, 100, 200\}$).
- Measure Return, Max Drawdown, Win Rate, and Profit Factor for each combination.
- Compute **Parameter Sensitivity**: Measures standard deviation of performance across adjacent parameter sets (Low, Medium, High).
- Display **Overfitting Risk Disclosure** prominently.

### 5.2 Train / Test Split
- User defines Train window (e.g. 2020-01-01 to 2023-12-31) and Out-of-Sample Test window (e.g. 2024-01-01 to 2026-01-01).
- Enforces strict boundary: $\text{Train}_{\text{end}} < \text{Test}_{\text{start}}$.
- Compares in-sample vs out-of-sample metrics side-by-side.

### 5.3 Walk-Forward Mode
- Rolling window optimization:
  - Phase 1: Train on Window 1 $\to$ Test on Window 2 $\to$ Roll forward by step.
  - Phase 2: Aggregate out-of-sample performance segments into unified walk-forward curve.

---

## 6. Integration with Stress Studio & Theses

- **Stress Studio Link**: Holding symbols traded by the strategy can be piped directly into `scenarioEngine.js` to assess how the strategy's current or target allocation behaves under hypothetical factor shocks (e.g. IT -15%, NIFTY -10%).
- **Thesis & Research Question**: Automatically synthesize structured research questions linked to `TradeJournalModel` or `PlaybookModel`:
  > *"Why did [Strategy Name] experience its largest drawdown of [X%] during [Period], and does the historical evidence support the thesis under high volatility?"*

---

## 7. Grounded AI Research Explainer

Structured payload sent to `aiAnalystService.js`:
- `OBSERVED DATA`: Strategy rules, historical dates, initial capital, transaction cost model.
- `DERIVED METRICS`: Net return, max drawdown, win rate, profit factor, benchmark comparison.
- `RESEARCH INTERPRETATION`: Behavior during drawdowns and regime characteristics.
- `LIMITATIONS`: Data timeframe, unadjusted/adjusted assumptions, survivorship limitations.
- `UNKNOWNS`: Explicit statement that past returns do not predict future performance.

---

## 8. API Specification

- `GET /api/v1/strategies` — List user strategies and curated presets.
- `POST /api/v1/strategies` — Create/version strategy.
- `GET /api/v1/strategies/:id` — Get strategy definition.
- `PATCH /api/v1/strategies/:id` — Update strategy definition.
- `DELETE /api/v1/strategies/:id` — Archive strategy.
- `POST /api/v1/backtests/run` — Run single historical backtest.
- `POST /api/v1/backtests/optimize` — Run parameter experiment grid.
- `POST /api/v1/backtests/split-test` — Run train/test out-of-sample backtest.
- `POST /api/v1/backtests/walk-forward` — Run rolling walk-forward analysis.
- `POST /api/v1/backtests/compare` — Compare two or more strategies side-by-side.
- `POST /api/v1/backtests/explain` — Grounded AI research analysis.

---

## 9. Verification & Test Plan

Create `backend/test_mvp35.js` with minimum 32 test cases:
1. Strategy creation & validation
2. Strategy ownership & user isolation
3. Strategy versioning increment
4. Historical data retrieval & normalization
5. Indicator calculations (SMA, EMA, RSI, Breakout)
6. Entry signal evaluation
7. Exit signal evaluation
8. Position sizing (Percent equity, fixed amount, fixed qty)
9. Cash simulation & zero borrowing
10. Transaction costs calculation
11. Slippage calculation
12. Trade ledger auditability
13. Equity curve generation
14. Drawdown calculation & peak tracking
15. Benchmark return comparison
16. Profit factor edge cases (no losses = N/A)
17. Multiple symbol positions handling
18. Partial exits / stop loss / take profit
19. Insufficient cash rejection
20. Look-ahead protection (Bar T signal $\to$ Bar T+1 execution)
21. Data leakage prevention in train/test
22. Train/Test out-of-sample performance separation
23. Parameter grid exploration
24. Parameter sensitivity scoring
25. Overfitting warning generation
26. Walk-forward rolling execution
27. Reproducibility & result hashing
28. Provider failure isolation & graceful handling
29. Multi-tenant security & authorization
30. Zero financial ledger mutation verification
31. Grounded AI research explainer formatting
32. High-volume performance benchmark (1 to 100 symbols)
