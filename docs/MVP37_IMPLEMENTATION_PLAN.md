# MVP-37 IMPLEMENTATION PLAN — TRADEFLOW RESEARCH COPILOT & EVIDENCE WORKSPACE

## 1. Objective & Non-Negotiable Boundaries

MVP-37 connects TradeFlow's analytical modules into a unified, evidence-driven **Research Copilot & Workspace**.
It is not an open-ended conversational bot or a stock tip engine; it is a **deterministic evidence orchestrator and grounded analytical workspace**.

### Strict Architectural Guardrails:
1. **Zero Financial Mutation**: Read-only research queries. No alterations to `virtualBalance`, `Holdings`, `Positions`, `Orders`, or `Transactions`.
2. **Zero Fabricated Market Facts**: The AI reasoning layer receives structured evidence from real backend APIs. If data is absent, it is explicitly classified as `UNKNOWN` or `LIMITATION`.
3. **Controlled Tool Registry**: The system executes only verified internal methods. Zero dynamic code generation (`eval()`, `new Function()`, raw SQL/Mongoose query strings).
4. **User Isolation**: All sessions and queries are strictly authenticated and bounded to `req.user.userId`.
5. **Architectural Reuse**: 100% reuse of `MarketDataService`, `marketScannerService`, `backtestEngine`, `scenarioEngine`, `watchlistService`, `alertService`, and `aiAnalystService`.

---

## 2. End-to-End Information Pipeline

```text
1. USER REQUEST
   "Why did TCS appear in my Momentum scanner?"
        ↓
2. INTENT CLASSIFIER & SYMBOL PARSER
   - Intent: SCANNER_RESEARCH (or SECURITY_RESEARCH, COMPARISON_RESEARCH, etc.)
   - Target Symbols: ["TCS"]
   - Context References: { scannerName: "Momentum Research" }
        ↓
3. RESEARCH PLANNER
   - Plan Checklist: [QUOTE, HISTORICAL_SERIES, SCANNER_EVIDENCE, WATCHLIST, ALERTS, THESIS]
   - Bounded tool execution list
        ↓
4. CONTROLLED TOOL REGISTRY EXECUTION
   - Parallel calls to registered service methods:
     • marketDataService.getQuote("TCS")
     • marketScannerService.runScan (or query recent run)
     • watchlistService.getWatchlist(userId)
     • alertService.getAlerts(userId)
     • TradeJournalModel.find({ user, symbol: "TCS" })
        ↓
5. EVIDENCE NORMALIZATION & CLASSIFICATION
   - OBSERVED: Quote price ₹3,412.00, RSI 61.4, Alert ₹3,480.00
   - DERIVED: 20-day return +4.2%, volume ratio 1.42x
   - INTERPRETED: Satisfied condition RSI > 55
   - UNKNOWN: Balance-sheet debt & P/E ratio
   - LIMITATION: Index survivorship disclosure
        ↓
6. SYNTHESIS ENGINE
   - Synthesizes Research Timeline (chronological order of events)
   - Generates Directed Evidence Graph (Nodes & Edges)
   - Audits Research Gaps (Verified vs Missing capabilities)
   - Computes Deterministic SHA-256 Research Hash
        ↓
7. GROUNDED AI EXPLAINER / OFFLINE FALLBACK
   - Formats strict sections: OBSERVED DATA, DERIVED METRICS, HISTORICAL EVIDENCE,
     STRESS EVIDENCE, RESEARCH INTERPRETATION, LIMITATIONS, UNKNOWNS, NEXT QUESTIONS.
        ↓
8. INTERACTIVE RESEARCH DOSSIER (FRONTEND)
   - Rendered in `/dashboard/research` with quick actions ("Investigate Deeper", "Save Session", "Export Markdown").
```

---

## 3. Database Schema: ResearchSessionModel

File: `backend/models/ResearchSessionModel.js`

```javascript
const ResearchSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  question: { type: String, required: true },
  intent: {
    type: String,
    enum: [
      'SECURITY_RESEARCH',
      'SCANNER_RESEARCH',
      'STRATEGY_RESEARCH',
      'PORTFOLIO_RESEARCH',
      'STRESS_RESEARCH',
      'THESIS_RESEARCH',
      'COMPARISON_RESEARCH',
      'ALERT_RESEARCH',
      'GENERAL_RESEARCH'
    ],
    default: 'SECURITY_RESEARCH'
  },
  symbols: [{ type: String, uppercase: true, trim: true }],
  plan: {
    intent: String,
    requiredTools: [String],
    symbols: [String],
    options: mongoose.Schema.Types.Mixed
  },
  evidenceReferences: [{
    sourceType: { type: String, required: true },
    sourceId: String,
    symbol: String,
    metric: String,
    value: mongoose.Schema.Types.Mixed,
    unit: String,
    context: String,
    confidence: {
      type: String,
      enum: ['OBSERVED', 'DERIVED', 'INTERPRETED', 'UNKNOWN', 'LIMITATION'],
      default: 'OBSERVED'
    },
    provider: String,
    timestamp: Date
  }],
  report: {
    summary: String,
    observedData: [String],
    derivedMetrics: [String],
    historicalEvidence: [String],
    stressEvidence: [String],
    researchInterpretation: [String],
    limitations: [String],
    unknowns: [String],
    nextQuestions: [String],
    gaps: [{ dimension: String, status: String, detail: String }],
    timeline: [{ date: String, eventType: String, description: String, source: String }],
    evidenceGraph: {
      nodes: [{ id: String, label: String, type: String, status: String }],
      edges: [{ source: String, target: String, relationship: String }]
    }
  },
  researchHash: { type: String, required: true },
  isArchived: { type: Boolean, default: false }
}, {
  timestamps: true
});

ResearchSessionSchema.index({ user: 1, createdAt: -1 });
```

---

## 4. Controlled Tool Registry

File: `backend/services/researchCopilotService.js`

| Tool Name | Engine / Service Reused | Description |
|---|---|---|
| `getQuote` | `marketDataService.getQuote` | Retrieves latest reference price, bid/ask, and provider. |
| `getHistoricalData` | `marketDataService.getHistoricalData` | Retrieves daily OHLCV bars and calculates moving averages/RSI. |
| `getScannerEvidence` | `marketScannerService.runScan` | Retrieves rule matches and exact numerical breakdown. |
| `getWatchlistEvidence` | `watchlistService.getWatchlist` | Verifies whether target symbol is monitored by user. |
| `getAlertEvidence` | `alertService.getAlerts` | Retrieves active price triggers for target symbol. |
| `getPortfolioEvidence` | `HoldingsModel` & `PositionsModel` | Audits user holdings, quantities, and sector exposure. |
| `getThesisAndJournalEvidence` | `TradeJournalModel` & `PlaybookModel` | Retrieves stored user hypotheses, entry reasons, and journal notes. |
| `runHistoricalBacktestBridge`| `backtestEngine.runBacktest` | Simulates historical performance of scanner criteria. |
| `runStressScenarioBridge` | `scenarioEngine.runScenario` | Evaluates hypothetical multi-shock portfolio impact on candidate basket. |

---

## 5. API Design & Endpoint Contracts

Mount Path: `/api/v1/research`

### 1. `POST /api/v1/research/investigate`
- Payload: `{ question: string, symbol?: string, scannerName?: string, options?: object }`
- Logic:
  1. Classifies intent and identifies symbols.
  2. Generates research plan.
  3. Executes controlled tools in parallel.
  4. Normalizes evidence into `OBSERVED`, `DERIVED`, `INTERPRETED`, `UNKNOWN`, `LIMITATION`.
  5. Computes research timeline, evidence graph, research gaps, and SHA-256 hash.
  6. Passes evidence to Grounded AI Explainer (or deterministic fallback).
  7. Persists session in `ResearchSessionModel`.
- Response: Standard `{ success: true, data: { session, report }, error: null }`.

### 2. `POST /api/v1/research/compare`
- Payload: `{ symbols: ["TCS", "INFY"], metrics?: string[] }`
- Logic: Generates side-by-side evidence matrix comparing price, moving averages, RSI, 20-day returns, watchlist presence, and alert coverage without declaring a "winner".

### 3. `POST /api/v1/research/deeper`
- Payload: `{ sessionId: string, deepType: "BACKTEST" | "STRESS" | "THESIS" }`
- Logic: Deepens specific dimension of the active research session (e.g. running full Strategy Lab backtest or Stress Studio sector shock).

### 4. `GET /api/v1/research/sessions`
- Retrieves paginated list of authenticated user's research dossiers.

### 5. `GET /api/v1/research/sessions/:id`
- Retrieves full research report with all evidence references.

### 6. `PATCH /api/v1/research/sessions/:id`
- Updates title or archives session.

### 7. `DELETE /api/v1/research/sessions/:id`
- Deletes research session.

---

## 6. Frontend Component Architecture

File: `dashboard/src/components/ResearchCopilot.js` & `ResearchCopilot.css`

1. **Header & Context Bar**:
   - Displays Active Symbol, Intent badge, Provider tier, As of Timestamp, and Deterministic Research Hash.
2. **Interactive Question Input & Preset Pills**:
   - Supports natural language query box.
   - One-click presets:
     - *"Research TCS and explain why it appeared in my scanner."*
     - *"Compare TCS and INFY using TradeFlow evidence."*
     - *"Validate historical performance of Momentum scanner criteria."*
     - *"Stress test current candidate basket against an IT sector correction."*
     - *"Audit my portfolio risk exposure and active theses."*
3. **Evidence Matrix & Timeline**:
   - Tabbed or multi-panel view displaying Market Data, Scanner Match, Historical Simulation, Stress Scenario, Watchlist, Alerts, and Theses.
   - Clickable `[View Evidence]` triggers detail drawer with underlying calculation provenance.
4. **Visual Evidence Graph**:
   - Lightweight visual graph showing relational nodes between Symbol, Scanner, Backtest, Stress Test, Watchlist, Alert, and Thesis.
5. **Research Gap Detector**:
   - Badges showing `✓ Technical Indicators Available`, `✓ Backtest Simulation Available`, `⚠ Fundamental Ratios Unavailable (Requires Provider Tier)`.
6. **Comparison Table**:
   - Side-by-side asset comparison table when comparing multiple symbols.
7. **Export Report**:
   - One-click Markdown export downloading the complete research dossier.

---

## 7. Test Plan (Minimum 40 Automated Tests)

File: `backend/test_mvp37.js`

1. Research session creation
2. Session validation & schema rejection
3. User ownership verification
4. Multi-tenant session isolation
5. Intent classification: SECURITY_RESEARCH
6. Intent classification: SCANNER_RESEARCH
7. Intent classification: STRATEGY_RESEARCH
8. Intent classification: PORTFOLIO_RESEARCH
9. Intent classification: COMPARISON_RESEARCH
10. Intent classification: STRESS_RESEARCH
11. Controlled tool registry execution
12. Quote evidence retrieval
13. Historical OHLCV evidence retrieval
14. Scanner rule breakdown evidence retrieval
15. Watchlist evidence retrieval
16. Alert evidence retrieval
17. Trade journal evidence retrieval
18. Playbook & thesis evidence retrieval
19. Historical backtest bridge execution
20. Stress studio scenario bridge execution
21. Missing data handling (UNKNOWN classification)
22. Unknown symbol handling (controlled error)
23. Provider rate limit (429) isolation
24. Provider server error (500) isolation
25. Grounded AI explainer segmentation
26. Zero fabricated prices or fundamentals
27. Zero arbitrary code execution (`eval()` / `Function()`)
28. Evidence source provenance references
29. Data timestamp tracking
30. Deterministic SHA-256 researchHash reproducibility
31. Follow-up research question synthesis
32. Research Gap Detector accuracy
33. Visual Evidence Graph node/edge structure
34. Deep investigation bridge (Investigate Deeper)
35. Side-by-side asset comparison matrix
36. Portfolio-level research aggregation
37. Thesis connection and drift detection
38. Performance benchmark (< 25ms total planning & evaluation)
39. Zero financial ledger mutation verification
40. Regression test: MVP-1 → MVP-36 verification
