# TRADEFLOW — SENIOR SOFTWARE ENGINEER & ARCHITECT INTERVIEW GUIDE

**Role Scope**: Full-Stack Senior Software Engineer / FinTech Systems Architect  
**Project**: TradeFlow (Paper Trading & Market Intelligence SaaS)  
**Date**: October 2026  

---

## 1. Core Platform Pitch

### What is TradeFlow?
> *"TradeFlow is a production-grade paper trading and market intelligence SaaS designed for active equity traders and quantitative analysts. It bridges the gap between basic charting tools and generic AI chatbots by combining a double-entry transactional paper ledger, deterministic multi-provider market data feeds, multi-hop factor stress testing, and a grounded AI copilot that cites verified financial metrics instead of hallucinating prices."*

### What problem does TradeFlow solve?
> *"Active traders today suffer from fragmented workflows: brokerages give raw charts without explainable macroeconomic context; generic AI chatbots hallucinate stock prices and financial statements; paper trading clones lack transactional integrity and oversell protection; and spreadsheets isolate investment theses from execution and post-trade reviews. TradeFlow unifies this entire workflow into a single institutional-grade terminal."*

### Why is TradeFlow different from a standard "Zerodha Clone"?
> *"A typical Zerodha clone is an MVP with static mock JSON, single-tenant unauthenticated endpoints, and basic UI buttons. TradeFlow began with the Zerodha visual trading ergonomics as a foundation and evolved into an institutional SaaS with:  
> 1. Multi-tenant JWT auth and RBAC organization workspaces.  
> 2. Full MongoDB ACID multi-document transactions with balance checks, double-entry audit ledgers, and idempotency protection against double-execution.  
> 3. A 4-tier resilient market data gateway integrating Twelve Data, Alpha Vantage, and fallback simulation.  
> 4. An AST-based quantitative market scanner and deterministic backtesting engine with Monte Carlo and walk-forward validation.  
> 5. An autonomous research agent powered by Google Gemini bounded to an allowlisted 11-tool analytical sandbox with zero financial hallucination."*

---

## 2. Deep-Dive Technical Questions & Answers

### Q1: How does BUY order execution work, and how do you guarantee financial integrity?
> *"When a user submits a BUY order (`POST /api/v1/orders/buy`), the request passes through our idempotency middleware, which checks for a client-supplied `Idempotency-Key` header and attempts an atomic lock in MongoDB. Inside `tradingService`, we start a MongoDB multi-document ACID transaction session (`session.startTransaction()`).  
> 1. We query the user within the session and assert `user.virtualBalance >= totalCost`. If insufficient, we abort the transaction and return 400.  
> 2. We atomically deduct `virtualBalance -= totalCost`.  
> 3. We create the `Order` record in the session.  
> 4. We upsert the user's `Holding`, recalculating the weighted average price: `((oldQty * oldAvg) + (newQty * newPrice)) / (oldQty + newQty)`.  
> 5. We append an immutable `Transaction` record storing `balanceBefore` and `balanceAfter`.  
> Finally, we commit the transaction. If any database write fails or the server crashes mid-flight, MongoDB rolls back all writes completely. Double-spending is mathematically impossible."*

### Q2: How does SELL order execution work?
> *"For a SELL order, the flow is similarly wrapped in a MongoDB ACID session. We first retrieve the user's `Holding` and assert `holding && holding.qty >= sellQty`. If the user attempts to sell shares they do not own, the transaction is immediately aborted. We then credit `user.virtualBalance += totalProceeds`, update or delete the holding (if shares reach 0), record the realized P&L `(sellPrice - holding.avg) * sellQty`, and append the double-entry transaction record."*

### Q3: Why did you choose MongoDB Atlas instead of PostgreSQL?
> *"MongoDB Atlas with a replica set allows us to store polymorphic financial data structures—such as dynamic AST scanner criteria, custom factor stress overrides, multi-stage DAG workflow runs, and multi-turn research sessions—without rigid migrations, while MongoDB 6.0+ multi-document ACID transactions provide the exact same transactional guarantees (isolation, atomicity, and rollback) as traditional relational databases."*

### Q4: How do you enforce multi-tenant isolation?
> *"We never trust client-supplied tenant identifiers or IDs in the request body or query parameters. Identity is derived strictly from the cryptographically verified JWT payload (`req.user.userId`). Every database query at the service layer enforces `{ user: req.user.userId }`. For organizations, membership and role (OWNER, ADMIN, RESEARCHER, VIEWER) are verified via `Membership` records before granting access to shared research."*

### Q5: How does your market data provider abstraction work?
> *"We built an abstract `MarketDataService` gateway implementing a 4-tier resilience hierarchy:  
> 1. **In-Memory Cache**: 5-minute TTL cache to eliminate redundant API calls for hot symbols.  
> 2. **Primary Provider**: Twelve Data REST/WebSocket feeds for real-time NSE/global equities.  
> 3. **Secondary Provider**: Alpha Vantage for technical indicators (RSI, SMA) and fallback quotes.  
> 4. **Resilience Provider**: `MockMarketDataProvider` for offline testing and graceful failover when external quotas are throttled.  
> Crucially, every quote response includes transparent metadata (`provider` and `providerNotice`), so users always know whether data is real-time, cached, or fallback."*

### Q6: How do you prevent Gemini AI from hallucinating market prices?
> *"We implement an **Evidence Builder Pattern**. We never allow the LLM to guess market prices or search the open web unconstrained. When a user asks an analytical question, our backend first queries our own verified services (live quotes, technical indicators, portfolio beta, sector contagion graph), binds those verified JSON facts into the prompt context, and instructs Gemini to act strictly as a synthesizer citing the supplied evidence. Furthermore, for our autonomous research agent, the model is sandboxed to an allowlisted registry of 11 analytical tools with a strict 5-step iteration limit."*

### Q7: What was the most difficult engineering challenge?
> *"Ensuring absolute financial consistency and race condition prevention when testing concurrent order bursts and network retries. We solved this with a two-layer defense: first, cryptographic idempotency reservation in Express middleware to debounce concurrent in-flight requests, and second, wrapping all balance deductions, holding updates, and transaction logging inside MongoDB replica set multi-document ACID transactions."*

### Q8: How would you scale this platform to 100,000 active concurrent users?
> *"1. **Distributed Caching & Locks**: Replace in-memory caches and MongoDB idempotency keys with a Redis cluster for sub-millisecond locks and quote caching.  
> 2. **Asynchronous Compute**: Offload heavy computational workloads (Monte Carlo simulations, walk-forward optimizations, multi-asset AST scans) to background worker queues (BullMQ / Celery).  
> 3. **Database Sharding**: Enable MongoDB Atlas horizontal sharding hashed on `user` ID to distribute tenant collections across multiple shards.  
> 4. **Read Secondaries**: Route read-heavy analytics (portfolio holding valuations, transaction history, events feed) to Atlas replica set read secondaries."*
