# MVP-6 Walkthrough: User Watchlists & Symbol Search

## 1. What MVP-6 Solves
Previously, the frontend `WatchList.js` component was a static, globally shared list of symbols relying on static market data. MVP-6 transforms this into a **user-specific, persistent watchlist**. Each authenticated user can individually search for, add, and remove symbols in their own private view.

## 2. Watchlist Model & Persistence
A dedicated `WatchlistModel` was created on the backend. This schema uses a MongoDB compound unique index `(user, symbol)` to natively guarantee that the same user cannot insert duplicate symbols. Ownership is stringently tied to the `req.user.userId` fetched from the JWT authentication middleware rather than any easily manipulated frontend parameter.

## 3. API & Routes
We expanded the REST interface with a dedicated `/api/v1/watchlist` suite:
- `GET /`: Loads the authenticated user's saved symbols and seamlessly enriches them with dynamic market quotes via `marketDataService.getQuotes()`.
- `POST /`: Validates the requested symbol against the `marketDataService`. If valid and non-duplicate, it is assigned to the user.
- `DELETE /:symbol`: Securely unlinks the symbol exclusively from the authenticated user's list.

## 4. Frontend Revamp
The `WatchList.js` component was heavily refactored. The static import from `data.js` was entirely removed. It now:
1. Dynamically loads the `watchlist` from the backend upon mounting.
2. Contains an integrated Search Input. Typing dynamically fetches matches using the previously built `/api/v1/market/search` endpoint.
3. Allows adding and removing symbols with smooth toast notifications and immediate state updates.

## 5. Security & Isolation
By extracting the user ID strictly from the JWT payload within the `authMiddleware`, we achieved strict multitenant isolation. User A cannot view, add to, or delete symbols from User B's watchlist.

## 6. Architecture & Separation of Concerns
Crucially, market quote logic (pricing, trends) was NOT duplicated into the `WatchlistModel`. The DB solely stores relational ownership (who is watching what). The `watchlistService` handles orchestrating this persistence layer alongside the `marketDataService` abstraction constructed in MVP-5 to return enriched payloads on the fly.
