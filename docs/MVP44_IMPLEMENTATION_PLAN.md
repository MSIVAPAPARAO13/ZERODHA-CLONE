# MVP-44 Implementation Plan — Sector Intelligence Engine

## Objective
Create a comprehensive sector-level intelligence layer connecting real market quotes, sector breadth, volume momentum, market event frequency, and user portfolio exposure.

## Architecture
1. **Taxonomy & Constituents**:
   - Reuses `VERIFIED_TAXONOMY` and `marketMetadata.js`.
   - Organizes benchmark securities into verified sector baskets (IT, Financial Services, Energy, Consumer Goods, Auto, Pharma, Metals).
2. **Sector Intelligence Service** (`backend/services/sectorIntelligenceService.js`):
   - Computes transparent sector metrics: Average Price Change, Breadth (advancing vs declining), Volume, Momentum, Event Count.
   - Computes user portfolio linkage: User exposure %, user holdings in sector, investigation prompts.
   - Sector comparison: Metric-by-metric comparison between any two sectors without black-box scores.
   - Sector event emitter: Emits `SECTOR_CHANGE` to `MarketEventModel` when material shift is detected.
3. **Controller & Routes**:
   - `backend/controllers/sectorController.js`
   - `backend/routes/sectorRoutes.js` mounted at `/api/v1/sectors` in `backend/index.js`
4. **Testing** (`backend/test_mvp44.js`):
   - Sector aggregation & breadth
   - Portfolio exposure cross-linkage
   - Sector side-by-side comparison
   - Material sector event generation
   - Missing metadata handling
   - User isolation
   - Zero financial ledger mutation
   - Regression MVP-37 through MVP-43
