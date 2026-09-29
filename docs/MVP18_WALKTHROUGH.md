# MVP-18 Walkthrough: Personal Trading Research Engine

## 1. Problem
TradeFlow needed a transparent way for users to interrogate their own data and test trading hypotheses without relying on opaque "AI black-box" scoring mechanisms.

## 2. The Research Engine
The `tradingResearchService` evaluates deterministic queries over a user's historical trades. Users can ask questions via UI filters or natural language, which is parsed strictly into safe JSON schemas (e.g., `{"playbook": "Momentum", "entryTimeFrom": "00:00", "entryTimeTo": "11:00"}`).

## 3. Transparency & Evidence
When a query executes, the UI returns the exact mathematical formula used (e.g., `Win Rate = 15 / 24 = 62.5%`), the sample size, and a table of the exact trades composing the sample. Users can click any trade to open its full Replay/Outcome Lab view.

## 4. AI Guardrails
AI does NOT compute statistics. The backend computes everything deterministically using Mongo aggregates. AI simply receives the results and provides a plain-English explanation, ensuring zero hallucinations in financial metrics.

## 5. Security & Isolation
All database calls are restricted by `req.user.userId`. AI parsers are restricted from outputting MongoDB operators (preventing NoSQL injection).

## 6. Integrations
Saved queries can feed into Behavioral Edge, acting as automated watchdogs for specific deviations or performance metrics.
