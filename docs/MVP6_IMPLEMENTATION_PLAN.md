# MVP-6 Implementation Plan: User Watchlists & Symbol Search

## 1. Current Architecture & Behavior
Currently, `WatchList.js` in the frontend fetches a global list of mock quotes from `/api/v1/market/quotes`. It does not store user-specific symbols persistently. The user cannot add or remove symbols. `MVP-5` introduced market data abstraction, but watchlists are still pseudo-static (tied to the mock dataset size).

## 2. Proposed Watchlist Design
- **Database:** `WatchlistModel` will store user-specific symbols (`user`, `symbol`, `createdAt`). It will have a compound unique index on `{ user: 1, symbol: 1 }` to prevent duplicates natively in MongoDB.
- **Service:** `watchlistService.js` handles CRUD logic for the watchlist and integrates with `marketDataService.js` to validate symbols on `POST` and enrich the `GET` response with actual quote data.
- **Controller/Routes:** `/api/v1/watchlist` protected by `authMiddleware`.
    - `GET /` -> Returns populated user watchlist.
    - `POST /` -> Validates symbol via market data, checks for duplicates, then adds to DB.
    - `DELETE /:symbol` -> Removes from the user's list.

## 3. Frontend Integration
- Add endpoints to `dashboard/src/services/api.js` (e.g. `watchlistService.getWatchlist()`).
- Modify `WatchList.js`:
    - Display current user's watchlist dynamically.
    - Render a Search input that calls `marketService.searchSymbols()`.
    - Allow users to click a search result to `POST` the symbol.
    - Add a remove (X) button to watchlist items for `DELETE`.
    - Handle loading, empty states, and errors via toast.

## 4. Authentication / Isolation Strategy
Ownership is exclusively determined by `req.user.userId` via `authMiddleware`. No client-supplied IDs are used for watchlist operations.

## 5. Duplicate and Validation Protection
MongoDB `unique: true` on the compound index is the final safeguard against duplicates. Service-level checks will proactively throw a 400 Bad Request before attempting insertion. Symbols are strictly validated against `marketDataService.getQuote(symbol)`.

## 6. Testing Strategy
A `test_mvp6.js` integration script will simulate User A creating a watchlist with duplicate checks and unknown symbol checks, and User B fetching their isolated empty watchlist. Regression checks will run for prior MVPs.
