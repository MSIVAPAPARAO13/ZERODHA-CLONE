# MVP-14 Walkthrough: Session Intelligence & Evidence-Based Pre-Trade Guardrails

## 1. Problem
TradeFlow needed to provide observable, evidence-based context during the active trading session to help users adhere to their Playbooks, without acting as a psychological therapist.

## 2. Architecture
- MVP-14 uses `sessionIntelligenceService` to pull deterministic metrics (like P&L, trade counts, loss streaks) for the current calendar day from `Orders` and `Transactions`.
- The `guardrailService` checks these metrics against user settings to trigger warnings (INFO, WARNING, LIMIT).

## 3. Session Definition
The session is defined chronologically as the current calendar day in the server's time zone.

## 4. Metrics
- `tradeCount`, `pnl`, `lossStreak`, `tradeFrequency`, `symbolFrequency`, `playbookCompliance`.

## 5. Guardrails
- **LOSS_STREAK**: Evaluates consecutive losses.
- **HIGH_TRADE_FREQUENCY**: Evaluates if the threshold is crossed within a window.
- **REPEATED_SYMBOL**: Evaluates symbol repetition.
- **PLAYBOOK_DEVIATION**: Validates checklist compliance in recent trades.
- **POSITION_SIZE_CHANGE**: Checks size changes.
- **SESSION_LOSS_LIMIT**: Hard limit that prevents order execution.

## 6. API
- `GET /api/v1/session/intelligence`: Fetches current session dashboard statistics.
- `POST /api/v1/session/evaluate`: Fetches proposed trade context.
- `GET /api/v1/ai/session-review`: Fetches AI reflection.

## 7. Frontend
The `BuyActionWindow` was extended to hit `/session/evaluate` before proceeding. Dashboard card created for Session Metrics.

## 8. Market API
All quote lookups are handled through `MarketDataService` server-side.

## 9. AI
`aiAnalystService` explains session facts without predicting fear or greed.

## 10. Security
All APIs properly scope database calls to `req.user.userId`.

## 11. Financial Isolation
Guardrails do not mutate any positions or balances unless a valid order is fully executed under allowed circumstances.

## 12. Testing
Test file `backend/tests/test_mvp14.js` verified metrics and loss limit bounds.

## 13. Limitations
Session boundaries reset unconditionally at midnight; long sessions crossing midnight behave incorrectly.

## 14. Future Improvements
Configurable timezone settings and rolling 24-hour windows.
