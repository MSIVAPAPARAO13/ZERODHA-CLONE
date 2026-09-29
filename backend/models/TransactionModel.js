const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL'] },
  symbol: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, { timestamps: true });

const TransactionModel = mongoose.model('Transaction', TransactionSchema);

module.exports = { TransactionModel };
