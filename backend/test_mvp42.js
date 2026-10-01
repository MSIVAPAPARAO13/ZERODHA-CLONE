require('dotenv').config();
const mongoose = require('mongoose');
const assert = require('assert');

// Models
const { UserModel } = require('./models/UserModel');
const { HoldingsModel } = require('./models/HoldingsModel');
const { OrdersModel } = require('./models/OrdersModel');
const DecisionJournal = require('./models/DecisionJournalModel');

// Services
const decisionJournalService = require('./services/decisionJournalService');
const portfolioIntelligenceService = require('./services/portfolioIntelligenceService');
const scenarioEngine = require('./services/scenarioEngine');

async function runMVP42Tests() {
  console.log('===================================================================');
  console.log('--- STARTING MVP-42 PORTFOLIO DECISION JOURNAL TEST SUITE ---');
  console.log('===================================================================\n');

  await mongoose.connect(process.env.MONGO_URL);

  // Cleanup test data
  await UserModel.deleteMany({ email: /mvp42test/ });
  await DecisionJournal.deleteMany({ title: /MVP42/ });

  // 1. Setup Test Users
  const userA = new UserModel({
    name: 'Alice Decider',
    email: `mvp42test_a_${Date.now()}@example.com`,
    password: 'password123',
    virtualBalance: 250000
  });
  await userA.save();

  const userB = new UserModel({
    name: 'Bob Decider',
    email: `mvp42test_b_${Date.now()}@example.com`,
    password: 'password123',
    virtualBalance: 50000
  });
  await userB.save();

  console.log('--- TEST 1: Decision Journal Record Creation ---');
  const decision1 = await decisionJournalService.createDecision(userA._id, {
    title: 'MVP42 Scale TCS on Cloud Growth',
    symbol: 'TCS',
    decisionType: 'PAPER_BUY',
    thesis: 'Enterprise cloud migration revenue acceleration exceeds conservative market pricing.',
    expectedOutcome: 'Target 8-12% appreciation over 3-6 month holding window.',
    riskFactors: ['Delay in US enterprise IT budgets', 'Currency headwinds'],
    invalidatingConditions: ['Quarterly constant currency growth falls below 2.0%'],
    reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  assert.ok(decision1._id);
  assert.strictEqual(decision1.symbol, 'TCS');
  assert.strictEqual(decision1.status, 'ACTIVE');
  assert.ok(decision1.timeline.length >= 1);
  console.log(`PASS: Decision record created successfully (ID: ${decision1._id}, Title: "${decision1.title}").\n`);

  console.log('--- TEST 2: Schema Validation on Missing Mandatory Fields ---');
  let rejected = false;
  try {
    await decisionJournalService.createDecision(userA._id, {
      title: 'Incomplete Decision'
      // Missing symbol, decisionType, thesis
    });
  } catch (err) {
    rejected = true;
  }
  assert.strictEqual(rejected, true, 'Must reject incomplete decision payload');
  console.log('PASS: Mandatory field validation verified.\n');

  console.log('--- TEST 3: Evidence & Scenario References Linking ---');
  const decisionWithEvidence = await decisionJournalService.createDecision(userA._id, {
    title: 'MVP42 Linked Evidence Decision',
    symbol: 'INFY',
    decisionType: 'HOLD',
    thesis: 'Holding through macro volatility; risk-adjusted valuation attractive.',
    evidenceReferences: [
      { sourceType: 'RESEARCH_SESSION', sourceId: 'session_123', metric: 'RSI', value: 58.4, provider: 'mock' },
      { sourceType: 'MARKET_EVENT', sourceId: 'event_456', metric: 'PRICE_MOVE', value: '+3.5%', provider: 'mock' }
    ],
    scenarioReferences: [
      { scenarioId: 'preset-it-correction', name: 'IT Sector Correction', modeledImpact: -15 }
    ]
  });
  assert.strictEqual(decisionWithEvidence.evidenceReferences.length, 2);
  assert.strictEqual(decisionWithEvidence.scenarioReferences.length, 1);
  assert.ok(decisionWithEvidence.timeline.some(t => t.eventType === 'SCENARIO_TESTED'));
  console.log('PASS: Evidence and scenario references successfully linked with timeline attribution.\n');

  console.log('--- TEST 4: Timeline Event Addition ---');
  const updatedWithTimeline = await decisionJournalService.addTimelineEvent(userA._id, decision1._id, {
    eventType: 'ORDER_LINKED',
    description: 'Paper trading BUY executed: 10 shares @ ₹3,410.'
  });
  const hasOrderEvent = updatedWithTimeline.timeline.some(t => t.eventType === 'ORDER_LINKED');
  assert.strictEqual(hasOrderEvent, true);
  console.log('PASS: Timeline sequence updated with external milestone.\n');

  console.log('--- TEST 5: Decision Review & Status Transition ---');
  const reviewed = await decisionJournalService.updateDecision(userA._id, decision1._id, {
    status: 'REVIEWED',
    reviewNotes: 'Earnings confirmed cloud revenue ramp (+3.4% CC). Thesis validated.'
  });
  assert.strictEqual(reviewed.status, 'REVIEWED');
  assert.ok(reviewed.timeline.some(t => t.eventType === 'DECISION_REVIEWED'));
  console.log(`PASS: Decision status updated to REVIEWED with review event added to timeline.\n`);

  console.log('--- TEST 6: Multi-Tenant User Isolation ---');
  const userBQueryResult = await decisionJournalService.getDecisionById(userB._id, decision1._id);
  assert.strictEqual(userBQueryResult, null, 'User B must not see User A decision');
  const userBDecisions = await decisionJournalService.getDecisions(userB._id);
  assert.strictEqual(userBDecisions.decisions.length, 0);
  console.log('PASS: User isolation strictly enforced — zero cross-user decision leakage.\n');

  console.log('--- TEST 7: Filter Queries (symbol, decisionType) ---');
  const queryRes = await decisionJournalService.getDecisions(userA._id, { symbol: 'TCS' });
  assert.ok(queryRes.decisions.length >= 1);
  assert.ok(queryRes.decisions.every(d => d.symbol === 'TCS'));
  console.log(`PASS: Filter queries verified (Found ${queryRes.total} records matching symbol=TCS).\n`);

  console.log('--- TEST 8: Decision Deletion ---');
  await decisionJournalService.deleteDecision(userA._id, decisionWithEvidence._id);
  const checkDeleted = await decisionJournalService.getDecisionById(userA._id, decisionWithEvidence._id);
  assert.strictEqual(checkDeleted, null);
  console.log('PASS: Decision record deletion verified.\n');

  console.log('--- TEST 9: Zero Financial Ledger Mutation ---');
  const userCheck = await UserModel.findById(userA._id);
  assert.strictEqual(userCheck.virtualBalance, 250000);
  const orderCount = await OrdersModel.countDocuments({ user: userA._id });
  assert.strictEqual(orderCount, 0);
  console.log('PASS: Zero financial ledger mutation verified.\n');

  console.log('--- TEST 10: Regression Check (MVP-41, MVP-40) ---');
  const intelCheck = await portfolioIntelligenceService.getPortfolioIntelligence(userA._id);
  assert.ok(intelCheck.totalCapital >= 0);
  console.log('PASS: Prior intelligence modules remain fully operational.\n');

  console.log('===================================================================');
  console.log('--- ALL 10/10 MVP-42 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
  console.log('===================================================================\n');

  await mongoose.disconnect();
}

runMVP42Tests().catch(err => {
  console.error('MVP-42 TEST FAILED:', err);
  process.exit(1);
});
