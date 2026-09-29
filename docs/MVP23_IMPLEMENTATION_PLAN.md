# MVP-23: Adaptive Playbook & Forward Evidence Lifecycle Implementation Plan

## 1. Problem
After a Playbook is validated in MVP-22 and set to ACTIVE, we need to track how well the user follows it in live/paper trading (Forward Evidence). If the user decides to change the rules, we must not mutate history; we need strict versioning.

## 2. Versioning Architecture
We introduce `PlaybookVersionModel`. When a Playbook is promoted from MVP-22, it creates `v1` in `DRAFT` status. The user must manually transition it to `ACTIVE`, which stamps `activatedAt` and freezes the `rulesSnapshot`.

## 3. Immutability
Only one version of a Playbook can be `ACTIVE` at a time. If the user edits `v1` rules, the backend automatically transitions `v1` to `PAUSED` (or `RETIRED`) and creates `v2` as a new `DRAFT` (or directly activates it, depending on the UX flow). Trades executed before `activatedAt` are strictly excluded from the Forward Evidence metrics of that version.

## 4. Forward Evidence vs Historical Validation
Metrics for Forward Evidence are grouped entirely separately from Historical Validation metrics. Forward Evidence leverages MVP-16 logic to check `Adherence` (Did the user deviate?) and `Drift` (Are there repeated violations?).

## 5. Lineage
The system maintains a relational lineage: `Edge Candidate -> Hypothesis -> Validation Run -> Playbook -> Version -> Forward Evidence`. This lineage is immutable.
