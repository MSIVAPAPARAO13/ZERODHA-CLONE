# MVP-14: Session Intelligence & Evidence-Based Pre-Trade Guardrails Implementation Plan

## 1. Existing Architecture (MVP-12 & MVP-13)
- **MVP-12** established the Behavioral Edge, which identifies patterns in the user's past trades deterministically.
- **MVP-13** implemented the Adaptive Decision Loop using User-approved Playbooks and Pre-Trade Checklists, integrated into the TradeJournal and TradeReplay.
- Both use the `MarketDataService` for real-market quotes.

## 2. Session Definition
- **Definition:** The current calendar day (using the project's existing server timezone or user configuration if available).
- Persistent Session Model is NOT required initially; session metrics will be derived directly from existing `Orders`, `Transactions`, and `TradeJournal` records within the day's boundaries.

## 3. Session Metrics
Derived deterministically from existing database records:
- `tradeCount`: Total trades today
- `winningTrades` / `losingTrades`: Count of profitable/unprofitable closed trades
- `winRate`: Ratio of winning to total closed trades
- `sessionPnL`: Cumulative realized P&L for the session
- `lossStreak`: Consecutive recent losing trades
- `averageTradeInterval` & `tradeFrequency`: Trades per rolling time window
- `symbolFrequency`: Number of trades per symbol
- `playbookCompliance`: Checklist compliance percentage for recent trades

## 4. Guardrail Rules (Deterministic)
Evaluated dynamically before trade execution:
1. **LOSS_STREAK (INFO):** Detect consecutive losses.
2. **HIGH_TRADE_FREQUENCY (WARNING):** Detect X trades in Y minutes.
3. **REPEATED_SYMBOL (INFO):** Detect repeated trades on the same symbol.
4. **PLAYBOOK_DEVIATION (WARNING):** Detect incomplete required rules in recent trades.
5. **POSITION_SIZE_CHANGE (INFO):** Compare proposed quantity vs. recent average.
6. **SESSION_LOSS_LIMIT (LIMIT):** User-configured hard loss boundary.

## 5. API Design
- **GET `/api/v1/session/intelligence`**: Returns the current session metrics.
- **POST `/api/v1/session/evaluate`**: Receives proposed trade context and returns guardrail evaluation (allowed boolean + guardrail warnings).

## 6. Frontend Design
- **Session Dashboard**: Added compactly to the existing Dashboard view.
- **BuyActionWindow**: Extended to fetch pre-trade context (`/session/evaluate`), display guardrails, and require review before execution. No intrusive modals.

## 7. AI & Market API Usage
- **AI**: Reuses `aiAnalystService` or `aiContextService` for `GET /api/v1/ai/session-review` to provide session explanation/reflection. AI will NOT calculate metrics or infer emotional state.
- **Market API**: Reuses `marketDataService` for current quotes in the BuyActionWindow. No frontend API calls to providers.

## 8. Security & Financial Isolation
- **Isolation**: JWT-based user isolation (`req.user.userId`).
- **Integrity**: Session Intelligence is informational (except for configured hard limits) and does not mutate Orders, Holdings, or Balances.

## 9. Migration & Limitations
- **Migration**: Minimal schema changes (add settings to `User`). No data migration required for existing trades.
- **Limitations**: Metrics are bounded to intraday performance; long-running multi-day sessions are outside this scope. No persistent session object limits historical session comparisons.
- **Non-Goals**: No real-money trading, no black-box discipline scores, no generic AI chatbots.
