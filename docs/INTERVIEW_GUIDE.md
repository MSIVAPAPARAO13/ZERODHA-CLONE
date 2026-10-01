# TRADEFLOW — SENIOR SOFTWARE ENGINEER INTERVIEW GUIDE

---

## 1. The Core Problem

Active traders and quantitative analysts operate across fractured workflows:
- **Brokerage apps** display raw charts without explainable macroeconomic context.
- **Generic AI chat interfaces** hallucinate stock prices, volume, and financial statements.
- **Paper trading toys** lack transactional integrity, oversell protection, and double-entry auditability.
- **Spreadsheets** isolate investment theses from actual execution and trade review.

**TradeFlow** solves this by unifying the entire investment lifecycle into an integrated platform:
$$\text{Discovery} \longrightarrow \text{Evidence Research} \longrightarrow \text{Stress Testing} \longrightarrow \text{Idempotent Execution} \longrightarrow \text{Autopsy} \longrightarrow \text{Behavioral Coaching}$$

---

## 2. Evolution: From Monolith Zerodha Clone to Advanced SaaS

1. **Initial Baseline (Zerodha Clone)**:
   A standard clone with basic static holdings and simple mock buy/sell actions with zero authentication, no database transactions, and no AI reasoning.
2. **Phase 1: Financial & Security Foundation (MVP 1-13)**:
   Introduced JWT authentication, password hashing, multi-tenant user scoping, MongoDB ACID transaction sessions, double-entry ledgers, and trade journals.
3. **Phase 2: Market Intelligence & Factor Risk (MVP 33-43)**:
   Added macroeconomic regime classifiers, shock transmission engines, multi-asset scanners, portfolio factor beta analytics, and scenario stress testing.
4. **Phase 3: Quantitative Strategies & Grounded Copilot (MVP 44-50)**:
   Engineered deterministic backtesting, Monte Carlo robustness scoring, decision pre-mortems, and behavioral trader bias coaching.
5. **Phase 4: SaaS Infrastructure & Enterprise Collaboration (MVP 51-60)**:
   Engineered autonomous research agents, workflow pipelines, multi-tenant organization RBAC (OWNER, ADMIN, RESEARCHER, VIEWER), idempotency keys, and telemetry observability.

---

## 3. Biggest Engineering Challenges & Solutions

### 1. Financial Consistency & Race Conditions
- **Challenge**: Prevent double-spending, balance over-deduction, or overselling when users spam submit buttons or experience network retries.
- **Solution**: MongoDB multi-document ACID transactions with `session.startTransaction()`. Pre-execution balance checks and holding balance verification happen inside the transaction. Idempotency middleware locks in-flight operations with an atomic unique index on `{ user, key }`.

### 2. Market Data Provider Outages & Rate Limits
- **Challenge**: Third-party providers (TwelveData, AlphaVantage) have strict rate limits and intermittent timeouts.
- **Solution**: 4-tier gateway: Primary Provider $\to$ Secondary Fallback $\to$ 5-minute In-Memory Cache with `isStale: true` transparency $\to$ Explicit `DATA_UNAVAILABLE` error envelope. The system **never fabricates fictitious numbers**.

### 3. AI Hallucination & Financial Grounding
- **Challenge**: LLMs invent numbers when asked about financial metrics.
- **Solution**: Strict prompt grounding via an Evidence Builder pattern. The LLM is supplied pre-calculated factual JSON payloads and restricted to 11 allowlisted tools in an agent registry.

### 4. Multi-Tenant Isolation
- **Challenge**: Ensure User A cannot view, modify, or delete User B's portfolios or orders.
- **Solution**: Identity is derived exclusively from cryptographically verified JWT (`req.user.userId`). All queries enforce tenant compound filters.

---

## 4. Key Architectural Decisions (Why These Choices?)

1. **Why MongoDB Atlas with Replica Set?**
   Enables flexible JSON document modeling for varied financial strategies, regime trees, and research sessions while maintaining ACID transaction semantics via multi-document sessions.
2. **Why a Dedicated Service Layer?**
   Controllers handle HTTP validation and formatting; business logic resides strictly inside dedicated domain services (`tradingService`, `marketDataService`, `scenarioEngine`), facilitating independent unit testing.
3. **Why Market Data Provider Abstraction?**
   Decouples the application from any single vendor. Allows seamless switching between TwelveData, AlphaVantage, or simulated feeds with zero changes to frontend or trading engines.
4. **Why Client-Driven Idempotency Keys?**
   Network dropped packets frequently cause duplicate order submissions. Providing an `Idempotency-Key` header guarantees that retries safely receive cached responses without re-executing balance deductions.

---

## 5. Technical Interview Q&A Cheatsheet

### Q1: How did you prevent double spending on paper orders?
> *"We implemented a two-tiered defense: First, an Express idempotency middleware hashes the payload and atomically reserves an `IdempotencyKey` record in MongoDB scoped to the user ID. If an in-flight request is active, it returns 409 Conflict; if completed, it replays the cached 200 response. Second, inside `tradingService`, all operations (balance deduction, order creation, transaction logging, holding update) are wrapped in a MongoDB ACID session. If the balance is insufficient or an error occurs, `session.abortTransaction()` reverts all writes."*

### Q2: How do you enforce user data isolation?
> *"We never trust client-supplied user identifiers in the request body or query params. Identity is extracted strictly from the validated JWT in `authMiddleware` as `req.user.userId`. Every database query enforces `{ user: req.user.userId }` at the service layer."*

### Q3: How do you prevent AI from hallucinating market metrics?
> *"We implement an Evidence Builder pattern. When a user asks a research question, the backend gathers verified market quotes, technical indicators, and sector exposures from our data services first, binds them into a structured prompt context, and instructs Gemini to cite only the provided evidence. For autonomous research, the agent is restricted to an allowlisted registry of 11 analytical tools with a 5-step loop limit."*

### Q4: How would you scale this architecture to 100,000 active users?
> *"1. **Caching & Session State**: Introduce Redis for distributed idempotency locking, market quote caching, and rate limiting.  
> 2. **Database Scaling**: Implement horizontal sharding in MongoDB Atlas on `user` key to distribute tenant data across shards.  
> 3. **Asynchronous Processing**: Offload compute-heavy backtesting and multi-asset scanners to background worker queues (BullMQ / Celery) over Redis or RabbitMQ.  
> 4. **Read Replicas**: Direct read-heavy analytics (portfolio holdings, market events, journal history) to Atlas read secondaries."*

### Q5: How would you introduce Kafka or Event Streaming?
> *"We would publish domain events (e.g. `OrderExecutedEvent`, `PriceAlertTriggeredEvent`, `MarketRegimeShiftEvent`) to Kafka topics partitioned by `userId` or `symbol`. Microservices for notifications, behavioral coaching analytics, and risk calculators would consume these streams independently without blocking the synchronous Express HTTP API."*
