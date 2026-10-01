# MVP-37 BATCH STATUS AUDIT

## STATUS CLASSIFICATION

### 1. IMPLEMENTED
- **ResearchSessionModel**: Located at `backend/models/ResearchSessionModel.js`. Implements full session schema, strictly scoped to `userId` via ObjectId, containing `intent`, `symbol`, `status`, `evidenceBundle`, `aiReport`, `researchHash`, `gapAnalysis`, `evidenceGraph`, `followUpQuestions`.
- **researchCopilotService**: Located at `backend/services/researchCopilotService.js`.
  - Intent classification (`SYMBOL_DEEP_DIVE`, `COMPARISON`, `TECHNICAL_ANALYSIS`, `SCANNER_EXPLANATION`, `PORTFOLIO_CHECK`, `EVENT_INVESTIGATION`, `GENERAL`).
  - Controlled Tool Registry: quote, historical, scanner, watchlist, alert, portfolio, thesis, journal, backtest bridge, stress bridge.
  - Zero arbitrary code execution / zero eval / zero dynamic query injection.
  - Evidence Taxonomy (`OBSERVED`, `DERIVED`, `INTERPRETED`, `UNKNOWN`, `LIMITATION`).
  - Strict Data Provenance (`provider`, `timestamp`, `symbol`, `sourceType`, `metric`, `value`).
  - Grounded AI integration via `aiAnalystService.generateResearchCopilotReport()`.
  - Comparison engine (`compareSymbols`).
  - Deep research synthesis (`deepResearch`).
  - Research Gap Detector (`identifyGaps`).
  - Evidence Graph generation (`buildEvidenceGraph`).
  - Deterministic SHA-256 research hashing (`computeResearchHash`).
- **Research Controller & Routes**: Located at `backend/controllers/researchController.js` and `backend/routes/researchRoutes.js`.
  - `POST /api/v1/research/investigate`
  - `POST /api/v1/research/compare`
  - `POST /api/v1/research/deeper`
  - `GET /api/v1/research/sessions`
  - `GET /api/v1/research/sessions/:id`
  - `PATCH /api/v1/research/sessions/:id`
  - `DELETE /api/v1/research/sessions/:id`
  - All protected by `authMiddleware` using `req.user.userId`.
- **Automated Test Suite**: Located at `backend/test_mvp37.js`. 40/40 tests passing with 0 failures.
- **Backend Route Mount**: Registered in `backend/index.js` under `/api/v1/research`.

### 2. PARTIALLY IMPLEMENTED
- **Research Copilot UI**: Backend APIs and contracts are 100% complete and passing tests. Frontend component `dashboard/src/components/ResearchCopilot.js` and route in `Dashboard.js` are currently being wired up in the React app.
- **Cross-module "Investigate" Buttons**: Scanner, Watchlist, Alert pages need one-click navigation bridge `?symbol=...&intent=...` to `/research`.

### 3. MISSING
- None in backend. Frontend component creation and route registration in progress.

### 4. BROKEN
- None. All 40 MVP-37 backend tests pass.

### 5. DUPLICATED
- None. Reused existing `marketDataService`, `marketScannerService`, `backtestEngine`, `scenarioEngine`, `watchlistService`, `alertService`, `HoldingsModel`, `PositionsModel`, `TradeJournalModel`.
