# MVP-34 Walkthrough: TradeFlow Advanced Scenario & Stress Studio

## 1. Executive Summary

MVP-34 delivers TradeFlow's **Advanced Scenario & Stress Studio**. While MVP-33 solved the multi-hop propagation of external market catalysts through relationship graphs, MVP-34 answers the critical risk question:

> *"What would happen to my current paper-trading portfolio if a specific market, sector, asset, or macro scenario occurred?"*

Stress testing in TradeFlow is explicitly a **scenario-analysis and stress-testing system, NOT a prediction engine**. It evaluates drawdown magnitude under defined hypothetical conditions rather than assigning false probabilities or predicting future prices.

---

## 2. Interview Demo Flow (Exact Step-by-Step)

Follow this exact walkthrough to demonstrate the core capability to an interviewer:

### Step 1: Open Stress Studio
1. In the navigation bar, click on **🎯 Stress Studio** (or click **Open Studio →** on the dashboard home banner).
2. The **Stress Studio** interface loads with the Scenario Builder, Impact Dashboard, Strategy Exposure, and Thesis Links.

### Step 2: Show Baseline Portfolio
1. Observe the **Baseline Portfolio Value** card in the dashboard:
   - Baseline Value: **₹100,000** (or user's current live paper portfolio value).
   - Holdings count, timestamp, and snapshot hash are deterministically recorded.

### Step 3: Select or Build "IT Sector Correction"
1. In the **Curated Presets** tab, select **IT Sector Correction** (or use Custom Builder).
2. Shocks configured:
   - Target: `IT` (Sector)
   - Magnitude: `-15.0%`
   - Horizon: `1 Day`
   - Severity: `SEVERE`

### Step 4: Run Scenario
1. Click **⚡ RUN SCENARIO**.
2. Notice the simulation executes deterministically in sub-millisecond calculation time:
   - **Modeled Portfolio Value**: ₹91,750 (example based on ₹100,000 baseline with IT exposure)
   - **Modeled Impact**: -₹8,250 (-8.25%)
   - **Severity**: SEVERE

### Step 5: Inspect Top Loss Contributors & Offsets
1. Observe the **📉 Top Loss Contributors** widget:
   - **TCS**: Modeled loss: -₹3,200 (38.8% of loss)
   - **INFY**: Modeled loss: -₹2,100 (25.5% of loss)
   - **WIPRO**: Modeled loss: -₹1,100 (13.3% of loss)
2. Observe the **📈 Offsetting Positions** widget:
   - **RELIANCE**: +₹650 (positive or zero-drag unshocked asset)

### Step 6: Click Holding Row to Inspect Drilldown
1. Click on the **TCS** row in the Holding-Level Attribution Table.
2. The **Holding Inspector Drawer** slides open:
   - **Reference Price**: Live quote from `MarketDataService` (e.g. ₹3,450.00)
   - **Scenario Price**: ₹2,932.50 (-15%)
   - **Baseline Value**: ₹30,000
   - **Scenario Value**: ₹25,500
   - **Absolute Impact**: -₹4,500
   - **Loss Contribution**: 54.5%
   - **Applied Shocks**: IT Sector (-15%)

### Step 7: Inspect Strategy Impact Panel
1. Look at the **Strategy Exposure Under Scenario** panel:
   - **Momentum Breakout v3**: 48% exposure
   - Label explicitly states: *"Strategy-linked holdings account for 48% of modeled portfolio impact."*
   - Explains clearly: Does NOT say "strategy will fail", only reports mapped exposure.

### Step 8: Inspect Related Theses
1. Look at the **Related Theses** panel:
   - **IT Growth Continuation Thesis**: Affected holdings: `TCS`, `INFY`.
   - **Scenario Status**: `SCENARIO REQUIRES REVIEW`
   - Thesis state is NOT mutated automatically, preserving human-in-the-loop review.

### Step 9: Click "View Methodology"
1. Click the **📐 View Methodology** button in the header.
2. The transparency modal displays:
   - **Engine Version**: `1.0.0-mvp34-deterministic`
   - **Combination Formula**: $S_{\text{combined}} = (1 + S_{\text{market}}) \times (1 + S_{\text{sector}}) \times (1 + S_{\text{asset}}) - 1$
   - **Market Data Source**: `MarketDataService (NSE/BSE Quotes & Cache)`
   - **Portfolio Snapshot Hash**: SHA-256 fingerprint of current ledger state
   - **Look-Ahead Window**: Strict $T_{\text{snapshot}} \le T_{\text{asOf}}$ enforcement
   - **Double-Counting Protection**: Multiplicative chaining eliminates additive inflation.

### Step 10: Create Research Question
1. Click the **🔬 Create Research Question** button.
2. The system auto-synthesizes a grounded research query and routes to the Research Engine:
   > *"Which holdings contribute most to the portfolio's modeled downside under an IT Sector Correction?"*

### Step 11: Compare Scenarios (Side-by-Side Matrix)
1. Switch to the **Compare Scenarios** tab.
2. Select **IT Sector Correction (-15%)** and **NIFTY 50 Correction (-10%)**.
3. Click **📊 Compare Scenarios**:
   - Compares: Current Portfolio vs IT -15% vs NIFTY -10%
   - Displays Portfolio Value, Total Impact, Impact %, and Largest Drag asset per column.

### Step 12: Verify Zero Financial Ledger Side Effects
1. Navigate back to **Holdings**, **Positions**, or **Funds**.
2. Point out to the interviewer:
   - `virtualBalance` is unchanged.
   - Zero orders or transactions were submitted.
   - All scenario outcomes are purely hypothetical simulations.

---

## 3. What-If Position Simulator

The studio also includes a position simulator:
1. In the builder, expand **What-If Position Simulation (Hypothetical)**.
2. Add a hypothetical position:
   - Symbol: `RELIANCE`
   - Action: `ADD`
   - Quantity: `20`
   - Price: `₹2,950`
3. Run the scenario:
   - The UI displays side-by-side **Before vs After** metrics:
     - New Portfolio Value
     - Simulated Cash Impact
     - New Scenario Impact
     - Concentration Shift
   - Zero live trades are placed.

---

## 4. Grounded AI Explainer

Clicking **✨ Explain with Grounded AI** generates a strictly bounded, non-predictive summary:
- **OBSERVED DATA**: Identifies user's exact holdings and verified sectors.
- **HYPOTHETICAL INPUT**: Recaps user's shock parameters.
- **DERIVED CALCULATION**: Quantifies the calculated loss and top contributors.
- **UNKNOWNS**: Explicitly notes that the scenario does not predict market events and correlations may vary in live trading.
- **NO PREDICTIONS / NO BUY-SELL**: Adheres strictly to FINRA/SEBI educational guidelines.
