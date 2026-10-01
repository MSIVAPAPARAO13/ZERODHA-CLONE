# MVP-46 Implementation Plan — Strategy Lab 2.0

## Objective
Upgrade existing Strategy Lab with structured component builders, immutable versioning (`strategyVersion`, `parametersHash`, `createdAt`), and transparent side-by-side experiment comparison.
Reuses existing `backtestEngine` without rebuilding.

## Architecture
1. **Strategy Builder Validation**:
   - Entry Conditions (Indicators, Operators, Thresholds)
   - Exit Conditions (Signal, Stop Loss, Take Profit, Max Holding)
   - Supported Indicators: SMA, EMA, RSI, PRICE_CHANGE, VOLUME_SMA, DONCHIAN_BREAKOUT
   - Universe, Timeframe, Capital, Fees, Slippage
2. **Strategy Versioning Engine** (`backend/services/strategyVersioningService.js`):
   - Computes deterministic SHA-256 `parametersHash`.
   - Immutable version preservation: when parameters change, a new Strategy record is created with `strategyVersion = previousVersion + 1`, `parentStrategyId = previous._id`. Historical records are never overwritten.
3. **Experiment Comparison Engine**:
   - Compares:
     - Return (% total profit)
     - Drawdown (% maximum peak-to-trough drop)
     - Win Rate (% winning trades)
     - Profit Factor (gross profit / gross loss)
     - Trade Count
     - Benchmark Comparison (% benchmark return & alpha)
   - Produces delta comparison table without arbitrary AI ranking.
4. **Testing** (`backend/test_mvp46.js`):
   - Strategy Builder component verification
   - Immutable version creation & history retention
   - Parameter hash determinism
   - Experiment comparison accuracy
   - User isolation & zero financial mutation
   - Regression MVP-37 through MVP-45
