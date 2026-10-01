# MVP-33 Implementation Plan: Market Event Cascade & Thesis Impact Engine

## 1. System Overview

MVP-33 extends TradeFlow's market intelligence by introducing the **Market Event Cascade & Thesis Impact Engine**. This engine maps external market events across a multi-hop, evidence-backed relationship graph:

$$\text{Event} \longrightarrow \text{Entity} \longrightarrow \text{Sector} \longrightarrow \text{Portfolio} \longrightarrow \text{Strategy} \longrightarrow \text{Thesis} \longrightarrow \text{Research Question}$$

---

## 2. Core Architecture & Components

```text
                  Incoming Request: GET /api/v1/market-events/:id/cascade
                                      │
                                      ▼
                           [marketEventController]
                                      │
                                      ▼
                            [CascadeEngine.js]
                 ┌────────────────────┼────────────────────┐
                 ▼                    ▼                    ▼
        [MarketEventProvider]  [Verified Registry]  [User State Models]
         (AlphaVantage/12Data) (Sector/Peer Table)   - Holdings / Positions
                 │                    │              - Playbooks
                 │                    │              - TradeJournals
                 └────────────────────┼────────────────────┘
                                      ▼
                        [Graph Traversal & Assembly]
                         - Depth-Bounded (<= 3)
                         - Visited Node Set (No Cycles)
                         - Edge Deduplication (Unique Key)
                         - Strict Confidence Assignment
                                      ▼
                        [Thesis Impact & Drift Engine]
                         - Thesis Diff Calculation
                         - Drift Status (REQUIRES_REVIEW)
                         - Research Question Synthesizer
                                      ▼
                        [Cascade Cache Manager]
                         - Public Graph Cache
                         - User Private Graph Cache
                                      ▼
                           JSON Cascade Response
```

---

## 3. Relationship Sources & Types

### 3.1 Supported Enums
- `RelationshipType`:
  - `DIRECT_SECURITY`: Event explicitly identifies the ticker symbol.
  - `SECTOR`: Security belongs to an industry sector.
  - `INDUSTRY`: Specific sub-segment within a sector.
  - `WATCHLIST`: Security monitored in user's watchlist.
  - `PORTFOLIO`: Security held in user's active holdings/positions.
  - `STRATEGY`: Security or sector utilized by an active Playbook.
  - `PLAYBOOK`: Specific execution rules governing trade setups.
  - `THESIS`: User-authored investment hypothesis in a Trade Journal.
  - `ALERT`: Active user price alert threshold.
  - `RELATED_ENTITY`: Documented corporate peer within same verified sub-industry.

### 3.2 Prohibited Fabrications (Rule 7)
If a relationship is not present in:
- A configured market provider API,
- The verified internal metadata registry,
- Existing authenticated user records (`Holdings`, `Positions`, `Playbooks`, `Journals`),
then the edge MUST NOT be created, and the state is explicitly marked `RELATIONSHIP UNAVAILABLE`.

---

## 4. Relationship Confidence Methodology

Every edge and node is annotated with an explicit deterministic state:
- `VERIFIED`: Confirmed internal record (e.g., active user position, authored playbook).
- `USER_DEFINED`: Created explicitly by the user (e.g., trade thesis text).
- `PROVIDER_SUPPLIED`: Direct attribute from market data provider.
- `DERIVED`: Computed by deterministic mathematical calculation (e.g., portfolio exposure %).
- `UNKNOWN`: Unverified or ambiguous data.

No black-box or hallucinated statistical percentages are generated.

---

## 5. Event Propagation Methodology & Bounds

1. **Traversal Model**: Directed Acyclic Graph (DAG) generation rooted at the `MarketEvent`.
2. **Bounds**:
   - `maxDepth`: Default 3 (Event = Depth 0, Symbol = Depth 1, Sector/Peers = Depth 2, Portfolio/Strategy/Thesis = Depth 3).
   - Maximum nodes: 50.
   - Maximum edges: 75.
3. **Graph Loop Protection**:
   - Maintains a `visited` Set of node IDs (`type:id`).
   - If a target node is already visited, back-edges that create cycles are suppressed.
4. **Edge Deduplication**:
   - Unique key: `hash(sourceId + targetId + relationshipType + effectiveAt)`.
   - Prevents duplicate parallel edges between identical entities.

---

## 6. Portfolio & Strategy Intersection

- **Portfolio Exposure**:
  Calculated by reusing the verified holding and position logic:
  $$\text{Exposure \%} = \frac{\text{Symbol Position Value}}{\text{Total Portfolio Value}} \times 100$$
- **Strategy Intersection**:
  Queries active `PlaybookModel` for rules or strategies matching the affected symbol or sector.
- **Alert Intersection**:
  Queries active `AlertModel` matching the symbol.

---

## 7. Thesis Impact & Drift Methodology

### 7.1 Thesis States
- `SUPPORTED`: Observed event evidence reinforces the stored thesis assumption.
- `UNCHANGED`: Event is neutral or does not affect core assumptions.
- `REQUIRES_REVIEW`: Event evidence is material and warrants user review (Default for material new events).
- `CONTRADICTED`: Only applied if deterministic quantitative rule is violated (e.g., stop loss breached or explicitly falsified metric).
- `UNKNOWN`: Insufficient evidence to establish relationship.

### 7.2 Thesis Drift Detection
When an event occurs:
1. Extract stored thesis from `TradeJournalModel`.
2. Compare stored expected catalyst/period with event nature (e.g., earnings event vs expected momentum continuation).
3. Compute **Thesis Diff**:
   - `expected`: Stored assumption in thesis.
   - `observed`: Event headline and published metric.
   - `difference`: Factual delta statement.
4. Mark status as `REQUIRES_REVIEW`.

### 7.3 User Review Workflow & Audit Trail
- User choices:
  - `STILL_VALID`
  - `NEEDS_UPDATE`
  - `NO_LONGER_RELEVANT`
- Audit trail persists in `ThesisReviewModel`:
  `{ userId, eventId, thesisId, playbookId, previousStatus, newStatus, reason, thesisVersion, reviewedAt, reviewedBy }`.

---

## 8. Research Engine Integration

The engine generates structured, non-predictive research questions containing 5 mandatory elements:
1. Event title/nature
2. Affected entity (symbol/sector)
3. Existing thesis reference
4. Observed evidence
5. Remaining unknown

Example:
> *"How does TCS's Q2 earnings result compare with the assumptions documented in Momentum Playbook v3, and does the observed revenue growth alter the thesis's expected holding period?"*

Users can click `[Create Research Question]` to save to the research queue.

---

## 9. Temporal Rules & Look-Ahead Protection

- Historical events evaluate portfolio state and theses as of `event.timestamp`.
- If an event occurred on 2026-01-10, positions opened on 2026-01-15 or theses authored on 2026-01-20 are strictly excluded from the historical cascade.
- Thesis versions active at `event.timestamp` are referenced, not later versions.

---

## 10. API Specifications

### 10.1 `GET /api/v1/market-events`
- Query params: `symbol`, `limit`, `asOf`
- Returns normalized market events list.

### 10.2 `GET /api/v1/market-events/:id/cascade`
- Query params:
  - `depth` (integer, 1 to 3, default: 3)
  - `relationshipTypes` (comma-separated list of allowed relationship enums)
  - `asOf` (ISO 8601 date string for historical cascade)
- Returns:
  ```json
  {
    "success": true,
    "data": {
      "event": { "id", "symbol", "title", "publishedAt", "provider" },
      "nodes": [{ "id", "type", "name", "symbol", "metadata", "source" }],
      "edges": [{ "source", "target", "relationshipType", "sourceType", "provider", "effectiveAt", "retrievedAt", "confidence", "evidence" }],
      "portfolioImpact": { "symbol", "exposurePercent", "shares", "currentValue", "isHeld" },
      "strategies": [{ "id", "name", "strategy", "active" }],
      "theses": [{ "id", "thesis", "status", "version", "diff", "reviewHistory" }],
      "researchQuestions": [{ "question", "context", "generatedAt" }]
    }
  }
  ```

### 10.3 `POST /api/v1/market-events/:id/thesis-review`
- Body:
  `{ "thesisId": "...", "status": "STILL_VALID" | "NEEDS_UPDATE" | "NO_LONGER_RELEVANT", "reason": "..." }`
- Returns updated thesis status and audit log record.

### 10.4 `POST /api/v1/market-events/:id/research-question`
- Body:
  `{ "question": "...", "thesisId": "...", "affectedSymbol": "..." }`
- Saves research question to user's research workflow.

### 10.5 `POST /api/v1/market-events/:id/ai-explain`
- Body:
  `{ "cascadeData": { ... } }`
- Calls grounded LLM with strict guardrails distinguishing OBSERVED, PROVIDER-SUPPLIED, DERIVED, USER-DEFINED, UNKNOWN.

---

## 11. Caching Strategy

1. **Public Graph Cache**:
   Key: `market-cascade:public:{eventId}:v{version}`
   TTL: 30 minutes. Caches external event data, sector taxonomy, and verified peer links.
2. **Private User Cascade Cache**:
   Key: `market-cascade:user:{userId}:{eventId}:{snapshotHash}`
   TTL: 5 minutes. Scoped to authenticated user's portfolio, playbooks, and journals.

---

## 12. Security & User Isolation

- All private data (holdings, positions, playbooks, theses, reviews, research questions) strictly scoped by `req.user.userId`.
- No client can supply or forge ownership of other users' portfolio or thesis graphs.
- External API keys remain securely on the backend.

---

## 13. Testing & Verification Plan

Create `test_mvp33.js` to execute automated tests:
1. Event Cascade generation (depth 1, 2, 3).
2. Deterministic relationship confidence states (`VERIFIED`, `USER_DEFINED`, etc.).
3. No fabricated relationships verification (`RELATIONSHIP UNAVAILABLE` handling).
4. Graph loop protection test (circular mock nodes $A \rightarrow B \rightarrow C \rightarrow A$).
5. Edge deduplication test.
6. Portfolio exposure calculation accuracy.
7. Playbook & strategy intersection matching.
8. Thesis matching, drift detection (`REQUIRES_REVIEW`), and diff calculation.
9. User thesis review workflow and audit persistence.
10. Research question generation (5 mandatory components).
11. Temporal isolation test (preventing look-ahead bias).
12. Historical thesis version test (v1 vs v2).
13. User data isolation test (User A vs User B).
14. Performance benchmarks (simulation of 1, 10, 100, 1000 events and graph assembly latency).
15. Regression validation across MVP-1 through MVP-32.
