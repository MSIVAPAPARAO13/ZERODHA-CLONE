const { TradeJournalModel } = require('../models/TradeJournalModel');
const tradeReplayService = require('../services/tradeReplayService');

const getJournals = async (req, res, next) => {
  try {
    const query = { user: req.user.userId };
    if (req.query.symbol) query.symbol = req.query.symbol;
    if (req.query.side) query.side = req.query.side;
    if (req.query.strategy) query.strategy = req.query.strategy;
    
    const journals = await TradeJournalModel.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: journals, error: null });
  } catch (err) {
    next(err);
  }
};

const getJournalById = async (req, res, next) => {
  try {
    const journal = await TradeJournalModel.findOne({ _id: req.params.id, user: req.user.userId });
    if (!journal) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Journal not found' } });
    }
    res.json({ success: true, data: journal, error: null });
  } catch (err) {
    next(err);
  }
};

const updateJournal = async (req, res, next) => {
  try {
    // Only allow specific editable fields
    const allowedUpdates = ['strategy', 'reason', 'confidence', 'thesis', 'targetPrice', 'riskPrice', 'expectedHoldingPeriod'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    const journal = await TradeJournalModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!journal) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Journal not found' } });
    }
    
    res.json({ success: true, data: journal, error: null });
  } catch (err) {
    next(err);
  }
};

const deleteJournal = async (req, res, next) => {
  try {
    const journal = await TradeJournalModel.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!journal) {
      return res.status(404).json({ success: false, data: null, error: { message: 'Journal not found' } });
    }
    res.json({ success: true, data: null, error: null });
  } catch (err) {
    next(err);
  }
};

const getReplay = async (req, res, next) => {
  try {
    const replayData = await tradeReplayService.getReplay(req.params.id, req.user.userId);
    res.json({ success: true, data: replayData, error: null });
  } catch (err) {
    if (err.message === 'Journal not found' || err.message === 'Entry transaction not found') {
      return res.status(404).json({ success: false, data: null, error: { message: err.message } });
    }
    next(err);
  }
};

const journalIntelligenceService = require('../services/journalIntelligenceService');

const recordTradeReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const review = await journalIntelligenceService.recordTradeReview(userId, id, req.body);
    res.json({ success: true, data: review, error: null });
  } catch (err) {
    if (err.message === 'JOURNAL_ENTRY_NOT_FOUND') {
      return res.status(404).json({ success: false, data: null, error: { message: err.message } });
    }
    next(err);
  }
};

const getJournalPatterns = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const patterns = await journalIntelligenceService.detectJournalPatterns(userId);
    res.json({ success: true, data: patterns, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  getReplay,
  recordTradeReview,
  getJournalPatterns
};
