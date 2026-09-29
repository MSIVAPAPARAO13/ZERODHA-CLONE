# MVP-3 Implementation Plan: User-Linked Trading & Portfolio Engine

## 1. Current State
- **Current Trading Behavior:** The `createOrder` endpoint merely saves an order to the `Orders` collection. It does not enforce quantity limits on sells, nor does it update the user's `Holdings` or `Positions`.
- **Current Portfolio Flow:** The portfolio endpoints (`getHoldings`, `getPositions`) simply read the collections. There is no logic tying order execution to portfolio balances.
- **Existing Database Structure:** `Orders`, `Holdings`, and `Positions` currently reference `User` (from MVP-2). No transactional integrity is present for multi-document updates.

## 2. Missing Trading Logic
- **BUY Logic:** Needs to calculate new average prices, update or create `Holdings`/`Positions`, and save the `Order`.
- **SELL Logic:** Needs to validate sufficient quantity, reduce `Holdings`/`Positions`, calculate realized P&L (if applicable), and remove holdings if quantity reaches zero.
- **Transactions:** MongoDB transactions via `mongoose.startSession()` are required to ensure atomicity across `Orders`, `Holdings`, and `Positions`.

## 3. Files to Modify
- `backend/controllers/orderController.js` (Delegate to trading service).
- `backend/validators/orderValidator.js` (Add robust quantity/price validation if missing).
- `dashboard/src/components/BuyActionWindow.js` (or similar frontend component) to add loading states, success/error handling, and trigger portfolio refresh.
- `dashboard/src/components/Dashboard.js` (Ensure holdings/positions refresh after order).

## 4. Files to Create
- `backend/services/tradingService.js` (Will contain `placeBuyOrder` and `placeSellOrder` using Mongoose sessions).
- `docs/MVP3_WALKTHROUGH.md`
- `docs/MVP3_FINAL_AUDIT.md`
- Automated test scripts for MVP-3.

## 5. Order Lifecycle & Portfolio Logic
1. **Validation:** Ensure valid `qty` (>0), `price` (>0), and valid `mode` (BUY/SELL).
2. **Session Start:** Open Mongoose transaction.
3. **Sell Check:** If SELL, query existing holding. If `holding.qty < order.qty`, abort and return 400.
4. **Order Creation:** Insert `Order` document.
5. **Holding Update:** 
   - BUY: Calculate `newAvgPrice = ((oldQty * oldAvgPrice) + (newQty * newPrice)) / (oldQty + newQty)`. Update holding.
   - SELL: Reduce `qty`. If `qty === 0`, delete holding.
6. **Position Update:** Same logic as holding to keep the intraday/position consistent.
7. **Commit:** Commit transaction. If any step fails, abort transaction.

## 6. Definition of Done
- [ ] Authenticated BUY/SELL works.
- [ ] Portfolio correctly updates and average price is calculated.
- [ ] Selling respects owned quantity constraints.
- [ ] Mongoose transactions prevent partial updates.
- [ ] Frontend order UI properly handles validation, loading, and refreshing.
- [ ] All required tests pass (User isolation, transaction rollback).
- [ ] Walkthrough and Final Audit documents created.
