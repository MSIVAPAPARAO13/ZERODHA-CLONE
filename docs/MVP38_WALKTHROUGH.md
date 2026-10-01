# MVP-38 WALKTHROUGH — MARKET EVENT INTELLIGENCE ENGINE

## 1. Overview

MVP-38 upgrades TradeFlow from simplistic isolated alerts into an integrated **Market Event Intelligence Engine**. It continuously evaluates market data, scanners, and alerts across the user's monitored assets, normalizes signals, deterministically classifies severity, clusters co-occurring signals into correlation events, deduplicates repeatedly observed events using SHA-256 time-bucketing, and bridges directly into the MVP-37 Research Copilot.

---

## 2. Key Components Created

### Backend Architecture
1. **`MarketEventModel.js`**:
   - Mongoose model strictly tied to authenticated `user` ObjectId.
   - Controlled event types (`PRICE_MOVE`, `VOLUME_SURGE`, `VOLATILITY_CHANGE`, `TECHNICAL_BREAKOUT`, `TECHNICAL_BREAKDOWN`, `SCANNER_ENTRY`, `ALERT_TRIGGERED`, `CORRELATED_EVENT`).
   - Deterministic severity scale (`INFO`, `WATCH`, `SIGNIFICANT`, `CRITICAL`).
   - Compound indexes: `{ user, occurredAt: -1 }`, `{ user, symbol, occurredAt: -1 }`, and unique `{ user, dedupeKey }`.
2. **`marketEventService.js`**:
   - Reuses `marketDataService`, `marketScannerService`, `AlertModel`, `WatchlistModel`, `HoldingsModel`, and `PositionsModel`.
   - `detectPriceAndVolumeEvents()`: Extracts quote & 20-day historical baseline to flag price moves, unusual volume, and 20-day breakouts/breakdowns.
   - `detectScannerEvents()`: Evaluates momentum scanner rules against user assets.
   - `detectAlertEvents()`: Evaluates user triggered alerts.
   - `correlateAndClusterEvents()`: Clusters multiple co-occurring signals on the same symbol into a unified `CORRELATED_EVENT` with elevated severity.
   - `generateDedupeKey()`: SHA-256 hash across `userId + symbol + eventType + hourlyBucket` guaranteeing zero duplicate spam.
3. **`eventsController.js` & `eventsRoutes.js`**:
   - `GET /api/v1/events` (paginated, filtered by severity, symbol, read status).
   - `GET /api/v1/events/:id`.
   - `PATCH /api/v1/events/:id/read`.
   - `PATCH /api/v1/events/read-all`.
   - `POST /api/v1/events/evaluate`.
   - Mounted at `/api/v1/events` behind `authMiddleware`.
4. **`test_mvp38.js`**:
   - 24/24 automated tests passing.
   - Zero financial ledger mutation verified.

### Frontend Architecture
1. **`Events.js` & `Events.css`**:
   - Severity filtering chips (`ALL`, `CRITICAL`, `SIGNIFICANT`, `WATCH`, `INFO`).
   - Confluence cluster highlights for multi-signal events.
   - Detailed event inspection modal with raw observed metric records.
   - One-click `[🔬 Investigate]` button bridging directly into `/research`.
2. **`Dashboard.js` & `Menu.js`**:
   - Mounted `/events` route.
   - Added `Events` nav item under the Research group.

---

## 3. Workflow Verification

```text
1. User adds TCS to Watchlist or holds TCS
2. Market Event Service evaluates market state
3. Signals detected:
   - Price Gain +4.2% (PRICE_MOVE)
   - Volume 1.8x (VOLUME_SURGE)
   - Momentum Scanner matched 3/3 (SCANNER_ENTRY)
4. Clustering Engine combines signals into:
   "TCS Momentum Confluence (3 Signals)" [CRITICAL]
5. User clicks [Investigate] on the event
6. Research Copilot opens with:
   question: "Why did TCS generate this CORRELATED EVENT event today?"
   symbol: "TCS"
   intent: "EVENT_INVESTIGATION"
7. Grounded multi-source evidence is retrieved with zero financial mutation.
```
