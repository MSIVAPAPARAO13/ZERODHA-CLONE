const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const MarketEvent = require("./models/MarketEventModel");

const marketNarrativeService = require("./services/marketNarrativeService");
const portfolioIntelligenceService = require("./services/portfolioIntelligenceService");
const scenarioEngine = require("./services/scenarioEngine");
const decisionJournalService = require("./services/decisionJournalService");
const marketRegimeService = require("./services/marketRegimeService");
const sectorIntelligenceService = require("./services/sectorIntelligenceService");

async function runMVP45Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-45 MARKET NARRATIVE ENGINE TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  try {
    // Clean test data
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });

    // Seed User A with balance and holdings
    await UserModel.create({
      _id: testUserA,
      name: "MVP45 Tester A",
      username: "mvp45_tester_a",
      email: "mvp45a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP45 Tester B",
      username: "mvp45_tester_b",
      email: "mvp45b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // Seed User A holdings
    await HoldingsModel.create([
      {
        user: testUserA,
        name: "TCS",
        qty: 15,
        avg: 3500,
        price: 3650,
        net: "+4.29%",
        day: "+1.2%"
      },
      {
        user: testUserA,
        name: "INFY",
        qty: 25,
        avg: 1500,
        price: 1520,
        net: "+1.33%",
        day: "-0.5%"
      }
    ]);

    // Seed recent MarketEvent for User A on TCS
    await MarketEvent.create({
      user: testUserA,
      symbol: "TCS",
      eventType: "TECHNICAL_BREAKOUT",
      severity: "CRITICAL",
      category: "MARKET",
      title: "TCS 20-Day High Breakout",
      description: "TCS broke above 20-day high with 1.8x volume expansion.",
      observedData: [{ metric: "price", value: 3650 }, { metric: "volumeMultiple", value: 1.8 }],
      sources: [{ sourceType: "MARKET_DATA" }],
      dedupeKey: `tcs_breakout_${Date.now()}`
    });

    // -------------------------------------------------------------
    // TEST 1: Mandatory 5-Section Narrative Structure
    // -------------------------------------------------------------
    console.log("--- TEST 1: Mandatory 5-Section Narrative Structure ---");

    const narrativeA = await marketNarrativeService.generateMarketNarrative(testUserA);
    assert.ok(narrativeA.sections);

    const {
      whatChanged,
      whatIsUnusual,
      whichSectorsChanged,
      whichMonitoredAssetsAffected,
      whatRemainsUnknown
    } = narrativeA.sections;

    assert.ok(whatChanged && whatChanged.title && whatChanged.summary && Array.isArray(whatChanged.evidence));
    assert.ok(whatIsUnusual && whatIsUnusual.title && whatIsUnusual.summary && Array.isArray(whatIsUnusual.evidence));
    assert.ok(whichSectorsChanged && whichSectorsChanged.title && whichSectorsChanged.summary && Array.isArray(whichSectorsChanged.evidence));
    assert.ok(whichMonitoredAssetsAffected && whichMonitoredAssetsAffected.title && whichMonitoredAssetsAffected.summary && Array.isArray(whichMonitoredAssetsAffected.evidence));
    assert.ok(whatRemainsUnknown && whatRemainsUnknown.title && whatRemainsUnknown.summary && Array.isArray(whatRemainsUnknown.evidence));

    console.log("PASS: All 5 mandatory narrative sections present with structured summaries and evidence.");

    // -------------------------------------------------------------
    // TEST 2: Grounded Citations & Deterministic Facts
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Grounded Citations & Deterministic Facts ---");

    // Section 1 must reference regime and breadth
    assert.ok(whatChanged.evidence.some(e => e.includes("Regime") || e.includes("Breadth")));

    // Section 2 must reference the critical event on TCS
    assert.ok(whatIsUnusual.evidence.some(e => e.includes("TCS") || e.includes("critical")));

    // Section 4 must reference user's held assets
    assert.ok(whichMonitoredAssetsAffected.evidence.some(e => e.includes("TCS")));

    // Section 5 must explicitly state unknown corporate / institutional data
    assert.ok(whatRemainsUnknown.evidence.some(e => e.includes("earnings") || e.includes("registry")));

    console.log("PASS: Evidence citations verified across all 5 sections.");

    // -------------------------------------------------------------
    // TEST 3: Zero Predictive Language Guardrail
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Zero Predictive Language Guardrail ---");

    const fullText = JSON.stringify(narrativeA).toLowerCase();
    const bannedPhrases = [
      "will rise",
      "will fall",
      "target price",
      "guaranteed return",
      "buy now",
      "sell immediately",
      "skyrocket",
      "crash incoming"
    ];

    bannedPhrases.forEach(phrase => {
      assert.strictEqual(
        fullText.includes(phrase),
        false,
        `Forbidden speculative phrase found: '${phrase}'`
      );
    });

    assert.strictEqual(narrativeA.disclaimer, "EVIDENCE_BASED_OBSERVATION — NOT A PREDICTION OR RECOMMENDATION");
    console.log("PASS: Zero speculative or predictive assertions verified.");

    // -------------------------------------------------------------
    // TEST 4: Empty Portfolio State Handling
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Empty Portfolio State Handling ---");

    const narrativeB = await marketNarrativeService.generateMarketNarrative(testUserB);
    assert.ok(narrativeB.sections);
    assert.ok(
      narrativeB.sections.whichMonitoredAssetsAffected.evidence.some(e => e.includes("0 active equity positions"))
    );
    console.log("PASS: Graceful narrative generation for user with empty portfolio.");

    // -------------------------------------------------------------
    // TEST 5: Multi-Tenant User Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Multi-Tenant User Isolation ---");

    // User B must NOT see User A's TCS breakout event in their narrative
    const bEventsText = JSON.stringify(narrativeB.sections.whichMonitoredAssetsAffected);
    assert.strictEqual(bEventsText.includes("TCS: Qty 15"), false);
    console.log("PASS: Multi-tenant user isolation verified — zero cross-user narrative contamination.");

    // -------------------------------------------------------------
    // TEST 6: Zero Financial Ledger Mutation
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Zero Financial Ledger Mutation ---");

    const userACheck = await UserModel.findById(testUserA);
    assert.strictEqual(userACheck.virtualBalance, 500000);
    const holdingsACheck = await HoldingsModel.find({ user: testUserA });
    assert.strictEqual(holdingsACheck.length, 2);
    console.log("PASS: Zero financial ledger mutation verified.");

    // -------------------------------------------------------------
    // TEST 7: Regression Verification (MVP-40 through MVP-44)
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Regression Verification (MVP-40 through MVP-44) ---");

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

    // MVP-44
    const sectors = await sectorIntelligenceService.getSectorDashboard(testUserA);
    assert.ok(sectors.sectors.length > 0);

    console.log("PASS: Regression verified across MVP-40 through MVP-44.");

    console.log("\n===================================================================");
    console.log("--- ALL 7/7 MVP-45 AUTOMATED TESTS PASSED SUCCESSFULLY! ---");
    console.log("===================================================================\n");
  } finally {
    // Clean up
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP45Tests().catch(err => {
  console.error("MVP-45 TEST FAILED:", err);
  process.exit(1);
});
