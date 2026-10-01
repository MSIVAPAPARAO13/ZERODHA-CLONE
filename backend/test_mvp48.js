const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const { UserModel } = require("./models/UserModel");
const { StrategyModel } = require("./models/StrategyModel");
const StrategyNotebook = require("./models/StrategyNotebookModel");
const { HoldingsModel } = require("./models/HoldingsModel");

const strategyNotebookService = require("./services/strategyNotebookService");
const strategyVersioningService = require("./services/strategyVersioningService");
const strategyRobustnessService = require("./services/strategyRobustnessService");
const portfolioIntelligenceService = require("./services/portfolioIntelligenceService");
const scenarioEngine = require("./services/scenarioEngine");
const decisionJournalService = require("./services/decisionJournalService");
const marketRegimeService = require("./services/marketRegimeService");
const sectorIntelligenceService = require("./services/sectorIntelligenceService");
const marketNarrativeService = require("./services/marketNarrativeService");

async function runMVP48Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-48 STRATEGY RESEARCH NOTEBOOK TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  try {
    // Clean test collections
    await StrategyNotebook.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await StrategyModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP48 Tester A",
      username: "mvp48_tester_a",
      email: "mvp48a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP48 Tester B",
      username: "mvp48_tester_b",
      email: "mvp48b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // Seed mock strategy
    const strat = await StrategyModel.create({
      user: testUserA,
      name: "MVP48 Trend Breakout Lab",
      version: 1,
      strategyVersion: 1,
      parametersHash: "paramhash_mvp48_01",
      universe: ["TCS", "INFY"]
    });

    // -------------------------------------------------------------
    // TEST 1: Record Strategy Experiment in Notebook
    // -------------------------------------------------------------
    console.log("--- TEST 1: Record Strategy Experiment in Notebook ---");

    const experimentPayload = {
      strategyId: strat._id,
      title: "Testing Dual SMA 10/30 on IT Universe",
      hypothesis: "Shorter period moving average crossover captures early trending momentum with manageable drawdowns.",
      datasetRange: { startDate: "2023-01-01", endDate: "2024-01-01", interval: "1day" },
      configuration: { capital: 100000, universe: ["TCS", "INFY"] },
      results: {
        totalReturnPercent: 18.2,
        maxDrawdownPercent: 7.4,
        winRatePercent: 57.0,
        profitFactor: 1.82,
        tradeCount: 22,
        benchmarkReturnPercent: 12.0,
        alpha: 6.2
      },
      robustnessResults: {
        status: "MODERATE_ROBUSTNESS",
        reason: "Performance degrades 28% under 2x slippage."
      },
      observations: "Trades on TCS exhibited higher win rate (65%) than INFY (48%).",
      limitations: "Did not evaluate performance during high-volatility flash events.",
      nextExperiment: "Introduce 4.5% ATR trailing stop loss to protect against sharp reversal bars."
    };

    const entry = await strategyNotebookService.recordExperiment(testUserA, experimentPayload);

    assert.ok(entry._id);
    assert.strictEqual(entry.title, experimentPayload.title);
    assert.strictEqual(entry.strategyVersion, 1);
    assert.strictEqual(entry.parametersHash, "paramhash_mvp48_01");
    assert.ok(entry.resultHash && entry.resultHash.length === 16);
    assert.strictEqual(entry.robustnessResults.status, "MODERATE_ROBUSTNESS");

    console.log(`PASS: Experiment recorded successfully (ID: ${entry._id}, ResultHash: ${entry.resultHash}).`);

    // -------------------------------------------------------------
    // TEST 2: Deterministic Result Hash Reproducibility
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Deterministic Result Hash Reproducibility ---");

    const recomputedResultHash = strategyNotebookService.computeResultHash(
      entry.parametersHash,
      entry.datasetRange,
      entry.configuration,
      entry.results
    );

    assert.strictEqual(entry.resultHash, recomputedResultHash, "Result hash must be strictly deterministic");
    console.log("PASS: Result hash reproducibility verified.");

    // -------------------------------------------------------------
    // TEST 3: List & Filter Notebook Entries
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: List & Filter Notebook Entries ---");

    const list = await strategyNotebookService.getNotebookEntries(testUserA, {
      strategyId: strat._id
    });

    assert.strictEqual(list.total, 1);
    assert.strictEqual(list.entries[0].title, experimentPayload.title);
    console.log(`PASS: Retrieved ${list.total} notebook entries matching strategy filter.`);

    // -------------------------------------------------------------
    // TEST 4: Update Reflections (Observations, Limitations, Next Step)
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Update Reflections ---");

    const updated = await strategyNotebookService.updateNotebookEntry(testUserA, entry._id, {
      observations: "Post-review: TCS sustained momentum longer after quarterly guidance.",
      nextExperiment: "Run walk-forward validation across 2024–2025."
    });

    assert.ok(updated.observations.includes("Post-review"));
    assert.ok(updated.nextExperiment.includes("walk-forward"));
    console.log("PASS: Notebook qualitative reflections updated successfully.");

    // -------------------------------------------------------------
    // TEST 5: Research Copilot Bridge ([Investigate Results])
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Research Copilot Bridge ---");

    const bridgeContext = await strategyNotebookService.getInvestigationContext(testUserA, entry._id);

    assert.ok(bridgeContext.investigatePrompt);
    assert.ok(bridgeContext.investigatePrompt.includes(entry.title));
    assert.ok(bridgeContext.evidencePayload.results.totalReturnPercent === 18.2);
    assert.strictEqual(bridgeContext.disclaimer, "RESEARCH_NOTEBOOK_EVIDENCE — GROUNDED HISTORICAL EXPERIMENT");

    console.log(`PASS: Copilot investigation bridge generated: "${bridgeContext.investigatePrompt.slice(0, 70)}..."`);

    // -------------------------------------------------------------
    // TEST 6: Multi-Tenant User Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Multi-Tenant User Isolation ---");

    const userBEntries = await strategyNotebookService.getNotebookEntries(testUserB);
    assert.strictEqual(userBEntries.total, 0, "User B must see 0 notebook entries");

    let accessError = false;
    try {
      await strategyNotebookService.getInvestigationContext(testUserB, entry._id);
    } catch (err) {
      accessError = true;
    }
    assert.strictEqual(accessError, true, "User B must be denied access to User A's notebook experiment");
    console.log("PASS: Multi-tenant user isolation verified.");

    // -------------------------------------------------------------
    // TEST 7: Zero Financial Ledger Mutation
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Zero Financial Ledger Mutation ---");

    const userACheck = await UserModel.findById(testUserA);
    assert.strictEqual(userACheck.virtualBalance, 500000);
    const holdingsCount = await HoldingsModel.countDocuments({ user: testUserA });
    assert.strictEqual(holdingsCount, 0);
    console.log("PASS: Zero financial ledger mutation verified.");

    // -------------------------------------------------------------
    // TEST 8: Regression Verification (MVP-40 through MVP-47)
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Regression Verification (MVP-40 through MVP-47) ---");

    const health = await portfolioIntelligenceService.getPortfolioIntelligence(testUserA);
    assert.ok(health.health);

    const scenario = await scenarioEngine.runScenario(testUserA, {
      name: "Regression Test Scenario",
      shocks: [{ targetType: "SECTOR", target: "Information Technology", percentage: -5 }]
    });
    assert.ok(scenario.disclaimer);

    const decisions = await decisionJournalService.getDecisions(testUserA);
    assert.strictEqual(decisions.total, 0);

    const regime = await marketRegimeService.detectCurrentRegime(testUserA);
    assert.ok(regime.regime);

    const sectors = await sectorIntelligenceService.getSectorDashboard(testUserA);
    assert.ok(sectors.sectors.length > 0);

    const narrative = await marketNarrativeService.generateMarketNarrative(testUserA);
    assert.ok(narrative.sections);

    const versionCheck = await strategyVersioningService.getStrategyVersionHistory(testUserA, strat._id);
    assert.strictEqual(versionCheck.length, 1);

    const robustnessCheck = strategyRobustnessService.classifyRobustness({ baseTrades: 10, baseReturn: 12, higherCostReturn: 10, higherSlippageReturn: 9, inSampleReturn: 12, oosReturn: 8 });
    assert.strictEqual(robustnessCheck.classification, "HIGHER_ROBUSTNESS");

    console.log("PASS: Regression verified across MVP-40 through MVP-47.");

    console.log("\n===================================================================");
    console.log("--- ALL 8/8 MVP-48 AUTOMATED TESTS PASSED SUCCESSFULLY! ---");
    console.log("===================================================================\n");
  } finally {
    // Clean up
    await StrategyNotebook.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await StrategyModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP48Tests().catch(err => {
  console.error("MVP-48 TEST FAILED:", err);
  process.exit(1);
});
