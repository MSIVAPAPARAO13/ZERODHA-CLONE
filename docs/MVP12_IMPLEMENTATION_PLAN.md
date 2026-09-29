# MVP-12 Implementation Plan: Behavioral Edge Engine

## 1. Goal
Implement a deterministic Behavioral Analytics Service that answers "What recurring patterns exist in my trading process?" using evidence from TradeJournal and TradeReplay. Feed these deterministic facts to an AI endpoint for contextual reflection, avoiding hallucinations.

## 2. Core Service
Create `backend/services/behaviorAnalyticsService.js`:
- Fetch trades within the requested time window (7D, 30D, 90D, ALL).
- Minimum sample size protection (`MIN_PATTERN_SAMPLE = 5`).
- Calculate base metrics (win rate, average P&L, hold times).
- Calculate Strategy / Confidence grouping.
- Compute Journal completeness.
- Compute Plan vs. Execution metrics (Target recorded, risk recorded, target hit, risk crossed, exit before target).
- Compute MFE/MAE based on historical Replay data (if available).
- Detect Behavioral Patterns (e.g. TARGET_WITHOUT_RISK, EXIT_BEFORE_TARGET) only when `trades >= 5`.

## 3. Data Integration
This service will rely heavily on:
- `TradeJournalModel`
- `TransactionModel`
- `tradeReplayService.getReplay` (to fetch chronological facts).

Since replaying all trades dynamically might be expensive, we will limit the processing window. Note: MVP-10 `tradeReplayService` derives the outcome directly.

## 4. API Endpoints
Update `aiRoutes.js` (or create `analyticsRoutes.js`) with:
- `GET /api/v1/analytics/behavior?window=30d` (Deterministic JSON)
- `GET /api/v1/ai/behavior-review?window=30d` (AI reflection based on the deterministic JSON).

## 5. AI Service Updates
Update `aiAnalystService.js` and `aiContextService.js` to process `BEHAVIOR_REVIEW`. The prompt will strictly instruct the AI to parse the factual `analytics` object and provide qualitative reflection.

## 6. Frontend
Create `BehaviorInsights.js` inside `dashboard/src/components`. Add routes and sidebar menu link.
The view will display deterministic stats in tables/cards (Strategy, Confidence, Journal completeness, MFE/MAE) and a button to trigger "AI Reflection" on the patterns.

## 7. Security and Validation
- Ensure all queries are scoped by `userId`.
- No financial records are mutated.
- The AI prompt clearly defines "Do not give investment advice, do not predict prices."
