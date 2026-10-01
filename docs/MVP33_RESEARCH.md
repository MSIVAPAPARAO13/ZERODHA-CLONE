# MVP-33 Research: Market Event Cascade & Thesis Impact Engine

## 1. Existing Industry Approaches

Financial platforms and institutional analytics have evolved significantly beyond static news feeds:

- **Bloomberg / Reuters Eikon**: Supply real-time corporate action alerts and supply-chain graphs (e.g., Bloomberg's SPLC supply chain data). However, these enterprise systems treat portfolio interaction as external spreadsheet analytics rather than an integrated thesis-tracking feedback loop.
- **MarketRipple & Contextual Event Intelligence**: Map macro events and corporate earnings to sector hierarchies, upstream/downstream partners, and persistent market narratives ("market stories"). They highlight ripple effects through company networks.
- **Modern Institutional Risk & Knowledge Graphs (e.g., Kensho, FactSet Revere, BlackRock Aladdin)**: Use explicit entity-relationship ontologies (Direct Security -> Industry -> Sector -> Macro Theme -> Portfolio Exposure) to quantify multi-hop exposure without fabricating predictive claims.
- **AI Financial Knowledge Graphs**: Recent academic and industrial frameworks employ knowledge graphs (KGs) combined with LLMs for grounded reasoning. The consensus best practice is:
  1. The graph ontology must be strictly deterministic and evidence-backed.
  2. The LLM must NEVER predict price direction or generate ad-hoc relationship edges.
  3. The LLM serves solely as an explainer of the deterministic evidence graph.

---

## 2. Existing TradeFlow Capabilities

TradeFlow has established a structured foundation across MVP-1 through MVP-32:
- **Market Data Layer (`MarketDataService`)**: Abstracts Twelve Data, Alpha Vantage, and Mock providers with rate-limiting, error fallbacks, and multi-symbol quotes.
- **User Financial State**:
  - `HoldingsModel` & `PositionsModel`: Quantified position sizing, average price, P&L, and portfolio exposure percentages.
  - `WatchlistModel`: Monitored symbols without capital allocation.
  - `AlertModel`: User-defined price thresholds and active alerts.
  - `PlaybookModel`: Disciplined execution frameworks with categorized rules (`PLANNING`, `RISK`, `ENTRY`, `EXIT`, `JOURNAL`).
  - `TradeJournalModel`: Grounded trade journals containing user-authored theses, strategies, target/risk prices, and timeframes.
- **AI Analyst Layer (`aiAnalystService`, `aiContextService`)**: Grounded generative analysis constrained to structured JSON payloads with strict prohibition against financial advice.
- **Audit & Timeline Framework (MVP-31)**: Chronological state snapshots, idempotent change detection, and evidence attribution.

---

## 3. What MVP-32 Solved

MVP-32 answered the fundamental direct-match question:
> *"Does this market event relate to my portfolio?"*

It provided:
1. Event ingestion from external providers (Twelve Data / Alpha Vantage).
2. Deduplication using SHA-256 hashes of `provider + sourceId + symbol`.
3. Deterministic intersection matching:
   - Direct ownership in `Holdings` / `Positions`.
   - Direct tracking in `Watchlist`.
   - Direct triggers in `Alerts`.
   - Strategy associations in `Playbooks`.
   - Keyword/symbol associations in `TradeJournal` theses.
4. Calculation of exact exposure percentage for directly held assets.

---

## 4. What Remains Unsolved (The MVP-33 Challenge)

MVP-32 stopped at direct 1-to-1 symbol matches. Real market events propagate through structural relationships:
1. **Multi-Hop Event Propagation**: An event on TCS affects not just TCS directly, but also the Information Technology sector, related IT peers held in the user's portfolio (e.g., INFY, WIPRO), downstream momentum playbooks, and active investment theses.
2. **Thesis Drift Detection**: When new material evidence emerges (e.g., earnings deviation), how does it compare with the user's stored thesis assumptions? The user needs a clear before/after diff of assumptions versus observed reality.
3. **Thesis Lifecycle & User Review Workflow**: An automated system must never invalidate a user's thesis. Instead, it must flag the state as `REQUIRES_REVIEW`, present an interactive diff, allow the user to make a deliberate decision (`Still Valid`, `Needs Update`, `No Longer Relevant`), and preserve a versioned audit trail.
4. **Structured Research Question Generation**: Instead of trading impulsively on news, systematic investors formulate empirical research questions linking the event, affected entity, existing thesis, observed evidence, and remaining unknowns.
5. **Historical Cascade & Look-Ahead Protection**: When viewing an event from a past date, the cascade must be reconstructed using the portfolio snapshot and thesis versions active at that exact timestamp, strictly preventing hindsight contamination.

---

## 5. Proposed Cascade Architecture

The Event Cascade is a bounded, evidence-backed relationship graph:

```text
                     EXTERNAL MARKET EVENT
                               │
                               ▼
                       NORMALIZED EVENT
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   [DIRECT ENTITY]       [RELATED ENTITY]        [SECTOR]
     (e.g., TCS)       (e.g., INFY, WIPRO)   (e.g., IT Sector)
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                      PORTFOLIO EXPOSURE
                     (Holdings & Positions)
                               │
                               ▼
                       ACTIVE STRATEGIES
                          (Playbooks)
                               │
                               ▼
                       RESEARCH THESES
                          (Journals)
                               │
                               ▼
                    THESIS DRIFT & REVIEW
                    (REQUIRES_REVIEW Status)
                               │
                               ▼
                    RESEARCH QUESTION ENGINE
```

### Architectural Guardrails:
1. **Maximum Default Depth = 3**: Prevents exponential graph fan-out.
2. **Deterministic Confidence States**:
   - `VERIFIED`: Directly from confirmed internal DB records (e.g., actual user holdings, authored playbooks).
   - `PROVIDER_SUPPLIED`: Directly from API market metadata (e.g., Alpha Vantage / Twelve Data sector classification).
   - `USER_DEFINED`: Authored by the authenticated user (e.g., trade journal thesis, custom alert).
   - `DERIVED`: Computed by deterministic mathematical intersection (e.g., sector portfolio overlap, exposure percentage).
   - `UNKNOWN`: Insufficient evidence to establish relationship.
3. **Graph Loop Protection**: Strict visited-node set traversal preventing cycles (e.g., $A \rightarrow B \rightarrow C \rightarrow A$).
4. **Edge Deduplication**: Strict identity hash over `source + target + relationshipType + effectiveAt`.

---

## 6. Data Sources & Relationship Grounding

To adhere strictly to Rule 7 (NO FABRICATED RELATIONSHIPS):
- **Direct Securities**: Extracted from normalized event payload (`tickers` or `symbol` fields).
- **Sector & Industry Relationships**: Derived from documented market classification datasets and provider metadata (e.g., TCS -> Information Technology, INFY -> Information Technology, RELIANCE -> Energy & Diversified, ONGC -> Energy & Natural Gas, M&M -> Automotive, HUL -> FMCG). If an entity's sector is not verified, it is marked `RELATIONSHIP UNAVAILABLE` and no edge is created.
- **Portfolio Exposures**: Queried from `HoldingsModel` and `PositionsModel` matching `req.user.userId`.
- **Strategy Intersections**: Queried from `PlaybookModel` matching `req.user.userId` and strategy keywords or rules.
- **Thesis Intersections**: Queried from `TradeJournalModel` matching `req.user.userId` where `symbol` or `strategy` aligns.
- **Related Entities**: Only included if explicitly documented in verified sector-peer mappings or supply-chain datasets. Never inferred by LLM.

---

## 7. Relationship Confidence Methodology

TradeFlow rejects black-box numerical confidence scores (e.g., "78% confident") for structural graph edges. Instead, confidence is an explicit categorical enum:
- `VERIFIED`: Exact primary record match in user database or verified registry.
- `USER_DEFINED`: Explicitly entered by the user (thesis text, playbook rule).
- `PROVIDER_SUPPLIED`: Direct field in external API response.
- `DERIVED`: Deterministic algorithmic calculation (e.g., portfolio exposure math).
- `UNKNOWN`: Unverified connection (excluded from graph or explicitly flagged).

---

## 8. Limitations

1. **Static External Supply-Chain Data**: Without institutional enterprise feeds (such as Bloomberg SPLC), supply-chain mappings are bounded to verified company-to-sector and peer datasets.
2. **Provider Rate Limits**: Free-tier APIs (Alpha Vantage 5 calls/min, Twelve Data 8 calls/min) require caching and graceful fallback.
3. **Historical Snapshot Granularity**: Historical reconstruction relies on user transaction timestamps and journal creation dates. If an order occurred prior to system tracking, exposure is calculated from the earliest available ledger entry.

---

## 9. False-Positive Risks & Mitigations

| Risk | Cause | Mitigation |
|---|---|---|
| **Spurious Macro Overlap** | High-level macro news (e.g., "Fed interest rates") linking to every single holding in portfolio. | Cap cascade depth at 3, require explicit sector/symbol mentions, and rank nodes by direct exposure first. |
| **Hindsight Look-Ahead** | A user held no TCS on Jan 10, bought TCS on Jan 15; an event from Jan 10 surfaces on Jan 20 claiming 22% exposure. | Temporal filter enforces `position.createdAt <= event.timestamp`. |
| **Premature Thesis Invalidation** | System declaring a thesis "Dead" due to bad news. | System NEVER marks a thesis `CONTRADICTED` automatically. It marks `REQUIRES_REVIEW` and prompts the user for review. |
| **Graph Traversal Loops** | Circular links between related peers. | Visited Set tracking in DFS/BFS traversal; recursion hard-capped at `maxDepth`. |
