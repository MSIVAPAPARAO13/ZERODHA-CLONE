# MVP-9 Walkthrough: Trading Decision Journal

## 1. Why TradeFlow Needs a Decision Journal
A typical simulated trading app captures *what* happened financially: Entry, Exit, P&L. However, to foster actual learning and build a foundation for Market Intelligence, TradeFlow must capture *why* a trade happened. MVP-9 introduces the `TradeJournal`, appending subjective human intent (thesis, confidence, targets, invalidation) alongside objective market context (live snapshot) at the exact moment a trade is executed.

## 2. Data Model & Architecture
The `TradeJournalModel` is distinct from the `OrdersModel` and `TransactionModel`.
- **Order/Transaction:** Strict, immutable financial records that dictate `virtualBalance`, `holdings`, and `positions`.
- **TradeJournal:** A subjective analytical layer explicitly linked to an Order via `order: ObjectId`. 

This guarantees that deleting or editing a journal never corrupts the user's financial simulation. 

## 3. The Journal Lifecycle
1. **Frontend Flow**: The user clicks `BUY` and sees the order execution window. By default, it's a Quick Trade.
2. **Opt-in Thesis**: The user toggles "Add Trade Thesis" and completes the subjective fields (Strategy, Reason, Confidence, Targets, Thesis text).
3. **Pre-flight Execution**: When submitting, `orderController` hits `marketDataService.getQuote` to snapshot the real-world market price and metadata *before* starting the transaction. (If the API rate limits, the snapshot degrades gracefully rather than failing the trade).
4. **Transaction**: Inside the MongoDB session, `placeBuyOrder` executes the financial accounting exactly as it did in MVP-4. Then, seamlessly within that same session, the `TradeJournal` record is minted and attached to the new order.
5. **Review**: The user navigates to the "Trade Journal" page to review their historical reasoning.

## 4. API Design & Security
- `POST /api/v1/orders/new`: Now accepts an optional nested `journal` object.
- `GET /api/v1/journal`: Returns user-scoped journal records.
- `PATCH /api/v1/journal/:id`: Enforces partial updates. Critically, it explicitly filters incoming payloads to *only* allow edits to subjective fields (`strategy`, `thesis`, etc.). Objective financial facts (`entryPrice`, `side`, `quantity`) cannot be mutated.
- All routes are wrapped in `authMiddleware` forcing total user isolation.

## 5. Frontend & UI
- `BuyActionWindow.js` was enhanced with a conditionally rendered form.
- `TradeJournal.js` acts as a historical dashboard summarizing win-rate context (targets set vs risks set) and lists all prior decisions cleanly.
- `Menu.js` was updated to weave the Journal into the main navigational hierarchy.

## 6. Future-Proofing
By storing the `{ price, changePercent, timestamp, source }` snapshot and capturing the user's explicit Target and Risk prices, TradeFlow MVP-9 has perfectly positioned the database structure for MVP-10: Trade Replay and AI Analysis. Future agents can now chronologically replay the user's expectation against the eventual market reality.
