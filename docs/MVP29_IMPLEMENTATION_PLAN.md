# MVP-29 Implementation Plan: Strategy Stress Lab

## 1. Architecture
- **StrategyStressService**: Parent service managing experiments.
- **MonteCarloService**: Given an array of historical P&L trades, generates N randomized permutations based on a PRNG seed.
- **FragilityService**: Maps the variance of the stress tests against Baseline. Outputs the `Robustness Profile`.

## 2. Methodology
- **Cost & Slippage Stress**: Re-calculates P&L array applying `+25%`, `+50%`, `+100%` transaction cost and execution lag assumptions.
- **Sequence Randomization**: Resamples trades with replacement (Monte Carlo) to build 25th, 50th, 75th percentile equity curves and clustering streaks.

## 3. Caching & Limits
Monte Carlo loops (e.g., 1000 simulations of 500 trades) execute purely in CPU/memory without additional Database hits, making them extremely fast. Node cache prevents re-fetching the initial validation trades payload.

## 4. API Boundaries
New endpoints:
- `POST /api/v1/stress-lab/run`
- `GET /api/v1/stress-lab/experiments`
- `GET /api/v1/stress-lab/experiments/:id`
