const mongoose = require('mongoose');

const TradeJournalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['BUY', 'SELL'], required: true },
  
  strategy: { 
    type: String, 
    enum: ['MOMENTUM', 'BREAKOUT', 'VALUE', 'NEWS', 'TECHNICAL', 'TREND', 'REBALANCE', 'OTHER'],
    default: 'OTHER'
  },
  reason: { 
    type: String, 
    enum: ['EARNINGS', 'VALUATION', 'TECHNICAL_SETUP', 'NEWS', 'PORTFOLIO_REBALANCE', 'WATCHLIST_OPPORTUNITY', 'OTHER'],
    default: 'OTHER'
  },
  confidence: { type: Number, min: 1, max: 5 },
  thesis: { type: String },
  targetPrice: { type: Number, min: 0 },
  riskPrice: { type: Number, min: 0 },
  expectedHoldingPeriod: { 
    type: String, 
    enum: ['INTRADAY', '1-3 DAYS', '1-2 WEEKS', '1-3 MONTHS', 'LONG_TERM', 'UNSPECIFIED'],
    default: 'UNSPECIFIED'
  },

  entryPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },

  marketSnapshot: {
    price: Number,
    changePercent: Number,
    timestamp: Date,
    source: String,
    status: { type: String, enum: ['available', 'unavailable'] }
  },
  
  playbook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Playbook"
  },
  checklist: [{
    ruleText: String,
    followed: Boolean
  }],
  setup: {
    type: String,
    default: ""
  },
  evidence: [{
    type: String
  }],
  emotion: {
    type: String,
    enum: ['DISCIPLINED', 'FOMO', 'ANXIOUS', 'CONFIDENT', 'FRUSTRATED', 'NEUTRAL', ''],
    default: 'NEUTRAL'
  },
  mistake: {
    type: String,
    default: ""
  },
  executionNote: {
    type: String,
    default: ""
  },
  result: {
    pnl: { type: Number, default: 0 },
    pnlPercent: { type: Number, default: 0 },
    exitPrice: { type: Number, default: null },
    exitDate: { type: Date, default: null },
    status: { type: String, enum: ['OPEN', 'CLOSED', 'PARTIAL'], default: 'OPEN' }
  },
  lesson: {
    type: String,
    default: ""
  },
  researchSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResearchSession',
    default: null
  },
  reviewDate: {
    type: Date,
    default: null
  },
  isEarlyExit: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

TradeJournalSchema.index({ user: 1, createdAt: -1 });

const TradeJournalModel = mongoose.model('TradeJournal', TradeJournalSchema);

module.exports = { TradeJournalModel };
