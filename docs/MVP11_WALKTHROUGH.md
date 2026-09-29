# MVP-11 Walkthrough: AI Trade & Portfolio Analyst

## 1. Why TradeFlow Needs AI
MVP-9 and MVP-10 established a perfect loop: "Why did I trade?" (Decision) and "What happened?" (Outcome/Replay). MVP-11 introduces grounded AI analysis to complete the loop: "What can I learn?" 
Generic chatbots often hallucinate. TradeFlow AI Analyst specifically only receives sanitized, factual application data (ledgers, replays, history) and is explicitly constrained to returning strictly typed JSON feedback.

## 2. Architecture & Control
- **Backend Only**: React never talks to Gemini. All requests route through `/api/v1/ai/...`.
- **Sanitized Context**: `aiContextService.js` strictly filters database documents. Passwords, auth tokens, and raw ObjectIds never enter the Gemini prompt. 
- **System Constraints**: The prompt explicitly commands the AI to stick to the facts, avoid financial advice ("BUY/SELL"), and answer in rigorous JSON.
- **Rate Limiting**: An in-memory rate limiter caps analysis requests to 10 per 15 minutes, controlling API burn rate and preventing abuse.

## 3. Four Core Use Cases
1. **Trade Review**: Triggered from the Replay screen. Merges the initial thesis with the actual target/risk crossing timeline to provide a debrief on what went as planned vs what diverged.
2. **Portfolio Review**: A holistic look at holdings, balances, and recent transactions, designed to highlight concentration risks and shifts.
3. **Pattern Review**: Scans recent journals. E.g., identifying that momentum trades without target prices often result in larger drawdowns (based entirely on the user's factual ledger).
4. **Daily Debrief & What Changed**: A quick summarization engine answering "what actually moved in my account today?"

## 4. Frontend Experience
- A new section "AI Analyst" on the dashboard acts as the command center for generic reviews.
- The `TradeReplay` component features a dedicated "Analyze This Trade" button that generates a bespoke report directly tied to that specific trade's replay payload.

## 5. Security & Isolation
- JWT extraction guarantees User A's AI prompt only contains User A's data. 
- The AI Service operates strictly in a read-only capacity. It is absolutely decoupled from the `tradingService` and `orderController`, meaning Gemini can never hallucinate a live order or manipulate a balance.
