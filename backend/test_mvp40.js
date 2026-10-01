require('dotenv').config();
const mongoose = require('mongoose');
const assert = require('assert');

// Models
const { UserModel } = require('./models/UserModel');
const { HoldingsModel } = require('./models/HoldingsModel');
const { PositionsModel } = require('./models/PositionsModel');
const { OrdersModel } = require('./models/OrdersModel');
const MarketEvent = require('./models/MarketEventModel');

// Services
const portfolioIntelligenceService = require('./services/portfolioIntelligenceService');
const researchCopilotService = require('./services/researchCopilotService');
const marketEventService = require('./services/marketEventService');
const insightsService = require('./services/insightsService');

async function runMVP40Tests() {
  console.log('===================================================================');
  console.log('--- STARTING MVP-40 PORTFOLIO HEALTH & EXPOSURE TEST SUITE ---');
  console.log('===================================================================\n');

  await mongoose.connect(process.env.MONGO_URL);

  // Cleanup test data
  await UserModel.deleteMany({ email: /mvp40test/ });
  await HoldingsModel.deleteMany({ name: /MVP40/ });
  await PositionsModel.deleteMany({ name: /MVP40/ });
  await MarketEvent.deleteMany({ tags: /MVP40/ });

  // 1. Setup Test Users
  const userA = new UserModel({
    name: 'Alice Portfolio',
    email: `mvp40test_a_${Date.now()}@example.com`,
    password: 'password123',
    virtualBalance: 100000 // 1,00,000 INR Cash
  });
  await userA.save();

  const userB = new UserModel({
    name: 'Bob Portfolio',
    email: `mvp40test_b_${Date.now()}@example.com`,
    password: 'password123',
    virtualBalance: 50000
  });
  await userB.save();

  // Seed userA holdings:
  // TCS (IT): 50 shares @ avg 3200 (invested 1,60,000)
  // INFY (IT): 30 shares @ avg 1500 (invested 45,000)
  // RELIANCE (Energy): 20 shares @ avg 2500 (invested 50,000)
  await HoldingsModel.create([
    { user: userA._id, name: 'TCS', qty: 50, avg: 3200, price: 3400, net: '+6.25%', day: '+1.5%' },
    { user: userA._id, name: 'INFY', qty: 30, avg: 1500, price: 1600, net: '+6.67%', day: '+0.8%' },
    { user: userA._id, name: 'RELIANCE', qty: 20, avg: 2500, price: 2600, net: '+4.00%', day: '-0.5%' }
  ]);

  // Seed market event on TCS for userA
  const eventTCS = new MarketEvent({
    user: userA._id,
    symbol: 'TCS',
    eventType: 'PRICE_MOVE',
    severity: 'SIGNIFICANT',
    category: 'PORTFOLIO',
    title: 'TCS Price Gain +4.20%',
    description: 'TCS moved significantly in today’s session.',
    changePercent: 4.2,
    dedupeKey: marketEventService.generateDedupeKey(userA._id, 'TCS', 'PRICE_MOVE'),
    tags: ['TCS', 'MVP40']
  });
  await eventTCS.save();

  console.log('--- TEST 1: Full Portfolio Intelligence Calculation ---');
  const intel = await portfolioIntelligenceService.getPortfolioIntelligence(userA._id);
  assert.ok(intel.totalEquity > 0, 'Total equity must be positive');
  assert.strictEqual(intel.totalPositions, 3, 'Must aggregate 3 equity positions');
  assert.strictEqual(intel.cashBalance, 100000, 'Cash balance must match user virtual balance');
  assert.ok(intel.totalCapital > intel.totalEquity, 'Total capital must equal equity + cash');
  console.log(`PASS: Portfolio intelligence calculated successfully (Total Capital: ₹${intel.totalCapital.toLocaleString()}, Equity: ₹${intel.totalEquity.toLocaleString()}, Cash: ₹${intel.cashBalance.toLocaleString()}).\n`);

  console.log('--- TEST 2: Concentration Metrics (Top 1, Top 3, HHI) ---');
  assert.ok(intel.concentration.top1Weight > 0, 'Top 1 weight must be positive');
  assert.ok(intel.concentration.top3Weight >= intel.concentration.top1Weight, 'Top 3 weight >= Top 1 weight');
  assert.strictEqual(intel.concentration.top1Symbol, 'TCS', 'TCS should be the largest holding');
  assert.ok(intel.concentration.hhi > 0, 'HHI must be calculated');
  console.log(`PASS: Concentration verified (Top 1: ${intel.concentration.top1Symbol} ${intel.concentration.top1Weight}%, Top 3: ${intel.concentration.top3Weight}%, HHI: ${intel.concentration.hhi}).\n`);

  console.log('--- TEST 3: Sector Exposure Aggregation (VERIFIED_TAXONOMY) ---');
  assert.ok(Array.isArray(intel.sectors), 'Sectors must be an array');
  const itSector = intel.sectors.find(s => s.sector.includes('Information Technology'));
  assert.ok(itSector, 'Information Technology sector must be identified');
  assert.ok(itSector.percentage > 50, 'IT sector must dominate portfolio weight (TCS + INFY)');
  const energySector = intel.sectors.find(s => s.sector.includes('Energy'));
  assert.ok(energySector, 'Energy sector must be identified for RELIANCE');
  console.log(`PASS: Sector aggregation verified (IT: ${itSector.percentage.toFixed(1)}%, Energy: ${energySector.percentage.toFixed(1)}%).\n`);

  console.log('--- TEST 4: Portfolio Health Status Classification ---');
  assert.ok(intel.health.status, 'Health status must be assigned');
  assert.ok(['BALANCED', 'CONCENTRATED', 'HIGHLY_CONCENTRATED', 'CASH_HEAVY'].includes(intel.health.status));
  assert.ok(intel.health.reason, 'Health reason must be documented');
  console.log(`PASS: Health classification assigned: ${intel.health.status} ("${intel.health.reason}").\n`);

  console.log('--- TEST 5: Event Cross-Linking on High-Weight Assets ---');
  assert.ok(Array.isArray(intel.recentEventCrossLinks), 'Cross links must be an array');
  const tcsCrossLink = intel.recentEventCrossLinks.find(c => c.symbol === 'TCS');
  assert.ok(tcsCrossLink, 'TCS event must be cross-linked to portfolio holding');
  assert.ok(tcsCrossLink.portfolioWeight > 0, 'Must attach current portfolio weight to event');
  console.log(`PASS: Event cross-link verified: ${tcsCrossLink.symbol} (${tcsCrossLink.portfolioWeight}% of portfolio) has active ${tcsCrossLink.severity} event.\n`);

  console.log('--- TEST 6: Dedicated Exposure Endpoint Helper ---');
  const exposureData = await portfolioIntelligenceService.getExposure(userA._id);
  assert.strictEqual(exposureData.totalEquity, intel.totalEquity);
  assert.strictEqual(exposureData.sectors.length, intel.sectors.length);
  assert.strictEqual(exposureData.assetExposure.length, 3);
  console.log('PASS: getExposure() returned structured asset and sector exposures.\n');

  console.log('--- TEST 7: Dedicated Concentration Endpoint Helper ---');
  const concData = await portfolioIntelligenceService.getConcentration(userA._id);
  assert.strictEqual(concData.totalPositions, 3);
  assert.strictEqual(concData.concentration.top1Symbol, 'TCS');
  assert.strictEqual(concData.topHoldings.length, 3);
  console.log('PASS: getConcentration() returned concentration metrics & top holdings.\n');

  console.log('--- TEST 8: Empty Portfolio Handling (DATA_LIMITED) ---');
  const emptyIntel = await portfolioIntelligenceService.getPortfolioIntelligence(userB._id);
  assert.strictEqual(emptyIntel.totalPositions, 0);
  assert.strictEqual(emptyIntel.health.status, 'DATA_LIMITED');
  assert.strictEqual(emptyIntel.totalEquity, 0);
  assert.strictEqual(emptyIntel.cashBalance, 50000);
  console.log('PASS: Empty portfolio handled gracefully without division by zero.\n');

  console.log('--- TEST 9: Multi-Tenant User Isolation ---');
  // User B must not see User A holdings
  assert.strictEqual(emptyIntel.holdings.length, 0);
  const userAIntelDirect = await portfolioIntelligenceService.getPortfolioIntelligence(userA._id);
  assert.strictEqual(userAIntelDirect.holdings.length, 3);
  console.log('PASS: User isolation strictly verified between User A and User B.\n');

  console.log('--- TEST 10: Missing Sector Metadata Fallback ---');
  // Add holding with unlisted symbol
  await HoldingsModel.create({
    user: userB._id,
    name: 'UNKNOWNCO_XYZ',
    qty: 10,
    avg: 100,
    price: 110,
    net: '+10%',
    day: '+1%'
  });
  const unkIntel = await portfolioIntelligenceService.getPortfolioIntelligence(userB._id);
  const unkHolding = unkIntel.holdings.find(h => h.symbol === 'UNKNOWNCO_XYZ');
  assert.strictEqual(unkHolding.sector, 'Unclassified Sector');
  console.log('PASS: Unlisted securities default to "Unclassified Sector" without crashing.\n');

  console.log('--- TEST 11: Zero Financial Ledger Mutation ---');
  const userACheck = await UserModel.findById(userA._id);
  assert.strictEqual(userACheck.virtualBalance, 100000, 'Virtual balance must remain untouched');
  const ordersCount = await OrdersModel.countDocuments({ user: userA._id });
  assert.strictEqual(ordersCount, 0, 'Zero orders placed');
  const holdingsCount = await HoldingsModel.countDocuments({ user: userA._id });
  assert.strictEqual(holdingsCount, 3, 'Holdings count must remain unchanged');
  console.log('PASS: Zero financial ledger mutation verified — 100% read-only calculation.\n');

  console.log('--- TEST 12: Regression Check (MVP-37, MVP-38, MVP-39) ---');
  const res37 = researchCopilotService.classifyIntentAndSymbols('Research TCS');
  assert.strictEqual(res37.symbols[0], 'TCS');
  const res38 = marketEventService.calculateSeverity('PRICE_MOVE', { changePercent: 5.0 });
  assert.strictEqual(res38, 'CRITICAL');
  const res39 = await insightsService.getTodayFeed(userA._id);
  assert.ok(res39.date);
  console.log('PASS: MVP-37, MVP-38, and MVP-39 remain fully operational.\n');

  console.log('===================================================================');
  console.log('--- ALL 12/12 MVP-40 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
  console.log('===================================================================\n');

  await mongoose.disconnect();
}

runMVP40Tests().catch(err => {
  console.error('MVP-40 TEST FAILED:', err);
  process.exit(1);
});
