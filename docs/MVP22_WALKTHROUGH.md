# MVP-22 Walkthrough: Strategy Validation & Robustness Lab

## 1. Freezing the Hypothesis
When a user brings a Candidate Hypothesis from MVP-21 into the Robustness Lab, the first action is freezing it. If the rule says "TCS Momentum between 9:15-10:00", that snapshot is locked into the `StrategyValidationRun` so it cannot be stealth-edited later to artificially improve the score.

## 2. Chronological Testing
The user selects a validation method. If they choose `OUT_OF_SAMPLE`, they select a date to split the data. The engine measures performance on the Discovery (In-Sample) data, and then independently tests on the Validation (Out-Of-Sample) data.

## 3. Walk-Forward Folds
If they have a lot of history, they can use `WALK_FORWARD`. The engine creates rolling windows (e.g. Train on Jan-Mar, Test on Apr; Train Feb-Apr, Test May). If a specific fold fails and produces a negative P&L, it is explicitly shown in red. The system never hides failed folds.

## 4. Evidence Traceability
Every metric (Win Rate, Avg R, Drawdown) is clickable. Clicking it reveals the precise `includedTrades` array of historical Order records that generated the number.

## 5. Playbook Promotion
Once a trader sees how a hypothesis performed out-of-sample, they can click "Create Playbook Draft." This acts as a bridge, moving an empirically validated idea into a formal rule they will follow in tomorrow's live Session.
