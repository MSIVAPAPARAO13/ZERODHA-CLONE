# MVP-20 Walkthrough: Counterfactual Lab

## 1. Historical Reconstruction
The Counterfactual Lab allows a trader to look back at a completed session and ask, "What was the recorded result if I had stopped at my planned maximum of 5 trades?" The system deterministically slices the actual trades chronologically and reports the exact difference.

## 2. No Hindsight Bias
We rigorously avoid terms like "Missed Profit" or "What you should have done." The UI explicitly labels the output as a "Historical Scenario Reconstruction."

## 3. Transparency
If a user applies the "Planned Playbooks Only" scenario, the Lab generates a table showing exactly which executed trades were included (e.g., matching the 'Momentum' playbook) and which were excluded (e.g., an unplanned 'Mean Reversion' trade), alongside their individual P&L contributions.

## 4. Integration
The Counterfactual Lab is accessible directly from the MVP-19 Session Reconciliation view and the MVP-17 Outcome Lab. Users can also save custom scenarios (like filtering for specific times or sides) to revisit later.

## 5. Educational Focus
By mathematically proving the cost of deviations (or occasionally, the benefit), the Counterfactual Lab provides emotion-free evidence to feed back into the Playbook rules.
