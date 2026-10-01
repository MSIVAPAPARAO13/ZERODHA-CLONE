# MVP-30 Implementation Plan: Portfolio Intelligence

## 1. Architecture
- **PortfolioIntelligenceService**: The orchestrator. Fetches data from `PortfolioService`, `PlaybookService`, and `StrategyLabService`.
- **StrategyOverlapService**: Calculates intersection of arrays (symbols, sectors, regimes) across active strategies.
- **ExposureService**: Normalizes the ₹ value of current positions and maps them backwards via Playbook IDs to their originating strategy.

## 2. Methodology
- **Strategy Overlap**: Matrix intersection. If 3 strategies trade INFY, the overlap depth is 3.
- **Capital Contention**: Sum of all active Playbook maximum allocation rules minus actual available Virtual Balance.
- **Conflict Detection**: Scans active Playbooks for opposing entry signals on the same underlying asset on the same interval.

## 3. Caching & Limits
Heavy overlap calculations on large portfolios (e.g., >500 positions) will be paginated or cached on a 15-minute interval to prevent Node event-loop blocking.

## 4. API Boundaries
New endpoints:
- `GET /api/v1/portfolio-intelligence/exposure`
- `GET /api/v1/portfolio-intelligence/overlap`
- `GET /api/v1/portfolio-intelligence/conflicts`
