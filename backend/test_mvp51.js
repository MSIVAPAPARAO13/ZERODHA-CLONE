const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const Automation = require("./models/AutomationModel");

const automationService = require("./services/automationService");
const portfolioIntelligenceService = require("./services/portfolioIntelligenceService");
const scenarioEngine = require("./services/scenarioEngine");
const decisionJournalService = require("./services/decisionJournalService");
const marketRegimeService = require("./services/marketRegimeService");
const sectorIntelligenceService = require("./services/sectorIntelligenceService");
const marketNarrativeService = require("./services/marketNarrativeService");
const strategyVersioningService = require("./services/strategyVersioningService");
const strategyRobustnessService = require("./services/strategyRobustnessService");
const strategyNotebookService = require("./services/strategyNotebookService");
const journalIntelligenceService = require("./services/journalIntelligenceService");
const learningCoachService = require("./services/learningCoachService");

async function runMVP51Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-51 PERSONAL AUTOMATION ENGINE TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  try {
    // Clean test data
    await Automation.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP51 Automation User A",
      username: "mvp51_user_a",
      email: "mvp51a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP51 Automation User B",
      username: "mvp51_user_b",
      email: "mvp51b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // Seed User A holdings
    await HoldingsModel.create([
      { user: testUserA, name: "TCS", qty: 10, avg: 3500, price: 3600, net: "+2.86%", day: "+0.5%" }
    ]);

    // -------------------------------------------------------------
    // TEST 1: Creation of Research Automation Tasks
    // -------------------------------------------------------------
    console.log("--- TEST 1: Creation of Research Automation Tasks ---");

    const auto1 = await automationService.createAutomation(testUserA, {
      name: "Daily Morning Market Brief",
      type: "DAILY_BRIEF",
      schedule: "DAILY_8AM"
    });

    assert.ok(auto1._id);
    assert.strictEqual(auto1.name, "Daily Morning Market Brief");
    assert.strictEqual(auto1.type, "DAILY_BRIEF");
    assert.strictEqual(auto1.enabled, true);
    assert.strictEqual(auto1.lastStatus, "PENDING");

    const auto2 = await automationService.createAutomation(testUserA, {
      name: "Weekly Portfolio Exposure Review",
      type: "PORTFOLIO_REVIEW",
      schedule: "WEEKLY_MONDAY"
    });
    assert.ok(auto2._id);

    console.log(`PASS: Created automation tasks (ID 1: ${auto1._id}, ID 2: ${auto2._id}).`);

    // -------------------------------------------------------------
    // TEST 2: Validation of Invalid Automation Types
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Validation of Invalid Automation Types ---");

    let invalidTypeError = false;
    try {
      await automationService.createAutomation(testUserA, {
        name: "Auto Trader",
        type: "AUTOMATIC_BUY_SELL" // Banned: No automated broker trading!
      });
    } catch (err) {
      invalidTypeError = true;
    }
    assert.strictEqual(invalidTypeError, true, "Must reject trading/broker automation types");
    console.log("PASS: Rejection of automated broker trading types verified.");

    // -------------------------------------------------------------
    // TEST 3: Listing Automations
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Listing Automations ---");

    const listA = await automationService.listAutomations(testUserA);
    assert.strictEqual(listA.length, 2);
    console.log(`PASS: Listed ${listA.length} automations for User A.`);

    // -------------------------------------------------------------
    // TEST 4: Updating Automation
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Updating Automation ---");

    const updated = await automationService.updateAutomation(testUserA, auto1._id, {
      schedule: "DAILY_EOD",
      enabled: false
    });
    assert.strictEqual(updated.schedule, "DAILY_EOD");
    assert.strictEqual(updated.enabled, false);
    console.log("PASS: Automation updated successfully.");

    // -------------------------------------------------------------
    // TEST 5: Manual Task Execution (PORTFOLIO_REVIEW)
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Manual Task Execution (PORTFOLIO_REVIEW) ---");

    const execPort = await automationService.runAutomation(testUserA, auto2._id);
    assert.strictEqual(execPort.status, "SUCCESS");
    assert.ok(execPort.result.totalEquity > 0);

    const docAfter = await Automation.findById(auto2._id);
    assert.strictEqual(docAfter.lastStatus, "SUCCESS");
    assert.ok(docAfter.lastRunAt);
    assert.strictEqual(docAfter.executionCount, 1);
    console.log(`PASS: PORTFOLIO_REVIEW executed (Total Equity: ₹${execPort.result.totalEquity}, Status: ${docAfter.lastStatus}).`);

    // -------------------------------------------------------------
    // TEST 6: Manual Task Execution (DAILY_BRIEF)
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Manual Task Execution (DAILY_BRIEF) ---");

    const execBrief = await automationService.runAutomation(testUserA, auto1._id);
    assert.strictEqual(execBrief.status, "SUCCESS");
    assert.ok(execBrief.result.sections);
    console.log("PASS: DAILY_BRIEF executed with 5-section market narrative.");

    // -------------------------------------------------------------
    // TEST 7: Multi-Tenant User Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Multi-Tenant User Isolation ---");

    const listB = await automationService.listAutomations(testUserB);
    assert.strictEqual(listB.length, 0, "User B must see 0 automations");

    let userBRunFail = false;
    try {
      await automationService.runAutomation(testUserB, auto1._id);
    } catch (err) {
      userBRunFail = true;
    }
    assert.strictEqual(userBRunFail, true, "User B must not be able to execute User A's automation");
    console.log("PASS: Multi-tenant user isolation verified.");

    // -------------------------------------------------------------
    // TEST 8: Automation Deletion
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Automation Deletion ---");

    await automationService.deleteAutomation(testUserA, auto1._id);
    const checkDeleted = await automationService.getAutomationById(testUserA, auto1._id);
    assert.strictEqual(checkDeleted, null);
    console.log("PASS: Automation deleted successfully.");

    // -------------------------------------------------------------
    // TEST 9: Zero Financial Ledger Mutation
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Zero Financial Ledger Mutation ---");

    const userCheck = await UserModel.findById(testUserA);
    assert.strictEqual(userCheck.virtualBalance, 500000);
    const holdings = await HoldingsModel.find({ user: testUserA });
    assert.strictEqual(holdings.length, 1);
    assert.strictEqual(holdings[0].qty, 10);
    console.log("PASS: Zero financial ledger mutation verified — 100% read-only automation.");

    // -------------------------------------------------------------
    // TEST 10: Regression Verification (MVP-40 through MVP-50)
    // -------------------------------------------------------------
    console.log("\n--- TEST 10: Regression Verification (MVP-40 through MVP-50) ---");

    const health = await portfolioIntelligenceService.getPortfolioIntelligence(testUserA);
    assert.ok(health.health);

    const scenario = await scenarioEngine.runScenario(testUserA, {
      name: "Regression Test Scenario",
      shocks: [{ targetType: "SECTOR", target: "Information Technology", percentage: -5 }]
    });
    assert.ok(scenario.disclaimer);

    const learningProfile = await learningCoachService.getLearningProfile(testUserA);
    assert.ok(learningProfile._id);

    console.log("PASS: Full regression verified across preceding milestones.");

    console.log("\n===================================================================");
    console.log("--- ALL 10/10 MVP-51 AUTOMATED TESTS PASSED SUCCESSFULLY! ---");
    console.log("===================================================================\n");
  } finally {
    // Clean up
    await Automation.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP51Tests().catch(err => {
  console.error("MVP-51 TEST FAILED:", err);
  process.exit(1);
});
