# MVP-18: Personal Trading Research Engine Implementation Plan

## 1. Problem
Traders often have hypotheses (e.g. "Do I perform better with Momentum before 11 AM?") but lack an evidence-backed, transparent way to answer them from their own historical data without resorting to opaque, black-box AI tools.

## 2. Research Architecture
We will introduce `tradingResearchService` which accepts structured filters (symbol, side, playbook, time range) and uses MongoDB `$match` and `$group` aggregations strictly scoped to `req.user.userId`.

## 3. Natural Language Safety
The AI parsing layer converts natural language queries strictly into the validated structured JSON filter schema. Under no circumstances can AI emit raw MongoDB queries, aggregation pipelines, or JavaScript strings. All incoming filters are validated against an allowlist schema before hitting the database.

## 4. Deterministic Metrics
The research engine computes metrics (Win Rate, Average P&L, Median P&L, Profit Factor, R-Multiple) directly from the filtered records. It also supports Side-by-Side group comparisons (e.g. Before 11 AM vs After 11 AM).

## 5. Sample Size Guardrails
Any metric or pattern requires `n >= 5` to be presented as a meaningful historical observation.

## 6. Frontend
A new "Research Lab" dashboard section allows manual filter configuration or natural language querying, saving research, and tracing results directly to actual historical trades.
