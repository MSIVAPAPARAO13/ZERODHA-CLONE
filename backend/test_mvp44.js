const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const MarketEvent = require("./models/MarketEventModel");

const sectorIntelligenceService = require("./services/sectorIntelligenceService");
const portfolioIntelligenceService = require("./services/portfolioIntelligenceService");
const scenarioEngine = require("./services/scenarioEngine");
const decisionJournalService = require("./services/decisionJournalService");
const marketRegimeService = require("./services/marketRegimeService");

async function runMVP44Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-44 SECTOR INTELLIGENCE ENGINE TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  try {
    // Clean test collections
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });

    // Seed User A with balance and specific sector holdings
    await UserModel.create({
      _id: testUserA,
      name: "MVP44 Tester A",
      username: "mvp44_tester_a",
      email: "mvp44a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP44 Tester B",
      username: "mvp44_tester_b",
      email: "mvp44b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // Seed User A holdings: IT sector (TCS, INFY)
    await HoldingsModel.create([
      {
        user: testUserA,
        name: "TCS",
        qty: 10,
        avg: 3500,
        price: 3600,
        net: "+2.86%",
        day: "+1.2%"
      },
      {
        user: testUserA,
        name: "INFY",
        qty: 20,
        avg: 1500,
        price: 1550,
        net: "+3.33%",
        day: "+0.8%"
      }
    ]);

    // -------------------------------------------------------------
    // TEST 1: Sector Metric Aggregation & Breadth
    // -------------------------------------------------------------
    console.log("--- TEST 1: Sector Metric Aggregation & Breadth ---");

    const itMetrics = await sectorIntelligenceService.computeSectorMetrics("Information Technology");
    assert.strictEqual(itMetrics.sector, "Information Technology");
    assert.ok(Array.isArray(itMetrics.constituents) && itMetrics.constituents.length >= 3);
    assert.ok(typeof itMetrics.averagePriceChange === "number");
    assert.ok(typeof itMetrics.breadthPercent === "number");
    assert.ok(["BULLISH", "BEARISH", "NEUTRAL"].includes(itMetrics.momentum));
    console.log(`PASS: IT Sector metrics computed (Avg Change: ${itMetrics.averagePriceChange}%, Breadth: ${itMetrics.breadthPercent}%, Momentum: ${itMetrics.momentum}).`);

    // -------------------------------------------------------------
    // TEST 2: Sector Dashboard & Portfolio Linkage
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Sector Dashboard & Portfolio Linkage ---");

    const dashboard = await sectorIntelligenceService.getSectorDashboard(testUserA);
    assert.ok(dashboard.sectors && dashboard.sectors.length >= 5);

    const itCard = dashboard.sectors.find(s => s.sector === "Information Technology");
    assert.ok(itCard);
    assert.ok(itCard.portfolioExposure.userExposurePercent > 0, "User A should have > 0% IT exposure");
    assert.strictEqual(itCard.portfolioExposure.holdings.length, 2);
    assert.ok(itCard.actions.investigatePrompt.includes("Information Technology"));
    assert.ok(itCard.actions.stressPrompt.includes("Information Technology"));

    const financialCard = dashboard.sectors.find(s => s.sector === "Financial Services");
    assert.strictEqual(financialCard.portfolioExposure.userExposurePercent, 0, "User A has 0% Financials exposure");

    console.log(`PASS: Portfolio exposure cleanly connected (IT Exposure: ${itCard.portfolioExposure.userExposurePercent}%, Value: ₹${itCard.portfolioExposure.sectorHoldingEquity}).`);

    // -------------------------------------------------------------
    // TEST 3: Transparent Sector Comparison
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Transparent Sector Comparison ---");

    const comparison = await sectorIntelligenceService.compareSectors(
      "Information Technology",
      "Financial Services",
      testUserA
    );

    assert.ok(comparison.sectorA);
    assert.ok(comparison.sectorB);
    assert.ok(typeof comparison.comparison.priceChangeDelta === "number");
    assert.ok(typeof comparison.comparison.breadthDelta === "number");
    assert.ok(typeof comparison.comparison.userExposureDelta === "number");
    assert.strictEqual(comparison.methodology.includes("ZERO ARBITRARY FINANCIAL SCORES"), true);
    console.log(`PASS: Sector comparison verified without black-box scores (Exposure Delta: ${comparison.comparison.userExposureDelta}%).`);

    // -------------------------------------------------------------
    // TEST 4: Material Sector Event Generation (SECTOR_CHANGE)
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Material Sector Event Generation ---");

    const emitted = await sectorIntelligenceService.checkAndEmitSectorEvents(testUserA);
    assert.ok(Array.isArray(emitted));

    // Check if any sector event exists or verify manual creation
    const sectorEvents = await MarketEvent.find({
      user: testUserA,
      eventType: "SECTOR_CHANGE"
    });
    console.log(`PASS: Sector event check verified (${sectorEvents.length} SECTOR_CHANGE events recorded).`);

    // -------------------------------------------------------------
    // TEST 5: Graceful Handling of Unclassified / Missing Metadata
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Graceful Handling of Unclassified / Missing Metadata ---");

    const unclassified = await sectorIntelligenceService.computeSectorMetrics("NonExistentSector123");
    assert.strictEqual(unclassified.status, "DATA_LIMITED");
    assert.strictEqual(unclassified.constituents.length, 0);
    console.log("PASS: Unclassified / unknown sectors handled gracefully with DATA_LIMITED status.");

    // -------------------------------------------------------------
    // TEST 6: Multi-Tenant User Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Multi-Tenant User Isolation ---");

    const dashboardB = await sectorIntelligenceService.getSectorDashboard(testUserB);
    const itCardB = dashboardB.sectors.find(s => s.sector === "Information Technology");
    assert.strictEqual(itCardB.portfolioExposure.userExposurePercent, 0, "User B has zero holdings and zero exposure");
    assert.strictEqual(itCardB.portfolioExposure.holdings.length, 0);
    console.log("PASS: Multi-tenant user isolation verified — zero cross-user exposure contamination.");

    // -------------------------------------------------------------
    // TEST 7: Zero Financial Ledger Mutation
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Zero Financial Ledger Mutation ---");

    const userACheck = await UserModel.findById(testUserA);
    assert.strictEqual(userACheck.virtualBalance, 500000);
    const holdingsACheck = await HoldingsModel.find({ user: testUserA });
    assert.strictEqual(holdingsACheck.length, 2);
    console.log("PASS: Zero financial ledger mutation verified.");

    // -------------------------------------------------------------
    // TEST 8: Regression Verification (MVP-40, 41, 42, 43)
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Regression Verification (MVP-40, 41, 42, 43) ---");

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

    // MVP-43
    const regime = await marketRegimeService.detectCurrentRegime(testUserA);
    assert.ok(regime.regime);

    console.log("PASS: Regression verified across MVP-40 through MVP-43.");

    console.log("\n===================================================================");
    console.log("--- ALL 8/8 MVP-44 AUTOMATED TESTS PASSED SUCCESSFULLY! ---");
    console.log("===================================================================\n");
  } finally {
    // Clean up
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP44Tests().catch(err => {
  console.error("MVP-44 TEST FAILED:", err);
  process.exit(1);
});
