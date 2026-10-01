# MVP-52 Implementation Plan — Intelligent Research Agent

## Objective
Upgrade the Research Copilot into an autonomous, bounded **Intelligent Research Agent** executing a structured cycle:
`Question → Plan → Collect Evidence → Analyze → Find Gaps → Generate Follow-up Questions`.

## Controlled Tool Registry
Strictly limited to 11 allowlisted domain tools:
1. `getQuote`
2. `getHistoricalData`
3. `runScanner`
4. `getMarketEvents`
5. `getPortfolio`
6. `runScenario`
7. `runBacktest`
8. `runRobustness`
9. `getJournal`
10. `getDecision`
11. `getResearchSession`

## Security & Architecture Guardrails
- **Max Iterations**: Hard capped at 5 tool calls per invocation.
- **Zero Arbitrary Execution**: No `eval`, `Function`, or unrestricted database querying.
- **Audit Logging**: Every tool call records duration, inputs, outputs, and status.
- **Strict Grounding**: Findings, gaps, and follow-ups derived solely from collected evidence.
- **Zero Investment Advice**: Explicit disclaimer that results are non-predictive research synthesis.

## Components
- Service: `backend/services/researchAgentService.js`
- Controller & Routes: `POST /api/v1/research/agent` in `researchController.js` and `researchRoutes.js`
- Automated Test: `backend/test_mvp52.js`
