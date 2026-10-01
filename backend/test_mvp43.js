const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const MarketRegime = require("./models/MarketRegimeModel");
const MarketEvent = require("./models/MarketEventModel");
const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { PositionsModel } = require("./models/PositionsModel");

const marketRegimeService = require("./services/marketRegimeService");
const portfolioIntelligenceService = require("./services/portfolioIntelligenceService");
const scenarioEngine = require("./services/scenarioEngine");
const decisionJournalService = require("./services/decisionJournalService");

async function runMVP43Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-43 MARKET REGIME ENGINE TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  try {
    // Clean up test data
    await MarketRegime.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });

    // Seed mock user for balance mutation check
    await UserModel.create({
      _id: testUserA,
      name: "MVP43 Tester",
      username: "mvp43_tester",
      email: "mvp43@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    // Seed mock holding
    await HoldingsModel.create({
      user: testUserA,
      name: "TCS",
      qty: 10,
      avg: 3500,
      price: 3600,
      net: "+2.86%",
      day: "+0.5%"
    });

    // -------------------------------------------------------------
    // TEST 1: Deterministic Regime Classification Rules
    // -------------------------------------------------------------
    console.log("--- TEST 1: Deterministic Regime Classification Rules ---");

    const limited = marketRegimeService.classifyRegime({ sampleSize: 1 });
    assert.strictEqual(limited, "DATA_LIMITED");

    const highVol = marketRegimeService.classifyRegime({ sampleSize: 10, averageVolatility: 3.8, advancingPercent: 50, decliningPercent: 50 });
    assert.strictEqual(highVol, "HIGH_VOLATILITY");

    const trendUp = marketRegimeService.classifyRegime({ sampleSize: 10, averageVolatility: 1.5, advancingPercent: 75, decliningPercent: 20 });
    assert.strictEqual(trendUp, "TRENDING_UP");

    const trendDown = marketRegimeService.classifyRegime({ sampleSize: 10, averageVolatility: 1.8, advancingPercent: 20, decliningPercent: 75 });
    assert.strictEqual(trendDown, "TRENDING_DOWN");

    const lowVol = marketRegimeService.classifyRegime({ sampleSize: 10, averageVolatility: 0.6, advancingPercent: 52, decliningPercent: 48 });
    assert.strictEqual(lowVol, "LOW_VOLATILITY");

    const rangeBound = marketRegimeService.classifyRegime({ sampleSize: 10, averageVolatility: 1.2, advancingPercent: 48, decliningPercent: 52 });
    assert.strictEqual(rangeBound, "RANGE_BOUND");

    console.log("PASS: Deterministic regime classifications verified for all 6 test scenarios.");

    // -------------------------------------------------------------
    // TEST 2: Transparent Metrics & Breadth Computation
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Transparent Metrics & Breadth Computation ---");

    const mockQuotes = [
      { symbol: "TCS", percentChange: 1.8 },
      { symbol: "INFY", percentChange: 2.2 },
      { symbol: "RELIANCE", percentChange: -0.9 },
      { symbol: "HDFCBANK", percentChange: 1.1 },
      { symbol: "ICICIBANK", percentChange: -0.4 }
    ];

    const metrics = marketRegimeService.computeMetrics(mockQuotes);
    assert.strictEqual(metrics.sampleSize, 5);
    assert.strictEqual(metrics.advancingPercent, 60);
    assert.strictEqual(metrics.decliningPercent, 40);
    assert.strictEqual(metrics.breadthRatio, 1.5);
    assert.ok(metrics.averageVolatility > 0);
    assert.strictEqual(metrics.trend, "UP");

    console.log(`PASS: Metrics calculated (advancing: ${metrics.advancingPercent}%, declining: ${metrics.decliningPercent}%, breadthRatio: ${metrics.breadthRatio}, vol: ${metrics.averageVolatility}%).`);

    // -------------------------------------------------------------
    // TEST 3: Evidence Generation (No Fabricated Facts)
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Evidence Generation (Transparent & Grounded) ---");

    const evidence = marketRegimeService.generateEvidence(metrics, "TRENDING_UP");
    assert.ok(Array.isArray(evidence) && evidence.length >= 4);
    assert.ok(evidence.some(e => e.includes("Breadth Ratio")));
    assert.ok(evidence.some(e => e.includes("Volatility")));
    console.log(`PASS: Evidence generated (${evidence.length} structured transparent statements).`);

    // -------------------------------------------------------------
    // TEST 4: Initial Regime Detection & Persistence
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Initial Regime Detection & Persistence ---");

    const detection = await marketRegimeService.detectCurrentRegime(testUserA, {
      symbols: ["TCS", "INFY", "RELIANCE", "HDFCBANK"]
    });

    assert.ok(detection.regime);
    assert.ok(detection.metrics.sampleSize > 0);
    assert.ok(detection.evidence.length > 0);
    assert.strictEqual(detection.notes.includes("NOT A FINANCIAL PREDICTION"), true);

    const savedDoc = await MarketRegime.findById(detection._id);
    assert.ok(savedDoc);
    assert.strictEqual(String(savedDoc.user), String(testUserA));
    console.log(`PASS: Regime detected (${detection.regime}) and persisted in MarketRegimeModel.`);

    // -------------------------------------------------------------
    // TEST 5: Regime Transition & Event Generation
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Regime Transition & Event Generation ---");

    // Ensure latest prior record is distinct to test deterministic transition
    await MarketRegime.create({
      user: testUserA,
      regime: "RANGE_BOUND",
      previousRegime: null,
      changedAt: new Date(),
      metrics: { sampleSize: 4, averageVolatility: 0.8 },
      createdAt: new Date(Date.now() + 2000)
    });

    const transitionResult = await marketRegimeService.detectCurrentRegime(testUserA, {
      symbols: ["TCS", "INFY", "RELIANCE", "HDFCBANK", "ICICIBANK"]
    });

    assert.strictEqual(transitionResult.transitionDetected, true);
    assert.strictEqual(transitionResult.previousRegime, "RANGE_BOUND");
    const event = await MarketEvent.findOne({
      user: testUserA,
      eventType: "MARKET_REGIME_CHANGE"
    });
    assert.ok(event, "MARKET_REGIME_CHANGE event should be emitted on transition");
    assert.strictEqual(event.symbol, "MARKET");
    assert.strictEqual(event.category, "MARKET");
    console.log(`PASS: Transition detected (${transitionResult.previousRegime} → ${transitionResult.regime}) and MARKET_REGIME_CHANGE event emitted.`);

    // -------------------------------------------------------------
    // TEST 6: Regime History Retrieval
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Regime History Retrieval ---");

    const history = await marketRegimeService.getRegimeHistory(testUserA, 5);
    assert.ok(Array.isArray(history));
    assert.ok(history.length >= 2, "Should return at least 2 historical snapshots");
    console.log(`PASS: Retrieved ${history.length} historical regime snapshots.`);

    // -------------------------------------------------------------
    // TEST 7: Multi-Tenant User Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Multi-Tenant User Isolation ---");

    const userBHistory = await marketRegimeService.getRegimeHistory(testUserB, 10);
    assert.strictEqual(userBHistory.length, 0, "User B should have zero regime records");
    console.log("PASS: Multi-tenant user isolation verified — zero cross-user regime leakage.");

    // -------------------------------------------------------------
    // TEST 8: Zero Financial Ledger Mutation
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Zero Financial Ledger Mutation ---");

    const userAfter = await UserModel.findById(testUserA);
    assert.strictEqual(userAfter.virtualBalance, 500000, "Virtual balance must not mutate");

    const holdingsAfter = await HoldingsModel.find({ user: testUserA });
    assert.strictEqual(holdingsAfter.length, 1);
    assert.strictEqual(holdingsAfter[0].qty, 10);
    console.log("PASS: Zero financial ledger mutation verified.");

    // -------------------------------------------------------------
    // TEST 9: Regression Verification (MVP-40, 41, 42)
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Regression Verification (MVP-40, 41, 42) ---");

    // MVP-40
    const health = await portfolioIntelligenceService.getPortfolioIntelligence(testUserA);
    assert.ok(health.health);

    // MVP-41
    const scenario = await scenarioEngine.runScenario(testUserA, {
      name: "Regression Test Scenario",
      shocks: [{ targetType: "SECTOR", target: "Information Technology", percentage: -5 }]
    });
    assert.ok(scenario.disclaimer);

    // MVP-42
    const decisions = await decisionJournalService.getDecisions(testUserA);
    assert.strictEqual(decisions.total, 0);

    console.log("PASS: Regression verified — MVP-40, 41, 42 remain fully functional.");

    console.log("\n===================================================================");
    console.log("--- ALL 9/9 MVP-43 AUTOMATED TESTS PASSED SUCCESSFULLY! ---");
    console.log("===================================================================\n");
  } finally {
    // Clean up
    await MarketRegime.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP43Tests().catch(err => {
  console.error("MVP-43 TEST FAILED:", err);
  process.exit(1);
});
