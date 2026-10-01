# MVP-44 Walkthrough — Sector Intelligence Engine

## Overview
MVP-44 introduces the **Sector Intelligence Engine** in TradeFlow, connecting real-time market data across verified industry sectors with user portfolio holdings and event signals.

## Key Capabilities Verified
1. **Deterministic Sector Aggregation**: Real quotes aggregated across verified exchange taxonomy for key sectors (Information Technology, Financial Services, Energy, FMCG, Auto, Pharma, Metals).
2. **Transparent Metrics**: Computes average price change, advancing vs declining breadth, cumulative volume, and momentum without arbitrary scores.
3. **Portfolio Cross-Linkage**: Shows user's exact portfolio exposure % in each sector, held constituent symbols, and provides direct prompts for Copilot investigation and stress testing.
4. **Transparent Sector Comparison**: Enables side-by-side comparison between any two sectors on real metrics.
5. **Sector Event Generation**: Emits `SECTOR_CHANGE` into `MarketEventModel` when material moves occur.
6. **Graceful Handling of Unclassified Data**: Unclassified or unknown sectors return `DATA_LIMITED` status safely.
7. **Zero Financial Ledger Mutation**: Completely read-only intelligence layer.
8. **Multi-Tenant User Isolation**: Strict scoping of user holdings and exposure.
