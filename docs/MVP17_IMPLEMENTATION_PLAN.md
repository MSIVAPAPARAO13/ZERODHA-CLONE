# MVP-17: Trade Outcome Lab Implementation Plan

## 1. Problem
Traders need to understand the outcome of their execution choices (the gap between their Plan, Actual execution, and the historical path the market took post-execution) without judgmental "hindsight scores."

## 2. Architecture
Introduce `tradeOutcomeLabService` which aggregates `TradePlan`, `Order`, `Transactions`, and `marketDataService` historical candles to produce a factual summary.

## 3. Outcome Analysis
Calculates R-Multiple (realized P&L / planned risk), target capture rate (did price reach target post-exit?), and holding duration.

## 4. Deviation Analysis
Aggregates trades *with* quantity deviation vs trades *without* quantity deviation to show differences in historical win rate, average P&L, and R.

## 5. Sample Size Guardrail
All historical comparisons display `n` count. Behavioral Edge pattern recognition is disabled for sample sizes `< 5`.

## 6. Integrations
- Replay overlaid with target/stop/actuals.
- Post-trade Journal displays Outcome Lab.

## 7. Security
All `trade-outcomes` endpoints secured by `req.user.userId`.
