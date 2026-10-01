const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const { UserModel } = require("./models/UserModel");
const { TradeJournalModel } = require("./models/TradeJournalModel");
const { OrdersModel } = require("./models/OrdersModel");
const { HoldingsModel } = require("./models/HoldingsModel");

const journalIntelligenceService = require("./services/journalIntelligenceService");
const strategyNotebookService = require("./services/strategyNotebookService");
const strategyVersioningService = require("./services/strategyVersioningService");
const strategyRobustnessService = require("./services/strategyRobustnessService");
const portfolioIntelligenceService = require("./services/portfolioIntelligenceService");
const scenarioEngine = require("./services/scenarioEngine");
const decisionJournalService = require("./services/decisionJournalService");
const marketRegimeService = require("./services/marketRegimeService");
const sectorIntelligenceService = require("./services/sectorIntelligenceService");
const marketNarrativeService = require("./services/marketNarrativeService");

async function runMVP49Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-49 TRADING JOURNAL INTELLIGENCE TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  try {
    // Clean test data
    await TradeJournalModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP49 Tester A",
      username: "mvp49_tester_a",
      email: "mvp49a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP49 Tester B",
      username: "mvp49_tester_b",
      email: "mvp49b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // Create a mock order to satisfy unique order index
    const mockOrder1 = await OrdersModel.create({
      user: testUserA,
      name: "TCS",
      qty: 10,
      price: 3500,
      mode: "BUY"
    });

    // -------------------------------------------------------------
    // TEST 1: Structured Trade Journal Entry Capture
    // -------------------------------------------------------------
    console.log("--- TEST 1: Structured Trade Journal Entry Capture ---");

    const journal1 = await TradeJournalModel.create({
      user: testUserA,
      order: mockOrder1._id,
      symbol: "TCS",
      side: "BUY",
      entryPrice: 3500,
      quantity: 10,
      setup: "20-Day Donchian Breakout",
      thesis: "Strong earnings momentum with IT sector outperformance.",
      evidence: ["Volume 1.8x 20-day average", "RSI 62 bullish momentum"],
      emotion: "CONFIDENT",
      reviewDate: new Date(Date.now() + 7 * 24 * 3600 * 1000) // 7 days later
    });

    assert.ok(journal1._id);
    assert.strictEqual(journal1.setup, "20-Day Donchian Breakout");
    assert.strictEqual(journal1.evidence.length, 2);
    assert.strictEqual(journal1.emotion, "CONFIDENT");
    console.log(`PASS: Structured journal entry created (ID: ${journal1._id}, Setup: ${journal1.setup}).`);

    // -------------------------------------------------------------
    // TEST 2: Trade Review Lifecycle Workflow
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Trade Review Lifecycle Workflow ---");

    const reviewed = await journalIntelligenceService.recordTradeReview(testUserA, journal1._id, {
      result: {
        pnl: 1500,
        pnlPercent: 4.28,
        exitPrice: 3650,
        exitDate: new Date(Date.now() + 2 * 24 * 3600 * 1000), // Exited in 2 days (early exit)
        status: "CLOSED"
      },
      mistake: "Exited early before planned 7-day review date due to intraday dip.",
      executionNote: "Clean fill at limit price on market open.",
      lesson: "Give trending setups room to breathe instead of reacting to intraday noise.",
      isEarlyExit: true,
      emotion: "ANXIOUS"
    });

    assert.strictEqual(reviewed.result.status, "CLOSED");
    assert.strictEqual(reviewed.result.pnl, 1500);
    assert.strictEqual(reviewed.isEarlyExit, true);
    assert.strictEqual(reviewed.emotion, "ANXIOUS");
    assert.ok(reviewed.lesson.includes("Give trending setups room"));

    console.log("PASS: Trade review recorded with structured result, mistakes, and lessons.");

    // -------------------------------------------------------------
    // TEST 3: Rule-Based Pattern Detection
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Rule-Based Pattern Detection ---");

    // Seed 4 additional trades to create measurable patterns:
    // - 3 trades in TCS (frequent symbol)
    // - 2 trades with missing research session
    // - 1 trade with missing thesis
    const mockOrder2 = await OrdersModel.create({ user: testUserA, name: "TCS", qty: 5, price: 3550, mode: "BUY" });
    const mockOrder3 = await OrdersModel.create({ user: testUserA, name: "TCS", qty: 10, price: 3600, mode: "BUY" });
    const mockOrder4 = await OrdersModel.create({ user: testUserA, name: "INFY", qty: 20, price: 1500, mode: "BUY" });

    await TradeJournalModel.create([
      {
        user: testUserA,
        order: mockOrder2._id,
        symbol: "TCS",
        side: "BUY",
        entryPrice: 3550,
        quantity: 5,
        setup: "Momentum",
        thesis: "", // missing thesis
        evidence: [], // missing evidence
        isEarlyExit: true
      },
      {
        user: testUserA,
        order: mockOrder3._id,
        symbol: "TCS",
        side: "BUY",
        entryPrice: 3600,
        quantity: 10,
        setup: "Momentum",
        thesis: "Scaling in",
        evidence: [], // missing evidence
        isEarlyExit: false
      },
      {
        user: testUserA,
        order: mockOrder4._id,
        symbol: "INFY",
        side: "BUY",
        entryPrice: 1500,
        quantity: 20,
        setup: "Support Bounce",
        thesis: "Testing horizontal support",
        evidence: ["Support tested 3 times"],
        isEarlyExit: false
      }
    ]);

    const patternReport = await journalIntelligenceService.detectJournalPatterns(testUserA);

    assert.strictEqual(patternReport.totalTrades, 4);
    assert.ok(patternReport.metrics.unlinkedResearchCount >= 2, "Should identify trades without research evidence");
    assert.ok(patternReport.metrics.earlyExitCount >= 2, "Should identify early exits");
    assert.ok(patternReport.metrics.missingThesisCount >= 1, "Should identify missing thesis");
    assert.ok(patternReport.metrics.frequentSymbolsCount >= 1, "Should identify frequent symbol clustering in TCS");

    console.log(`PASS: Journal patterns detected (${patternReport.metrics.unlinkedResearchCount} unlinked research, ${patternReport.metrics.earlyExitCount} early exits, ${patternReport.metrics.missingThesisCount} missing thesis).`);

    // -------------------------------------------------------------
    // TEST 4: Prohibition of Mental Health / Psychological Diagnoses
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Prohibition of Mental Health Diagnoses ---");

    const reportStr = JSON.stringify(patternReport).toLowerCase();
    const bannedClinicalTerms = [
      "adhd",
      "addiction",
      "gambling disorder",
      "pathological",
      "therapy",
      "clinical depression",
      "neurotic",
      "psychological defect"
    ];

    bannedClinicalTerms.forEach(term => {
      assert.strictEqual(reportStr.includes(term), false, `Forbidden diagnostic term found: '${term}'`);
    });

    assert.strictEqual(
      patternReport.disclaimer,
      "EMPIRICAL_JOURNAL_PATTERN — OBSERVED SYSTEM LOGS, NOT A PSYCHOLOGICAL OR FINANCIAL DIAGNOSIS"
    );
    console.log("PASS: Prohibition of psychological diagnosis verified.");

    // -------------------------------------------------------------
    // TEST 5: Empty Journal State Handling
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Empty Journal State Handling ---");

    const emptyReport = await journalIntelligenceService.detectJournalPatterns(testUserB);
    assert.strictEqual(emptyReport.totalTrades, 0);
    assert.strictEqual(emptyReport.status, "DATA_LIMITED");
    console.log("PASS: Empty journal handled gracefully with DATA_LIMITED status.");

    // -------------------------------------------------------------
    // TEST 6: Multi-Tenant User Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Multi-Tenant User Isolation ---");

    let crossUserAccessFail = false;
    try {
      await journalIntelligenceService.recordTradeReview(testUserB, journal1._id, { lesson: "Hacked" });
    } catch (err) {
      crossUserAccessFail = true;
    }
    assert.strictEqual(crossUserAccessFail, true, "User B must not be able to review User A's trade journal");
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
    // TEST 8: Regression Verification (MVP-40 through MVP-48)
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Regression Verification (MVP-40 through MVP-48) ---");

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

    const notebookEntries = await strategyNotebookService.getNotebookEntries(testUserA);
    assert.strictEqual(notebookEntries.total, 0);

    console.log("PASS: Regression verified across MVP-40 through MVP-48.");

    console.log("\n===================================================================");
    console.log("--- ALL 8/8 MVP-49 AUTOMATED TESTS PASSED SUCCESSFULLY! ---");
    console.log("===================================================================\n");
  } finally {
    // Clean up
    await TradeJournalModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP49Tests().catch(err => {
  console.error("MVP-49 TEST FAILED:", err);
  process.exit(1);
});
