const mongoose = require("mongoose");
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { OrdersModel } = require("./models/OrdersModel");
const MarketEvent = require("./models/MarketEventModel");
const { ResearchSessionModel } = require("./models/ResearchSessionModel");
const DecisionJournal = require("./models/DecisionJournalModel");
const { TradeJournalModel } = require("./models/TradeJournalModel");
const digestService = require("./services/digestService");

async function runMVP54Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-54 INTELLIGENT DAILY / WEEKLY DIGEST TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  let passedTests = 0;
  let totalTests = 10;

  try {
    // Cleanup prior run data
    await UserModel.deleteMany({ email: { $in: ["mvp54a@test.com", "mvp54b@test.com"] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await ResearchSessionModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await DecisionJournal.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await TradeJournalModel.deleteMany({ user: { $in: [testUserA, testUserB] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP54 Digest User A",
      username: "mvp54_user_a",
      email: "mvp54a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP54 Digest User B",
      username: "mvp54_user_b",
      email: "mvp54b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // Seed User A data
    await HoldingsModel.create([
      { user: testUserA, name: "TCS", qty: 25, avg: 3400, price: 3500, net: "+2.94%", day: "+0.5%" },
      { user: testUserA, name: "INFY", qty: 10, avg: 1500, price: 1550, net: "+3.33%", day: "+1.0%" }
    ]);

    await MarketEvent.create([
      {
        user: testUserA,
        title: "TCS Volatility Spike",
        symbol: "TCS",
        eventType: "VOLATILITY_CHANGE",
        severity: "CRITICAL",
        description: "TCS realized volatility spiked past 35%",
        dedupeKey: "dedupe_tcs_vol_1",
        occurredAt: new Date()
      },
      {
        user: testUserA,
        title: "INFY 20-Day Breakout",
        symbol: "INFY",
        eventType: "TECHNICAL_BREAKOUT",
        severity: "SIGNIFICANT",
        description: "INFY 20-day high breakout",
        dedupeKey: "dedupe_infy_breakout_1",
        occurredAt: new Date()
      }
    ]);

    await ResearchSessionModel.create([
      {
        user: testUserA,
        title: "TCS Momentum Evaluation",
        question: "How does TCS momentum compare to sector peers?",
        researchHash: "hash_tcs_momentum_1",
        status: "ACTIVE"
      }
    ]);

    await DecisionJournal.create([
      {
        user: testUserA,
        title: "TCS Hold Decision",
        symbol: "TCS",
        decisionType: "HOLD",
        status: "ACTIVE",
        thesis: "Earnings expected to maintain IT leadership position"
      }
    ]);

    await TradeJournalModel.create([
      {
        user: testUserA,
        order: new mongoose.Types.ObjectId(),
        symbol: "TCS",
        side: "BUY",
        entryPrice: 3400,
        quantity: 25,
        tags: [] // unreviewed
      }
    ]);

    // -------------------------------------------------------------
    // TEST 1: Daily Brief Generation
    // -------------------------------------------------------------
    console.log("Test 1: Generating intelligent daily brief digest...");
    const daily = await digestService.getDailyDigest(testUserA);
    assert.strictEqual(daily.type, "DAILY_BRIEF");
    assert(daily.sections, "Must contain sections");
    assert(daily.sections.market, "Must contain market section");
    assert(daily.sections.portfolio, "Must contain portfolio section");
    assert(daily.sections.events, "Must contain events section");
    assert(daily.sections.research, "Must contain research section");
    assert(daily.sections.strategies, "Must contain strategies section");
    assert(daily.sections.journal, "Must contain journal section");
    assert(daily.sections.nextResearch, "Must contain next research recommendation");
    console.log("  ✓ Daily brief contains all 7 core synthesized sections.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 2: Market Section Grounding
    // -------------------------------------------------------------
    console.log("Test 2: Verifying market regime evidence in daily brief...");
    assert(daily.sections.market.evidence.regime, "Regime must be present");
    assert(daily.sections.market.evidence.volatility, "Volatility must be present");
    assert(daily.sections.market.summary.includes("Current regime is"), "Market summary text present");
    console.log(`  ✓ Market regime grounded: ${daily.sections.market.evidence.regime} (${daily.sections.market.evidence.volatility}).\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 3: Portfolio Concentration Evidence
    // -------------------------------------------------------------
    console.log("Test 3: Verifying portfolio concentration attribution...");
    assert(daily.sections.portfolio.evidence.symbol === "TCS", "Top holding must be TCS");
    assert(daily.sections.portfolio.summary.includes("TCS represents"), "Summary must reflect top holding");
    console.log(`  ✓ Portfolio holding verified: ${daily.sections.portfolio.summary}\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 4: Surveillance Events Evidence
    // -------------------------------------------------------------
    console.log("Test 4: Verifying market surveillance events evidence...");
    assert.strictEqual(daily.sections.events.evidence.significantCount, 2, "Must identify 2 critical/significant events");
    assert.strictEqual(daily.sections.events.evidence.topEvents.length, 2);
    console.log(`  ✓ Events synthesized: ${daily.sections.events.summary}\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 5: Open Research Questions Linkage
    // -------------------------------------------------------------
    console.log("Test 5: Verifying research session questions linkage...");
    assert.strictEqual(daily.sections.research.evidence.openQuestionsCount, 1);
    assert(daily.sections.research.evidence.questions[0].includes("TCS momentum"));
    console.log("  ✓ Open research questions linked accurately to active sessions.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 6: Unreviewed Trades & Discipline Tracking
    // -------------------------------------------------------------
    console.log("Test 6: Verifying trading journal discipline audit...");
    assert.strictEqual(daily.sections.journal.evidence.unreviewedTradesCount, 1);
    assert(daily.sections.journal.summary.includes("trades without behavioral tags need review"));
    console.log("  ✓ Trading journal discipline alerts flagged.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 7: Suggested Next Research & Non-Advisory Guardrails
    // -------------------------------------------------------------
    console.log("Test 7: Verifying non-prescriptive next research directive...");
    assert(daily.sections.nextResearch.action, "Next research action must be present");
    assert(daily.disclaimer.includes("EDUCATIONAL RESEARCH DIGEST"), "Must contain educational disclaimer");
    assert(!JSON.stringify(daily).includes("BUY "), "Must not contain unsolicited BUY signals");
    assert(!JSON.stringify(daily).includes("SELL "), "Must not contain unsolicited SELL signals");
    console.log(`  ✓ Suggested next research grounded: "${daily.sections.nextResearch.action}"\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 8: Weekly Digest Multi-Dimensional Synthesis
    // -------------------------------------------------------------
    console.log("Test 8: Generating weekly retrospective digest...");
    const weekly = await digestService.getWeeklyDigest(testUserA);
    assert.strictEqual(weekly.type, "WEEKLY_DIGEST");
    assert(weekly.sections.marketSummary, "Must contain weekly market summary");
    assert(weekly.sections.portfolioEvolution, "Must contain portfolio evolution");
    assert(weekly.sections.strategyExperiments, "Must contain strategy experiments");
    assert(weekly.sections.journalPatterns, "Must contain journal patterns");
    assert(weekly.sections.researchSessions, "Must contain research sessions");
    assert(weekly.sections.openDecisions, "Must contain open decisions");
    console.log("  ✓ Weekly digest synthesizes macro, portfolio, experiments, journal, and decisions.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 9: Strict User Isolation in Digest
    // -------------------------------------------------------------
    console.log("Test 9: Verifying strict user isolation across digests...");
    const dailyUserB = await digestService.getDailyDigest(testUserB);
    assert.strictEqual(dailyUserB.sections.portfolio.summary, "No active holdings in portfolio.");
    assert.strictEqual(dailyUserB.sections.events.evidence.totalEvents, 0);
    assert.strictEqual(dailyUserB.sections.research.evidence.openQuestionsCount, 0);
    assert.strictEqual(dailyUserB.sections.journal.evidence.recentTradesCount, 0);
    console.log("  ✓ User B digest completely isolated from User A data.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 10: Financial Safety & Zero Ledger Mutation
    // -------------------------------------------------------------
    console.log("Test 10: Verifying zero financial-ledger mutation...");
    const userACheck = await UserModel.findById(testUserA);
    const holdingsACheck = await HoldingsModel.find({ user: testUserA });
    const ordersACheck = await OrdersModel.find({ user: testUserA });

    assert.strictEqual(userACheck.virtualBalance, 500000, "virtualBalance must remain 500,000");
    assert.strictEqual(holdingsACheck.length, 2, "Holdings must remain exactly 2");
    assert.strictEqual(ordersACheck.length, 0, "No orders placed by digest generation");
    console.log("  ✓ Zero financial mutations: virtualBalance, Holdings, and Orders untouched.\n");
    passedTests++;

    console.log("===================================================================");
    console.log(`MVP-54 ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log("===================================================================\n");

  } catch (error) {
    console.error("MVP-54 TEST FAILED:", error);
    process.exit(1);
  } finally {
    // Cleanup
    await UserModel.deleteMany({ email: { $in: ["mvp54a@test.com", "mvp54b@test.com"] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await ResearchSessionModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await DecisionJournal.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await TradeJournalModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP54Tests();
