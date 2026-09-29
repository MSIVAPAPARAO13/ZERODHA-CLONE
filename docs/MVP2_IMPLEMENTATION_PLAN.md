# MVP-2 Implementation Plan: Authentication & Authorization

## 1. Overview
MVP-2 focuses on introducing secure user authentication and authorization. Currently, the application is completely open, meaning any orders placed are globally visible and not tied to any specific user. MVP-2 will lay the foundation for isolated, multi-tenant portfolios.

## 2. Current Relevant Files
- `backend/models/*` (Holdings, Positions, Orders lack a user reference)
- `backend/routes/*` (Unprotected routes)
- `backend/controllers/*`
- `dashboard/src/services/api.js` (No auth headers attached)
- `dashboard/src/components/*` (No login/register UI)

## 3. Files to Create
### Backend
- `backend/models/UserModel.js` (Mongoose schema for User with password hashing)
- `backend/controllers/authController.js` (Registration, Login, Token generation)
- `backend/routes/authRoutes.js` (Endpoints for `/api/v1/auth/register` and `/login`)
- `backend/middleware/authMiddleware.js` (JWT verification to protect routes)

### Frontend
- `dashboard/src/pages/Login.js`
- `dashboard/src/pages/Register.js`
- `dashboard/src/context/AuthContext.js` (To manage global logged-in state)

## 4. Files to Modify
### Backend
- `backend/index.js` (Register new `/api/v1/auth` routes)
- `backend/models/HoldingsModel.js`, `PositionsModel.js`, `OrdersModel.js` (Add `user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }` field)
- `backend/controllers/portfolioController.js` and `orderController.js` (Update logic to only fetch/save documents belonging to `req.user.id`)

### Frontend
- `dashboard/src/services/api.js` (Update Axios interceptor to automatically attach the JWT token from `localStorage` as a `Bearer` token in the `Authorization` header)
- `dashboard/src/components/Dashboard.js` (Add React Router logic to protect the dashboard routes and redirect unauthenticated users to `/login`)
- `dashboard/src/components/TopBar.js` or `Menu.js` (Add a Logout button)

## 5. Dependencies to Install
**Backend:**
- `bcryptjs`: For securely hashing user passwords before storing them in MongoDB.
- `jsonwebtoken`: For issuing and verifying JWT access tokens.

**Frontend:**
- (No new dependencies strictly required; we will use React Context for state and existing `react-router-dom` for protected routes).

## 6. Security & UI Strategy
- **Passwords** will never be stored in plain text.
- **JWTs** will be used for stateless session management.
- **Protected Routes**: On the frontend, navigating to `/` or `/orders` without a token will redirect to `/login`.
- **Loading States**: Auth checks on startup will display a full-screen loading spinner until the user's session validity is determined.

## 7. Definition of Done
- [ ] `UserModel` created.
- [ ] Registration endpoint works and hashes passwords.
- [ ] Login endpoint works and returns a JWT.
- [ ] `authMiddleware` successfully protects endpoints.
- [ ] Existing trading models updated to reference the `User`.
- [ ] Frontend API client attaches JWT to requests.
- [ ] Frontend Login/Register pages created.
- [ ] Unauthenticated users are redirected to login.
- [ ] Logged-in users only see their own orders.

---
*Note: This plan outlines the required steps for MVP-2. Implementation will only begin upon confirmation.*

### Existing Database & Schema Verification (Live Atlas DB)
- **Database Name:** Connected successfully to Atlas (`ZerodhaCloneCluster`).
- **Collections Found:** `orders`, `positions`, `holdings`. No `users` collection exists yet.
- **Existing Relevant Fields:** Models strictly define fields like `name`, `qty`, `price`. There are **no existing user, owner, or account fields**.
- **Existing Mongoose Models:** `HoldingsModel.js`, `PositionsModel.js`, `OrdersModel.js`. No `UserModel.js`.
- **Schema Differences:** The current schema matches the pre-MVP2 plan exactly (no users attached). Adding `{ type: Schema.Types.ObjectId, ref: 'User' }` is a purely additive schema change.
- **User Ownership Status:** All existing data is currently globally scoped.
- **Required Migration Changes (Option A):** We found existing data: **3 Orders, 13 Holdings, 4 Positions**. We have selected **Option A — Migration**. We will create a `demo@tradeflow.local` user and explicitly reassign all existing legacy records to this user ID. This safely isolates old data without deletion and allows us to strictly enforce `user: { type: Schema.Types.ObjectId, required: true }` for all models.
- **Data-loss Risks:** None. All legacy data is safely preserved under the demo user.
