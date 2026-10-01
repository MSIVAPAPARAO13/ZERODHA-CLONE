# MVP-40 IMPLEMENTATION PLAN — PORTFOLIO HEALTH & EXPOSURE ENGINE

## 1. Executive Summary

MVP-40 creates a production-grade portfolio intelligence layer that moves beyond basic tabular holding balances to answer:
> *"What is my portfolio actually exposed to, how concentrated is my capital, and do any high-exposure holdings face critical market events?"*

```text
USER HOLDINGS + POSITIONS + VIRTUAL BALANCE
                    ↓
        PRICING & SECTOR ENRICHMENT
  (MarketDataService + VERIFIED_TAXONOMY)
                    ↓
      CONCENTRATION & SECTOR METRICS
       (Top 1, Top 3, Top 5, HHI, Sectors)
                    ↓
      DETERMINISTIC HEALTH CLASSIFICATION
   (BALANCED, CONCENTRATED, HIGHLY_CONCENTRATED, CASH_HEAVY)
                    ↓
           EVENT CROSS-LINKING
  (Active MVP-38 MarketEvents on High-Weight Assets)
                    ↓
       PORTFOLIO INTELLIGENCE APIS
```

## 2. Metrics & Formulas

- **Total Capital**: `EquityValue + VirtualCashBalance`
- **Holding Weight**: `(HoldingCurrentPrice * HoldingQuantity) / TotalEquity`
- **Cash Allocation %**: `VirtualCashBalance / TotalCapital`
- **Concentration**:
  - `Top1Weight`: Weight of largest holding
  - `Top3Weight`: Sum of top 3 holding weights
  - `Top5Weight`: Sum of top 5 holding weights
  - `HHI`: Sum of squared percentage weights (e.g. 30^2 + 20^2...); HHI > 2500 indicates high concentration
- **Sector Exposure**: Aggregates holding values mapped to official sectors via `backend/config/marketMetadata.js` (`VERIFIED_TAXONOMY`).
- **Health Categories**:
  - `HIGHLY_CONCENTRATED`: `Top1 >= 50%` OR `Top3 >= 80%`
  - `CONCENTRATED`: `Top1 >= 30%` OR `Top3 >= 60%`
  - `CASH_HEAVY`: `CashPercentage >= 60%`
  - `BALANCED`: Diversified holdings within standard thresholds
  - `DATA_LIMITED`: Zero or missing positions

## 3. Endpoints

- `GET /api/v1/portfolio/intelligence` — Complete portfolio health report including summary, concentration, sectors, health status, and event cross-links.
- `GET /api/v1/portfolio/exposure` — Dedicated sector & asset exposure breakdown.
- `GET /api/v1/portfolio/concentration` — Top-N holdings, HHI index, and concentration distribution.

## 4. Test Strategy (`test_mvp40.js`)

1. Accurate calculation of portfolio metrics (equity, cash, P&L, returns).
2. Concentration math (Top 1, Top 3, Top 5, HHI).
3. Sector allocation aggregation using `VERIFIED_TAXONOMY`.
4. Graceful handling of unclassified or missing sector symbols.
5. Deterministic health status assignment.
6. Event bridge: identifying events on top holdings.
7. Empty portfolio handling.
8. Multi-tenant isolation (`userA` vs `userB`).
9. Zero financial ledger mutation.
10. Full regression check (MVP-37 → MVP-39).
