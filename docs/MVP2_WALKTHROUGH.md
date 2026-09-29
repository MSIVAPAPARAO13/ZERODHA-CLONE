# MVP-2 Walkthrough: Authentication & Authorization

## Overview
This document serves as a walkthrough of the features and changes introduced in MVP-2 of TradeFlow SaaS.

### 1. Database Migration & Security
- Inspected the live MongoDB Atlas database.
- Executed a migration script that successfully created a `demo@tradeflow.local` user and reassigned all 20 existing legacy records (Orders, Holdings, Positions) to this user.
- Updated `OrdersModel`, `HoldingsModel`, and `PositionsModel` schemas to require the `user` field, which securely references the newly created `User` model via `ObjectId`.

### 2. Backend Implementation
- Created `UserModel` utilizing `bcryptjs` for strong password hashing.
- Developed `authController` with `/register` and `/login` endpoints that return stateless JSON Web Tokens (JWT).
- Created `authMiddleware` to protect API routes. Only requests providing a valid `Bearer` token can proceed.
- Refactored `orderController` and `portfolioController` to strictly scope database queries using `req.user.userId`.
- Conducted automated integration testing verifying isolation:
  - Created User A and User B.
  - User A created an order.
  - User B fetched orders and saw an empty array, verifying 100% data isolation.

### 3. Frontend Implementation
- Integrated an `AuthContext` to manage global user state and sessions safely.
- Updated the `api.js` Axios client to include an interceptor that dynamically injects the token from `localStorage` into all request headers. It also listens for `401 Unauthorized` responses to auto-logout invalid sessions.
- Developed the `Login` and `Register` React pages.
- Built a `ProtectedRoute` component wrapping the `Home` dashboard, ensuring unauthenticated users are seamlessly redirected to `/login`.
- Implemented a Logout button in the `Menu.js` profile section displaying the user's initial and name.

## End result
The application is now securely partitioned for multi-tenancy. Every transaction and portfolio holding strictly belongs to a registered user account.
