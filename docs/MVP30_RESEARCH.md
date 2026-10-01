# MVP-30 Research: Portfolio & Strategy Allocation Intelligence

## 1. Existing Industry Capability
Platforms like QuantConnect and Portfolio123 offer multi-strategy portfolio backtesting. Traditional risk engines (Aladdin, RiskMetrics) measure factor exposures, correlations, and Value at Risk (VaR).

## 2. TradeFlow's Differentiator
TradeFlow bridges the gap between individual strategy research and portfolio aggregation. It answers the question: "Are my 4 strategies truly independent?" by mapping overlapping symbols, timing windows, and market regimes.

## 3. Product Integration
When Capital Contention or Strategy Conflict (e.g. Strategy A wants to buy RELIANCE, Strategy B wants to sell) is detected, TradeFlow doesn't automatically block the trade. Instead, it exposes the conflict to the **Portfolio Intelligence** dashboard and pipes it into the **Research Engine** for systematic investigation.
