# MVP-28 Implementation Plan: Adaptive Strategy Lab

## 1. Architecture
- **StrategyLabService**: Orchestrates experiments. Interfaces with the existing `StrategyValidationService`.
- **WalkForwardService**: Slices historical market data chronologically (e.g., 3-month Train, 1-month Validate, 1-month Forward step-size) to strictly prevent look-ahead bias.
- **SensitivityService**: Iterates through parameter matrix arrays (e.g., Volume > 1.2, 1.5, 2.0) and aggregates variance.
- **StrategyHealthService**: Computes `Drift` by mapping Historical Out-Of-Sample outcomes against actual Playbook Forward execution outcomes.

## 2. Regime Matrix
We will pull the regime state (from MVP-26) at the time of each historical signal to group the validation samples. UI will render a grid of regimes vs strategy outcomes.

## 3. Caching & Performance
Heavy Walk-Forward matrix permutations will hit the node-cache aggressively to prevent repetitive Market Data provider API calls for identical symbol/date intervals.

## 4. API Boundaries
New endpoints:
- `GET /api/v1/strategy-lab/:strategyId/health`
- `GET /api/v1/strategy-lab/:strategyId/regimes`
- `POST /api/v1/strategy-lab/experiments/walk-forward`
