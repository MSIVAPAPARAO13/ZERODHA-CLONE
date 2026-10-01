# MVP-31 Implementation Plan: Portfolio Change Intelligence

## 1. Architecture
- **PortfolioSnapshotModel**: A lightweight daily/periodic snapshot saving exposure and overlap states to calculate deltas.
- **PortfolioChangeDetectionService**: Compares Snapshot T against Snapshot T-1. Generates `PortfolioChangeEvent` objects if deltas exceed configured thresholds (e.g., >5% exposure drift).
- **EvidenceAttributionEngine**: Traverses relationships. If exposure increased, it queries the `TransactionModel` to find the associated BUY order and attaches it to the event.

## 2. Methodology
- **Idempotency**: Snapshots are hashed. Running detection twice on the same hash returns the cached events without creating duplicates.
- **Event Taxonomy**: Strictly typed string enums (`EXPOSURE_CHANGED`, `STRATEGY_OVERLAP_CHANGED`, `CAPITAL_CONTENTION_DETECTED`).
- **Attribution**: Events maintain a `sourceId` pointing to the exact Order, Playbook, or Market Data shift that caused the delta.

## 3. Caching & Limits
Detection logic is computationally bounded by daily/hourly snapshots to prevent database thrashing on every page load.

## 4. API Boundaries
New endpoints:
- `GET /api/v1/portfolio-changes/today`
- `GET /api/v1/portfolio-changes/:id`
