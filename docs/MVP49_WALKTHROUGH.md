# MVP-49 Walkthrough — Trading Journal Intelligence

## Overview
MVP-49 upgrades TradeFlow's trading journal from basic text notes into **structured learning data** backed by deterministic rule-based pattern detection.

## Structured Journal Entry Fields
- `symbol`, `side`, `quantity`, `entryPrice`
- `setup`: Named setup (e.g. Breakout, Reversion)
- `thesis`: Structured rationale
- `evidence`: Bulleted market proof points
- `emotion`: Self-recorded trader state (`DISCIPLINED`, `FOMO`, `ANXIOUS`, `CONFIDENT`, `FRUSTRATED`, `NEUTRAL`)
- `mistake`: Self-identified execution errors
- `executionNote`: Order routing and timing details
- `result`: `{ pnl, pnlPercent, exitPrice, exitDate, status }`
- `lesson`: Empirical takeaway
- `isEarlyExit`: Flag marking exit before target review date

## Deterministic Rule-Based Pattern Detection
- Repeated early exits before target review date
- Frequent trades clustered in the same symbol (>= 3 trades)
- Repeated setup failures (win rate < 35% on specific setups)
- Trades without linked thesis
- Trades without research session evidence

## Guardrails
- **Zero Psychological or Mental Health Diagnosis**: Outputs strictly describe system logs and empirical behaviors without psychoanalyzing the user.
- **Explicit Disclaimer**: `"EMPIRICAL_JOURNAL_PATTERN — OBSERVED SYSTEM LOGS, NOT A PSYCHOLOGICAL OR FINANCIAL DIAGNOSIS"`.
- **Zero Financial Ledger Mutation**: Completely decoupled from real cash and orders.
