const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { OrdersModel } = require("./models/OrdersModel");
const MarketEvent = require("./models/MarketEventModel");
const { StrategyModel } = require("./models/StrategyModel");
const StrategyNotebook = require("./models/StrategyNotebookModel");
const DecisionJournal = require("./models/DecisionJournalModel");
const { TradeJournalModel } = require("./models/TradeJournalModel");
const LearningProfile = require("./models/LearningProfileModel");

const learningCoachService = require("./services/learningCoachService");
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

async function runMVP50Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-50 PERSONAL LEARNING COACH (CAPSTONE) TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  try {
    // Clean test data
    await LearningProfile.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await TradeJournalModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await DecisionJournal.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await StrategyNotebook.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await StrategyModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP50 Systematic Trader",
      username: "mvp50_trader_a",
      email: "mvp50a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP50 Observer",
      username: "mvp50_trader_b",
      email: "mvp50b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // -------------------------------------------------------------
    // TEST 1: End-to-End Pipeline Execution (The Complete Loop)
    // -------------------------------------------------------------
    console.log("--- TEST 1: End-to-End Pipeline Execution (The Complete Loop) ---");

    // Step 1: Holdings seeded
    await HoldingsModel.create([
      { user: testUserA, name: "TCS", qty: 20, avg: 3400, price: 3550, net: "+4.41%", day: "+1.2%" },
      { user: testUserA, name: "INFY", qty: 30, avg: 1450, price: 1500, net: "+3.45%", day: "+0.5%" }
    ]);

    // Step 2: Market Event emitted
    const dedupeKey = `mvp50_event_${Date.now()}`;
    await MarketEvent.create({
      user: testUserA,
      symbol: "TCS",
      eventType: "TECHNICAL_BREAKOUT",
      severity: "SIGNIFICANT",
      category: "MARKET",
      title: "TCS Breakout with Sector Momentum",
      description: "TCS crosses above 50-day SMA with IT sector advance.",
      observedData: [{ metric: "price", value: 3550 }],
      sources: [{ sourceType: "MARKET_DATA" }],
      dedupeKey
    });

    // Step 3: Portfolio Health & Exposure
    const portIntel = await portfolioIntelligenceService.getPortfolioIntelligence(testUserA);
    assert.ok(portIntel.totalEquity > 0);

    // Step 4: Scenario Stress Test
    const scenarioRes = await scenarioEngine.runScenario(testUserA, {
      name: "MVP50 IT Sector Shock -10%",
      shocks: [{ targetType: "SECTOR", target: "Information Technology", percentage: -10 }]
    });
    assert.strictEqual(scenarioRes.disclaimer, "MODELLED SCENARIO — NOT A PREDICTION");

    // Step 5: Market Regime & Sectors
    const regimeRes = await marketRegimeService.detectCurrentRegime(testUserA);
    assert.ok(regimeRes.regime);

    // Step 6: Strategy Versioning & Robustness
    const stratRes = await strategyVersioningService.saveStrategyVersion(testUserA, {
      name: "MVP50 Trend Strategy",
      universe: ["TCS", "INFY"],
      entryRules: [{ indicator: "SMA", params: { fastPeriod: 10, slowPeriod: 30 }, condition: "CROSS_ABOVE" }]
    });

    const notebookExp = await strategyNotebookService.recordExperiment(testUserA, {
      strategyId: stratRes.strategy._id,
      title: "Testing Moving Average Filter on Tech",
      hypothesis: "SMA crossover captures early trend breakout.",
      datasetRange: { startDate: "2023-01-01", endDate: "2024-01-01" },
      results: { totalReturnPercent: 14.5, maxDrawdownPercent: 6.2, winRatePercent: 55 },
      robustnessResults: { status: "MODERATE_ROBUSTNESS", reason: "Friction reduces return by 20%." },
      observations: "Solid trend follow-through on TCS."
    });

    // Step 7: Decision Journal Record
    const decision = await decisionJournalService.createDecision(testUserA, {
      title: "TCS Momentum Scaling Decision",
      symbol: "TCS",
      decisionType: "PAPER_BUY",
      thesis: "Breakout confirmed by IT sector breadth and backtest alpha.",
      expectedOutcome: "+5% upside in 14 days",
      riskFactors: ["Macro rate hike surprise"],
      invalidatingConditions: ["Close below 3400 SMA support"],
      reviewDate: new Date(Date.now() + 14 * 24 * 3600 * 1000)
    });
    assert.ok(decision._id);

    // Step 8: Paper Trade & Journal Review
    const mockOrder = await OrdersModel.create({
      user: testUserA,
      name: "TCS",
      qty: 10,
      price: 3550,
      mode: "BUY"
    });

    const tradeJournal = await TradeJournalModel.create({
      user: testUserA,
      order: mockOrder._id,
      symbol: "TCS",
      side: "BUY",
      entryPrice: 3550,
      quantity: 10,
      setup: "Moving Average Breakout",
      thesis: "Sector-backed momentum",
      evidence: ["IT sector +2.4%", "RSI 61"],
      emotion: "DISCIPLINED"
    });

    await journalIntelligenceService.recordTradeReview(testUserA, tradeJournal._id, {
      result: { pnl: 2200, pnlPercent: 6.19, exitPrice: 3770, status: "CLOSED" },
      mistake: "None identified.",
      lesson: "Patience allowed the position to reach full profit target.",
      isEarlyExit: false
    });

    console.log("PASS: Complete 8-stage research-to-review pipeline executed without failure.");

    // -------------------------------------------------------------
    // TEST 2: Learning Profile Generation & Activity Counts
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Learning Profile Generation & Activity Counts ---");

    const profile = await learningCoachService.getLearningProfile(testUserA);
    assert.ok(profile._id);
    assert.ok(profile.researchActivity.totalStrategyExperiments >= 1);
    assert.ok(profile.researchActivity.totalDecisionsRecorded >= 1);
    assert.ok(profile.researchActivity.totalJournalsReviewed >= 1);

    console.log(`PASS: Learning Profile generated (Experiments: ${profile.researchActivity.totalStrategyExperiments}, Decisions: ${profile.researchActivity.totalDecisionsRecorded}, Reviews: ${profile.researchActivity.totalJournalsReviewed}).`);

    // -------------------------------------------------------------
    // TEST 3: Transparent Knowledge Gaps Derivation
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Transparent Knowledge Gaps Derivation ---");

    const gapsData = await learningCoachService.getKnowledgeGaps(testUserA);
    assert.ok(Array.isArray(gapsData.gaps));
    assert.ok(gapsData.gaps.length >= 5);

    const fundamentalGap = gapsData.gaps.find(g => g.dimension === "Fundamental Analysis");
    assert.ok(fundamentalGap);
    assert.strictEqual(fundamentalGap.status, "UNAVAILABLE");

    const technicalGap = gapsData.gaps.find(g => g.dimension === "Technical Evidence");
    assert.ok(technicalGap);
    assert.ok(["STRONG", "MODERATE"].includes(technicalGap.status));

    console.log(`PASS: Knowledge gaps evaluated (${gapsData.gaps.length} dimensions verified, Fundamental status: ${fundamentalGap.status}).`);

    // -------------------------------------------------------------
    // TEST 4: Factual, Non-Pressuring Research Questions
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Factual, Non-Pressuring Research Questions ---");

    const questionsData = await learningCoachService.getPersonalResearchQuestions(testUserA);
    assert.ok(Array.isArray(questionsData.questions));
    assert.ok(questionsData.questions.length >= 1);

    // Questions must be inquiries, not commands or buy signals
    questionsData.questions.forEach(q => {
      assert.ok(q.question.includes("?") || q.question.toLowerCase().includes("would you like"));
      assert.ok(q.rationale);
    });

    console.log(`PASS: Personalized research questions formulated (${questionsData.questions.length} questions).`);

    // -------------------------------------------------------------
    // TEST 5: Complete Learning Loop Status
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Complete Learning Loop Status ---");

    const loopStatus = await learningCoachService.getLearningLoopStatus(testUserA);
    assert.ok(loopStatus.currentStage);
    assert.ok(Array.isArray(loopStatus.loopStages) && loopStatus.loopStages.length === 6);
    assert.ok(loopStatus.summary.includes("completed"));

    console.log(`PASS: Learning Loop status verified (Stage: ${loopStatus.currentStage}, Summary: "${loopStatus.summary}").`);

    // -------------------------------------------------------------
    // TEST 6: Strict AI Contract & Educational Guardrails
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Strict AI Contract & Educational Guardrails ---");

    const profileText = JSON.stringify(profile).toLowerCase();
    const bannedPhrases = [
      "buy this stock",
      "sell immediately",
      "guaranteed win",
      "target price reach",
      "adhd",
      "gambling problem",
      "pathological"
    ];

    bannedPhrases.forEach(phrase => {
      assert.strictEqual(profileText.includes(phrase), false, `Forbidden text found: '${phrase}'`);
    });

    assert.ok(profile.notes.includes("META-ANALYSIS OF USER'S OWN RESEARCH PROCESS"));
    console.log("PASS: Educational guardrails and non-prescriptive contract verified.");

    // -------------------------------------------------------------
    // TEST 7: Multi-Tenant User Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Multi-Tenant User Isolation ---");

    const profileB = await learningCoachService.getLearningProfile(testUserB);
    assert.strictEqual(profileB.researchActivity.totalDecisionsRecorded, 0);
    assert.strictEqual(profileB.researchActivity.totalJournalsReviewed, 0);
    console.log("PASS: Multi-tenant user isolation verified — zero cross-user profile contamination.");

    // -------------------------------------------------------------
    // TEST 8: Zero Financial Ledger Mutation
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Zero Financial Ledger Mutation ---");

    const userACheck = await UserModel.findById(testUserA);
    assert.strictEqual(userACheck.virtualBalance, 500000);
    console.log("PASS: Zero financial ledger mutation verified across the full pipeline.");

    // -------------------------------------------------------------
    // TEST 9: Full Regression Test Across MVP-40 → MVP-49
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Full Regression Test Across MVP-40 → MVP-49 ---");

    // MVP-40: Portfolio Health
    const health = await portfolioIntelligenceService.getPortfolioIntelligence(testUserA);
    assert.ok(health.health);

    // MVP-41: Scenario Planner
    assert.ok(scenarioRes.modeledResult);

    // MVP-42: Decision Journal
    const decisions = await decisionJournalService.getDecisions(testUserA);
    assert.ok(decisions.total >= 1);

    // MVP-43: Market Regime
    const regime = await marketRegimeService.detectCurrentRegime(testUserA);
    assert.ok(regime.regime);

    // MVP-44: Sector Intelligence
    const sectors = await sectorIntelligenceService.getSectorDashboard(testUserA);
    assert.ok(sectors.sectors.length > 0);

    // MVP-45: Market Narrative
    const narrative = await marketNarrativeService.generateMarketNarrative(testUserA);
    assert.ok(narrative.sections.whatChanged);

    // MVP-46: Strategy Lab 2.0 Versioning
    const versions = await strategyVersioningService.getStrategyVersionHistory(testUserA, stratRes.strategy._id);
    assert.ok(versions.length >= 1);

    // MVP-47: Robustness Lab
    const robustness = strategyRobustnessService.classifyRobustness({ baseTrades: 10, baseReturn: 15, higherCostReturn: 12, higherSlippageReturn: 11, inSampleReturn: 15, oosReturn: 10 });
    assert.ok(robustness.classification);

    // MVP-48: Strategy Notebook
    const notebookList = await strategyNotebookService.getNotebookEntries(testUserA);
    assert.ok(notebookList.total >= 1);

    // MVP-49: Journal Intelligence Patterns
    const patterns = await journalIntelligenceService.detectJournalPatterns(testUserA);
    assert.ok(patterns.patterns);

    console.log("PASS: Comprehensive regression verified across all 10 preceding milestones (MVP-40 through MVP-49).");

    console.log("\n===================================================================");
    console.log("--- ALL 9/9 MVP-50 AUTOMATED TESTS PASSED SUCCESSFULLY! ---");
    console.log("===================================================================\n");
  } finally {
    // Clean up
    await LearningProfile.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await TradeJournalModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await DecisionJournal.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await StrategyNotebook.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await StrategyModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await MarketEvent.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UserModel.deleteMany({ _id: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP50Tests().catch(err => {
  console.error("MVP-50 TEST FAILED:", err);
  process.exit(1);
});
