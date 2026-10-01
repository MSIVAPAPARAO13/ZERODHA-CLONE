# MVP-50 Implementation Plan — Personal Research & Learning Coach (Capstone)

## Objective
Establish the capstone personal learning intelligence layer connecting Research, Events, Portfolio, Strategies, Backtests, Decisions, and the Journal into a unified learning loop.
This is strictly educational meta-research assistance ("AI helps me understand my own research process"), NOT securities recommendations ("AI tells me what to buy").

## Architecture
1. **Model** (`backend/models/LearningProfileModel.js`):
   - Aggregates activity counters across all TradeFlow modules.
   - Evaluates factual knowledge gaps (Technical, Backtesting, Scenario, Fundamental, Portfolio Exposure, Documentation).
   - Generates non-pressuring research questions.
   - Tracks stage along the canonical Learning Loop:
     `RESEARCH → EXPERIMENT → RESULT → REVIEW → LESSON → NEXT QUESTION`.
2. **Service** (`backend/services/learningCoachService.js`):
   - Queries actual database state across `ResearchSession`, `MarketEvent`, `PortfolioScenario`, `Strategy`, `StrategyNotebook`, `DecisionJournal`, and `TradeJournal`.
   - Derives empirical knowledge gaps without black-box scores.
   - Generates factual research questions grounded in the user's specific activity.
3. **Controller & Routes**:
   - `backend/controllers/learningCoachController.js`
   - `backend/routes/learningCoachRoutes.js` mounted at `/api/v1/learning`
4. **End-to-End Capstone Verification** (`backend/test_mvp50.js`):
   - Complete 10-step integration pipeline connecting:
     `Market Event → Portfolio Impact → Research → Scenario → Strategy Version → Robustness → Decision → Paper Trade → Trade Review → Learning Coach → Next Question`.
   - User isolation, zero financial mutation, regression of all prior MVPs.
