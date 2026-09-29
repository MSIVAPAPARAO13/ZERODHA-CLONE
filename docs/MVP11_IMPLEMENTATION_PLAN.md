# MVP-11 Implementation Plan: AI Trade & Portfolio Analyst

## 1. Product Goal
MVP-11 turns TradeFlow factual data into grounded educational AI analysis. It answers "What can I learn from the record?" by securely contextualizing user actions for Gemini. The system restricts responses to structured schemas, prevents financial mutations, and avoids hallucinations.

## 2. Gemini Integration
- Using `@google/generative-ai` package on the backend.
- Reads `GEMINI_API_KEY` from `.env`.
- Gemini API interactions will be strictly server-side.
- Model: `gemini-2.5-flash` for fast, structured JSON capabilities (we will use strict JSON parsing).

## 3. Context Retrieval & Sanitization
The `aiContextService.js` handles pulling data. It strictly uses `req.user.userId`.
It strips any sensitive info (`_id` logic, passwords, salts are not applicable but we will ensure only specific lean payload fields are included).
- **Trade Review**: Extracts the TradeJournal, the corresponding Entry Order, Replay timeline, and historical facts.
- **Portfolio Review**: Fetches balances, holdings, current positions.
- **Pattern Review**: Extracts all journal entries (limit to 50 recent to control token size) and aggregates targets hit vs missed.
- **Daily Debrief**: Fetches all transactions, journals, alerts triggered *today*.
- **What Changed**: Generates factual counts of differences in the last 24 hours.

## 4. Prompt Generation
`aiPromptService.js` creates strictly bounded prompts, demanding a specific JSON shape.

## 5. AI Service & Routes
`aiAnalystService.js` coordinates `context -> prompt -> gemini -> response JSON parse`.
New endpoints in `aiRoutes.js`:
- `GET /api/v1/ai/trade-review/:journalId`
- `GET /api/v1/ai/portfolio-review`
- `GET /api/v1/ai/pattern-review`
- `GET /api/v1/ai/daily-debrief`
- `GET /api/v1/ai/what-changed-today`

## 6. Rate Limiting
We will add a lightweight in-memory rate limiter `aiRateLimiter.js` for the `/api/v1/ai` endpoints. E.g., max 10 requests per user per 15 minutes.

## 7. Frontend Integration
- Create an "Analyze This Trade" button in `TradeReplay.js`.
- Create a `PortfolioAnalyst.js` component accessible from Dashboard.
- Provide simple "Analyze" buttons that fetch the JSON and render the structured response safely (never innerHTML).

## 8. Explicit Non-Goals
- Real-time trading execution by AI.
- Investment recommendations ("BUY TCS NOW").
- A freeform chatbot interface.
- Writing to Orders or Journals directly.
