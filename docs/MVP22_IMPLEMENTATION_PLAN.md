# MVP-22: Strategy Validation & Robustness Lab Implementation Plan

## 1. Problem
MVP-21 discovered candidate patterns and allowed users to create Hypotheses. However, simply testing a rule on the same data that discovered it leads to overfitting (Look-Ahead Bias). We need a rigid validation layer to test Hypotheses strictly out-of-sample.

## 2. Validation Architecture
The `strategyValidationService` will manage the lifecycle of a `StrategyValidationRunModel`. When a validation runs, it freezes the underlying Hypothesis parameters into an immutable snapshot.

## 3. Methodologies
- **OUT_OF_SAMPLE**: Splits the data chronologically based on a user-defined pivot date.
- **WALK_FORWARD**: If data permits, runs multiple sequential Train/Test splits (Folds) across the timeline.

## 4. Strict Temporal Ordering
All validation slices strictly adhere to the `createdAt` timestamps of the executed `Order` records. Random shuffling or Monte Carlo simulations are strictly prohibited to ensure authentic chronological market reconstruction.

## 5. Transparency & Limitations
Every fold's metrics (even if negative) are persistently visible. No result is hidden. The UI will explicitly display warnings that "Historical validation does not guarantee future performance."

## 6. Integrations
From a completed validation fold, a user can seamlessly push the underlying Trade IDs into Replay (MVP-10), Counterfactual Lab (MVP-20), or Research Lab (MVP-18). Validated hypotheses can be pushed to Playbook Drafts.
