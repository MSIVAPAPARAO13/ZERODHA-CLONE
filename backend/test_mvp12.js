require('dotenv').config();
const mongoose = require('mongoose');
const { UserModel } = require('./models/UserModel');
const { TradeJournalModel } = require('./models/TradeJournalModel');
const { TransactionModel } = require('./models/TransactionModel');
const { OrdersModel } = require('./models/OrdersModel');
const behaviorAnalyticsService = require('./services/behaviorAnalyticsService');

async function runTests() {
  console.log('--- Starting MVP-12 Behavioral Analytics Tests ---');
  
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tradeflow_test');
  
  // Clean up
  await UserModel.deleteMany({ email: /behaviortest/ });
  await OrdersModel.deleteMany({});
  await TransactionModel.deleteMany({});
  await TradeJournalModel.deleteMany({});
  
  // Create User
  const user = new UserModel({
    name: 'Behavior Test User',
    email: 'behaviortest@example.com',
    password: 'hashed',
    virtualBalance: 100000
  });
  await user.save();

  console.log('Testing Minimum Sample Protection (1 trade)...');
  
  // 1 Trade
  const order1 = new OrdersModel({ name: 'TCS', qty: 10, price: 3000, mode: 'BUY', user: user._id });
  await order1.save();
  const tx1 = new TransactionModel({ user: user._id, type: 'BUY', symbol: 'TCS', quantity: 10, price: 3000, amount: 30000, balanceBefore: 100000, balanceAfter: 70000, order: order1._id });
  await tx1.save();
  const j1 = new TradeJournalModel({ user: user._id, order: order1._id, symbol: 'TCS', side: 'BUY', strategy: 'MOMENTUM', targetPrice: 3200, riskPrice: 2900, entryPrice: 3000, quantity: 10 });
  await j1.save();

  let analytics = await behaviorAnalyticsService.getAnalytics(user._id, 'all');
  if (analytics.message && analytics.tradeCount === 1) {
      console.log('SUCCESS: Min sample protection passed for 1 trade.');
  } else {
      console.error('FAIL: Min sample protection failed.', analytics);
  }

  console.log('Adding more trades to cross threshold...');
  
  // Add 4 more trades to hit the 5 min threshold
  for(let i=0; i<4; i++) {
    const o = new OrdersModel({ name: 'INFY', qty: 10, price: 1500, mode: 'BUY', user: user._id });
    await o.save();
    const t = new TransactionModel({ user: user._id, type: 'BUY', symbol: 'INFY', quantity: 10, price: 1500, amount: 15000, balanceBefore: 100000, balanceAfter: 85000, order: o._id });
    await t.save();
    
    // Simulate missing risk to trigger a pattern
    const j = new TradeJournalModel({ user: user._id, order: o._id, symbol: 'INFY', side: 'BUY', strategy: 'MOMENTUM', targetPrice: 1600, entryPrice: 1500, quantity: 10, confidence: 4, thesis: 'Testing' });
    await j.save();
  }

  analytics = await behaviorAnalyticsService.getAnalytics(user._id, 'all');
  if (analytics.summary && analytics.tradeCount === 5) {
      console.log('SUCCESS: Analytics unlocked at 5 trades.');
      
      const noRiskPattern = analytics.patterns.find(p => p.type === 'TARGET_WITHOUT_RISK');
      if (noRiskPattern) {
          console.log('SUCCESS: Detected TARGET_WITHOUT_RISK pattern.');
      } else {
          console.error('FAIL: Did not detect expected TARGET_WITHOUT_RISK pattern.');
      }

      if (analytics.dataQuality.target === '100.0%') {
          console.log('SUCCESS: Data quality target calculation correct.');
      } else {
          console.error('FAIL: Data quality target incorrect.', analytics.dataQuality.target);
      }
      
      if (analytics.strategyStats.length === 1 && analytics.strategyStats[0].strategy === 'MOMENTUM' && analytics.strategyStats[0].trades === 5) {
          console.log('SUCCESS: Strategy aggregation correct.');
      } else {
          console.error('FAIL: Strategy aggregation incorrect.', analytics.strategyStats);
      }
  } else {
      console.error('FAIL: Analytics did not unlock at 5 trades.', analytics);
  }

  console.log('\nALL MVP-12 TESTS COMPLETED!');
  process.exit(0);
}

runTests();
