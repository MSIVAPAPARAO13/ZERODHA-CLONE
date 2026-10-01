# MVP-31 Walkthrough: Portfolio Change Intelligence & Decision Timeline

## 1. Beyond the Current State
Most platforms tell you what your portfolio looks like right now. TradeFlow's Portfolio Change Intelligence tells you exactly how it got there. 

## 2. What Changed Today?
By clicking "What Changed Today?", TradeFlow generates a clean timeline of all material shifts in your account. If your exposure to IT stocks jumped by 15%, the system explicitly traces that back to the exact trade execution or playbook activation that caused it. 

## 3. The Evidence Chain
TradeFlow links everything. A single BUY order might trigger an `EXPOSURE_CHANGED` event. That increased exposure might trigger a `STRATEGY_OVERLAP_CHANGED` event if multiple playbooks now share that asset. If that overlap creates risk, TradeFlow automatically generates a Research Question ("Does this overlap increase drawdown risk?"). You can trace the entire causal chain from a single trade all the way to a high-level research hypothesis.

## 4. Grounded Explanations
Instead of hallucinating advice, the AI Explainer is strictly grounded in the event payload. It reads the deterministic "Before/After" deltas and provides a clean summary of what changed and what evidence supports that change, ensuring complete analytical integrity.
