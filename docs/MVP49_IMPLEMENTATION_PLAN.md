# MVP-49 Implementation Plan — Trading Journal Intelligence

## Objective
Upgrade the trading journal from unstructured notes into structured empirical learning data with deterministic, rule-based pattern detection.
Guaranteed zero psychological or mental health diagnosis.

## Data Schema Extensions (`TradeJournalModel.js`)
- `setup`: e.g. "20-Day Breakout", "Mean Reversion Oversold"
- `thesis`: Core reasoning for trade
- `evidence`: Array of verifiable market evidence items
- `emotion`: User-recorded reflection (`DISCIPLINED`, `FOMO`, `ANXIOUS`, `CONFIDENT`, `FRUSTRATED`, `NEUTRAL`)
- `mistake`: Self-identified execution error (e.g. "Chased gap up", "Exited prematurely")
- `executionNote`: Timing and order fills commentary
- `result`: { pnl, pnlPercent, exitPrice, exitDate, status }
- `lesson`: Key takeaway for future trades
- `researchSessionId`: Reference to Research Copilot evidence
- `reviewDate`: Target milestone date
- `isEarlyExit`: Flag indicating premature liquidation before thesis milestone

## Rule-Based Pattern Detection
- Repeated early exits before target review date
- Frequent trades clustered in the same symbol
- Repeated setup failures (loss rate > 65% on specific setups)
- Trades without linked thesis
- Trades without research session evidence

## Strict Guardrails
- Transparent pattern statements
- Disclaims explicitly: `"EMPIRICAL_JOURNAL_PATTERN — OBSERVED SYSTEM LOGS, NOT A PSYCHOLOGICAL OR FINANCIAL DIAGNOSIS"`

## Testing (`backend/test_mvp49.js`)
- Complete trade review lifecycle
- Pattern detection accuracy
- Rejection of psychological inferences
- User isolation & zero financial mutation
- Regression MVP-40 through MVP-48
