# MVP-19: Decision Twin & Session Simulator Implementation Plan

## 1. Problem
TradeFlow records post-trade execution history, but it lacks a structured "Pre-Session" state to capture what the trader *intended* to do before they ever opened an order.

## 2. Decision Twin
We introduce a `SessionDecisionModel` to act as an immutable "Decision Twin" of the trader's intended process for the day. It captures a freeze-frame snapshot of:
- Allowed Watchlist
- Allowed Playbooks
- Max Trades / Max Daily Loss / Risk Guardrails
- Pre-Session Notes

## 3. Session Lifecycle
- `POST /sessions` -> DRAFT
- `POST /sessions/:id/start` -> ACTIVE
- `POST /sessions/:id/complete` -> COMPLETED

## 4. Reconciliation
When a session is marked COMPLETED, the backend generates a `Session Reconciliation`. It maps actual orders placed during the ACTIVE window against the Decision Twin's rules (e.g., flagging Unplanned Symbols, excessive trade counts, or breached loss guards).

## 5. Session Simulator (Replay)
MVP-10 Replay is wrapped to allow playing back the entire historical session rather than just single trades. The UI scrubs through time, showing exactly what was planned vs. what occurred.

## 6. AI Role
AI ingests the reconciliation payload and summarizes discrepancies neutrally. (e.g., "You planned 5 maximum trades and recorded 7.")

## 7. Isolation & Security
Every Session and associated event is strictly scoped to `req.user.userId`.
Legacy trades without a `sessionId` remain valid.
