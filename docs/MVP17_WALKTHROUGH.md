# MVP-17 Walkthrough: Trade Outcome Lab

## 1. Problem
TradeFlow needed a way to separate "execution quality" from "trade result", mapping the historical consequence of a trader's deviations without claiming what they *should* have done.

## 2. The Outcome Lab
After an execution is completed and reconciled, the `tradeOutcomeLabService` calculates final realized P&L, R-Multiple (based on planned risk), and checks the post-entry historical market path.

## 3. Target and Post-Entry Path Analysis
If a user planned a target of $100, exited at $95, and the market later reached $105, Outcome Lab flags "TARGET_REACHED_AFTER_EXIT" as an observation, explicitly NOT calling it a "mistake" or "missed profit".

## 4. Deviation Correlation
The Lab aggregates trades with deviations against trades without deviations (e.g. "12 trades with entry slippage had a 40% win rate; 30 trades without had a 60% win rate"). Sample sizes are explicitly disclosed.

## 5. Replay Integration
MVP-10 Replay is enriched to draw horizontal lines for Planned Entry, Actual Entry, Stop, and Target, making the gap visually obvious on the timeline.

## 6. AI Role
AI receives the mathematical facts and provides simple, emotionless plain-english summaries ("Across 8 trades, 5 reached target after you exited.").

## 7. Limitations
Historical candle availability depends heavily on the configured `marketDataService` provider. If a provider lacks tick/intraday historical data, the post-entry path defaults to `NOT_AVAILABLE`.
