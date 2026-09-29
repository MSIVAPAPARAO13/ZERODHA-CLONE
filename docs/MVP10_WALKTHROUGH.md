# MVP-10 Walkthrough: Trade Replay & Outcome Intelligence

## 1. Why Trade Replay Exists
MVP-9 captured the "Why" (TradeJournal) at the moment of execution. MVP-10 completes the learning loop by answering "What Happened After." It allows a user to revisit a past decision, view the historical market timeline that unfolded after the entry, and factually observe whether their predicted Target or Risk levels were crossed before their eventual exit.

## 2. Deriving a Replay (No Duplicate Accounting)
TradeFlow enforces strict financial immutability. Therefore, the Trade Replay is implemented as a **read-only analytical view** derived dynamically on-the-fly. 
- It uses the `TradeJournal` to define the baseline expectations.
- It queries the `TransactionModel` directly using a transparent **FIFO (First-In-First-Out)** matching rule to determine if the trade is currently `OPEN` or `CLOSED`.
- If the accumulated quantity of subsequent SELL transactions for that symbol matches the entry quantity, the trade is marked `CLOSED`.
- It calculates P&L entirely based on these factual ledger entries without ever storing a conflicting "Replay" document in the database.

## 3. The Historical Timeline
Once the Replay boundary (Entry Time to Exit Time / Now) is defined, the `TradeReplayService` calls `marketDataService.getHistoricalData()`.
- The historical daily candles are scanned chronologically.
- **Target Detection:** If a candle's `high` crosses the user's recorded `targetPrice`, `targetReached` is set to true.
- **Risk Detection:** If a candle's `low` crosses the user's `riskPrice`, `riskCrossed` is set to true.
- Crucially, Target/Risk detection **does not** imply exit. The Replay clearly distinguishes between "Target Reached (Historical Fact)" and "Actual Exit (User Action)."

## 4. API & Frontend Integration
- `GET /api/v1/journal/:id/replay` serves the fully computed Replay payload.
- The endpoint is protected by `authMiddleware` and explicitly enforces `{ _id: journalId, user: req.user.userId }` ownership. User A can never replay User B's trades.
- The `TradeReplay.js` React component renders a clean, deterministic summary of the decision, a simple timeline, and the factual outcome (P&L, holding duration, and status).

## 5. Graceful Degradation
External historical APIs (like Twelve Data or Alpha Vantage) have limits.
If the API rate-limits or fails, the `TradeReplayService` traps the error and returns the Replay with `marketData: null`. The frontend gracefully renders "Historical timeline unavailable" while still functioning perfectly to show the Entry, Exit, and P&L.

## 6. Future Integration
Because MVP-10 completely normalizes the timeline (`targetReached`, `holdingDurationDays`, `realizedPnl`), MVP-11 (AI Portfolio Analyst) can cleanly ingest this exact Replay JSON payload to generate deep, grounded coaching feedback.
