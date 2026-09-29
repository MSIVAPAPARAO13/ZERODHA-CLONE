# MVP-21 Walkthrough: Edge Discovery & Strategy Lab

## 1. Automated Discovery
Instead of making the user guess where their edge lies, the Edge Discovery engine passively groups and aggregates their trades. If it notices that the user has won 75% of their Momentum setups between 9:15 and 10:00 (with `n > 20`), it surfaces this as a "Candidate Pattern."

## 2. Formulating a Hypothesis
The user clicks on the pattern to view its underlying evidence (a strict list of included Trade IDs). If they like it, they click "Create Hypothesis", formalizing the parameters into a testable assumption.

## 3. Validation
The Strategy Lab runs the Hypothesis against a validation subset of the historical data to see if the anomaly held up out-of-sample. The math is simple, deterministic, and fully transparent.

## 4. Operationalizing
A proven hypothesis isn't useful if it's forgotten. TradeFlow allows the user to promote the validated hypothesis directly into a Playbook Draft. This closes the loop from "unknown edge" to "executed strategy."

## 5. Ecosystem Linkage
From any pattern or hypothesis, the user can branch seamlessly into MVP-10 Replay, MVP-18 Research Lab, or MVP-20 Counterfactual Lab to explore the data deeply. AI remains restricted to an explanatory assistant.
