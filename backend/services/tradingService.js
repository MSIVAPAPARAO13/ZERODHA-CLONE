const mongoose = require('mongoose');
const { OrdersModel } = require('../models/OrdersModel');
const { HoldingsModel } = require('../models/HoldingsModel');
const { PositionsModel } = require('../models/PositionsModel');
const { UserModel } = require('../models/UserModel');
const { TransactionModel } = require('../models/TransactionModel');

const placeBuyOrder = async (userId, orderData, session) => {
  const { name, qty, price } = orderData;
  const numericQty = Number(qty);
  const numericPrice = Number(price);
  const orderValue = numericQty * numericPrice;

  // 1. Fetch user and check balance
  const user = await UserModel.findById(userId).session(session);
  if (!user) throw new Error('User not found');
  if (user.virtualBalance < orderValue) {
    throw new Error('Insufficient virtual balance');
  }

  // 2. Update balance
  const balanceBefore = user.virtualBalance;
  user.virtualBalance -= orderValue;
  await user.save({ session });
  const balanceAfter = user.virtualBalance;

  // 3. Create the order
  const newOrder = new OrdersModel({
    user: userId,
    name,
    qty: numericQty,
    price: numericPrice,
    mode: 'BUY',
  });
  await newOrder.save({ session });

  // 4. Create Transaction Record
  const newTx = new TransactionModel({
    user: userId,
    type: 'BUY',
    symbol: name,
    quantity: numericQty,
    price: numericPrice,
    amount: orderValue,
    balanceBefore,
    balanceAfter,
    order: newOrder._id
  });
  await newTx.save({ session });

  // 5. Update or Create Holding
  let holding = await HoldingsModel.findOne({ user: userId, name }).session(session);
  
  if (holding) {
    const oldQty = holding.qty;
    const oldAvg = holding.avg;
    const newQty = oldQty + numericQty;
    const newAvg = ((oldQty * oldAvg) + (numericQty * numericPrice)) / newQty;

    holding.qty = newQty;
    holding.avg = newAvg;
    holding.price = numericPrice;
    
    await holding.save({ session });
  } else {
    holding = new HoldingsModel({
      user: userId,
      name,
      qty: numericQty,
      avg: numericPrice,
      price: numericPrice,
      net: '+',
      day: '+',
      isLoss: false
    });
    await holding.save({ session });
  }

  // 6. Update or Create Position
  let position = await PositionsModel.findOne({ user: userId, name }).session(session);
  if (position) {
    const oldQty = position.qty;
    const oldAvg = position.avg;
    const newQty = oldQty + numericQty;
    const newAvg = ((oldQty * oldAvg) + (numericQty * numericPrice)) / newQty;

    position.qty = newQty;
    position.avg = newAvg;
    position.price = numericPrice;
    await position.save({ session });
  } else {
    position = new PositionsModel({
      user: userId,
      product: 'CNC',
      name,
      qty: numericQty,
      avg: numericPrice,
      price: numericPrice,
      net: '+',
      day: '+',
      isLoss: false
    });
    await position.save({ session });
  }

  return newOrder;
};

const placeSellOrder = async (userId, orderData, session) => {
  const { name, qty, price } = orderData;
  const numericQty = Number(qty);
  const numericPrice = Number(price);
  const orderValue = numericQty * numericPrice;

  // 1. Check existing holding
  const holding = await HoldingsModel.findOne({ user: userId, name }).session(session);
  if (!holding || holding.qty < numericQty) {
    throw new Error('Insufficient quantity to sell');
  }

  // 2. Fetch User
  const user = await UserModel.findById(userId).session(session);
  if (!user) throw new Error('User not found');

  const balanceBefore = user.virtualBalance;
  user.virtualBalance += orderValue;
  await user.save({ session });
  const balanceAfter = user.virtualBalance;

  // 3. Create the order
  const newOrder = new OrdersModel({
    user: userId,
    name,
    qty: numericQty,
    price: numericPrice,
    mode: 'SELL',
  });
  await newOrder.save({ session });

  // 4. Create Transaction Record
  const newTx = new TransactionModel({
    user: userId,
    type: 'SELL',
    symbol: name,
    quantity: numericQty,
    price: numericPrice,
    amount: orderValue,
    balanceBefore,
    balanceAfter,
    order: newOrder._id
  });
  await newTx.save({ session });

  // 5. Update Holding
  holding.qty -= numericQty;
  if (holding.qty === 0) {
    await HoldingsModel.deleteOne({ _id: holding._id }).session(session);
  } else {
    await holding.save({ session });
  }

  // 6. Update Position
  const position = await PositionsModel.findOne({ user: userId, name }).session(session);
  if (position) {
    position.qty -= numericQty;
    if (position.qty === 0) {
      await PositionsModel.deleteOne({ _id: position._id }).session(session);
    } else {
      await position.save({ session });
    }
  }

  return newOrder;
};

module.exports = {
  placeBuyOrder,
  placeSellOrder
};
