# MVP-42 Walkthrough — Portfolio Decision Journal

## Overview
MVP-42 establishes the structured **Portfolio Decision Journal** in TradeFlow, linking:
- Portfolio
- Market Events
- Research Sessions
- Scenarios
- Journal Entries
into a structured decision record.

## Capabilities Verified
1. **Decision Record Creation**: Supports `OPEN_RESEARCH`, `PAPER_BUY`, `PAPER_SELL`, `HOLD`, `WATCH`, `ABANDON`.
2. **Explicit Thesis & Invalidation**: Captures `thesis`, `expectedOutcome`, `riskFactors`, `invalidatingConditions`, `reviewDate`.
3. **Evidence References Linking**: Directly references `ResearchSession`, `MarketEvent`, `Backtest`, `Scenario`, `Thesis` without duplicating payload data.
4. **Structured Decision Timeline**: Tracks sequential steps (`RESEARCH_INITIATED`, `SCENARIO_TESTED`, `DECISION_RECORDED`, `DECISION_REVIEWED`).
5. **Zero Financial Mutation**: Zero modifications to real holdings, positions, or cash balances.
6. **Multi-Tenant User Isolation**: Decisions are strictly scoped to `req.user.userId`.
