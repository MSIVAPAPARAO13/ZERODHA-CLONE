# MVP-35 Research: Strategy Research & Backtesting 2.0

## 1. Executive Summary

Backtesting in retail platforms has historically suffered from three fatal flaws:
1. **Predictive Illusion**: Presenting historical simulation as proof of future returns ("This strategy makes 42% annually").
2. **Methodological Leakage**: Unconscious look-ahead bias (using future candle closes/highs to trigger signals), data leakage across train/test splits, and survivorship bias (testing historical strategies against today's index constituent lists).
3. **Disjointed Silos**: Treating backtesting as an isolated toy calculator completely disconnected from active portfolio holdings, macro stress scenarios, strategy playbooks, and thesis management.

TradeFlow MVP-35 transforms backtesting into a **Strategy Research Engine**. It couples deterministic historical simulation with parameter sensitivity exploration, out-of-sample walk-forward validation, regime analysis, and direct integration with MVP-34's Stress Studio and MVP-33's Thesis Review graph.

---

## 2. Industry State of the Art & Comparative Analysis

| Platform / Capability | TradingView Strategy Tester | QuantConnect / LEAN | Portfolio Visualizer | Interactive Brokers PortfolioAnalyst | Proposed TradeFlow Strategy Research 2.0 |
|---|---|---|---|---|---|
| **Core Paradigm** | Scripted charting indicator execution (Pine Script) | Event-driven C#/Python institutional backtesting | Factor-based asset allocation backtest | Performance reporting & factor attribution | Deterministic rule DSL + hypothesis-driven research workflow |
| **Execution Reality** | High bar-magnifier slippage errors; repainting risks | Deep tick-level execution; high complexity | Monthly/daily portfolio rebalancing | Historical trade analysis (post-facto) | Strict Bar $T$ signal $\to$ Bar $T+1$ execution; deterministic slippage & fees |
| **Overfitting Mitigation** | Minimal; users optimize parameters blindly | Robustness frameworks, parameter heatmaps | Basic out-of-sample splits | None (reporting only) | Built-in Overfitting Risk Warnings, Parameter Sensitivity classification, Train/Test separation |
| **Walk-Forward Analysis** | Third-party scripts only | Full rolling window optimization | None | None | First-class rolling train/test/roll forward engine |
| **Stress Studio Integration** | Completely separate | Independent risk models | Historical drawdowns only | Static stress tests | Direct integration: backtested strategy holdings feed MVP-34 Stress Studio |
| **Thesis & Research Graph** | None | Jupyter notebook research | None | None | Direct integration: backtest outcomes generate structured research questions & thesis links |
| **Ledger Isolation** | Virtual paper engine | Virtual brokerage sandbox | Static models | Live brokerage | 100% immutable isolation: zero side-effects on paper balance or holdings |

---

## 3. Existing TradeFlow Architecture & Reusable Foundations

1. **Market Data Layer (`MarketDataService`)**:
   - Central abstraction routing between `AlphaVantageProvider`, `TwelveDataProvider`, and `MockMarketDataProvider`.
   - In-memory caching, rate-limit isolation, and standard quote/historical retrieval.
2. **Strategy & Playbook Models (`PlaybookModel`, `TradeJournalModel`)**:
   - `PlaybookModel` stores user-defined strategies with rules categorized by `PLANNING`, `RISK`, `ENTRY`, `EXIT`, `JOURNAL`.
   - `TradeJournalModel` stores historical trades, execution tags, and thesis definitions (`thesis`, `targetPrice`, `riskPrice`).
3. **Market Event Cascade & Thesis Drift (`cascadeEngine.js`, `ThesisReviewModel`)**:
   - Established multi-hop relationships and structured before/after diffs for hypothesis tracking.
4. **Advanced Scenario & Stress Studio (`scenarioEngine.js`, `ScenarioModel`)**:
   - Deterministic factor shocks and portfolio loss attribution. A backtested strategy's modeled exposure can directly be stressed under hypothetical market dislocations.

---

## 4. Key Gaps Addressed by MVP-35

1. **Lack of Historical Simulation Engine**:
   - Prior to MVP-35, TradeFlow tracked live paper holdings, journaled manual trades, and ran hypothetical factor shocks on current holdings, but could not backtest systematic rule-based strategies across historical daily OHLCV series.
2. **Absence of Standard Technical Indicator Calculators**:
   - Needs deterministic, math-safe implementations of `SMA`, `EMA`, `RSI`, `PRICE_CHANGE`, `VOLUME_SMA`, and `DONCHIAN_BREAKOUT` without external heavyweight native packages.
3. **Missing Trade Simulation Ledger & Performance Metrics**:
   - Needs simulated atomic trade execution tracking cash, positions, equity curve, max drawdown, win rate, profit factor (safe when losses = 0), and benchmark comparison.
4. **Missing Research Validation Tools**:
   - Needs Parameter Grid Optimization, Parameter Sensitivity Analysis (identifying brittle cliffs vs robust plateaus), Train/Test splits, and Walk-Forward analysis.

---

## 5. Mathematical Methodology & Formulation

### 5.1 Technical Indicators

1. **Simple Moving Average (SMA)**:
   $$\text{SMA}_t(n) = \frac{1}{n} \sum_{i=0}^{n-1} C_{t-i}$$
2. **Exponential Moving Average (EMA)**:
   $$\alpha = \frac{2}{n + 1}$$
   $$\text{EMA}_t(n) = \alpha \cdot C_t + (1 - \alpha) \cdot \text{EMA}_{t-1}(n)$$
3. **Relative Strength Index (RSI)**:
   $$\text{RS} = \frac{\text{Average Gain over } n \text{ bars}}{\text{Average Loss over } n \text{ bars}}$$
   $$\text{RSI} = 100 - \frac{100}{1 + \text{RS}}$$
4. **Price Channel / Breakout**:
   $$\text{Highest High}_t(n) = \max(H_{t-n}, \dots, H_{t-1})$$
   $$\text{Lowest Low}_t(n) = \min(L_{t-n}, \dots, L_{t-1})$$

### 5.2 Signal Timing & Execution Model (Zero Look-Ahead)
- **Bar $T$ Close**: Bar $T$ completes at market close. All indicators are calculated using prices up to and including Bar $T$ close.
- **Signal Generated at $T$**: If rules evaluate to TRUE, signal is registered at $T$.
- **Execution at $T+1$ Open / Reference Price**:
  - The trade executes at Bar $T+1$ Open (or next available reference price).
  - Buy Price: $P_{\text{exec}} = P_{\text{ref}} \times (1 + \text{slippage})$
  - Sell Price: $P_{\text{exec}} = P_{\text{ref}} \times (1 - \text{slippage})$
  - Transaction Costs: $\text{Commission} = \min(\text{maxFee}, \max(\text{flatFee}, \text{Rate} \times \text{GrossValue}))$

### 5.3 Performance Metrics & Edge Cases
1. **Equity Curve**:
   $$\text{Equity}_t = \text{Cash}_t + \sum (Q_{i,t} \times C_{i,t})$$
2. **Drawdown**:
   $$\text{Peak}_t = \max_{0 \le s \le t}(\text{Equity}_s)$$
   $$\text{Drawdown}_t = \frac{\text{Equity}_t - \text{Peak}_t}{\text{Peak}_t}$$
   $$\text{Max Drawdown} = \min_{t}(\text{Drawdown}_t)$$
3. **Profit Factor**:
   $$\text{Profit Factor} = \begin{cases} \frac{\sum \text{Gross Profits}}{\sum \text{Gross Losses}} & \text{if } \sum \text{Gross Losses} > 0 \\ \text{N/A (No Losses Recorded)} & \text{if } \sum \text{Gross Losses} = 0 \text{ and } \sum \text{Gross Profits} > 0 \\ 0 & \text{if no trades} \end{cases}$$
4. **Win Rate**:
   $$\text{Win Rate} = \frac{\text{Winning Trades Count}}{\text{Total Completed Trades Count}} \times 100\%$$

---

## 6. Methodological Protections & Risks

### 6.1 Look-Ahead Bias Mitigation
- Indicator windows at bar index $k$ can only slice array $[0 \dots k]$. Any attempt to reference $k+1$ is physically prevented by the sequential event iterator.
- Signals evaluated at bar $k$ are queued for bar $k+1$ execution.

### 6.2 Data Leakage Mitigation
- Train and Test windows must satisfy: $\text{Train}_{\text{end}} < \text{Test}_{\text{start}}$.
- No information from the test dataset (mean, standard deviation, high/low range) is ever normalized or leaked into the training phase.

### 6.3 Survivorship Bias Disclosure
- Current historical data feeds utilize historical prices for specified symbols. If index constituent tracking across past years is unavailable from the provider, the system displays an explicit disclosure: *"Historical constituent membership changes are unavailable for this benchmark. Results reflect survivorship of currently listed assets."*

### 6.4 Overfitting Risk Disclosure
- Running multi-parameter grid searches increases the likelihood of finding spurious random correlations. TradeFlow provides an **Overfitting Risk Gauge** and requires sensitivity verification (checking if neighboring parameters also yield positive results or collapse into steep drawdowns).

---

## 7. Strategic Differentiation

TradeFlow Strategy Research 2.0 is not a disconnected script tester:
1. **Connected Research Lifecycle**: A strategy tested in Strategy Lab connects directly to Playbooks (`PlaybookModel`), Thesis tracking (`TradeJournalModel`), Scenario Stress Studio (`scenarioEngine.js`), and Grounded AI synthesis (`aiAnalystService.js`).
2. **Grounded AI Integration**: Explains backtest results strictly partitioned into `OBSERVED DATA`, `DERIVED METRICS`, `RESEARCH INTERPRETATION`, `LIMITATIONS`, and `UNKNOWNS` without predicting future returns or issuing BUY/SELL recommendations.
3. **Zero Financial Mutation**: Strict simulation sandbox where paper account balances, positions, and live orders remain completely immutable.
