# MVP-1 Implementation Plan

## 1. Current Relevant Files
- `backend/index.js` (monolithic routing and connection)
- `backend/models/*.js` and `backend/schemas/*.js` (duplicate DB structure)
- `backend/package.json`
- `dashboard/src/components/*.js` (flat frontend structure)
- `dashboard/src/data/data.js` (static mock data)
- `dashboard/package.json`

## 2. Files to Create
- `backend/config/db.js` (database connection logic)
- `backend/middleware/errorHandler.js` (centralized error handling)
- `backend/validators/orderValidator.js` (Joi validation for orders)
- `backend/routes/portfolioRoutes.js` (holdings, positions)
- `backend/routes/orderRoutes.js`
- `backend/controllers/portfolioController.js`
- `backend/controllers/orderController.js`
- `backend/.env.example`
- `dashboard/src/services/api.js` (Axios API client)

## 3. Files to Move/Consolidate
- Consolidate `backend/schemas/` into `backend/models/`. The authoritative implementation will be the model defining both the schema and exporting the mongoose model in one file.
- Move components inside `dashboard/src/components` to `dashboard/src/pages` if they act as top-level views (e.g., `Dashboard.js`, `Holdings.js`, `Positions.js`, `Orders.js`). Keep truly reusable components in `components/`.

## 4. Files to Modify
- `backend/index.js` (refactor to just app startup and middleware registration)
- `dashboard/src/components/Holdings.js` (use API client, improve UI/UX, add loading states)
- `dashboard/src/components/Positions.js` (use API client, improve UI/UX, add loading states)
- `dashboard/src/components/WatchList.js` (improve UI/UX)
- `dashboard/src/components/Dashboard.js` (layout updates)
- `dashboard/src/index.css` (implement basic design system tokens)

## 5. Files that Should Remain Unchanged
- `dashboard/public/*`
- Build configs, general non-UI `react-scripts` boilerplate.

## 6. Dependencies to Install
**Backend:**
- `helmet`: Security headers.
- `joi`: Request validation.
- `morgan`: Structured logging.

**Frontend:**
- `react-hot-toast`: Toast notifications (needed for orders/errors).

## 7. Dependencies to Remove
**Backend:**
- `passport`, `passport-local`, `passport-local-mongoose`: Currently unused and will be implemented later in MVP-2 when we actually build auth. It's safer to remove unused dependencies for now.
- `body-parser`: Obsolete since `express.json()` is available.

## 8. Backend Changes
- Establish standard MVC layers (routes, controllers).
- Implement centralized error response formatter (`{ success, data, error }`).
- Add Joi validation to the `POST /api/v1/orders/new` route.
- Prefix existing API routes with `/api/v1/`.

## 9. Frontend Changes
- Create `api.js` Axios wrapper with a configurable `baseURL`.
- Update all components to use the new `api.js` client instead of raw Axios.
- Adjust endpoints to match the new `/api/v1/` prefix.

## 10. UI Changes
- Introduce loading skeletons or simple "Loading..." indicators for Holdings and Positions.
- Create explicit "Empty States" for Orders and Holdings.
- Refine padding, colors, and border-radius in `index.css` to look more modern.
- Add success/error toast notifications for order creation.

## 11. Testing Strategy
- Manual API testing (start backend, hit endpoints via a script or curl).
- UI testing (start frontend, navigate routes, place an order).
- Intentional failure testing (send bad data to `newOrder` and verify validation rejection).

## 12. Risks
- Restructuring the monolithic `index.js` might break existing endpoint names.
- Moving files in React might break imports.

## 13. Rollback Considerations
- Use Git carefully. Group changes into small commits.
- If the frontend fails to compile due to a moved file, trace the import and fix it rather than reverting immediately.

## 14. Definition of Done
- Validation added to orders.
- Error middleware works.
- Duplicate models removed.
- Frontend uses central API client.
- UI looks more polished (empty/loading states).
- Tests pass.
