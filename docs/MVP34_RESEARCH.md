# MVP-34 Research: Advanced Scenario & Stress Studio

## 1. Industry Capabilities

Modern institutional risk and portfolio analytics platforms (such as MSCI Barra, BlackRock Aladdin, FactSet, Bloomberg PORT, and Axioma) provide advanced stress testing and scenario analysis. Retail and prop-trading platforms (Koyfin, Portfolio Visualizer, Interactive Brokers Risk Navigator) have also begun integrating "what-if" scenario modeling. Key industry capabilities include:

1. **Hypothetical Factor & Sector Shocks**: Applying user-defined shocks to macro factors, benchmark indices, or individual sectors to evaluate conditional portfolio drawdowns.
2. **Historical Stress Replay**: Replaying severe market dislocations (e.g., 2008 Global Financial Crisis, 2020 COVID crash, 2022 Tech Selloff) against a portfolio to see how it would have behaved.
3. **Holding-Level Loss Attribution**: Decomposing total modeled drawdown into granular asset-level contributions (e.g., Asset A contributed 42% of total loss, Asset B contributed 18%).
4. **What-If Position Simulation**: Allowing investors to simulate adding, sizing, or removing positions to observe changes in portfolio concentration and resilience before executing orders.
5. **Scenario Comparison**: Side-by-side benchmarking of multiple scenarios (e.g., Moderate Correction vs. Severe Liquidity Shock vs. Baseline).
6. **Separation of Stress Testing from Prediction**: Industry gold-standard platforms strictly emphasize that stress testing answers *"What would happen under these defined assumptions?"* rather than *"What is the probability of this occurring?"*

---

## 2. Existing TradeFlow Capabilities

TradeFlow has established robust core services:
- **Ledger & Accounting (`HoldingsModel`, `PositionsModel`, `TransactionModel`, `UserModel`)**: Accurate calculation of asset quantities, average purchase prices, live market valuations, and cash balances.
- **Market Data Layer (`MarketDataService`)**: Abstracts Twelve Data, Alpha Vantage, and Mock providers with in-memory caching and rate-limit protection.
- **Corporate Taxonomy (`marketMetadata.js`)**: Verified mapping of securities to official sectors and industries with strict prohibition against fabricated relationships.
- **Strategy & Thesis Framework (`PlaybookModel`, `TradeJournalModel`, `ThesisReviewModel`)**: Structured execution rules, user-authored theses, and review audit trails.
- **AI Analyst Layer (`aiAnalystService`)**: Grounded generative analysis constrained to structured JSON with explicit guardrails against financial advice or predictive claims.

---

## 3. What MVP-33 Solved

MVP-33 introduced the **Market Event Cascade Engine**:
- Bounded multi-hop relationship propagation rooted in external real-world catalysts.
- Deterministic confidence states (`VERIFIED`, `USER_DEFINED`, `PROVIDER_SUPPLIED`, `DERIVED`, `UNKNOWN`).
- Look-ahead protection and historical reconstruction using strict T-0 boundaries (`asOf`).
- Structured thesis drift detection and user-confirmed review workflows.

---

## 4. Gaps Addressed by MVP-34

While MVP-33 connects **observed real-world market events** to the portfolio, traders face critical unanswered questions:
1. **Hypothetical What-If Questions**: Traders need to test arbitrary hypothetical scenarios (e.g., "What if the IT sector falls 15% and NIFTY falls 10%?") before any actual news hits.
2. **Holding Loss Attribution & Offsets**: Lack of granular mathematical attribution showing which specific holdings drive the majority of downside and which assets provide offsetting hedging.
3. **Multi-Shock Interaction & Double-Counting Prevention**: Without a rigorous mathematical combination model, applying an index shock alongside a sector shock risks naive double-counting.
4. **What-If Position Modeling**: Inability to test adding or removing hypothetical positions to see the impact on portfolio concentration and stress resilience without mutating the real paper ledger.
5. **Scenario Comparison**: Inability to evaluate multiple hypothetical market paths side-by-side against the baseline portfolio.

---

## 5. Proposed MVP-34: Advanced Scenario & Stress Studio

```text
                     STRESS STUDIO
                          │
                          ▼
                  SCENARIO BUILDER
         (Custom Shocks / Historical Presets)
                          │
                          ▼
                   SCENARIO ENGINE
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
     MARKET SHOCK   SECTOR SHOCK    ASSET SHOCK
      (e.g., -10%)   (e.g., -15%)    (e.g., +5%)
           │              │              │
           └──────────────┼──────────────┘
                          ▼
            MULTI-SHOCK COMBINATION MODEL
           (Multiplicative, No Double-Count)
                          │
                          ▼
                  PORTFOLIO BASELINE
             (HoldingsModel & PositionsModel)
                          │
                          ▼
                  IMPACT CALCULATOR
           (Scenario Value, Absolute & % Delta)
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        ATTRIBUTION   STRATEGIES     THESES
         (Top Drag /  (Playbook      (Scenario
          Offsets)     Exposure)      Drift)
                          │
                          ▼
                  SCENARIO COMPARISON
               (Baseline vs S1 vs S2)
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
          WHAT-IF SIMULATOR   AI EXPLAINER
          (Hypothetical Add)   (Grounded)
```

---

## 6. Mathematical Methodology

### 6.1 Baseline Portfolio Valuation
$$\text{Baseline Value} = \sum_{i=1}^{N} \left( \text{Quantity}_i \times \text{Reference Price}_i \right)$$
Where $\text{Reference Price}_i$ is fetched deterministically from `MarketDataService`.

### 6.2 Multiplicative Shock Combination Model (Preventing Double Counting)
If a holding $i$ is subject to multiple simultaneous shock dimensions (e.g., Market Benchmark Shock $S_{\text{mkt}}$, Sector Shock $S_{\text{sec}}$, and Individual Asset Shock $S_{\text{asset}}$), the combined shock factor $S_{\text{combined}, i}$ is calculated multiplicatively:
$$1 + S_{\text{combined}, i} = (1 + S_{\text{mkt}}) \times (1 + S_{\text{sec}}) \times (1 + S_{\text{asset}})$$
$$S_{\text{combined}, i} = \left[ (1 + S_{\text{mkt}}) \times (1 + S_{\text{sec}}) \times (1 + S_{\text{asset}}) \right] - 1$$

*Example*: If NIFTY is shocked by $-10\%$ ($S_{\text{mkt}} = -0.10$) and IT Sector by $-15\%$ ($S_{\text{sec}} = -0.15$):
$$S_{\text{combined}} = (1 - 0.10) \times (1 - 0.15) - 1 = 0.90 \times 0.85 - 1 = 0.765 - 1 = -23.5\%$$
This strictly eliminates additive distortion (which would naively sum to $-25\%$) and preserves structural consistency across market layers.

### 6.3 Holding Valuation & Absolute Impact
$$\text{Scenario Price}_i = \text{Reference Price}_i \times (1 + S_{\text{combined}, i})$$
$$\text{Scenario Value}_i = \text{Quantity}_i \times \text{Scenario Price}_i$$
$$\text{Impact}_i = \text{Scenario Value}_i - \text{Baseline Value}_i$$

### 6.4 Total Portfolio Impact
$$\text{Total Scenario Value} = \sum_{i=1}^{N} \text{Scenario Value}_i$$
$$\text{Total Absolute Impact} = \text{Total Scenario Value} - \text{Baseline Value}$$
$$\text{Total Percentage Impact} = \left( \frac{\text{Total Absolute Impact}}{\text{Baseline Value}} \right) \times 100$$

### 6.5 Holding Loss Contribution
When $\text{Total Absolute Impact} \neq 0$:
$$\text{Contribution}_i = \left( \frac{\text{Impact}_i}{\text{Total Absolute Impact}} \right) \times 100$$
If $\text{Total Absolute Impact} = 0$, contribution percentages are mathematically undefined and set to $0\%$.

---

## 7. Data Requirements

1. **Holdings & Positions**: Current paper trading records from `HoldingsModel` and `PositionsModel`.
2. **Current Quotes**: Provided by `MarketDataService` with rate-limiting and cache protection.
3. **Sector Classification**: Grounded strictly in `marketMetadata.js`. If an asset's sector is not verified, sector shocks do NOT apply (`RELATIONSHIP UNAVAILABLE`).
4. **Historical Price Series**: Provided by `MarketDataService.getHistoricalData()` for historical crisis replays.

---

## 8. Limitations

1. **Linear Equity Assumption**: TradeFlow focuses on equity paper-trading portfolios. Shocks are applied as linear percentage shifts without options pricing (Black-Scholes / Greeks) or non-linear liquidity slippage.
2. **Static Balance Sheet**: Scenarios assume static portfolio composition over the shock horizon without automated intraday stop-loss execution.
3. **No Fabricated Macro Correlations**: Macro variables (e.g., interest rate shifts) only affect holdings where direct historical or fundamental mapping exists.

---

## 9. False-Positive Risks & Mitigations

| Risk | Cause | Mitigation |
|---|---|---|
| **Double Counting** | Overlapping market, sector, and asset shocks inflating losses. | Multiplicative shock formula $(1+S_m)(1+S_s)(1+S_a)-1$ and explicit attribution traceability. |
| **Prediction Confusion** | Users misinterpreting a stress test as a forecast of future price. | Clear UI badges distinguishing `HYPOTHETICAL` vs `OBSERVED`; explicit language stating *"Under this defined scenario, the model estimates..."* |
| **Look-Ahead Contamination** | Historical replay including positions opened after the crisis date. | Temporal snapshot filtering (`createdAt <= asOf`). |
| **Financial Ledger Mutation** | Scenario runs accidentally altering account cash balance or order history. | Pure in-memory calculation; zero write operations to `HoldingsModel`, `PositionsModel`, or `UserModel`. |

---

## 10. Product Differentiation

Unlike generic market simulators or black-box risk tools, TradeFlow's Stress Studio:
1. **Connects Directly to Strategy Playbooks**: Maps modeled drawdowns directly to the user's active playbooks, identifying which strategy sleeve carries the highest downside risk.
2. **Surfaces Thesis Vulnerability**: Flags active investment theses as `SCENARIO REQUIRES REVIEW` when modeled shocks exceed risk thresholds.
3. **Spawns Grounded Research Questions**: Converts modeled vulnerabilities into structured research questions (e.g., *"Which concentration of IT holdings drives the majority of modeled downside under a 15% sector correction?"*).
4. **Provides Complete Methodology Transparency**: Every scenario run exposes reference prices, mathematical formulas, snapshot hashes, and data sources via a `[View Methodology]` panel.
