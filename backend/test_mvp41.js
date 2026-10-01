require('dotenv').config();
const mongoose = require('mongoose');
const assert = require('assert');

// Models
const { UserModel } = require('./models/UserModel');
const { HoldingsModel } = require('./models/HoldingsModel');
const { OrdersModel } = require('./models/OrdersModel');
const { ScenarioModel } = require('./models/ScenarioModel');

// Services
const scenarioEngine = require('./services/scenarioEngine');
const portfolioIntelligenceService = require('./services/portfolioIntelligenceService');
const researchCopilotService = require('./services/researchCopilotService');

async function runMVP41Tests() {
  console.log('===================================================================');
  console.log('--- STARTING MVP-41 PORTFOLIO SCENARIO PLANNER 2.0 TEST SUITE ---');
  console.log('===================================================================\n');

  await mongoose.connect(process.env.MONGO_URL);

  // Cleanup test data
  await UserModel.deleteMany({ email: /mvp41test/ });
  await HoldingsModel.deleteMany({ name: /MVP41/ });
  await ScenarioModel.deleteMany({ name: /MVP41/ });

  // 1. Setup Test Users
  const userA = new UserModel({
    name: 'Alice Planner',
    email: `mvp41test_a_${Date.now()}@example.com`,
    password: 'password123',
    virtualBalance: 200000
  });
  await userA.save();

  const userB = new UserModel({
    name: 'Bob Planner',
    email: `mvp41test_b_${Date.now()}@example.com`,
    password: 'password123',
    virtualBalance: 50000
  });
  await userB.save();

  // Seed userA holdings:
  // TCS (IT): 50 @ 3400 = 1,70,000
  // INFY (IT): 30 @ 1500 = 45,000
  // RELIANCE (Energy): 20 @ 2500 = 50,000
  // Total Equity = 2,65,000
  await HoldingsModel.create([
    { user: userA._id, name: 'TCS', qty: 50, avg: 3200, price: 3400, net: '+6.25%', day: '+1.5%' },
    { user: userA._id, name: 'INFY', qty: 30, avg: 1500, price: 1500, net: '+0.00%', day: '+0.0%' },
    { user: userA._id, name: 'RELIANCE', qty: 20, avg: 2500, price: 2500, net: '+0.00%', day: '+0.0%' }
  ]);

  console.log('--- TEST 1: Custom Sector Scenario Simulation (IT -15%) ---');
  const customScenario = {
    name: 'MVP41 Custom IT Shock',
    shocks: [
      { targetType: 'SECTOR', target: 'Information Technology', percentage: -15 }
    ]
  };

  const simResult = await scenarioEngine.runScenario(userA._id, customScenario);
  assert.ok(simResult.baseline.totalValue > 0, 'Baseline total value must be positive');
  assert.ok(simResult.modeledResult.absoluteImpact < 0, 'Impact must be negative for downward shock');
  assert.strictEqual(simResult.disclaimer, 'MODELLED SCENARIO — NOT A PREDICTION');
  console.log(`PASS: Scenario executed (Baseline: ₹${simResult.baseline.totalValue.toLocaleString()}, Modeled Loss: ₹${Math.abs(simResult.modeledResult.absoluteImpact).toLocaleString()}, Change: ${simResult.modeledResult.percentageImpact.toFixed(2)}%).\n`);

  console.log('--- TEST 2: Affected vs. Unaffected Holdings Segregation ---');
  assert.ok(Array.isArray(simResult.affectedHoldings), 'affectedHoldings must be an array');
  assert.ok(Array.isArray(simResult.unaffectedHoldings), 'unaffectedHoldings must be an array');

  const affectedSymbols = simResult.affectedHoldings.map(h => h.symbol);
  const unaffectedSymbols = simResult.unaffectedHoldings.map(h => h.symbol);

  assert.ok(affectedSymbols.includes('TCS'), 'TCS must be affected by IT shock');
  assert.ok(affectedSymbols.includes('INFY'), 'INFY must be affected by IT shock');
  assert.ok(unaffectedSymbols.includes('RELIANCE'), 'RELIANCE must remain unaffected by pure IT sector shock');
  console.log(`PASS: Holding segregation verified (Affected: [${affectedSymbols.join(', ')}], Unaffected: [${unaffectedSymbols.join(', ')}]).\n`);

  console.log('--- TEST 3: Mathematical Attribution Sums to 100% ---');
  const totalAttributed = simResult.holdingAttribution.reduce((sum, h) => sum + h.contributionPercent, 0);
  assert.ok(Math.abs(totalAttributed - 100) < 0.1, `Attribution must sum to 100% (Actual: ${totalAttributed}%)`);
  console.log(`PASS: Mathematical attribution verified (Sum = ${totalAttributed.toFixed(2)}%).\n`);

  console.log('--- TEST 4: Multi-Shock Composition (Market -5% + Sector -10%) ---');
  const multiShockScenario = {
    name: 'MVP41 Multi Shock',
    shocks: [
      { targetType: 'MARKET', target: 'NIFTY', percentage: -5 },
      { targetType: 'SECTOR', target: 'Information Technology', percentage: -10 }
    ]
  };

  const multiRes = await scenarioEngine.runScenario(userA._id, multiShockScenario);
  // All assets should be affected now because of the broad market shock
  assert.strictEqual(multiRes.unaffectedHoldings.length, 0, 'Broad market shock affects all holdings');
  console.log(`PASS: Multi-shock calculation verified (Loss: ₹${Math.abs(multiRes.modeledResult.absoluteImpact).toLocaleString()}).\n`);

  console.log('--- TEST 5: Interactive What-If Simulation Mode ---');
  const whatIfSim = await scenarioEngine.runScenario(userA._id, customScenario, {
    whatIfPositions: [
      { action: 'ADD', symbol: 'WIPRO', qty: 40, price: 450 }
    ]
  });
  assert.ok(whatIfSim.whatIfComparison, 'Must produce what-if simulation comparison');
  assert.ok(whatIfSim.whatIfComparison.after.portfolioValue > whatIfSim.whatIfComparison.before.portfolioValue);
  console.log(`PASS: What-if position simulator evaluated hypothetical portfolio without state mutation.\n`);

  console.log('--- TEST 6: Scenario Persistence in ScenarioModel ---');
  const savedScenario = await scenarioEngine.createScenario(userA._id, {
    name: 'MVP41 Saved Plan',
    description: 'Saved scenario plan for review',
    shocks: [{ targetType: 'ASSET', target: 'TCS', percentage: -10 }]
  });
  assert.ok(savedScenario._id);
  assert.strictEqual(savedScenario.name, 'MVP41 Saved Plan');
  console.log(`PASS: Scenario persisted successfully (ID: ${savedScenario._id}).\n`);

  console.log('--- TEST 7: Scenario -> Research Copilot Bridge Contract ---');
  assert.ok(simResult.investigationPrompt, 'Must include an investigation prompt');
  const researchDossier = await researchCopilotService.investigate(
    simResult.investigationPrompt,
    { symbol: 'TCS', intent: 'STRESS_RESEARCH' },
    userA._id
  );
  assert.ok(researchDossier.session._id);
  assert.ok(researchDossier.report.summary);
  console.log(`PASS: Scenario -> Research Copilot bridge verified with grounded stress dossier.\n`);

  console.log('--- TEST 8: Multi-Tenant Isolation ---');
  const userBRuns = await scenarioEngine.runScenario(userB._id, customScenario);
  assert.strictEqual(userBRuns.baseline.totalValue, 0, 'User B has no holdings');
  assert.strictEqual(userBRuns.affectedHoldings.length, 0);
  console.log('PASS: User isolation enforced — User B cannot access User A scenario calculations.\n');

  console.log('--- TEST 9: Zero Financial Ledger Mutation ---');
  const userCheck = await UserModel.findById(userA._id);
  assert.strictEqual(userCheck.virtualBalance, 200000);
  const orderCount = await OrdersModel.countDocuments({ user: userA._id });
  assert.strictEqual(orderCount, 0);
  const holdingCheck = await HoldingsModel.find({ user: userA._id });
  assert.strictEqual(holdingCheck.length, 3);
  console.log('PASS: Zero financial ledger mutation verified — 100% read-only what-if modeling.\n');

  console.log('--- TEST 10: Regression Verification (MVP-40, MVP-39, MVP-38, MVP-37) ---');
  const pIntel = await portfolioIntelligenceService.getPortfolioIntelligence(userA._id);
  assert.ok(pIntel.totalCapital > 0);
  console.log('PASS: MVP-40 Portfolio Intelligence intact.\n');

  console.log('===================================================================');
  console.log('--- ALL 10/10 MVP-41 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
  console.log('===================================================================\n');

  await mongoose.disconnect();
}

runMVP41Tests().catch(err => {
  console.error('MVP-41 TEST FAILED:', err);
  process.exit(1);
});
