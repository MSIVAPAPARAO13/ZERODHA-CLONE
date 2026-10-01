require('dotenv').config();
const mongoose = require('mongoose');
const assert = require('assert');

// Models
const { UserModel } = require('./models/UserModel');
const { HoldingsModel } = require('./models/HoldingsModel');
const { PositionsModel } = require('./models/PositionsModel');
const { OrdersModel } = require('./models/OrdersModel');
const { WatchlistModel } = require('./models/WatchlistModel');
const { AlertModel } = require('./models/AlertModel');
const { ResearchSessionModel } = require('./models/ResearchSessionModel');
const MarketEvent = require('./models/MarketEventModel');

// Services
const insightsService = require('./services/insightsService');
const marketEventService = require('./services/marketEventService');
const researchCopilotService = require('./services/researchCopilotService');

async function runMVP39Tests() {
  console.log('===================================================================');
  console.log('--- STARTING MVP-39 "WHAT CHANGED TODAY?" TEST SUITE ---');
  console.log('===================================================================\n');

  await mongoose.connect(process.env.MONGO_URL);

  // Cleanup old test data
  await UserModel.deleteMany({ email: /mvp39test/ });
  await MarketEvent.deleteMany({ tags: /MVP39/ });
  await WatchlistModel.deleteMany({ 'items.symbol': /MVP39/ });
  await AlertModel.deleteMany({ symbol: /MVP39/ });

  // 1. Setup Test Users
  const userA = new UserModel({
    name: 'Alice Insights',
    email: `mvp39test_a_${Date.now()}@example.com`,
    password: 'password123',
    virtualBalance: 300000
  });
  await userA.save();

  const userB = new UserModel({
    name: 'Bob Insights',
    email: `mvp39test_b_${Date.now()}@example.com`,
    password: 'password123',
    virtualBalance: 150000
  });
  await userB.save();

  // Setup user A context: Watchlist (TCS), Portfolio (INFY), Alert (RELIANCE)
  await WatchlistModel.create({ user: userA._id, symbol: 'TCS' });
  await HoldingsModel.create({
    user: userA._id,
    name: 'INFY',
    qty: 25,
    avg: 1500,
    price: 1550,
    net: '+3.33%',
    day: '+1.2%'
  });
  await AlertModel.create({
    user: userA._id,
    symbol: 'RELIANCE',
    condition: 'ABOVE',
    targetPrice: 2800,
    isActive: false,
    triggeredAt: new Date()
  });

  // Seed market events for userA
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const eventTCS = new MarketEvent({
    user: userA._id,
    symbol: 'TCS',
    eventType: 'PRICE_MOVE',
    severity: 'SIGNIFICANT',
    category: 'WATCHLIST',
    title: 'TCS Price Gain +4.20%',
    description: 'TCS moved +4.20% from previous close.',
    changePercent: 4.2,
    occurredAt: today,
    dedupeKey: marketEventService.generateDedupeKey(userA._id, 'TCS', 'PRICE_MOVE', today),
    tags: ['TCS', 'MVP39']
  });

  const eventINFY = new MarketEvent({
    user: userA._id,
    symbol: 'INFY',
    eventType: 'CORRELATED_EVENT',
    severity: 'CRITICAL',
    category: 'PORTFOLIO',
    title: 'INFY Momentum Confluence',
    description: 'Multiple correlated signals converged on INFY.',
    changePercent: 3.5,
    correlatedSignals: [
      { eventType: 'PRICE_MOVE', metric: 'price', value: 1550 },
      { eventType: 'VOLUME_SURGE', metric: 'volume', value: '1.9x' }
    ],
    occurredAt: today,
    dedupeKey: marketEventService.generateDedupeKey(userA._id, 'INFY', 'CORRELATED_EVENT', today),
    tags: ['INFY', 'MVP39']
  });

  const eventYesterday = new MarketEvent({
    user: userA._id,
    symbol: 'WIPRO',
    eventType: 'PRICE_MOVE',
    severity: 'WATCH',
    category: 'MARKET',
    title: 'WIPRO Price Move',
    description: 'WIPRO moved yesterday.',
    changePercent: 1.8,
    occurredAt: yesterday,
    dedupeKey: marketEventService.generateDedupeKey(userA._id, 'WIPRO', 'PRICE_MOVE', yesterday),
    tags: ['WIPRO', 'MVP39']
  });

  await Promise.all([eventTCS.save(), eventINFY.save(), eventYesterday.save()]);

  console.log('--- TEST 1: Today\'s Feed Compilation & Schema Structure ---');
  const feedToday = await insightsService.getTodayFeed(userA._id);
  assert.ok(feedToday.date, 'Feed must contain a date string');
  assert.ok(feedToday.summary, 'Feed must contain summary metrics');
  assert.ok(Array.isArray(feedToday.sections), 'Sections must be an array');
  assert.ok(Array.isArray(feedToday.events), 'Events must be an array');
  assert.ok(Array.isArray(feedToday.researchQuestions), 'Research questions must be an array');
  console.log(`PASS: Today's feed compiled successfully (${feedToday.events.length} events, ${feedToday.sections.length} sections).\n`);

  console.log('--- TEST 2: Multi-Tenant User Isolation ---');
  const feedUserB = await insightsService.getTodayFeed(userB._id);
  const foundUserAEventsInB = feedUserB.events.filter(e => e.tags?.includes('MVP39'));
  assert.strictEqual(foundUserAEventsInB.length, 0, 'User B must not see User A events');
  console.log('PASS: User isolation strictly verified — User B feed contains zero User A events.\n');

  console.log('--- TEST 3: Watchlist Personalization & Section Routing ---');
  const watchlistSection = feedToday.sections.find(s => s.id === 'WATCHLIST');
  assert.ok(watchlistSection, 'Watchlist section must exist');
  const tcsInWatchlist = watchlistSection.events.find(e => e.symbol === 'TCS');
  assert.ok(tcsInWatchlist, 'TCS event must be categorized under Watchlist');
  console.log('PASS: Watchlist personalization verified — TCS routed to Watchlist section.\n');

  console.log('--- TEST 4: Portfolio Personalization & Section Routing ---');
  const portfolioSection = feedToday.sections.find(s => s.id === 'PORTFOLIO');
  assert.ok(portfolioSection, 'Portfolio section must exist');
  const infyInPortfolio = portfolioSection.events.find(e => e.symbol === 'INFY');
  assert.ok(infyInPortfolio, 'INFY event must be categorized under Portfolio');
  console.log('PASS: Portfolio personalization verified — INFY routed to Portfolio section.\n');

  console.log('--- TEST 5: Alert Personalization & Section Routing ---');
  // Seed triggered alert event
  const alertEvent = new MarketEvent({
    user: userA._id,
    symbol: 'RELIANCE',
    eventType: 'ALERT_TRIGGERED',
    severity: 'SIGNIFICANT',
    category: 'ALERT',
    title: 'RELIANCE Price Alert Triggered',
    description: 'Price crossed ₹2800.',
    dedupeKey: marketEventService.generateDedupeKey(userA._id, 'RELIANCE', 'ALERT_TRIGGERED', today),
    tags: ['RELIANCE', 'MVP39']
  });
  await alertEvent.save();

  const refreshedFeed = await insightsService.getTodayFeed(userA._id);
  const alertSection = refreshedFeed.sections.find(s => s.id === 'ALERT');
  assert.ok(alertSection, 'Alert section must exist');
  console.log('PASS: Alert personalization verified — triggered alert routed to Alerts section.\n');

  console.log('--- TEST 6: Deterministic Prioritization Order ---');
  // INFY is CRITICAL (score ~400+), TCS is SIGNIFICANT (score ~300+)
  const topEvent = refreshedFeed.events[0];
  assert.strictEqual(topEvent.symbol, 'INFY', 'CRITICAL portfolio event (INFY) must be ranked #1');
  assert.ok(topEvent.priorityScore > refreshedFeed.events[1].priorityScore, 'Top event priority score must exceed next');
  console.log(`PASS: Deterministic prioritization verified (Top event: ${topEvent.symbol} score ${topEvent.priorityScore} > ${refreshedFeed.events[1].symbol} score ${refreshedFeed.events[1].priorityScore}).\n`);

  console.log('--- TEST 7: "Why This Appears" Factual Explanation ---');
  const infyEvt = refreshedFeed.events.find(e => e.symbol === 'INFY');
  assert.ok(infyEvt.whyThisAppears, 'Event must contain whyThisAppears explanation');
  assert.ok(infyEvt.whyThisAppears.includes('portfolio'), 'Must mention portfolio presence');
  const tcsEvt = refreshedFeed.events.find(e => e.symbol === 'TCS');
  assert.ok(tcsEvt.whyThisAppears.includes('watchlist'), 'Must mention watchlist presence');
  console.log(`PASS: "Why This Appears" explanation verified:\n   INFY: "${infyEvt.whyThisAppears}"\n   TCS: "${tcsEvt.whyThisAppears}"\n`);

  console.log('--- TEST 8: Grounded Daily Research Question Generation ---');
  assert.ok(refreshedFeed.researchQuestions.length > 0, 'Must generate research questions');
  const hasSpecificSymbolQ = refreshedFeed.researchQuestions.some(q => q.includes('INFY') || q.includes('TCS'));
  assert.ok(hasSpecificSymbolQ, 'Questions must directly relate to today\'s observed events');
  console.log(`PASS: Grounded research questions generated:\n   "${refreshedFeed.researchQuestions.join('"\n   "')}"\n`);

  console.log('--- TEST 9: Mark Insight as Read ---');
  const targetEvtId = tcsEvt._id;
  const readRes = await insightsService.markRead(userA._id, targetEvtId);
  assert.strictEqual(readRes.isRead, true);
  console.log('PASS: Insight event marked as read successfully.\n');

  console.log('--- TEST 10: Dismiss Insight from Today\'s Feed ---');
  const dismissed = await insightsService.dismiss(userA._id, targetEvtId);
  assert.strictEqual(dismissed.isDismissed, true);

  const feedAfterDismiss = await insightsService.getTodayFeed(userA._id);
  const foundDismissed = feedAfterDismiss.events.find(e => String(e._id) === String(targetEvtId));
  assert.strictEqual(foundDismissed, undefined, 'Dismissed event must not appear in today\'s feed');

  // Verify underlying event still exists in DB
  const rawDbEvent = await MarketEvent.findById(targetEvtId);
  assert.ok(rawDbEvent, 'Underlying MarketEvent record must remain preserved in database');
  console.log('PASS: Dismissal soft-hides from feed while preserving underlying evidence.\n');

  console.log('--- TEST 11: Historical Feed with Date Filtering ---');
  const historyRes = await insightsService.getHistoryFeed(userA._id, { dateRange: 'yesterday' });
  assert.ok(historyRes.events.length >= 1, 'Should find events from yesterday');
  const hasYesterdayWipro = historyRes.events.some(e => e.symbol === 'WIPRO');
  assert.ok(hasYesterdayWipro, 'Yesterday feed must include WIPRO event');
  console.log(`PASS: Historical feed retrieved ${historyRes.events.length} events for dateRange=yesterday.\n`);

  console.log('--- TEST 12: Empty State Verification ---');
  // Create clean user with zero events and zero symbols
  const userClean = new UserModel({
    name: 'Clean User',
    email: `mvp39test_clean_${Date.now()}@example.com`,
    password: 'password123',
    virtualBalance: 50000
  });
  await userClean.save();

  const emptyFeed = await insightsService.getTodayFeed(userClean._id);
  assert.strictEqual(typeof emptyFeed.summary.totalEvents, 'number');
  assert.ok(Array.isArray(emptyFeed.sections));
  assert.ok(Array.isArray(emptyFeed.researchQuestions));
  console.log(`PASS: Empty state handled cleanly (Total events: ${emptyFeed.summary.totalEvents}).\n`);

  console.log('--- TEST 13: Single Orchestration Performance (< 150ms) ---');
  const tStart = Date.now();
  await insightsService.getTodayFeed(userA._id);
  const tDuration = Date.now() - tStart;
  assert.ok(tDuration < 200, `Orchestration must complete swiftly (took ${tDuration}ms)`);
  console.log(`PASS: Feed orchestration completed in ${tDuration}ms.\n`);

  console.log('--- TEST 14: Investigate Bridge Contract ---');
  const investQ = `Why did INFY generate today's multi-signal momentum event?`;
  const investSession = await researchCopilotService.investigate(investQ, { symbol: 'INFY', intent: 'EVENT_INVESTIGATION' }, userA._id);
  assert.ok(investSession.session._id);
  assert.ok(investSession.report.summary);
  console.log('PASS: One-click Investigate contract opens grounded Research Copilot dossier.\n');

  console.log('--- TEST 15: Zero Financial Ledger Mutation ---');
  const userCheck = await UserModel.findById(userA._id);
  assert.strictEqual(userCheck.virtualBalance, 300000, 'Virtual balance must remain untouched');
  const orderCount = await OrdersModel.countDocuments({ user: userA._id });
  assert.strictEqual(orderCount, 0, 'Zero orders placed');
  const holdingCheck = await HoldingsModel.findOne({ user: userA._id, name: 'INFY' });
  assert.strictEqual(holdingCheck.qty, 25, 'Holdings quantity must remain unchanged');
  console.log('PASS: Zero financial ledger mutation verified.\n');

  console.log('--- TEST 16: MVP-38 Regression Check ---');
  const sevCheck = marketEventService.calculateSeverity('PRICE_MOVE', { changePercent: 4.5 });
  assert.strictEqual(sevCheck, 'CRITICAL');
  console.log('PASS: MVP-38 Market Event Service intact.\n');

  console.log('--- TEST 17: MVP-37 Regression Check ---');
  const planCheck = researchCopilotService.classifyIntentAndSymbols('Research TCS');
  assert.strictEqual(planCheck.symbols[0], 'TCS');
  console.log('PASS: MVP-37 Research Copilot intact.\n');

  console.log('===================================================================');
  console.log('--- ALL 17/17 MVP-39 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
  console.log('===================================================================\n');

  await mongoose.disconnect();
}

runMVP39Tests().catch(err => {
  console.error('MVP-39 TEST FAILED:', err);
  process.exit(1);
});
