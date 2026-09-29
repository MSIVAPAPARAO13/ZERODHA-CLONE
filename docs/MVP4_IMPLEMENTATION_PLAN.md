# MVP-4 Implementation Plan: Virtual Balance & Order Accounting

## 1. Current State
- **User Model:** Has `name`, `email`, `password`. No financial fields.
- **Order Model:** Stores basic order info but doesn't record balance changes.
- **Trading Flow:** MVP-3 correctly creates/updates `Holdings`, `Positions`, and `Orders` in a MongoDB transaction but does not enforce any virtual cash limits.
- **Frontend:** Displays static `Funds` values (which are mocked out) and does not display real balances when placing orders.

## 2. Plan

### Required Schema Changes
1. **User Model:** Add `virtualBalance` (default: `100000`).
2. **Transaction Model:** Create `TransactionModel.js` to store history of `BUY`, `SELL`, `DEPOSIT`, `WITHDRAWAL`. Needs fields: `user`, `type`, `symbol`, `quantity`, `price`, `amount`, `balanceBefore`, `balanceAfter`.

### Buy & Sell Accounting Logic
- **BUY:**
  - `orderValue = qty * price`.
  - Check `user.virtualBalance >= orderValue`. If insufficient, abort with HTTP 400.
  - Subtract `orderValue` from `virtualBalance`.
  - Create transaction record.
- **SELL:**
  - Execute normal MVP-3 holding reductions.
  - Add `orderValue` to `user.virtualBalance`.
  - Create transaction record.
- All modifications will be added to the existing MongoDB transaction session in `tradingService.js`.

### Migration Strategy
- `demo@tradeflow.local` and existing test users currently have no virtual balance.
- Setting a default `100000` via a backend update script for all users without a `virtualBalance`.

### Frontend Updates
- Implement a `/api/v1/account` endpoint to fetch the user's `virtualBalance`.
- Wire `Funds.js` to actually fetch and show this balance.
- Update `BuyActionWindow` to display available balance and order value.

### Testing Strategy
- Unit/integration script `test_mvp4.js` targeting: BUY insufficient balance rejection, exact balance decrement, SELL increment, atomic rollback of balance, and ensuring user isolation for balances/transactions.
