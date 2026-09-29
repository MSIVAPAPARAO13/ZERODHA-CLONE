# MVP-19 Walkthrough: Decision Twin & Session Simulator

## 1. The Pre-Session Workflow (Decision Twin)
TradeFlow now includes a "Decision Twin" creation page. Before trading, users declare their intent for the day: what symbols they will watch, what playbooks they will run, and what their max loss/trade limits are. Once finalized, these values are snapshotted to prevent later rewrites of history.

## 2. Active Session Command Center
During trading, the user views the "Session Command Center". It displays live daily P&L, trades executed vs max allowed, and current guardrails. Every executed order inherently links to this `sessionId`.

## 3. Post-Session Reconciliation
Upon finishing the session, TradeFlow evaluates reality against the Decision Twin. If the user drafted a plan for RELIANCE and TCS, but traded INFY, the reconciliation engine explicitly flags "UNPLANNED SYMBOL" for INFY. This eliminates memory bias.

## 4. Session Simulator
Users can launch the Session Simulator to replay their entire trading day, scrubbing across the market timeline to review when alerts fired, when plans were broken, and how the market reacted post-trade.

## 5. Ecosystem Integration
Completed sessions act as aggregate filters for the MVP-18 Research Lab and feed repetitive deviation patterns into the MVP-12 Behavioral Edge loop. AI summarizes the daily adherence facts safely.
