# MVP-38 IMPLEMENTATION PLAN — MARKET EVENT INTELLIGENCE ENGINE

## 1. Executive Summary

MVP-38 transforms TradeFlow from simple threshold alerts ("Price crossed ₹3500") into a connected **Market Event Intelligence Engine** answering: *"What meaningful market event just happened, how do multiple signals correlate, and what evidence should be investigated?"*

```text
MARKET DATA / SCANNER / ALERTS / WATCHLIST / PORTFOLIO
                        ↓
            EVENT DETECTION RULES
                        ↓
             EVENT NORMALIZATION
                        ↓
       DETERMINISTIC SEVERITY & IMPORTANCE
                        ↓
         CORRELATION & CLUSTERING ENGINE
                        ↓
           SHA-256 DEDUPLICATION
                        ↓
           MARKET EVENT INTELLIGENCE
                        ↓
           INVESTIGATE (COPILOT)
```

## 2. Supported Event Types

| Event Type | Source Service | Trigger Condition | Status |
|---|---|---|---|
| `PRICE_MOVE` | `marketDataService` | Session price change absolute value >= 1.0% | Supported |
| `VOLUME_SURGE` | `marketDataService` | Current volume >= 1.2x 20-day baseline | Supported |
| `VOLATILITY_CHANGE` | `marketDataService` | 20-day annualized volatility expansion >= 25% | Supported |
| `TECHNICAL_BREAKOUT` | `marketDataService` | Price breaks above 20-day high with volume support | Supported |
| `TECHNICAL_BREAKDOWN` | `marketDataService` | Price breaks below 20-day low | Supported |
| `SCANNER_ENTRY` | `marketScannerService` | Symbol freshly matches configured scanner criteria | Supported |
| `SCANNER_EXIT` | `marketScannerService` | Symbol no longer satisfies scanner criteria | Supported |
| `MARKET_BREADTH_CHANGE`| `marketScannerService` | Benchmark sector net advances/declines shift | Supported |
| `SECTOR_CHANGE` | `scenarioEngine` / `marketDataService` | Sector average move >= 1.5% | Supported |
| `ALERT_TRIGGERED` | `alertService` | User price condition crosses active threshold | Supported |
| `PORTFOLIO_EXPOSURE_CHANGE`| `HoldingsModel` | Holding weight shifts >= 3% due to market movement | Supported |
| `STRATEGY_SIGNAL_CHANGE` | `backtestEngine` | Rule condition changes state (BUY/SELL signal) | Supported |
| `RESEARCH_EVIDENCE_CHANGE` | `researchCopilotService` | Evidence metric changes state for monitored symbol | Supported |

*(Note: If underlying data is missing or inaccessible, the engine flags `UNSUPPORTED` and refuses to fake values.)*

## 3. Data Model (`backend/models/MarketEventModel.js`)

```javascript
{
  user: ObjectId (ref: User, required, indexed),
  symbol: String (uppercase, indexed),
  eventType: String (enum of supported types),
  severity: String (enum: ['INFO', 'WATCH', 'SIGNIFICANT', 'CRITICAL']),
  title: String,
  description: String,
  category: String (enum: ['MARKET', 'WATCHLIST', 'PORTFOLIO', 'SCANNER', 'ALERT', 'STRATEGY', 'RESEARCH']),
  
  observedData: [{
    metric: String,
    value: Mixed,
    unit: String,
    provider: String,
    timestamp: Date
  }],
  sourceReferences: [{
    sourceType: String,
    sourceId: String,
    details: Mixed
  }],

  previousValue: Number,
  currentValue: Number,
  changeValue: Number,
  changePercent: Number,

  provider: String,
  occurredAt: Date (default: Date.now, indexed),

  dedupeKey: String (indexed, unique within user+timeBucket),
  clusterId: String (indexed, groups correlated events),
  correlatedSignals: [{
    symbol: String,
    eventType: String,
    description: String,
    metric: String,
    value: Mixed
  }],

  isRead: Boolean (default: false),
  isDismissed: Boolean (default: false),
  tags: [String]
}
```

Compound Indexes:
- `{ user: 1, occurredAt: -1 }`
- `{ user: 1, symbol: 1, occurredAt: -1 }`
- `{ user: 1, dedupeKey: 1 }` (unique)
- `{ user: 1, isRead: 1, isDismissed: 1 }`

## 4. Deterministic Severity Rules

No arbitrary or opaque AI scores. Rules are completely transparent:
- `INFO`: Single minor movement (< 1.5% price change, volume 1.0x - 1.2x).
- `WATCH`: Moderate movement (1.5% - 3.0% price move, or volume 1.2x - 1.5x).
- `SIGNIFICANT`: Strong signal (>= 3.0% price move, or volume >= 1.5x, or fresh SCANNER_ENTRY, or ALERT_TRIGGERED).
- `CRITICAL`: Correlated multi-signal confluence (e.g. Price move >= 2.5% AND Volume >= 1.5x AND Scanner entry simultaneously, or Alert triggered on large portfolio holding).

## 5. Event Correlation & Clustering

When multiple signals occur on the same symbol within the observation window (e.g. 1 hour):
- Compute deterministic cluster identifier: `cluster_${user}_${symbol}_${dateBucket}`.
- Create or update the primary `CORRELATED_EVENT` containing individual supporting signals in `correlatedSignals`.
- Elevate severity to `CRITICAL` or `SIGNIFICANT`.
- Synthesize an integrated title: e.g. *"TCS Momentum Confluence (Price +4.2%, Volume 1.8x, Scanner Match)"*.

## 6. Deterministic Deduplication

Compute SHA-256 hash `dedupeKey`:
`SHA256(userId + ":" + symbol + ":" + eventType + ":" + hourBucket)`
This prevents runaway background loops or duplicate events on repeated scans.

## 7. API Specification

- `GET /api/v1/events` — Paginated list of events for `req.user.userId` with filters (`severity`, `symbol`, `isRead`, `category`).
- `GET /api/v1/events/:id` — Single event details with correlated signals and source evidence.
- `PATCH /api/v1/events/:id/read` — Mark event as read.
- `PATCH /api/v1/events/read-all` — Mark all user events as read.
- `POST /api/v1/events/evaluate` — Evaluates active watchlist, alerts, and portfolio holdings against current market state to generate fresh events safely.

## 8. Cross-Module Bridges

- **Event → Research Copilot**: One-click investigate action passing `{ eventId, symbol, intent: 'EVENT_INVESTIGATION', question: 'Why did ${symbol} generate this ${eventType} event today?' }`.
- **Event → Alert Bridge**: When alerts trigger via `alertService`, seamlessly create an `ALERT_TRIGGERED` MarketEvent.
- **Event → Watchlist/Portfolio Bridge**: Focus event generation specifically on user's active holdings, positions, and watchlist symbols to avoid noise.

## 9. Automated Testing Plan (`backend/test_mvp38.js`)

1. Event creation & validation
2. User ownership & multi-tenant isolation
3. Price move detection & normalization
4. Volume surge detection & normalization
5. Technical breakout detection
6. Scanner entry event generation
7. Alert triggered event generation
8. Deterministic severity calculation (INFO / WATCH / SIGNIFICANT / CRITICAL)
9. Event correlation & clustering (multi-signal confluence)
10. Deterministic SHA-256 deduplication
11. Read / unread / mark-all-read operations
12. Filter & pagination query performance
13. Unsupported event / missing data handling
14. Provider failure isolation
15. Zero financial ledger mutation
16. Regression: MVP-1 → MVP-37 verification
