const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const { UserModel } = require("./models/UserModel");
const { StrategyModel } = require("./models/StrategyModel");
const { HoldingsModel } = require("./models/HoldingsModel");

const strategyVersioningService = require("./services/strategyVersioningService");
const backtestEngine = require("./services/backtestEngine");
const portfolioIntelligenceService = require("./services/portfolioIntelligenceService");
const scenarioEngine = require("./services/scenarioEngine");
const decisionJournalService = require("./services/decisionJournalService");
const marketRegimeService = require("./services/marketRegimeService");
const sectorIntelligenceService = require("./services/sectorIntelligenceService");
const marketNarrativeService = require("./services/marketNarrativeService");

async function runMVP46Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-46 STRATEGY LAB 2.0 TEST SUITE ---");
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
      name: "MVP46 Tester A",
      username: "mvp46_tester_a",
      email: "mvp46a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP46 Tester B",
      username: "mvp46_tester_b",
      email: "mvp46b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // -------------------------------------------------------------
    // TEST 1: Structured Strategy Components & Builder
    // -------------------------------------------------------------
    console.log("--- TEST 1: Structured Strategy Components & Builder ---");

    const strategyV1Data = {
      name: "MVP46 Momentum Trend Breakout",
      description: "Dual moving average cross with ATR stop loss and realistic slippage.",
      timeframe: "1day",
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
          threshold: 4.5
        }
      ]
    };

    const hash1 = strategyVersioningService.computeParametersHash(strategyV1Data);
    assert.ok(hash1 && hash1.length === 16);

    const savedV1 = await strategyVersioningService.saveStrategyVersion(testUserA, strategyV1Data);
    assert.strictEqual(savedV1.isNewVersion, true);
    assert.strictEqual(savedV1.strategy.strategyVersion, 1);
    assert.strictEqual(savedV1.strategy.parametersHash, hash1);
    assert.strictEqual(savedV1.strategy.timeframe, "1day");

    console.log(`PASS: Strategy V1 saved with deterministic parametersHash: ${hash1}.`);

    // -------------------------------------------------------------
    // TEST 2: Deterministic Hash Consistency
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Deterministic Hash Consistency ---");

    const recomputedHash = strategyVersioningService.computeParametersHash(strategyV1Data);
    assert.strictEqual(hash1, recomputedHash, "Hash must be completely deterministic for identical inputs");
    console.log("PASS: Parameter hash reproducibility verified.");

    // -------------------------------------------------------------
    // TEST 3: Immutable Versioning On Parameter Modification
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Immutable Versioning On Parameter Modification ---");

    // Modify slippage and entry parameters -> must spawn Version 2 without overwriting V1
    const strategyV2Data = {
      ...strategyV1Data,
      name: "MVP46 Momentum Trend Breakout (Optimized)",
      costs: { ...strategyV1Data.costs, slippageRate: 0.002 },
      entryRules: [
        {
          indicator: "SMA",
          params: { fastPeriod: 12, slowPeriod: 35 },
          condition: "CROSS_ABOVE",
          threshold: null
        }
      ]
    };

    const savedV2 = await strategyVersioningService.saveStrategyVersion(
      testUserA,
      strategyV2Data,
      savedV1.strategy._id
    );

    assert.strictEqual(savedV2.isNewVersion, true);
    assert.strictEqual(savedV2.strategy.strategyVersion, 2);
    assert.notStrictEqual(savedV2.strategy.parametersHash, hash1);
    assert.strictEqual(String(savedV2.strategy.parentStrategyId), String(savedV1.strategy._id));

    // Verify V1 is still intact in database
    const verifyV1StillExists = await StrategyModel.findById(savedV1.strategy._id);
    assert.ok(verifyV1StillExists, "Historical V1 strategy must NOT be overwritten");
    assert.strictEqual(verifyV1StillExists.strategyVersion, 1);

    console.log(`PASS: Immutable versioning verified — V1 preserved, V2 created (Parent ID: ${savedV2.strategy.parentStrategyId}).`);

    // -------------------------------------------------------------
    // TEST 4: Version History Chain Retrieval
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Version History Chain Retrieval ---");

    const versionHistory = await strategyVersioningService.getStrategyVersionHistory(
      testUserA,
      savedV2.strategy._id
    );

    assert.strictEqual(versionHistory.length, 2);
    assert.strictEqual(versionHistory[0].strategyVersion, 1);
    assert.strictEqual(versionHistory[1].strategyVersion, 2);
    console.log(`PASS: Full version history retrieved (${versionHistory.length} immutable revisions).`);

    // -------------------------------------------------------------
    // TEST 5: Experiment Comparison Engine
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Experiment Comparison Engine ---");

    const experimentA = {
      summary: {
        totalReturnPercent: 18.5,
        maxDrawdownPercent: 7.2,
        winRatePercent: 58.0,
        profitFactor: 1.85,
        totalTrades: 24,
        benchmarkReturnPercent: 11.2
      }
    };

    const experimentB = {
      summary: {
        totalReturnPercent: 12.1,
        maxDrawdownPercent: 10.4,
        winRatePercent: 49.0,
        profitFactor: 1.35,
        totalTrades: 32,
        benchmarkReturnPercent: 11.2
      }
    };

    const comparison = strategyVersioningService.compareExperiments(
      experimentA,
      experimentB,
      "Momentum V1",
      "Momentum V2"
    );

    assert.strictEqual(comparison.metrics.totalReturn.delta, 6.4);
    assert.strictEqual(comparison.metrics.maxDrawdown.delta, -3.2);
    assert.strictEqual(comparison.metrics.winRate.delta, 9.0);
    assert.strictEqual(comparison.metrics.profitFactor.delta, 0.5);
    assert.strictEqual(comparison.metrics.tradeCount.delta, -8);
    assert.strictEqual(comparison.metrics.benchmarkReturn.delta, 0);
    assert.ok(comparison.conclusion.includes("Momentum V1 outperformed Momentum V2"));

    console.log("PASS: Side-by-side experiment comparison verified with transparent mathematical deltas.");

    // -------------------------------------------------------------
    // TEST 6: Multi-Tenant User Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Multi-Tenant User Isolation ---");

    const userBHistory = await strategyVersioningService.getStrategyVersionHistory(
      testUserB,
      savedV2.strategy._id
    );
    assert.strictEqual(userBHistory.length, 0, "User B must not see User A's strategy versions");
    console.log("PASS: Multi-tenant user isolation verified.");

    // -------------------------------------------------------------
    // TEST 7: Zero Financial Ledger Mutation
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Zero Financial Ledger Mutation ---");

    const userCheck = await UserModel.findById(testUserA);
    assert.strictEqual(userCheck.virtualBalance, 500000);
    const holdingsCount = await HoldingsModel.countDocuments({ user: testUserA });
    assert.strictEqual(holdingsCount, 0);
    console.log("PASS: Zero financial ledger mutation verified.");

    // -------------------------------------------------------------
    // TEST 8: Regression Verification (MVP-40 through MVP-45)
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Regression Verification (MVP-40 through MVP-45) ---");

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

    console.log("PASS: Regression verified across MVP-40 through MVP-45.");

    console.log("\n===================================================================");
    console.log("--- ALL 8/8 MVP-46 AUTOMATED TESTS PASSED SUCCESSFULLY! ---");
    console.log("===================================================================\n");
  } finally {
    // Clean up
    await StrategyModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP46Tests().catch(err => {
  console.error("MVP-46 TEST FAILED:", err);
  process.exit(1);
});
