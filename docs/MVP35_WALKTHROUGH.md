# MVP-35 Walkthrough: Strategy Research & Backtesting 2.0

## 1. Executive Summary

MVP-35 delivers TradeFlow's **Strategy Research & Backtesting 2.0** engine. Rather than acting as a simple retrospective profit/loss calculator, TradeFlow establishes a disciplined, scientific research environment:

> **"Allow a user to define a transparent trading strategy, test it against verified historical data, understand exactly why it performed as it did, compare variations, and convert the result into structured research evidence."**

The system enforces strict look-ahead protection (signals detected at Bar $T$ close execute at Bar $T+1$ open), realistic transaction fees and slippage models, parameter sensitivity scoring to combat curve-fitting, out-of-sample walk-forward validation, and seamless cross-engine bridges to MVP-34's Stress Studio and MVP-33's Thesis Review graph.

---

## 2. Interview Demo Flow (Exact Step-by-Step)

Follow this exact flow to demonstrate the core capabilities to an interviewer:

### Step 1: Open Strategy Lab
1. In the navigation bar, click on **🧪 Strategy Lab** (or click **Open Lab →** on the dashboard home banner).
2. The Strategy Research workspace loads with curated presets, strategy configurations, and performance panels.

### Step 2: Select or Create Strategy ("Momentum Moving Average Breakout v1")
1. In the **Strategy Configuration** sidebar, select **Momentum Moving Average Breakout**.
2. Rules definition:
   - **Entry**: 10-day SMA crosses above 30-day SMA.
   - **Exit**: 10-day SMA crosses below 30-day SMA OR Stop Loss of 5%.
   - **Position Sizing**: 20% of available simulated equity per position.
   - **Modeled Slippage**: 0.10% per transaction.
   - **Brokerage & Fees**: ₹20 flat fee + 0.03% turnover brokerage.

### Step 3: Set Simulation Parameters & Universe
1. Initial Capital: **₹100,000**.
2. Universe: Check **TCS**, **INFY**, and **RELIANCE**.
3. Benchmark: **NIFTY 50**.

### Step 4: Run Historical Backtest
1. Click **⚡ RUN HISTORICAL BACKTEST**.
2. Notice the simulation executes deterministically in sub-millisecond calculation time:
   - **Net Return**: Shows exact cumulative percentage and ₹ net profit.
   - **Benchmark Comparison**: Shows NIFTY 50 buy-and-hold return and Alpha difference.
   - **Maximum Drawdown**: Measures peak-to-trough decline and duration in days.
   - **Win Rate & Profit Factor**: Displays win/loss trade count ratio and gross profit-to-loss factor (safely handles zero-loss edge cases).

### Step 5: Inspect Interactive Equity Curve
1. Observe the **Simulated Equity Curve vs Benchmark** chart:
   - Blue line represents strategy equity.
   - Gray dashed line represents benchmark performance.
   - Reproducibility SHA-256 fingerprint is displayed in the header.

### Step 6: Audit the Trade Execution Ledger
1. Scroll down to the **Trade Execution Ledger**:
   - Every closed trade reports: Trade ID, Symbol, Entry Date, Exit Date, Entry Price, Exit Price, Quantity, Fees, Net P&L, Return %, and Exit Reason (`SIGNAL`, `STOP_LOSS`, or `TAKE_PROFIT`).
   - Demonstrates zero look-ahead bias: entries occurred on the morning after the signal date.

### Step 7: Explore Parameter Lab & Sensitivity
1. Switch to the **🔍 Parameter Lab & Sensitivity** tab.
2. Parameter grid inputs:
   - Fast SMA: `10, 20`
   - Slow SMA: `30, 50`
3. Click **⚡ RUN GRID EXPERIMENT**.
4. Observe the results:
   - **Parameter Sensitivity Score**: Classified as `LOW`, `MEDIUM`, or `HIGH` based on return standard deviation across adjacent parameter sets.
   - **Overfitting Warning Alert**: Warns that extensive curve-fitting increases data-snooping risks.
   - Grid table displays Return, Max Drawdown, Win Rate, and Profit Factor per combination without artificially labeling any row as "Best".

### Step 8: Run Out-of-Sample Split Validation
1. Switch to the **⏱️ Out-of-Sample / Walk-Forward** tab.
2. Set In-Sample Train window: `2023-01-01` to `2024-06-30`.
3. Set Out-of-Sample Test window: `2024-07-01` to `2025-12-31`.
4. Click **⚡ TEST OUT-OF-SAMPLE**.
5. Observe side-by-side metric cards:
   - In-Sample return vs Out-of-Sample return.
   - Evaluates performance degradation and provides structured research commentary.

### Step 9: Bridge to Stress Studio
1. Click **🎯 Stress Test Strategy Exposure**.
2. The backtest engine pipes the strategy's universe into MVP-34's Scenario Stress Studio:
   - Simulates hypothetical **IT Sector Correction (-15%)**.
   - Output: *"Strategy-linked holdings account for XX% of modeled portfolio impact under this defined scenario."*
   - Shows the interviewer how strategy research directly informs stress testing.

### Step 10: Create Grounded Research Question
1. Click **🔬 Create Research Question**.
2. The engine synthesizes a structured research query for the Research Engine:
   > *"What structural market regimes caused Momentum Moving Average Breakout to experience its maximum drawdown of -X%, and does the historical win rate of Y% persist during trend transitions?"*

### Step 11: Generate Grounded AI Analysis
1. Click **✨ Explain with Grounded AI**.
2. The AI review appears strictly partitioned into:
   - **OBSERVED DATA**: Identifies strategy rules, test dates, universe, and capital.
   - **DERIVED METRICS**: Reports exact historical returns, win rate, and profit factor.
   - **RESEARCH INTERPRETATION**: Discusses regime variations and risk-to-reward asymmetry.
   - **LIMITATIONS**: Notes survivorship assumptions and execution models.
   - **UNKNOWNS**: Explicitly emphasizes that past simulation does not guarantee future results.
   - **Zero BUY/SELL advice**: Strict compliance with educational non-predictive guidelines.

### Step 12: Verify Zero Financial Ledger Side Effects
1. Navigate back to **Holdings**, **Positions**, or **Funds**.
2. Point out to the interviewer:
   - `virtualBalance` is 100% unchanged.
   - Zero live paper orders were submitted.
   - The entire backtest operates in an immutable simulation ledger.
