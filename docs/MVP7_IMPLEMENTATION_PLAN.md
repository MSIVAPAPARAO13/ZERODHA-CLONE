# MVP-7 Implementation Plan: Price Alerts

## 1. Current Architecture
No alert or notification functionality exists currently. The backend consists of `UserModel`, `WatchlistModel`, `TransactionModel`, `HoldingsModel`, `PositionsModel`, and `OrdersModel`. Market data is abstracted via `MarketDataService` (MVP-5) and watchlists are stored with user isolation (MVP-6).

## 2. Alert Architecture
- **Model:** `AlertModel` will store alerts. `user` (ObjectId, ref: User), `symbol` (String), `condition` (ABOVE/BELOW), `targetPrice` (Number), `isActive` (Boolean), `triggeredAt` (Date).
- **Service:** `alertService.js` handles CRUD and alert evaluation against `marketDataService.js`.
- **Controller & Routes:** `/api/v1/alerts`. Includes `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, and an evaluation trigger `POST /evaluate`.
- **Evaluation Mechanism:** An explicit `/evaluate` endpoint will be provided to avoid background while-loops. When invoked, it groups active alerts by symbol, fetches current quotes via `MarketDataService`, checks if current price crosses target price based on condition, and if triggered, sets `isActive=false` and records `triggeredAt`.

## 3. Frontend Architecture
- `dashboard/src/components/Alerts.js` (new) will display the user's active and triggered alerts. It will include a form to create new alerts.
- A menu item for "Alerts" will be added to the Sidebar/Menu.
- Uses `api.js` (`alertService`) for `/alerts` API calls.

## 4. Ownership and Duplicates
- Ownership strictly enforced via `req.user.userId`.
- No unique compound index needed for alerts as users may want multiple alerts on the same symbol at different targets (e.g. TCS Above 3500, TCS Below 3300). However, application-level checks will prevent creating exact duplicates (`user + symbol + condition + targetPrice + isActive=true`).

## 5. Testing & Migration Strategy
- `test_mvp7.js` to simulate alert creation, modification, isolation, and evaluation.
- No historical data migration needed.
- MVP-4/5/6 structures remain pristine. Alerts are purely observational.
