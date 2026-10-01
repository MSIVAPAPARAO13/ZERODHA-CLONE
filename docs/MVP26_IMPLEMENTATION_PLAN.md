# MVP-26: TradeFlow Intelligence OS Implementation Plan

## 1. Objective
Transform TradeFlow into a closed-loop Trading Intelligence System. Rather than building isolated tools, MVP-26 connects them into an overarching "Intelligence OS" that observes market context, monitors trade executions, validates playbook adherence, detects edge drift, and automatically drafts new research hypotheses based on actual empirical evidence.

## 2. Core Architecture: The Intelligence Loop
The system relies on an orchestration layer, primarily governed by `IntelligenceService.js`, which aggregates outputs from:
- `MarketDataService` (Context)
- `BehaviorAnalyticsService` (Behavior)
- `PlaybookService` (Adherence & Forward Evidence)
- `StrategyValidationService` (Edge Decay)

## 3. Key Components
- **Daily Intelligence Brief**: A dashboard widget aggregating changes, playbook violations, and recent evidence into an analytical summary.
- **Decision Trace & Graph**: A visual map for every trade showing `Context -> Plan -> Execution -> Outcome`.
- **Missed Setup Detector**: Scans historical market data against the user's active Playbooks and Alerts to surface factual matches where no order was placed.
- **Edge Health & Drift**: Compares current Forward Evidence against the original Validation Run to classify edge decay (Stable, Changing, Deviating).
- **Research Queue**: Automatically drafts testable hypotheses (e.g., "Performance under high volatility") based on observed behavior/drift.

## 4. Database & Models
No major new models. The intelligence loop primarily projects existing data. We will add lightweight `IntelligenceSnapshot` and `ResearchQuestion` models to cache expensive aggregations and store generated questions pending user approval.

## 5. Security & AI Safety
- All data strictly scoped to `req.user.userId`.
- Look-ahead bias strictly prohibited in any generated hypothesis.
- AI is restricted to summarizing existing structured JSON evidence and drafting textual questions; it cannot predict, advise, or trade.
