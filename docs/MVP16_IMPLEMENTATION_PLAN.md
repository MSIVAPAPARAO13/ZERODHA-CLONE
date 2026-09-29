# MVP-16: Trade Plan vs Execution Intelligence Implementation Plan

## 1. Problem
Traders often deviate from their carefully constructed plans during actual execution. TradeFlow needs to make this plan vs actual gap measurable, neutral, and trackable.

## 2. Research & Architecture
We will introduce `TradePlanModel` to store explicit plans made *before* execution. When a trade executes, `executionDeviationService` calculates differences (quantity, price, playbook, direction) between the planned snapshot and actual execution order snapshot.

## 3. Deviation Engine
`executionDeviationService` identifies:
- Symbol/Direction deviation
- Entry/Quantity/Stop/Target deviation (percentage & absolute)
- Playbook deviation
- Timing delays
- Unplanned trades

## 4. Behavioral Feedback
Over time, the Behavioral Edge Service will detect patterns in deviation (e.g., "7 of 10 trades exceed planned quantity") and surface them for Playbook rule consideration.

## 5. API Design
- `POST/GET/PATCH/DELETE /api/v1/trade-plans`
- `GET /api/v1/trade-plans/:id/reconciliation` (Returns deviations)
- `GET /api/v1/behavior/execution-deviations`

## 6. Frontend
A new "Trade Planner" component will be built, alongside an "Execution Review" component that triggers post-trade to allow user tagging (e.g. "MARKET_CHANGED", "USER_OVERRIDE"). Journal and Replay will be updated to display Plan vs Actual.

## 7. Security & Integrity
All endpoints scoped to `req.user.userId`. Plans do not mutate `virtualBalance`.
