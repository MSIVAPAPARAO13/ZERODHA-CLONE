# MVP-9 Implementation Plan: Trading Decision Journal

## 1. Current Architecture
- Trading execution goes through `orderController` -> `tradingService.placeBuyOrder`/`placeSellOrder`.
- This is enclosed in a MongoDB transaction.
- `MarketDataService` abstracts our Real APIs (TwelveData/AlphaVantage).
- No journal models exist.

## 2. Journal Data Model
Create `backend/models/TradeJournalModel.js`:
- `user`: ObjectId, ref 'User'
- `order`: ObjectId, ref 'Order'
- `symbol`: String
- `side`: "BUY" | "SELL"
- `strategy`: String (Enum: MOMENTUM, BREAKOUT, VALUE, NEWS, TECHNICAL, TREND, REBALANCE, OTHER)
- `reason`: String (Enum: EARNINGS, VALUATION, TECHNICAL_SETUP, NEWS, PORTFOLIO_REBALANCE, WATCHLIST_OPPORTUNITY, OTHER)
- `confidence`: Number (1-5)
- `thesis`: String
- `targetPrice`: Number (Optional, > 0)
- `riskPrice`: Number (Optional, > 0)
- `expectedHoldingPeriod`: String (INTRADAY, 1-3 DAYS, 1-2 WEEKS, 1-3 MONTHS, LONG_TERM, UNSPECIFIED)
- `entryPrice`: Number
- `quantity`: Number
- `marketSnapshot`: Object { price, changePercent, timestamp, source, status }

## 3. Order/Journal Relationship & Transaction
To preserve the transaction atomicity, the journal creation will be appended to the transaction in `orderController` if journal fields are passed.
- Quick Trade: no journal fields provided -> executes normally.
- Planned Trade: journal fields provided -> `placeBuyOrder`/`placeSellOrder` are executed, then a `TradeJournal` record is created synchronously within the same session.
- To prevent slowing down the transaction, `MarketDataService.getQuote` will be fetched *before* starting the MongoDB transaction. If it fails, `marketSnapshot.status = 'unavailable'`.

## 4. API Endpoints
Create `journalController.js` and `journalRoutes.js`:
- `POST /api/v1/orders/new` (Modify existing route to accept journal payload).
- `GET /api/v1/journal`
- `GET /api/v1/journal/:id`
- `PATCH /api/v1/journal/:id` (Only allow editing subjective fields: strategy, reason, confidence, thesis, targetPrice, riskPrice, expectedHoldingPeriod).
- `DELETE /api/v1/journal/:id`

## 5. Frontend
- Update `BuyActionWindow.js` to optionally expand an "Add Trade Thesis" section with a clean form.
- Add `TradeJournal.js` as a new page showing the table of historical decisions.
- Add "Trade Journal" to `Menu.js` sidebar.

## 6. Security & Isolation
- The backend derives `user`, `symbol`, `side`, `entryPrice`, `quantity` directly from the authenticated `req.user.userId` and the executed order. The client cannot forge these financial facts in the journal.
- Journals are filtered strictly by `userId`.

## 7. Migration & Testing
- `test_mvp9.js` will simulate Quick Trades, Planned Trades with full journals, and verify isolation and editing constraints.

## 8. Explicit Non-Goals
- Real-money trading, AI Analysis, backtesting.
