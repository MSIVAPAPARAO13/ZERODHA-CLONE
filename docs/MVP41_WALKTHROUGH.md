# MVP-41 WALKTHROUGH — PORTFOLIO SCENARIO PLANNER 2.0

## 1. Overview

MVP-41 extends the core scenario engine into an interactive portfolio scenario planner that allows users to evaluate arbitrary factor shocks (asset, sector, benchmark), separates affected from unaffected holdings, provides exact mathematical loss attribution summing to 100%, runs hypothetical what-if position experiments without financial ledger mutations, and directly bridges into Research Copilot.

---

## 2. Deliverables Summary

- **Engine Enhancement**: Enhanced `scenarioEngine.js` with `affectedHoldings`, `unaffectedHoldings`, and clear `disclaimer: "MODELLED SCENARIO — NOT A PREDICTION"`.
- **Holding Segregation**: Evaluates shocks against `VERIFIED_TAXONOMY` to identify which assets are directly/indirectly shocked vs. which remain insulated.
- **What-If Simulation**: Computes delta comparisons (`before`, `after`, `delta`) when adding or removing hypothetical positions without writing to the ledger.
- **Research Copilot Bridge**: Generates `investigationPrompt` formatted for direct dispatch into Research Copilot (`intent: "STRESS_RESEARCH"`).
- **Test Suite**: `test_mvp41.js` (10/10 tests passing).

---

## 3. Workflow Verification

1. User defines custom shock (e.g. IT sector -15%).
2. Engine calculates baseline equity (₹2,48,651.5) and modeled loss (-₹30,960.6).
3. Holdings are segregated: Affected = [TCS, INFY], Unaffected = [RELIANCE].
4. Attribution is confirmed to sum to 100.00%.
5. User tests what-if addition (+40 WIPRO @ 450): hypothetical capital increases cleanly without order creation.
6. Scenario saved to `ScenarioModel` with user isolation.
7. User clicks `[Investigate Scenario]` to generate grounded evidence dossier in Research Copilot.
