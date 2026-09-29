# MVP-4 Walkthrough: Virtual Balance & Order Accounting

## 1. What MVP-4 Solves
MVP-3 introduced a user-linked portfolio where users could buy and sell stocks natively. However, it lacked financial constraints. Users could theoretically "buy" infinite shares of a stock because there was no concept of cash. MVP-4 solves this by introducing authoritative Virtual Balances on the backend, converting TradeFlow into a true paper-trading simulation.

## 2. Virtual Balance & Accounting
A `virtualBalance` field with a default of ₹100,000 has been added to the `UserModel`.
When an order is created:
- **BUY:** The order value (`qty * price`) is calculated. The backend verifies `virtualBalance >= orderValue`. If sufficient, the balance is deducted natively. If insufficient, a 400 Bad Request is returned and no changes occur.
- **SELL:** After successfully verifying the user owns the required shares, the proceeds of the sell (`qty * price`) are credited to the user's `virtualBalance`.

## 3. Transaction History
A new `TransactionModel` was created to track all chronological accounting events. Whenever a successful BUY or SELL occurs, an immutable transaction record is committed, tracking:
- Type (BUY / SELL)
- Amount (Order value)
- `balanceBefore` & `balanceAfter` (for accounting tracing)

## 4. Atomic MongoDB Transactions
Like MVP-3, all MVP-4 accounting steps are chained into the existing Mongoose `session.startTransaction()`. If any step fails (e.g. insufficient cash, overselling, database crash), **everything** (including balance updates, holding deductions, order creations, and transaction records) is safely aborted, ensuring strict financial consistency.

## 5. API Endpoints
- `GET /api/v1/account/balance`: Securely returns the `virtualBalance` of the authenticated user.
- `GET /api/v1/account/transactions`: Returns chronological transaction history.

## 6. Frontend Changes
- `Funds.js`: Previously mocked "Available Margin" strings have been deleted. It now makes a secure API request to the backend and dynamically renders the authenticated user's actual cash balance.
- `BuyActionWindow.js`: Modified to display the required order margin vs the user's actual available balance dynamically. If the required margin exceeds available cash, the UI highlights it in red to warn the user, while the backend prevents execution.

## 7. Migration
A migration script (`migrate_mvp4.js`) safely initialized `virtualBalance` to `100,000` for all existing users (including Demo User) who did not have the field.

## 8. Testing & Isolation
A full end-to-end integration test (`test_mvp4.js`) proved:
- Balances correctly deduct and increment upon buy/sell.
- Concurrent User B interactions do not modify User A's balances.
- Oversized buy requests correctly revert and do not leave partial portfolio artifacts behind.
