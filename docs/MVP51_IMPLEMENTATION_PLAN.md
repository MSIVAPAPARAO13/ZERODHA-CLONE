# MVP-51 Implementation Plan — Personal Automation Engine

## Objective
Establish a controlled, non-trading automation engine that schedules recurring research and portfolio intelligence workflows.
Explicitly forbids automated trade execution (no BUY/SELL).

## Architecture
1. **Model** (`backend/models/AutomationModel.js`):
   - User ownership, automation type, schedule cadence, enabled state, execution history.
   - Types: `DAILY_BRIEF`, `PORTFOLIO_REVIEW`, `RESEARCH_REVIEW`, `STRATEGY_REVIEW`, `JOURNAL_REVIEW`, `EVENT_DIGEST`.
2. **Service** (`backend/services/automationService.js`):
   - CRUD management with multi-tenant user isolation.
   - Execution dispatcher invoking existing intelligence services:
     - `PORTFOLIO_REVIEW` -> `portfolioIntelligenceService`
     - `DAILY_BRIEF` -> `marketNarrativeService`
     - `JOURNAL_REVIEW` -> `journalIntelligenceService`
     - `STRATEGY_REVIEW` -> `strategyNotebookService`
     - `RESEARCH_REVIEW` -> `decisionJournalService`
     - `EVENT_DIGEST` -> `marketEventService`
   - Guarantees zero balance or order mutation.
3. **Controller & Routes**:
   - `backend/controllers/automationController.js`
   - `backend/routes/automationRoutes.js` mounted at `/api/v1/automations` in `backend/index.js`
4. **Automated Testing** (`backend/test_mvp51.js`):
   - Creation, listing, updating, deletion
   - Manual task execution dispatching
   - Validation & duplicate prevention
   - Multi-tenant user isolation
   - Zero financial ledger mutation
