# MVP-52 WALKTHROUGH — INTELLIGENT RESEARCH AGENT

## Overview
MVP-52 upgrades TradeFlow's research capability from single-turn retrieval into an autonomous, controlled, multi-step research agent cycle:
$$\text{Question} \longrightarrow \text{Plan} \longrightarrow \text{Collect Evidence} \longrightarrow \text{Analyze} \longrightarrow \text{Find Gaps} \longrightarrow \text{Generate Follow-ups}$$

## Core Capabilities Implemented

### 1. Controlled Tool Registry
11 verified, sandboxed research tools wrapping existing production services:
- `getQuote`: Current bid/ask/price via `marketDataService`
- `getHistoricalData`: OHLCV series via `marketDataService`
- `runScanner`: Technical condition scanner via `marketScannerService`
- `getMarketEvents`: Surveillance events via `marketEventService`
- `getPortfolio`: Holdings, cash, concentration via `portfolioIntelligenceService`
- `runScenario`: Portfolio shock simulation via `scenarioEngine`
- `runBacktest`: Historical strategy test via `backtestEngine`
- `runRobustness`: Parameter sensitivity test via `strategyRobustnessService`
- `getJournal`: Past journal trade records via `TradeJournalModel`
- `getDecision`: Decision log records via `decisionJournalService`
- `getResearchSession`: Session details via `researchCopilotService`

### 2. Execution Safeguards
- **Max Iteration Limit**: Clamped to a maximum of 5 tool iterations per invocation.
- **Sandbox Containment**: Arbitrary code execution (`eval`, shell commands, direct MongoDB queries) strictly rejected with `TOOL_NOT_PERMITTED`.
- **Zero Ledger Mutation**: Agent operations are read-only research operations; `virtualBalance`, `OrdersModel`, `HoldingsModel`, and `PositionsModel` remain unaltered.
- **Injection Resistance**: Prompt injections with malicious instructions are sanitized; execution strictly adheres to the allowlisted tool plan.
- **User Isolation**: All tool calls receive `req.user.userId`. User B cannot access User A's portfolio, journal, or private data.

## API Endpoint
- `POST /api/v1/research/agent`: Runs the research agent with `{ question, maxIterations }`.

## Test Results
10/10 tests passed in `backend/test_mvp52.js`:
- Test 1: Tool Registry completeness (11 tools) — PASS
- Test 2: Unauthorized tool rejection & sandbox containment — PASS
- Test 3: Deterministic plan synthesis — PASS
- Test 4: Execution loop & evidence collection — PASS
- Test 5: Maximum iteration bounding (<= 5) — PASS
- Test 6: Tool failure resilience — PASS
- Test 7: Prompt injection resistance — PASS
- Test 8: Grounded non-advisory outputs — PASS
- Test 9: Strict user isolation — PASS
- Test 10: Zero financial ledger mutation — PASS
