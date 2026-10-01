const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const { UserModel } = require("./models/UserModel");
const { StrategyModel } = require("./models/StrategyModel");
const { HoldingsModel } = require("./models/HoldingsModel");

const strategyRobustnessService = require("./services/strategyRobustnessService");
const strategyVersioningService = require("./services/strategyVersioningService");
const portfolioIntelligenceService = require("./services/portfolioIntelligenceService");
const scenarioEngine = require("./services/scenarioEngine");
const decisionJournalService = require("./services/decisionJournalService");
const marketRegimeService = require("./services/marketRegimeService");
const sectorIntelligenceService = require("./services/sectorIntelligenceService");
const marketNarrativeService = require("./services/marketNarrativeService");

async function runMVP47Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-47 STRATEGY ROBUSTNESS LAB TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  try {
    // Clean test data
    await StrategyModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP47 Tester A",
      username: "mvp47_tester_a",
      email: "mvp47a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP47 Tester B",
      username: "mvp47_tester_b",
      email: "mvp47b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // Seed a valid strategy for User A
    const savedStrat = await StrategyModel.create({
      user: testUserA,
      name: "MVP47 Robustness Momentum Strategy",
      description: "Dual moving average strategy with trailing exit and friction stress tests.",
      version: 1,
      strategyVersion: 1,
      universe: ["TCS", "INFY", "RELIANCE"],
      benchmark: "NIFTY50",
      initialCapital: 100000,
      positionSizing: { type: "PERCENT_EQUITY", value: 15 },
      costs: { brokerageRate: 0.0003, flatFeePerTrade: 20, slippageRate: 0.001 },
      entryRules: [
        {
          indicator: "SMA",
          params: { fastPeriod: 10, slowPeriod: 30 },
          condition: "CROSS_ABOVE",
          threshold: null
        }
      ],
      exitRules: [
        {
          type: "SIGNAL",
          indicator: "SMA",
          params: { fastPeriod: 10, slowPeriod: 30 },
          condition: "CROSS_BELOW"
        },
        {
          type: "STOP_LOSS",
          threshold: 5
        }
      ]
    });

    // -------------------------------------------------------------
    // TEST 1: Full Robustness Battery Execution
    // -------------------------------------------------------------
    console.log("--- TEST 1: Full Robustness Battery Execution ---");

    const report = await strategyRobustnessService.evaluateStrategyRobustness(
      savedStrat,
      {},
      testUserA
    );

    assert.ok(report.base);
    assert.ok(report.costSensitivity);
    assert.ok(report.slippageSensitivity);
    assert.ok(report.timePeriodComparison);
    assert.ok(report.benchmarkComparison);
    assert.ok(report.robustness);

    console.log(`PASS: Robustness battery executed (Base Return: ${report.base.returnPercentage}%, Max DD: ${report.base.maxDrawdown}%).`);

    // -------------------------------------------------------------
    // TEST 2: Transaction Cost Sensitivity
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Transaction Cost Sensitivity ---");

    const { baseReturn, higherCostsReturn, higherCostsDelta, lowerCostsReturn } = report.costSensitivity;
    assert.ok(typeof higherCostsReturn === "number");
    assert.ok(typeof lowerCostsReturn === "number");
    // Higher costs should naturally result in lower or equal net returns
    assert.ok(higherCostsReturn <= lowerCostsReturn, "Higher costs must yield lower or equal return than lower costs");
    console.log(`PASS: Cost sensitivity verified (Base: ${baseReturn}%, Higher Costs: ${higherCostsReturn}%, Delta: ${higherCostsDelta}%).`);

    // -------------------------------------------------------------
    // TEST 3: Slippage Sensitivity
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Slippage Sensitivity ---");

    const { elevatedSlippageReturn, zeroSlippageReturn, elevatedSlippageDelta } = report.slippageSensitivity;
    assert.ok(typeof elevatedSlippageReturn === "number");
    assert.ok(typeof zeroSlippageReturn === "number");
    assert.ok(elevatedSlippageReturn <= zeroSlippageReturn, "Elevated slippage must yield <= return than zero slippage");
    console.log(`PASS: Slippage sensitivity verified (Elevated: ${elevatedSlippageReturn}%, Zero Slippage: ${zeroSlippageReturn}%, Delta: ${elevatedSlippageDelta}%).`);

    // -------------------------------------------------------------
    // TEST 4: Time-Period / Split-Test Comparison
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Time-Period / Split-Test Comparison ---");

    assert.ok(typeof report.timePeriodComparison.inSampleReturn === "number");
    assert.ok(typeof report.timePeriodComparison.outOfSampleReturn === "number");
    assert.ok(typeof report.timePeriodComparison.returnRetentionPercent === "number");
    console.log(`PASS: Time-period split verified (In-Sample: ${report.timePeriodComparison.inSampleReturn}%, OOS: ${report.timePeriodComparison.outOfSampleReturn}%, Retention: ${report.timePeriodComparison.returnRetentionPercent}%).`);

    // -------------------------------------------------------------
    // TEST 5: Deterministic Overfitting Classifications
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Deterministic Overfitting Classifications ---");

    const testLimited = strategyRobustnessService.classifyRobustness({ baseTrades: 2 });
    assert.strictEqual(testLimited.classification, "DATA_LIMITED");

    const testLow = strategyRobustnessService.classifyRobustness({
      baseTrades: 10,
      baseReturn: 15,
      higherCostReturn: -2,
      higherSlippageReturn: 5,
      inSampleReturn: 12,
      oosReturn: 8
    });
    assert.strictEqual(testLow.classification, "LOW_ROBUSTNESS");

    const testModerate = strategyRobustnessService.classifyRobustness({
      baseTrades: 15,
      baseReturn: 20,
      higherCostReturn: 10, // 50% degradation
      higherSlippageReturn: 14,
      inSampleReturn: 20,
      oosReturn: 10 // 50% retention
    });
    assert.strictEqual(testModerate.classification, "MODERATE_ROBUSTNESS");

    const testHigher = strategyRobustnessService.classifyRobustness({
      baseTrades: 25,
      baseReturn: 22,
      higherCostReturn: 19,
      higherSlippageReturn: 18,
      inSampleReturn: 20,
      oosReturn: 16 // 80% retention
    });
    assert.strictEqual(testHigher.classification, "HIGHER_ROBUSTNESS");

    console.log("PASS: Deterministic robustness classification verified across all 4 regimes.");

    // -------------------------------------------------------------
    // TEST 6: Strict Prohibition of "Guaranteed Robust" Claims
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Strict Prohibition of 'Guaranteed Robust' Claims ---");

    const reportStr = JSON.stringify(report).toLowerCase();
    assert.strictEqual(reportStr.includes("guaranteed robust"), false, "Must never claim guaranteed robust");
    assert.strictEqual(report.disclaimer.includes("NEVER GUARANTEES ROBUSTNESS"), true);
    console.log("PASS: Prohibition of guaranteed claims enforced.");

    // -------------------------------------------------------------
    // TEST 7: Multi-Tenant User Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Multi-Tenant User Isolation ---");

    let userBFail = false;
    try {
      await strategyRobustnessService.evaluateStrategyRobustness(savedStrat._id, {}, testUserB);
    } catch (err) {
      userBFail = true;
    }
    assert.strictEqual(userBFail, true, "User B must not be able to run robustness on User A's custom strategy");
    console.log("PASS: Multi-tenant user isolation verified.");

    // -------------------------------------------------------------
    // TEST 8: Zero Financial Ledger Mutation
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Zero Financial Ledger Mutation ---");

    const userACheck = await UserModel.findById(testUserA);
    assert.strictEqual(userACheck.virtualBalance, 500000);
    const holdingsCount = await HoldingsModel.countDocuments({ user: testUserA });
    assert.strictEqual(holdingsCount, 0);
    console.log("PASS: Zero financial ledger mutation verified.");

    // -------------------------------------------------------------
    // TEST 9: Regression Verification (MVP-40 through MVP-46)
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Regression Verification (MVP-40 through MVP-46) ---");

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

    const versionCheck = await strategyVersioningService.getStrategyVersionHistory(testUserA, savedStrat._id);
    assert.strictEqual(versionCheck.length, 1);

    console.log("PASS: Regression verified across MVP-40 through MVP-46.");

    console.log("\n===================================================================");
    console.log("--- ALL 9/9 MVP-47 AUTOMATED TESTS PASSED SUCCESSFULLY! ---");
    console.log("===================================================================\n");
  } finally {
    // Clean up
    await StrategyModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP47Tests().catch(err => {
  console.error("MVP-47 TEST FAILED:", err);
  process.exit(1);
});
