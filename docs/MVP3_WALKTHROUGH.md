# MVP-3 Walkthrough: User-Linked Trading & Portfolio Engine

## 1. What MVP-3 Solves
Before MVP-3, the trading simulation simply created orders in the database. There was no link between an order and the user's holdings or positions. MVP-3 bridges this gap by turning order execution into a full portfolio engine.

## 2. Architecture & Implementation
We introduced a `tradingService.js` that abstracts complex database operations away from the route controllers.
When an order is created, `tradingService` uses **MongoDB/Mongoose Transactions (`session.startTransaction()`)** to ensure atomic writes.

### 3. Order Lifecycle
- **Validation**: Ensure qty and price are valid positive numbers.
- **BUY Flow**: Order is inserted. `Holdings` and `Positions` are created or updated. New average buy prices are correctly calculated: `((oldQty * oldAvg) + (newQty * newPrice)) / totalQty`.
- **SELL Flow**: Order is validated against `Holdings` to ensure the user owns enough shares. If valid, the order is inserted, and `Holdings`/`Positions` quantities are decremented. If quantity reaches `0`, the holding is closed (deleted).
- **Transaction Rollback**: If an error occurs during a multi-document update (e.g., selling more than owned), the transaction aborts, safely rolling back all changes to prevent database corruption.

### 4. User Isolation
Every operation inside `tradingService` is hard-filtered by `userId` (derived strictly from the authenticated JWT token). `test_mvp3.js` proves that User A cannot affect or view User B's portfolio.

### 5. Frontend Trading Flow
- The existing `BuyActionWindow.js` was refactored to support both `BUY` and `SELL` modes dynamically.
- `GeneralContext` now exports `openSellWindow(uid)`.
- `Holdings.js` and `Positions.js` were updated to render a "Sell" action button on every row, seamlessly launching the context window.
- The `Holdings` summary section was upgraded to compute Total Investment and Current Value dynamically based on the user's actual portfolio, rather than hardcoding static mock totals.

## 6. Testing
An automated test suite (`test_mvp3.js`) was run which rigorously executed:
- Authenticated buy flows.
- Portfolio verification & isolation.
- Rollback validation on oversells.
- Proper average price mathematics upon repeated buys.
