# MVP-43 Implementation Plan — Market Regime Engine

## Objective
Determine the current observable market regime using transparent, deterministic market metrics (trend, breadth, volatility).
Not a prediction engine.

## Deterministic Regime Types
- `TRENDING_UP`
- `TRENDING_DOWN`
- `RANGE_BOUND`
- `HIGH_VOLATILITY`
- `LOW_VOLATILITY`
- `MIXED`
- `DATA_LIMITED`

## Architectural Components
1. **Model**:
   - Update `MarketEventModel.js` to include `MARKET_REGIME_CHANGE` in `eventType` enum.
   - Create `backend/models/MarketRegimeModel.js` to persist regime snapshots and transition timestamps.
2. **Service**:
   - `backend/services/marketRegimeService.js`: Reuses `marketDataService` to query market breadth, price trends, and volatility across monitored universe. Evaluates deterministic classification rules. Emits `MARKET_REGIME_CHANGE` event on transition.
3. **Controller & Routes**:
   - Extend `marketController.js` & `marketRoutes.js` to expose `GET /api/v1/market/regime` and `GET /api/v1/market/regime/history`.
4. **Testing**:
   - `backend/test_mvp43.js` covering deterministic classification, regime change events, user isolation, and zero financial mutation.
