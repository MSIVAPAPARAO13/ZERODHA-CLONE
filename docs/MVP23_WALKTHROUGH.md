# MVP-23 Walkthrough: Adaptive Playbook Lifecycle

## 1. Playbook Drafts & Activation
When you validate an edge in MVP-22 and promote it, TradeFlow creates a Playbook Draft (`v1`). You review the rules, add your own rationale, and click "Activate". At that exact second, `v1` is locked. 

## 2. Forward Evidence Tracking
Any paper trades you execute from that moment forward that are associated with that Playbook are logged as "Forward Evidence" for `v1`. The UI explicitly displays the difference between the Historical Validation (what happened before) and the Forward Evidence (what is happening now).

## 3. Adherence & Drift
TradeFlow monitors your real-time execution against `v1`'s frozen rules. If you repeatedly violate your own stop loss or time windows, the system flags "Execution Drift". AI helps summarize these deviations neutrally without psychological assumptions.

## 4. Creating v2
If you realize your `v1` rules are too restrictive, you click "Create Revision". TradeFlow generates `v2` as a new Draft, pre-filled with `v1`'s rules. You tweak the rules, save the Change Reason ("Wider stops needed"), and Activate `v2`. 

## 5. Immutable Evidence
`v1` goes into a `PAUSED` state. All trades executed under `v1` remain permanently tied to `v1`. The Forward Evidence for `v2` starts completely fresh at zero, preventing cross-version data contamination.
