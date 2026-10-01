# MVP-34 Implementation Plan: Advanced Scenario & Stress Studio

## 1. System Overview

MVP-34 implements TradeFlow's **Advanced Scenario & Stress Studio**, providing a deterministic, non-predictive portfolio shock and what-if simulation engine. It allows authenticated traders to test hypothetical market disruptions, sector shocks, and historical stress events against their paper-trading portfolio.

---

## 2. Core Architecture & Components

```text
               Client Request: POST /api/v1/scenarios/run
                                  │
                                  ▼
                     [scenarioController.js]
                                  │
                                  ▼
                      [scenarioEngine.js]
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
    [Portfolio Service]   [MarketDataService]   [marketMetadata.js]
     Holdings & Positions  Current Quotes        Verified Taxonomies
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  ▼
                    [Multiplicative Shock Model]
                     - Combines Market, Sector, Asset
                     - Strict Double-Counting Elimination
                                  ▼
                   [Impact & Attribution Engine]
                     - Baseline vs Scenario Valuation
                     - Holding-Level Loss Attribution
                     - Largest Drag & Offsetting Positions
                                  ▼
                  [Strategy & Thesis Intersections]
                     - Playbook Exposure Mapping
                     - Thesis Risk Threshold Flags
                                  ▼
                    [What-If Position Simulator]
                     - Optional Simulated Assets Add/Drop
                                  ▼
                    [Scenario Cache & Response]
                     - Deterministic Hash Caching
                     - Exposes Methodology & Calculation Version
```

---

## 3. Supported Scenario Types & Presets

### 3.1 Scenario Types
1. **Type A: Single Security Shock**: Shocks a single ticker symbol (e.g., `TCS -15%`).
2. **Type B: Multi-Security Shock**: Independent shocks across multiple specific holdings (e.g., `TCS -10%`, `INFY -8%`, `RELIANCE +5%`).
3. **Type C: Sector Shock**: Shocks all held assets mapped to a verified sector in `marketMetadata.js` (e.g., `Information Technology -15%`).
4. **Type D: Index Shock**: Shocks the broader benchmark market index (e.g., `NIFTY 50 -10%`), applying across all portfolio assets.
5. **Type E: Multi-Shock Combinations**: Simultaneously applying index, sector, and asset-level shocks using the multiplicative combination model.
6. **Type F: Historical Replay**: Replaying documented historical stress periods (e.g., March 2020 Liquidity Shock, 2022 Tech Valuation Drawdown) using verified historical price deltas with strict look-ahead protection.

### 3.2 Curated Presets
- **IT Sector Correction**: `IT Sector -15%`, Horizon: 1 Day, Severity: `MODERATE`.
- **Broad Market Selloff**: `NIFTY -10%`, Horizon: 3 Days, Severity: `MODERATE`.
- **Severe Tech Valuation Drawdown**: `IT Sector -25%`, `NIFTY -12%`, Horizon: 1 Month, Severity: `SEVERE`.
- **Energy Supply Crisis**: `Energy Sector +12%`, `Broad Market -4%`, Horizon: 1 Week, Severity: `MODERATE`.

---

## 4. Multi-Shock Mathematical Methodology

### 4.1 Decimal-Safe Multiplicative Formula
To eliminate double-counting when multiple shocks target the same underlying asset:
$$S_{\text{combined}, i} = \left[ (1 + S_{\text{market}}) \times (1 + S_{\text{sector}, i}) \times (1 + S_{\text{asset}, i}) \right] - 1$$

*Boundary Validation*:
- Minimum combined shock: $-100\%$ (Asset value cannot become negative).
- Maximum combined shock: $+500\%$ (Guards against integer overflow / unrealistic values).
- All currency values rounded to 2 decimal places using deterministic math.

### 4.2 Granular Attribution Formula
$$\text{Attribution \%}_i = \begin{cases} 
\left( \frac{\text{Scenario Value}_i - \text{Baseline Value}_i}{\text{Total Portfolio Impact}} \right) \times 100 & \text{if } \text{Total Portfolio Impact} \neq 0 \\
0 & \text{if } \text{Total Portfolio Impact} = 0 
\end{cases}$$

---

## 5. What-If Position Simulator

Allows the user to evaluate:
- *"What if I added 50 shares of RELIANCE at ₹2,500?"*
- *"What if I closed my TCS position?"*
The engine accepts an optional `whatIfPositions: [{ symbol, qty, price, action: 'ADD'|'REMOVE' }]` array, recalculates baseline and scenario impact, and returns a **Before vs After comparison** without mutating the persistent ledger.

---

## 6. Persistence & Data Models

### 6.1 `ScenarioModel.js`
Persists user-customized scenarios:
```javascript
{
  user: ObjectId,
  name: String,
  description: String,
  type: String, // 'CUSTOM', 'PRESET', 'HISTORICAL_REPLAY'
  shocks: [{
    targetType: 'MARKET' | 'SECTOR' | 'ASSET',
    target: String, // e.g. 'NIFTY', 'Information Technology', 'TCS'
    percentage: Number // e.g. -15
  }],
  horizon: String, // '1D', '1W', '1M'
  severity: String, // 'MILD', 'MODERATE', 'SEVERE', 'EXTREME'
  version: Number // default 1
}
```

---

## 7. API Specifications

1. `GET /api/v1/scenarios` — Returns user's saved scenarios and system curated presets.
2. `POST /api/v1/scenarios` — Creates a custom user scenario.
3. `GET /api/v1/scenarios/:id` — Fetches scenario details.
4. `PATCH /api/v1/scenarios/:id` — Updates custom scenario (increments version).
5. `DELETE /api/v1/scenarios/:id` — Deletes custom scenario.
6. `POST /api/v1/scenarios/run` — Executes scenario calculation on demand (supports ad-hoc shocks, saved scenario ID, historical replay, and what-if positions).
7. `POST /api/v1/scenarios/compare` — Compares 2 or more scenarios side-by-side against baseline.
8. `POST /api/v1/scenarios/ai-explain` — Grounded AI analysis explaining modeled impact and holding contributions.

---

## 8. Caching Strategy

1. **Deterministic Scenario Cache**:
   Key: `scenario-run:${userSnapshotHash}:${scenarioHash}`
   TTL: 5 minutes. Scoped to authenticated user.
2. **Market Quote Cache**:
   Reuses existing `MarketDataService` in-memory quote cache to prevent repetitive provider hits.

---

## 9. Security & User Isolation

- All scenario CRUD and run operations strictly scoped to `req.user.userId`.
- Zero financial ledger mutation: `HoldingsModel`, `PositionsModel`, `UserModel.virtualBalance`, `OrdersModel`, and `TransactionModel` remain immutable during scenario runs.

---

## 10. Testing & Verification Suite (`test_mvp34.js`)

1. **Basic Single Asset Shock**: Accurate linear price and valuation change.
2. **Multi-Asset Shocks**: Independent shocks across multiple holdings.
3. **Sector Shocks**: Correct propagation to held assets matching verified sector; unknown sectors safely rejected.
4. **Index Shocks**: Broad market factor application.
5. **Multi-Shock Interaction & No Double-Counting**: Verifies multiplicative formula $(1+S_m)(1+S_s)(1+S_a)-1$.
6. **Loss Attribution & Offsets**: Mathematically verifies holding contribution percentages and offsetting positions.
7. **Strategy & Playbook Intersection**: Exposure percentage mapping to active playbooks.
8. **Thesis Linkage**: Flags affected theses as `SCENARIO REQUIRES REVIEW` without modifying actual thesis state.
9. **What-If Position Simulator**: Accurate before/after comparison when adding/removing simulated positions.
10. **Historical Replay & Look-Ahead Protection**: Verifies that positions opened after the historical event date are excluded.
11. **User Isolation**: User B cannot view, edit, delete, or run User A's custom scenarios.
12. **Zero Financial Ledger Mutation**: Verifies that virtual balance, holdings, positions, and orders are 100% identical before and after scenario execution.
13. **Methodology Transparency**: Exposes formulas, reference prices, snapshot hashes, and calculation versions.
14. **Reproducibility**: Same inputs yield byte-for-byte identical output.
15. **Provider Failure Graceful Isolation**: Operates reliably from local reference prices if external APIs return errors.
16. **Performance Benchmarks**: Measures execution speed across 10, 50, 100, 500 simulated holdings.
17. **Regression Suite**: Validates MVP-1 through MVP-33 stability.
