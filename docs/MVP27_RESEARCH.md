# MVP-27 Research: Market Intelligence & Discovery

## 1. Existing Tools Analysis
Platforms like TradingView and TrendSpider offer deep scripting languages (PineScript) or visual node-based condition builders to scan the entire market universe for arbitrary indicators (RSI, MACD crossover, etc). They trigger alerts when conditions are met.

## 2. TradeFlow's Unique Differentiation
While TradeFlow cannot currently scan 10,000 real-time tickers without violating external API rate limits, its true moat is the **Intelligence OS (MVP-26)** and **Playbooks (MVP-23)**. 
Therefore, TradeFlow's discovery engine does not need to just find "high RSI". It can scan the user's *Watchlist* and find **Playbook Matches** (e.g., finding stocks where 4 out of 5 rules of your validated "Momentum Breakout v3" playbook are currently true) and create a **Research Opportunity**.

## 3. Product Integration
Rather than building an isolated screener, TradeFlow integrates discovery directly into the Research Loop:
`Market Radar -> Playbook Match -> Research Opportunity -> Validation Lab`
