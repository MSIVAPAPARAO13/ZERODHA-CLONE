# MVP-12 Walkthrough: TradeFlow Behavioral Edge Engine

## 1. Why Behavioral Analytics?
Current trading-journal products provide metrics like MAE, MFE, and psychology tracking. TradeFlow differentiates by leveraging the loop of Decision -> Replay -> Fact-based AI Explanation. The Behavioral Edge Engine deterministically uncovers recurring patterns in the user's trading process (e.g. consistently exiting before a recorded target, or risking trades without a set target).

## 2. Deterministic Foundation
- **`behaviorAnalyticsService.js`**: Computes strategy and confidence distributions, calculates Win Rates, and evaluates "Plan vs. Execution." 
- **MFE / MAE**: Calculated directly from historical `marketDataService` candles matched across the trade's holding period.
- **Minimum Sample Size**: Enforces a strict minimum of 5 trades before emitting any analytics. This prevents false behavioral flags drawn from insignificant sample sizes.

## 3. Pattern Recognition
Patterns (Edges or Leaks) are generated deterministically rather than through AI assumptions. Examples include:
- `TARGET_WITHOUT_RISK`
- `RISK_WITHOUT_TARGET`
- `EXIT_BEFORE_TARGET`
These facts are fed directly to the frontend and form the baseline for the AI reflection.

## 4. AI Explanation Layer
Unlike generic chatbots, the AI in MVP-12 only interprets deterministic data. When the user clicks "Review My Patterns", the system passes the highly summarized JSON of statistical facts (win rate, strategy count, pattern count) to Gemini. The prompt explicitly prohibits giving investment advice or recalculating the numbers. The AI returns structured reflections to help the user internalize the insights.

## 5. Security & Isolation
All behavioral analytics are explicitly scoped to `req.user.userId`. Cross-user data contamination is mathematically impossible in the query layer.

## 6. Frontend
A dedicated `BehaviorInsights.js` dashboard acts as a central hub for Edge evaluation. It clearly displays Journal Completeness (showing the user how robust their data is) and lists all observed patterns, alongside the optional AI Reflection module.
