const { UserModel } = require('../models/UserModel');
const { TransactionModel } = require('../models/TransactionModel');

const getAccountBalance = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    
    // In a full app, we would calculate invested/portfolio values here too, but frontend usually does it for MVP
    res.json({ success: true, data: { virtualBalance: user.virtualBalance }, error: null });
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await TransactionModel.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: transactions, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAccountBalance, getTransactions };
