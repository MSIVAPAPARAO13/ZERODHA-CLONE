# Development Roadmap

## MVP 0: Repository Audit + Documentation (Current Phase)
- Analyze existing structure.
- Generate PRD, Architecture, and Gap Analysis docs.

## MVP 1: Architecture + Codebase Cleanup
- Restructure backend into `controllers/`, `services/`, `routes/`, `middleware/`.
- Setup `.env` configuration and centralized error handling.
- Setup basic API request validation.

## MVP 2: Authentication + Authorization
- Create `User` model.
- Implement JWT-based login/register flow.
- Add authentication middleware to protect routes.

## MVP 3: Core Trading Domain
- Update `Holdings`, `Positions`, and `Orders` models to reference a `User`.
- Implement API endpoints for fetching user-specific portfolio data.
- Refactor frontend to use authenticated requests.

## MVP 4: Paper Trading Engine
- Add `virtualBalance` to the `User` model.
- Implement logic in order placement to check balance, deduct funds, and update holdings/positions accordingly.
- Create `Transaction` model for accounting history.

## MVP 5: Market Data Abstraction
- Create a `MarketDataProvider` service abstraction.
- Implement a robust MockProvider.
- Update the frontend to poll or fetch real-time simulated prices.

## MVP 6: Watchlists + Search
- Create a `Watchlist` model linked to `User`.
- Implement dynamic search for instruments.
- Allow users to add/remove instruments from their watchlist.

## MVP 7: Alerts + Notifications
- Implement basic in-app notifications for order execution.
- Create UI for toast notifications.

## MVP 8: Portfolio Analytics
- Improve the Dashboard UI to show historical portfolio value.
- Add advanced charting.

## MVP 9: Trading Journal
- Allow users to add notes and tags to specific executed orders.

## MVP 10: Backtesting
- Basic UI and backend engine to simulate a strategy over historical mock data.

## MVP 11: AI-Powered Explanations
- Integrate an LLM provider.
- Add a "Summarize my day" button that feeds portfolio data to the AI for analysis.

## MVP 12: SaaS Capabilities
- Add user settings, profile management, and mock subscription tiers.

## MVP 13: Admin Dashboard
- Basic view for admins to monitor total active users and system health.

## MVP 14: Production Hardening
- UI/UX polish (loading skeletons, empty states, error boundaries).
- Security audit (Helmet, CORS, rate limiting).
- Comprehensive testing.

## MVP 15: Deployment
- Deploy to Vercel/Render/MongoDB Atlas.
