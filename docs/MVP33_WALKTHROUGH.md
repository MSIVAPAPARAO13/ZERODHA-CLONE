# MVP-33 Walkthrough: Market Event Cascade & Thesis Impact Engine

## 1. Executive Summary

MVP-33 delivers TradeFlow's flagship **Market Event Cascade & Thesis Impact Engine**. While MVP-32 established direct event matching ("Does this event relate to my portfolio?"), MVP-33 solves the deep structural propagation problem:

> *"How could this event propagate through the market relationships already supported by TradeFlow, and which parts of my strategy/thesis graph intersect with that propagation?"*

TradeFlow achieves this through an evidence-backed relationship graph with zero fabricated connections, deterministic relationship confidence states, bounded graph depth, thesis drift detection with structured diffs, a user-confirmed review workflow, and research question synthesis.

---

## 2. Walkthrough & Interview Demo Flow

Use this exact flow to demonstrate the feature:

### Step 1: Open Market Cascade
1. In the dashboard navigation bar, click on **⚡ Cascade** (or click **View Cascade Graph →** on the dashboard home banner).
2. The **Market Event Cascade & Thesis Impact** workspace loads.

### Step 2: Select Catalyst ("TCS Earnings")
1. From the event dropdown, select:
   **`TCS — TCS Announces Q3 Financial Results with Modest Operating Margin Contraction`**
2. The event hero card displays:
   - Category: `EARNINGS`
   - Published: `2026-09-15`
   - Source: `AlphaVantage`
   - Factual summary of revenue growth (+2.1% YoY) and 45 bps operating margin contraction.

### Step 3: Inspect the Interactive Multi-Hop Cascade Graph
1. Observe the hierarchical visual tree:
   ```text
                      ROOT EVENT
               (TCS Q3 Earnings Catalyst)
                          │
                          ▼
                   DIRECT SECURITY
                        (TCS)
                    ┌─────┴─────┐
                    ▼           ▼
               SECTOR PEERS   PORTFOLIO
             (IT Sector, INFY) (84.21% Exposure)
                                │
                                ▼
                             PLAYBOOK
                      (Momentum Breakout v3)
                                │
                                ▼
                         RESEARCH THESIS
                      (Q3 Margin Expansion)
   ```
2. The **Graph Legend** explicitly distinguishes:
   - `PROVIDER-SUPPLIED`: External API market headlines and exchange data.
   - `VERIFIED`: Confirmed exchange taxonomy and corporate peer datasets.
   - `DERIVED`: Mathematical portfolio exposure calculations.
   - `USER-DEFINED`: User-authored playbooks, alerts, and trade journal theses.

### Step 4: Click Any Node for Grounded Evidence
1. Click the **TCS** node:
   - Entity Inspector reveals: Relationship: `DIRECT_SECURITY`, Source: `EXCHANGE_IDENTIFIER`, Confidence: `PROVIDER_SUPPLIED`.
2. Click the **Information Technology** or **INFY** node:
   - Inspector confirms: Relationship: `RELATED_ENTITY`, Source: `VERIFIED_REGISTRY`, Evidence: "INFY is a verified peer in IT Services & Consulting".
3. Click the **Portfolio** node:
   - Inspector confirms: 84.21% exposure, 50 shares held, mathematically derived from internal ledger.

### Step 5: Detect Thesis Drift & Inspect Diff
1. In the **Thesis Drift Detection & Review** panel, click **Thesis v1 (MOMENTUM)**.
2. The UI renders the structured **Thesis Diff**:
   - **Stored Thesis Assumption**: *"Steady Q3 margin expansion and cloud deal ramp will drive continuation toward 3500."*
   - **Observed Event Evidence**: *"TCS Announces Q3 Financial Results with Modest Operating Margin Contraction - Tata Consultancy Services reported Q3 revenue growth of 2.1% YoY with operating margins contracting by 45 basis points..."*
   - **Calculated Difference**: *"Observed evidence from AlphaVantage indicates new material catalyst (EARNINGS), requiring verification against stored assumption..."*
3. Notice the status badge:
   `REQUIRES REVIEW`
   *(TradeFlow NEVER automatically invalidates a user's thesis. It flags the assumption divergence for deliberate user action.)*

### Step 6: User-Confirmed Review Decision
1. Enter an optional review note: *"Q3 seasonal furlough was anticipated; pipeline deals remain robust."*
2. Click **[✓ Still Valid]**.
3. A success notification confirms the review.
4. The status badge immediately updates to **`STILL VALID`**, and the audit trail preserves the decision with timestamp, reviewer ID, and reason.
5. In subsequent updates (e.g. clicking **[⚠ Needs Update]**), the thesis automatically increments to **Thesis v2** with a preserved revision history.

### Step 7: Synthesize Grounded Research Question
1. Under **Research Engine Integration**, inspect the automatically synthesized research question:
   > *"How does the earnings event ('TCS Announces Q3 Financial Results with Modest Operating Margin Contraction') affect the valuation and holding assumptions for TCS documented in MVP33 Momentum Breakout v3, and does the observed evidence change the anticipated risk threshold?"*
2. Confirm the 5 mandatory elements:
   - **Event**: Q3 Earnings contraction
   - **Affected Entity**: TCS
   - **Existing Thesis**: Momentum margin expansion
   - **Observed Evidence**: 45 bps margin dip
   - **Unknown**: Price reaction and next quarter operating metrics
3. Click **[+ Create Research Question]** to save the inquiry directly into the research queue.

### Step 8: View Decision Timeline (MVP-31 Integration)
1. In the top controls, toggle **Decision Timeline**.
2. TradeFlow displays the chronological audit chain:
   ```text
   1. Market Event Ingestion (09:15 via AlphaVantage)
   2. Cascade Detected (8 nodes, 7 edges, 84.21% exposure)
   3. Thesis Drift Review Requested (Flagged assumption divergence)
   4. User Review Confirmed (Trader marked STILL_VALID)
   5. Research Question Synthesized (Non-predictive hypothesis)
   ```

### Step 9: Grounded AI Explainer (Zero Hallucination)
1. Click **✨ Explain with Grounded AI**.
2. The AI Explainer strictly segments its reasoning:
   - **Observed Facts**: Held shares and exact exposure percentage.
   - **Provider-Supplied**: Headline and published timestamp.
   - **Derived Intersections**: Intersecting playbooks.
   - **User-Defined**: Original stored thesis text.
   - **Unknown**: Future price reaction and fundamental durability.
3. The AI provides zero price predictions, zero buy/sell signals, and zero fabricated connections.

---

## 3. Summary of Key Architectural Guardrails

- **Zero Fabricated Relationships**: Unverified tickers and relationships strictly return `RELATIONSHIP UNAVAILABLE`.
- **Look-Ahead Protection**: Historical cascade queries (`asOf`) evaluate portfolio state at T-0, excluding positions created after the event timestamp.
- **Loop Protection**: Graph traversal visited-set prevents cycles ($A \rightarrow B \rightarrow C \rightarrow A$).
- **Deterministic Confidence States**: Only categorical states (`VERIFIED`, `USER_DEFINED`, `PROVIDER_SUPPLIED`, `DERIVED`, `UNKNOWN`).
- **High Performance**: 100 graph cascades generated in ~200ms (~2ms average latency).
