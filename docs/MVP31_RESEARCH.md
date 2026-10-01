# MVP-31 Research: Portfolio Change Intelligence

## 1. Existing Industry Capability
Most platforms provide portfolio analytics but only show the *current* state. Products like TradingView or specialized portfolio trackers (Sharesight) might show performance over time, but they don't explicitly attribute *why* risk or exposure changed in real-time. Change attribution is usually limited to institutional tools (like Aladdin) answering "Why did my portfolio return X?" rather than "Why did my strategy overlap increase today?".

## 2. TradeFlow's Differentiator
TradeFlow introduces a chronological **Decision Timeline**. It monitors underlying mutations (new orders, activated playbooks) and automatically calculates the second-order effects (e.g., a new order increased strategy overlap, which then triggered capital contention). 

## 3. Product Integration
When a user sees their portfolio, they don't just see "Reliance 29%". They can click "WHAT CHANGED TODAY?" and see the exact evidence chain: Order #1234 -> Exposure +11% -> Overlap Warning -> Research Question Generated.
