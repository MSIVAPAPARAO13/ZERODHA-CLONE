# MVP-26 Walkthrough: TradeFlow Intelligence OS

## 1. The Closed Loop
TradeFlow is no longer just a paper-trading app. It is now a comprehensive Trading Intelligence System. The defining feature of this release is the **Intelligence Loop**. When you trade, TradeFlow doesn't just record the P&L; it analyzes *why* the trade happened, how strictly you followed your versioned Playbook, and whether your historical "edge" is showing signs of decay in forward live data.

## 2. The Intelligence Center
When you log in, you are greeted by the Daily Intelligence Brief. It tells you exactly what changed: which playbooks were adhered to, where you deviated, and what new evidence has surfaced. 

## 3. Decision Trace
Clicking on any trade opens the **Decision Graph**. You can visually trace the exact Market Context, the hypothesis that drove your entry, the actual execution versus the plan, and the final behavioral outcome.

## 4. Edge Decay & Strategy Drift
The system continuously monitors your active Playbooks. If your average holding period for a Breakout strategy suddenly increases by 40%, the system flags a "Strategy Drift Detected" alert. If your win-rate drops significantly compared to the original validation backtest, the Edge Health shifts from "STABLE" to "DEVIATING."

## 5. Research Queue
Instead of staring at a blank Research Engine, TradeFlow now observes your drift and actively drafts **Questions Worth Investigating**. For example, it might draft: "Does the Breakout setup behave differently under current high-volatility conditions?" With one click, you can approve the hypothesis and run it through the Validation Lab, potentially spinning up Playbook v4 based on purely objective, closed-loop evidence.
