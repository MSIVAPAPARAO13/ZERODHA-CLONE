# Product Requirements Document (PRD)

## 1. Product Vision
TradeFlow SaaS is an AI-powered trading, paper-trading, and portfolio intelligence platform designed to bridge the gap between beginner retail investors and advanced trading analytics. It provides a risk-free environment for learning and an intelligent dashboard for portfolio management.

## 2. Problem Statement
- **Beginner Traders**: Find professional trading platforms overwhelming and lack a safe space to practice without financial risk.
- **Retail Investors**: Struggle to track portfolio performance intuitively and understand why their portfolio changes daily.
- **Active Learners**: Lack tools that provide clear, educational explanations of market movements and trade outcomes.

## 3. Target Users
- **The Learner**: Wants to practice trading strategies risk-free (paper trading).
- **The Casual Investor**: Wants a clean, simple dashboard to track long-term holdings.
- **The Analytical Trader**: Wants a trading journal, backtesting, and AI-driven portfolio insights.

## 4. Product Goals
- Provide a scalable, robust MERN-stack architecture for trading simulation.
- Deliver a modern, premium UI/UX that rivals top-tier SaaS products.
- Incorporate AI to explain market movements and portfolio performance.
- Ensure the application is easily deployable and highly maintainable.

## 5. Non-Goals
- We are not building a real broker (no real money or clearinghouse integration).
- We are not building high-frequency trading (HFT) infrastructure.
- We will not focus on complex derivatives or options in the MVP.

## 6. Core Features (Existing + Planned)
- **Authentication**: Secure user login and authorization (JWT).
- **Dashboard**: High-level portfolio summary.
- **Holdings & Positions**: Tracking long-term and short-term investments.
- **Watchlist**: Real-time or simulated market data tracking.
- **Order Execution**: Buy/Sell market and limit orders (simulated).

## 7. Unique Features (Differentiators)
- **Paper Trading Engine**: A fully accounted virtual trading environment.
- **AI Portfolio Explanation**: "What Changed Today?" AI summaries.
- **Trading Journal**: Automated logging of trade rationale and outcomes.
- **Market Intelligence Dashboard**: Abstracted provider for market data with mock fallbacks.
- **Market Event Cascade & Thesis Impact**: Multi-hop evidence propagation connecting macro/earnings catalysts through sector taxonomies to portfolio exposures, active playbooks, and user-authored theses with structured drift diffs and research question synthesis.
- **Advanced Scenario & Stress Studio**: Deterministic what-if stress testing enabling users to simulate asset, sector, and broad index shocks on active paper holdings with exact mathematical loss attribution, strategy exposure mapping, thesis impact linking, what-if position simulations, and transparent calculation methodology without making predictions or mutating financial ledgers.
- **Strategy Research & Backtesting 2.0**: Systematic historical backtesting engine with strict zero look-ahead protection, parameter grid experiments with sensitivity analysis, overfitting risk detection, out-of-sample walk-forward validation, and direct integration with Stress Studio and Thesis Review workflows.


## 8. User Stories
- As a user, I want to create a paper-trading order, so that I can practice trading without risking real money.
- As a user, I want to view a breakdown of my portfolio's daily P&L, so I can understand my performance.
- As a user, I want to ask the AI to explain a sudden drop in a stock on my watchlist.
- As an admin, I want to manage simulated market data for testing purposes.

## 9. Functional Requirements
- System must support market and limit orders.
- Portfolio values must update dynamically based on market data.
- Users must have isolated workspaces/accounts.
- AI features must use structured data context (e.g., passing portfolio JSON to the AI prompt).

## 10. Non-Functional Requirements
- **Security**: Passwords hashed, JWT tokens, helmet, rate-limiting.
- **Performance**: API responses under 200ms.
- **Maintainability**: Modular architecture (controllers, services, models).
- **Observability**: Centralized error logging.

## 11. UX Requirements
- Modern SaaS aesthetics (vibrant colors, glassmorphism, smooth micro-animations).
- Responsive design for mobile and desktop.
- Clear empty, loading, and error states.

## 12. API Requirements
- RESTful conventions (`GET /api/v1/portfolio`, `POST /api/v1/orders`).
- Standardized response format: `{ success: true, data: {}, error: null }`.

## 13. Database Requirements
- MongoDB schemas for Users, Portfolios, Orders, Holdings, Positions, and Transactions.

## 14. Security Requirements
- Secure environment secrets.
- CORS configured for the specific frontend origin.
- Input validation on all endpoints.

## 15. Testing Requirements
- Jest/Supertest for API endpoints.
- React Testing Library for frontend components.
- Post-deployment health checks.

## 16. Deployment Requirements
- Frontend: Vercel/Netlify.
- Backend: Render.
- DB: MongoDB Atlas.

## 17. MVP Definition
- **MVP 1**: Architecture cleanup.
- **MVP 2**: Authentication.
- **MVP 3**: Core Trading Domain (Users, Portfolio, Orders).
- **MVP 34**: Advanced Scenario & Stress Studio.
- **MVP 35**: Strategy Research & Backtesting 2.0 (Walk-forward, train/test, parameter optimization).
- **MVP 36**: Intelligent Market Scanner & Opportunity Research Engine (Discovery, Rule DSL AST, Multi-Engine Bridges).

## 18. Future Roadmap
- **MVP 37**: Automated Scan-Alert triggers & cross-asset event discovery.
- **MVP 38**: Real-time streaming scanner integration.
