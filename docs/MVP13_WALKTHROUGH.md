# MVP-13 Walkthrough: TradeFlow Adaptive Decision Loop

## 1. The Core Loop
MVP-13 establishes the **Adaptive Decision Loop**, connecting deterministic behavioral analytics with future execution rules without letting AI run wild. The flow is:
1. **Behavioral Edge**: Identifies a recurring flaw (e.g. `TARGET_WITHOUT_RISK`).
2. **AI Suggestion**: Gemini proposes a concrete rule (e.g. "Record risk before entry.") based solely on the factual pattern.
3. **Playbook**: The user approves the rule and saves it to a Playbook.
4. **Execution**: The user optionally attaches the Playbook to their next trade, completing a Pre-Trade Checklist.
5. **Replay & Compliance**: TradeReplay displays whether the rules were followed, and Playbook Analytics tracks historical compliance.

## 2. Deterministic AI Constraints
- AI is explicitly blocked from fabricating rules on its own.
- When an AI Playbook Suggestion is requested, the application context isolates *only* the specific behavioral pattern being targeted.
- AI returns a strict JSON structured rule to prevent generic, unhelpful conversational outputs.

## 3. Historical Immutability
`TradeJournal` natively stores a snapshot of the `checklist` at the exact time the order is placed. 
This means if the user alters a Playbook later, the historical compliance of past trades remains absolutely accurate, maintaining the integrity of the ledger.

## 4. Frontend Implementation
- **BehaviorInsights**: Expanded to include a direct `[ Create Process Rule ]` button on detected patterns.
- **BuyActionWindow**: Upgraded with a playbook dropdown and a dynamically rendered checkbox-list that logs the user's explicit Pre-Trade adherence.
- **TradeReplay**: Rendered the historical snapshot of the Checklist to show exactly how disciplined the user was at the time of execution.
- **Playbooks Dashboard**: A central hub to view overall Playbook compliance.

## 5. Security
All operations (Create, Update, Delete) route through `req.user.userId`. Cross-user playbook injection or reading is programmatically impossible in the `playbookService.js` layer.
