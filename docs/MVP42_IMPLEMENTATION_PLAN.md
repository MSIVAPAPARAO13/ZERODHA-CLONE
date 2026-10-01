# MVP-42 IMPLEMENTATION PLAN — PORTFOLIO DECISION JOURNAL

## 1. Executive Summary

MVP-42 creates a **Portfolio Decision Journal** connecting analytical inputs (Research Copilot dossiers, Market Events, Scenarios, Theses) into an auditable, structured decision workflow. Rather than isolated post-trade notes, the Decision Journal captures user rationale *before*, *during*, and *after* execution.

```text
RESEARCH DOSSIER (MVP-37) + MARKET EVENT (MVP-38) + SCENARIO STRESS (MVP-41)
                                      ↓
                         STRUCTURED DECISION TEMPLATE
                 (Thesis, Invalidation Conditions, Review Date)
                                      ↓
                            DECISION RECORD CREATION
                           (DecisionJournalModel.js)
                                      ↓
                               DECISION TIMELINE
                    (Research → Scenario → Trade → Review)
                                      ↓
                             DECISION STATUS UPDATE
                        (ACTIVE → REVIEWED / ARCHIVED)
```

## 2. Decision Types & States

- **Decision Types**: `OPEN_RESEARCH`, `PAPER_BUY`, `PAPER_SELL`, `HOLD`, `WATCH`, `ABANDON`
- **Statuses**: `DRAFT`, `ACTIVE`, `REVIEWED`, `ARCHIVED`
- **Structured Fields**:
  - `thesis`: Primary thesis supporting the decision
  - `invalidatingConditions`: Specific factors that would invalidate the thesis ("What would make me change my mind?")
  - `riskFactors`: Identified risk and stress factors
  - `evidenceReferences`: Direct object references to `ResearchSession`, `MarketEvent`, `Backtest`
  - `scenarioReferences`: Direct link to modeled stress scenario results
  - `timeline`: Chronological progression from inquiry to review

## 3. API Specification

- `POST /api/v1/decisions` — Create new structured decision record.
- `GET /api/v1/decisions` — List user decisions with filters (`symbol`, `decisionType`, `status`).
- `GET /api/v1/decisions/:id` — Retrieve decision with full timeline and evidence references.
- `PATCH /api/v1/decisions/:id` — Update decision status, review notes, or add timeline event.
- `DELETE /api/v1/decisions/:id` — Soft-archive or remove decision.

## 4. Test Strategy (`test_mvp42.js`)

1. Decision CRUD operations and validation.
2. User ownership & multi-tenant isolation.
3. Structured evidence referencing (Research, Event, Scenario).
4. Decision timeline tracking.
5. Invalidation conditions and review date handling.
6. Zero financial ledger mutation.
7. Full regression: MVP-37 → MVP-41.
