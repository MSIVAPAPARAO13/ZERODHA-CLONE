# MVP-36 WALKTHROUGH — TRADEFLOW INTELLIGENT MARKET SCANNER & OPPORTUNITY RESEARCH ENGINE

## 1. Executive Summary

TradeFlow MVP-36 adds the missing **Discovery & Opportunity Research Layer** to TradeFlow's analytical platform.

Unlike retail stock-picking screeners or signal-selling services that output arbitrary "BUY/SELL" recommendations with proprietary black-box "scores," TradeFlow's Market Scanner is built on **transparent research evidence, deterministic AST-based rule evaluation, zero look-ahead bias, strict data freshness auditability, and immediate multi-engine workflow bridges**.

The discovery pipeline operates as:
```text
DISCOVER (Market Scanner)
      ↓
EXPLAIN (Deterministic Rule Evidence & Grounded AI)
      ↓
VALIDATE (Strategy Lab Historical Backtest)
      ↓
STRESS (Stress Studio Multi-Factor Drawdown)
      ↓
RESEARCH (Thesis Links & Factor Hypothesis Generation)
      ↓
PAPER TRADE (Existing Paper Trading Engine)
```

---

## 2. Interactive Interview Walkthrough Demo

### Step 1: Open Market Scanner
1. Navigate to the TradeFlow dashboard at `http://localhost:3000/`.
2. Notice the new quick discovery banner on the Summary screen:
   `🔍 Intelligent Market Scanner & Opportunity Discovery — Open Scanner →`
3. Click the banner or click `🔍 Scanner` on the navigation bar (`/scanner`).

### Step 2: Select Universe & Curated Research Preset
1. On the left sidebar, review the 6 curated research presets:
   - **Momentum Research**: `SMA(20) > SMA(50)`, `RSI(14) > 55`, `Volume > 1.2x Volume SMA(20)`.
   - **Trend Alignment**: `EMA(20) > EMA(50)`, `Price Change (1D) > 0%`.
   - **Breakout Research**: `Price > 20D High (Donchian)`, `Volume > 1.2x`.
   - **Volume Expansion**: `Volume > 1.5x Volume SMA(20)`.
   - **Oversold Research**: `RSI(14) < 35`, `Price Change (5D) < -2%`.
   - **Relative Strength**: `20-Day Performance vs NIFTY50 Benchmark > 0%`.
2. Click **Momentum Research**. Notice how the condition builder automatically populates the structured conditions.
3. Select universe: **NIFTY 50 Benchmark Universe**.
4. Set match strictness: **Strict (100% Conditions Must Match)**.

### Step 3: Run Market Scan
1. Click **▶ Run Market Scan**.
2. Notice execution feedback:
   - Evaluates the universe symbols in parallel using cached `MarketDataService` daily OHLCV series.
   - Computes technical indicators simultaneously in a single historical pass without redundant API calls.
   - Shows real-time metadata:
     - `Matched: X / 50`
     - `Data Provider: TwelveData / Mock`
     - `As of: [Timestamp]`
     - `Latency: < 2ms`
3. Review the **Market Breadth Snapshot** banner:
   - Advancing: count
   - Declining: count
   - Above SMA 20: count
   - Above SMA 50: count
   - Total Evaluated: count

### Step 4: Inspect Transparent Match Evidence ("Why Did This Match?")
1. Look at the candidate research table. Notice columns: `Symbol`, `Sector`, `Latest Price`, `Match Score (e.g. 3/3 (100%))`, `RSI(14)`, `Trend Alignment`, `Volume Multiple`, and `Actions`.
2. Click the **Why?** button next to `TCS`.
3. The **Research Evidence Drawer** slides out from the right:
   - Exact condition verification breakdown:
     - `✓ SMA(20) [3412.00] > SMA(50) [3280.00]`
     - `✓ RSI [61.4] > 55.0`
     - `✓ Volume [1.42x Avg] > 1.2x Baseline`
   - Notice that every number is the actual indicator value calculated from real market OHLCV bars.
   - Notice the **Data Audit & Reproducibility Panel**:
     - Provider Tier: `MarketDataService` / `TwelveData`
     - Bars Analyzed: `252 Daily Sessions`
     - Latest Bar Timestamp: Verified
     - Result Hash: `bb3cb7686654b3a6` (fully reproducible deterministic audit hash)
     - Fundamental Status: `PLANNED / Requires Fundamental Provider Tier` (no fabricated PE/ROE).

### Step 5: Bridge Candidate to Watchlist & Alert
1. In the Research Drawer, click **+ Add to Watchlist**.
   - Reuses existing `watchlistService.addSymbol('TCS')`.
   - Toast notification: `Added TCS to your research watchlist.`
2. Click **Create Alert**.
   - Reuses existing `alertService.createAlert(...)` setting target price 2% above current price.
   - Toast notification: `Alert created: TCS above ₹3,480`.

### Step 6: Bridge to Strategy Lab ("Backtest This Scan")
1. At the top of the Results table or in the Action bar, click **🧪 Backtest This Scan**.
2. TradeFlow translates the scanner's active rule AST into a `StrategyModel` configuration and sends it directly to `backtestEngine.js`:
   - Fast SMA: 20
   - Slow SMA: 50
   - Entry Rules: Transferred directly from scan
   - Sizing: 20% equity
   - Initial Capital: ₹1,00,000
3. A modal opens with the historical backtest results:
   - Cumulative Return % vs Benchmark Return
   - Max Drawdown
   - Trade count & Profit Factor
   - Complete Trade Ledger with simulated entry/exit executions, slippage, and brokerage costs.
4. No duplicate backtesting engine was created; architecture cleanly reuses MVP-35.

### Step 7: Bridge to Stress Studio ("Stress Selected")
1. Select candidate assets (e.g. `TCS`, `INFY`).
2. Click **🎯 Stress Top Basket**.
3. TradeFlow bridges the candidate basket into `scenarioEngine.js` under the `IT Sector Correction` (-15% shock) preset.
4. A Stress Studio modal opens:
   - Modeled candidate basket drawdown (e.g. -₹11,980.50).
   - Loss attribution breakdown by candidate asset.
   - Clear statement: `Selected candidate basket (TCS, INFY) contributes ₹-11,980.50 to modeled scenario drawdown.`

### Step 8: Formulate Empirical Research Hypothesis
1. Click **🔬 Research Question**.
2. TradeFlow's research question synthesizer generates a structured 5-part research query:
   - `"What structural factor characteristics unite the securities matching Momentum Research, and how did candidates perform historically following similar technical alignment?"`
   - Links discovery to existing thesis and playbook reviews.

### Step 9: Grounded AI Explanation
1. Click **✨ AI Explainer**.
2. The AI Explainer responds with strictly partitioned research sections:
   - **OBSERVED DATA**: Market breadth, candidate counts, provider tier.
   - **DETERMINISTIC MATCH EVIDENCE**: Exact condition thresholds passed.
   - **RESEARCH INTERPRETATION**: Factual technical context without forecasting.
   - **LIMITATIONS & UNKNOWNS**: Clear disclosure of historical survivorship, absence of fundamental balance sheet data, and execution risks.
   - **Zero stock tips, buy/sell ratings, or target price predictions**.

### Step 10: Zero Real-Ledger Mutation Verification
1. Open the Orders and Positions pages.
2. Confirm that `virtualBalance`, real/paper orders, holdings, and portfolio ledgers remain 100% immutable throughout all scanning, backtesting, and stress testing.

---

## 3. Product Positioning & Interview Narrative

When asked:
> *"Your project started as a Zerodha clone. What's actually new?"*

The answer:
> *"The original application was a simple trading interface. I evolved it into an integrated quantitative research and paper-trading platform. TradeFlow now connects market data providers, rule-based discovery scanning, strategy backtesting with walk-forward validation, multi-factor stress testing, corporate event impact cascades, and grounded AI decision support into a cohesive analytical workflow."*
