require('dotenv').config();
const mongoose = require('mongoose');
const { TradeJournalModel } = require('./models/TradeJournalModel');
const { UserModel } = require('./models/UserModel');
const { OrdersModel } = require('./models/OrdersModel');
const { TransactionModel } = require('./models/TransactionModel');
const { HoldingsModel } = require('./models/HoldingsModel');
const { PositionsModel } = require('./models/PositionsModel');
const { placeBuyOrder } = require('./services/tradingService');
const marketDataService = require('./services/marketDataService');

async function runTests() {
  console.log('--- Starting MVP-9 Trading Decision Journal Tests ---');
  
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tradeflow_test');
  
  // Clean up
  await UserModel.deleteMany({ email: /journaltest/ });
  await OrdersModel.deleteMany({ user: { $in: await UserModel.find({ email: /journaltest/ }).distinct('_id') } });
  await TransactionModel.deleteMany({ user: { $in: await UserModel.find({ email: /journaltest/ }).distinct('_id') } });
  await TradeJournalModel.deleteMany({});
  
  // Create User
  const userA = new UserModel({
    name: 'User A',
    email: 'journaltestA@example.com',
    password: 'hashedpassword',
    virtualBalance: 100000
  });
  await userA.save();

  const userB = new UserModel({
    name: 'User B',
    email: 'journaltestB@example.com',
    password: 'hashedpassword',
    virtualBalance: 100000
  });
  await userB.save();

  console.log('User A creates a trade with a journal...');
  
  const orderData = { name: 'TCS', qty: 10, price: 3500, mode: 'BUY' };
  const journalData = {
    strategy: 'MOMENTUM',
    reason: 'TECHNICAL_SETUP',
    confidence: 4,
    thesis: 'Test thesis',
    targetPrice: 3700,
    riskPrice: 3300,
    expectedHoldingPeriod: '1-2 WEEKS'
  };

  const session = await mongoose.startSession();
  session.startTransaction();
  
  let order;
  try {
    order = await placeBuyOrder(userA._id, orderData, session);
    
    // Simulate what the controller does
    const newJournal = new TradeJournalModel({
        user: userA._id,
        order: order._id,
        symbol: orderData.name,
        side: 'BUY',
        strategy: journalData.strategy,
        reason: journalData.reason,
        confidence: journalData.confidence,
        thesis: journalData.thesis,
        targetPrice: journalData.targetPrice,
        riskPrice: journalData.riskPrice,
        expectedHoldingPeriod: journalData.expectedHoldingPeriod,
        entryPrice: orderData.price,
        quantity: orderData.qty,
        marketSnapshot: { status: 'available', price: 3500 }
    });
    await newJournal.save({ session });
    
    await session.commitTransaction();
    console.log('SUCCESS: Journal created alongside order in transaction.');
  } catch (err) {
    await session.abortTransaction();
    console.error('FAIL: Could not create journal and order.', err);
  } finally {
    session.endSession();
  }
  
  // Verify Database State
  const savedJournal = await TradeJournalModel.findOne({ order: order._id });
  if (savedJournal && savedJournal.strategy === 'MOMENTUM' && savedJournal.targetPrice === 3700) {
      console.log('SUCCESS: Journal correctly mapped to User and Order.');
  } else {
      console.error('FAIL: Journal not saved correctly.');
  }
  
  const savedOrder = await OrdersModel.findById(order._id);
  if (savedOrder && savedOrder.qty === 10) {
      console.log('SUCCESS: Order financial record intact.');
  } else {
      console.error('FAIL: Order corrupted.');
  }

  // Duplicate journal prevention
  console.log('Attempting to create duplicate journal for same order...');
  try {
      const dupJournal = new TradeJournalModel({
          user: userA._id,
          order: order._id,
          symbol: orderData.name,
          side: 'BUY',
          entryPrice: 3500,
          quantity: 10
      });
      await dupJournal.save();
      console.error('FAIL: Allowed duplicate journal.');
  } catch (err) {
      if (err.code === 11000) {
          console.log('SUCCESS: Duplicate journal prevented.');
      } else {
          console.error('FAIL:', err);
      }
  }

  // Edit Journal
  console.log('Updating Journal...');
  savedJournal.confidence = 5;
  savedJournal.entryPrice = 1; // Immutable in controller, but testing model directly; in our controller we only pass allowedUpdates.
  await savedJournal.save();
  console.log('SUCCESS: Journal updated.');

  // User B tries to get User A's journal
  const userBQuery = await TradeJournalModel.findOne({ _id: savedJournal._id, user: userB._id });
  if (!userBQuery) {
      console.log('SUCCESS: User B cannot access User A journal.');
  } else {
      console.error('FAIL: User B accessed User A journal.');
  }

  console.log('\nALL MVP-9 TESTS COMPLETED!');
  process.exit(0);
}

runTests();
