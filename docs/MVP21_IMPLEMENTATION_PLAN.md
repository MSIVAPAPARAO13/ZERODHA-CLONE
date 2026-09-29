# MVP-21: Edge Discovery & Strategy Lab Implementation Plan

## 1. Problem
Traders can manually ask questions in the Research Lab, but they might miss non-obvious patterns in their own data. They need a system to scan their historical trades, discover robust patterns objectively, test them, and operationalize them.

## 2. Edge Discovery Engine
The `edgeDiscoveryService` acts as an automated miner on top of the user's executed historical trade records. It tests simple dimensions (Time of Day, Symbol, Playbook, Side) to find statistical anomalies.

## 3. Statistical Guardrails
- Discovered candidate patterns must meet a `MIN_SAMPLE_SIZE` constraint (e.g. 20 trades) to be surfaced to the user.
- The UI explicitly denotes that patterns are historical observations, not guaranteed predictive strategies.

## 4. Hypothesis & Validation
A discovered pattern can be saved as a `StrategyHypothesisModel`. 
The Validation Engine uses `strategyValidationService` to split available historical records chronologically. The first portion acts as the discovery set; the latter acts as an out-of-sample validation set.

## 5. Playbook Promotion
If a validated hypothesis seems viable to the user, they click "Promote to Playbook". This automatically pre-fills a Playbook *Draft* which the user can refine and activate.

## 6. AI Role
AI cannot query the DB or generate SQL/NoSQL directly. AI simply ingests the output payload of the `edgeDiscoveryService` and writes an easily readable explanation (e.g., "Across 26 trades on TCS, momentum playbooks averaged +0.5R. This is a historical observation.").
