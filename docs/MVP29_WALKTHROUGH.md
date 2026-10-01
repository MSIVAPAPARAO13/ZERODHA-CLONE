# MVP-29 Walkthrough: Strategy Stress Lab

## 1. Beyond Backtesting
Welcome to the Strategy Stress Lab. While the Adaptive Strategy Lab (MVP-28) told you if your strategy had historical evidence, MVP-29 tells you how easily that evidence breaks in the real world. 

## 2. The Evidence Triangle
You can now visualize your strategy's integrity across three domains: **Historical** (the backtest), **Forward** (your actual live paper trades), and **Stress** (the worst-case mathematical permutations).

## 3. Fragility Detection
With one click on "Find Weaknesses," the engine hits your strategy with increased Slippage, higher Costs, and Parameter Perturbations. It will explicitly highlight if your strategy is highly dependent on a single outlier trade, or if your max drawdown historically was purely lucky sequence grouping.

## 4. Sequence Randomization
By applying deterministic Monte Carlo randomization, TradeFlow shuffles the chronological order of your historical trades 1,000 times. It then plots the 95th percentile worst-case drawdown. If your baseline drawdown was -12% but the P95 randomization hits -35%, you now know your risk management rules need updating.
