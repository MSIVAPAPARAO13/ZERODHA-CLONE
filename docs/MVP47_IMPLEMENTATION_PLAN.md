# MVP-47 Implementation Plan — Strategy Robustness Lab

## Objective
Provide rigorous robustness stress-testing for trading strategies to diagnose overfitting and fragile curve-fitting before deploying paper capital.
Reuses existing `backtestEngine` without duplication.

## Robustness Dimension Checks
1. **Transaction Cost Sensitivity**: Evaluates performance degradation under 2x brokerage & fees vs low friction.
2. **Slippage Sensitivity**: Tests sensitivity to execution slippage (0% vs 2x normal slippage).
3. **Time-Period Comparison / Split Testing**: Compares In-Sample vs Out-of-Sample return retention.
4. **Benchmark Comparison**: Measures Alpha against NIFTY50 benchmark.

## Deterministic Overfitting Classifications
- `DATA_LIMITED`: Total trades < 5 or insufficient historical bars.
- `LOW_ROBUSTNESS`: Return flips negative under increased friction, or Out-of-Sample return turns negative while In-Sample was positive. High probability of overfitting.
- `MODERATE_ROBUSTNESS`: Return degrades 20% to 50% under friction, or Out-of-Sample retains 40%–60% of baseline return.
- `HIGHER_ROBUSTNESS`: Strategy remains solidly profitable across all friction tests and retains > 60% of return Out-of-Sample.
- Explicit rule: Never claims "Guaranteed robust".

## Architecture
1. **Service** (`backend/services/strategyRobustnessService.js`):
   - Invokes `backtestEngine.runBacktest` across permutations with modified cost and slippage options.
   - Evaluates transparent classification thresholds.
2. **Controller & Routes**:
   - `POST /api/v1/strategies/robustness`
3. **Automated Testing** (`backend/test_mvp47.js`):
   - Cost & slippage sensitivity evaluation
   - Time-period comparison
   - Overfitting classification determinism
   - Rejection of "guaranteed robust" claims
   - Multi-tenant user isolation & zero financial mutation
   - Regression MVP-37 through MVP-46
