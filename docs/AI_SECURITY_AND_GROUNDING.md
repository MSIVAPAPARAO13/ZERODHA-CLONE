# TRADEFLOW — GEMINI AI SECURITY, GROUNDING & EVIDENCE ARCHITECTURE

**System**: TradeFlow Copilot & Quantitative Research Agent  
**LLM Engine**: Google Gemini 1.5 Pro / Gemini 2.0 Flash (`@google/generative-ai`)  
**Status**: **PASSED (Zero-Hallucination Grounded Architecture)**

---

## 1. Architectural Philosophy: The Evidence Builder Pattern

In financial SaaS applications, unrestricted generative AI responses are unacceptable due to hallucinations regarding prices, fundamentals, and corporate events.

TradeFlow enforces an **Evidence Builder Pattern**:
```text
User Question / Research Query
              │
              ▼
┌────────────────────────────────────────────────────────┐
│               Backend Domain Orchestrator              │
│  - Fetches factual quote from MarketDataService        │
│  - Pulls user's actual portfolio holdings & risk beta  │
│  - Queries macro regime classifier (VIX, yields)       │
│  - Compiles verifiable SEC / NSE catalyst filings       │
└─────────────────────────────┬──────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│             Structured Context Assembly                │
│  - Injects verified JSON evidence into system prompt   │
│  - Enforces JSON Schema output constraint              │
│  - Forbids ungrounded extrapolation or price invention │
└─────────────────────────────┬──────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│                  Google Gemini Model                   │
│  - Operates purely as a synthesis & reasoning engine   │
│  - Generates structured thesis, bull/bear cases        │
│  - Attaches explicit citations to input facts          │
└─────────────────────────────┬──────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│            Output Validation & Sanitization            │
│  - Parses & validates against Joi / JSON schema        │
│  - Appends mandatory educational disclaimer            │
│  - Rejects malformed or speculative tokens             │
└────────────────────────────────────────────────────────┘
```

---

## 2. Distinction of Content Layers

All AI endpoints and UI components explicitly partition response data into 4 distinct visual blocks:

1. **Source Data**: Verifiable raw numbers (LTP, 52W High/Low, PE, Beta, VIX).
2. **AI Analysis**: Grounded synthesis, factor tilt assessment, and scenario vulnerability.
3. **User Data**: Tenant-specific portfolio weighting and entry cost basis.
4. **Educational Disclaimer**: Mandatory legal notice that outputs represent simulated analysis and educational commentary, never guaranteed financial advice or brokerage execution.

---

## 3. Sandboxed Autonomous Research Agent (`researchAgentService.js`)

The TradeFlow Autonomous Research Agent executes iterative multi-step research through an allowlisted registry of 11 analytical tools:

### Allowlisted Agent Tools
1. `getQuote`: Fetches verified real-time bid/ask and OHLCV.
2. `getHistoricalPrices`: Historical daily prices for volatility and trend calculations.
3. `getTechnicalIndicators`: RSI, SMA, and MACD indicators.
4. `getMacroRegime`: Current macroeconomic state classification.
5. `getPortfolioExposure`: Reads caller's current portfolio holdings and cash.
6. `calculateVaR`: Computes 95% parametric Value at Risk.
7. `simulateStressScenario`: Evaluates portfolio drawdown under historical shocks.
8. `getEarningsCatalysts`: Pulls scheduled corporate earnings announcements.
9. `getContagionGraph`: Queries sector transmission dependencies.
10. `getTraderBiases`: Audits recent trading journal for behavioral patterns.
11. `synthesizeNarrative`: Assembles final structured investment memo.

### Strict Safety Invariants
- **No Arbitrary Code Execution**: The agent cannot execute bash, PowerShell, Python, or eval.
- **No Direct Database Writes**: Tools are strictly read-only or scoped to research session models.
- **Iteration Cap**: Maximum 5 agent reasoning cycles (`MAX_STEPS = 5`).
- **Token Limits**: Output bounded to 2,048 tokens per turn to prevent denial-of-wallet exhaustion.
- **Prompt Injection Defense**: System instructions enforce role boundary delimiters (`### SYSTEM INSTRUCTION ###`, `### VERIFIED CONTEXT ###`, `### USER QUERY ###`). Instructions in user inputs attempting to override role constraints are ignored.

---

## 4. API Key Protection & Fallback Resilience

- **Secret Protection**: `GEMINI_API_KEY` is loaded exclusively in `services/aiService.js` on the server and is never transmitted to the frontend bundle.
- **Offline / Rate-Limit Fallback**: If the Gemini API is unconfigured, unreachable, or returns HTTP 429, the system triggers deterministic rule-based heuristic analyzers (`aiService.generateFallbackInsights`) ensuring uninterrupted platform operation without blank screens.
