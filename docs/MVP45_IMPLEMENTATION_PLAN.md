# MVP-45 Implementation Plan — Market Narrative Engine

## Objective
Convert raw market events, regime classifications, sector movements, and portfolio exposures into a grounded, structured, evidence-based market narrative.
Zero financial predictions, zero invented facts.

## Narrative Structure
1. **What Changed?** (Observable trend, breadth, regime shifts + evidence)
2. **What is Unusual?** (Volume surges, critical severity events, volatility deviations + evidence)
3. **Which Sectors Changed?** (Top sector moves, breadth discrepancies + evidence)
4. **Which Monitored Assets Were Affected?** (User holdings / watchlist items with active events + evidence)
5. **What Remains Unknown?** (Corporate actions, fundamental earnings data limitations + evidence)

## Architectural Components
1. **Service** (`backend/services/marketNarrativeService.js`):
   - Gathers deterministic evidence from `marketRegimeService`, `sectorIntelligenceService`, `marketEventService`, and user holdings.
   - Builds 5 structured sections with explicit citations.
   - Synthesizes grounded narrative summary without speculative or predictive language.
2. **Controller & Routes**:
   - `GET /api/v1/market/narrative` in `marketController.js` and `marketRoutes.js`.
3. **Automated Testing** (`backend/test_mvp45.js`):
   - Verification of 5 mandatory narrative sections
   - Verification of deterministic evidence citations
   - Rejection of predictive phrasing
   - User isolation & zero financial mutation
   - Regression MVP-37 through MVP-44
