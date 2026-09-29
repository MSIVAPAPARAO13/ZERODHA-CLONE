require('dotenv').config();
const mongoose = require('mongoose');
const { TradeJournalModel } = require('./models/TradeJournalModel');
const { UserModel } = require('./models/UserModel');
const { OrdersModel } = require('./models/OrdersModel');
const { TransactionModel } = require('./models/TransactionModel');
const tradeReplayService = require('./services/tradeReplayService');

async function runTests() {
  console.log('--- Starting MVP-10 Trade Replay Tests ---');
  
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tradeflow_test');
  
  // Clean up
  await UserModel.deleteMany({ email: /replaytest/ });
  await OrdersModel.deleteMany({});
  await TransactionModel.deleteMany({});
  await TradeJournalModel.deleteMany({});
  
  // Create User
  const userA = new UserModel({
    name: 'Replay A',
    email: 'replaytestA@example.com',
    password: 'hashed',
    virtualBalance: 100000
  });
  await userA.save();

  const userB = new UserModel({
    name: 'Replay B',
    email: 'replaytestB@example.com',
    password: 'hashed',
    virtualBalance: 100000
  });
  await userB.save();

  // Create an Order & Transaction
  const order = new OrdersModel({
    name: 'TCS',
    qty: 10,
    price: 3500,
    mode: 'BUY',
    user: userA._id
  });
  await order.save();

  const entryTime = new Date('2023-01-01T10:00:00Z');
  
  const tx = new TransactionModel({
    user: userA._id,
    type: 'BUY',
    symbol: 'TCS',
    quantity: 10,
    price: 3500,
    amount: 35000,
    balanceBefore: 100000,
    balanceAfter: 65000,
    order: order._id,
    createdAt: entryTime
  });
  await tx.save();

  // Create Journal
  const journal = new TradeJournalModel({
    user: userA._id,
    order: order._id,
    symbol: 'TCS',
    side: 'BUY',
    strategy: 'MOMENTUM',
    targetPrice: 3700,
    riskPrice: 3400,
    entryPrice: 3500,
    quantity: 10,
    createdAt: entryTime
  });
  await journal.save();

  console.log('Testing OPEN Replay...');
  const replayOpen = await tradeReplayService.getReplay(journal._id, userA._id);
  
  if (replayOpen.outcome.status === 'OPEN') {
      console.log('SUCCESS: Correctly identified as OPEN.');
  } else {
      console.error('FAIL: Status should be OPEN, got', replayOpen.outcome.status);
  }

  console.log('Testing CLOSED Replay with FIFO...');
  // Add a SELL transaction
  const exitTime = new Date('2023-01-10T10:00:00Z');
  const txSell = new TransactionModel({
    user: userA._id,
    type: 'SELL',
    symbol: 'TCS',
    quantity: 10,
    price: 3600,
    amount: 36000,
    balanceBefore: 65000,
    balanceAfter: 101000,
    createdAt: exitTime
  });
  await txSell.save();

  const replayClosed = await tradeReplayService.getReplay(journal._id, userA._id);
  if (replayClosed.outcome.status === 'CLOSED') {
      console.log('SUCCESS: Correctly identified as CLOSED.');
      if (replayClosed.outcome.realizedPnl === 1000) {
          console.log('SUCCESS: Realized P&L calculated accurately.');
      } else {
          console.error('FAIL: Incorrect Realized P&L', replayClosed.outcome.realizedPnl);
      }
      if (replayClosed.outcome.holdingDurationDays === 9) {
          console.log('SUCCESS: Holding duration accurately computed.');
      } else {
          console.error('FAIL: Incorrect holding duration', replayClosed.outcome.holdingDurationDays);
      }
  } else {
      console.error('FAIL: Status should be CLOSED, got', replayClosed.outcome.status);
  }

  console.log('Testing User Isolation...');
  try {
      await tradeReplayService.getReplay(journal._id, userB._id);
      console.error('FAIL: User B was able to access User A replay.');
  } catch(err) {
      if (err.message === 'Journal not found') {
          console.log('SUCCESS: User B prevented from accessing User A replay.');
      } else {
          console.error('FAIL:', err);
      }
  }

  console.log('\nALL MVP-10 TESTS COMPLETED!');
  process.exit(0);
}

runTests();
