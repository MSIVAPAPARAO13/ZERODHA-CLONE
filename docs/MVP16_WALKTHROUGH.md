# MVP-16 Walkthrough: Trade Plan vs Execution Intelligence

## 1. Problem
TradeFlow needed to close the loop between intended strategy and actual market action, tracking deviations without assigning psychological labels.

## 2. Trade Plan & Execution Snapshot
The application now supports drafting a `TradePlan`. Upon execution, the order preserves a static snapshot of the executed state and links to the `TradePlan`.

## 3. Deviation Engine
The `executionDeviationService` deterministically maps differences (entry slippage, quantity jumps, direction flips, playbook changes) between the Plan and Actual states. Unplanned trades are flagged neutrally.

## 4. UI & Reconciliation
Post-trade, users receive an Execution Review screen explicitly comparing their Plan vs Actual. They can attach an explanation (e.g., `MARKET_CHANGED`). This is appended to the TradeJournal.

## 5. Behavioral Feedback
When a user frequently slips on entries or exceeds size limits compared to their plans, Behavioral Edge detects the repeated sequence and suggests reviewing the pattern, feeding directly back into the Playbook loop.

## 6. AI Explanation
AI analyzes the mathematical deviations and user-selected reasons to provide plain-english summaries, but strictly refrains from guessing emotions like "FOMO".

## 7. Testing
Validated Plan CRUD, linking logic, UNPLANNED_TRADE detection, and accuracy of deviation percentages. Replay and Journal handle Plan mapping safely.
