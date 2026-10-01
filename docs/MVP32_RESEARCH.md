# MVP-32 Research: Market Impact Intelligence

## 1. Existing Industry Capability
Market data platforms (Bloomberg, Reuters, Benzinga) supply real-time news and corporate actions. Portfolio tools (Koyfin, SeekingAlpha) link news to watchlists. However, very few retail platforms contextualize external market events against *internal strategy logic*, overlap density, and historical thesis journals.

## 2. TradeFlow's Differentiator
TradeFlow solves the "so what?" problem. When an earnings report drops, TradeFlow doesn't just display a news article. It maps the event against the authenticated user's exact exposure percentage, affected Playbooks, active alerts, and past research journals. 

## 3. Product Integration
The event serves as the trigger point. A single API event (e.g., "TCS Earnings") is normalized, deduplicated, and fed into the `ImpactMatchEngine`. If a match is found, it pipes directly into the MVP-31 Decision Timeline and MVP-18 Research Engine to generate grounded, contextual hypotheses.
