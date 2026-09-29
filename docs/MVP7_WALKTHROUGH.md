# MVP-7 Walkthrough: Price Alerts

## 1. What MVP-7 Solves
MVP-7 introduces the ability for users to set subjective, personalized price condition alerts (e.g. "Alert me when TCS goes ABOVE ₹3500"). Previously, TradeFlow lacked any mechanism to observe or proactively evaluate market movements beyond visually checking the Watchlist or placing an order.

## 2. Architecture & Design
A dedicated `AlertModel` was built alongside a RESTful `/api/v1/alerts` route structure. The alerts architecture delegates exclusively to the pre-established `marketDataService` abstraction to resolve symbol existence and live quotes, preventing duplication of market interfaces.

The alert structure captures:
- Ownership (`user`) strictly from the JWT payload.
- Subject (`symbol`).
- Directionality (`condition`: `ABOVE` / `BELOW`).
- Trigger bound (`targetPrice`).
- State (`isActive`, `triggeredAt`).

## 3. Duplication and Security Rules
We deliberately omitted a rigid Unique Compound Index since valid use-cases exist for multiple active bounds on the same symbol (e.g. TCS Above 3500 AND TCS Below 3300). However, application-level checks exist to prevent creating exact identical records (identical symbol, condition, and target).

Multi-tenant isolation ensures User A's alerts are strictly inaccessible and completely invisible to User B. 

## 4. Evaluation Strategy
Rather than implementing a runaway `while(true)` background loop or heavy polling interval, MVP-7 introduces an explicit evaluation trigger endpoint (`POST /api/v1/alerts/evaluate`). This endpoints scans active alerts, polls the internal mock quote boundaries, triggers matches, marks them inactive, and stamps a `triggeredAt` date. Alerts are explicitly designed to be **one-time** to prevent perpetual re-trigger spam. 

## 5. Frontend UI
A completely new module (`Alerts.js`) was engineered.
- Integrated securely into the protected `Dashboard.js` React Router.
- Added a visual pathing inside the main `Menu.js` sidebar.
- Features a drop-down dynamic search leveraging MVP-5's query endpoint.
- Visualizes status changes cleanly via a tabular format.
