const { Schema, model } = require("mongoose");

const EntryRuleSchema = new Schema({
  indicator: {
    type: String,
    enum: ['SMA', 'EMA', 'RSI', 'PRICE_CHANGE', 'VOLUME_SMA', 'DONCHIAN_BREAKOUT'],
    required: true
  },
  params: {
    type: Schema.Types.Mixed,
    default: {}
  },
  condition: {
    type: String,
    enum: ['CROSS_ABOVE', 'CROSS_BELOW', 'GREATER_THAN', 'LESS_THAN'],
    required: true
  },
  threshold: {
    type: Schema.Types.Mixed,
    default: null
  }
}, { _id: false });

const ExitRuleSchema = new Schema({
  type: {
    type: String,
    enum: ['SIGNAL', 'STOP_LOSS', 'TAKE_PROFIT', 'MAX_HOLDING_DAYS'],
    required: true
  },
  indicator: {
    type: String,
    enum: ['SMA', 'EMA', 'RSI', 'PRICE_CHANGE', 'VOLUME_SMA', 'DONCHIAN_BREAKOUT', null]
  },
  params: {
    type: Schema.Types.Mixed,
    default: {}
  },
  condition: {
    type: String
  },
  threshold: {
    type: Schema.Types.Mixed,
    default: null
  }
}, { _id: false });

const StrategySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  strategyVersion: {
    type: Number,
    default: 1,
    min: 1
  },
  parametersHash: {
    type: String,
    default: ""
  },
  timeframe: {
    type: String,
    default: "1day"
  },
  parentStrategyId: {
    type: Schema.Types.ObjectId,
    ref: "Strategy",
    default: null
  },
  rootStrategyId: {
    type: Schema.Types.ObjectId,
    ref: "Strategy",
    default: null
  },
  universe: {
    type: [String],
    default: ['TCS', 'INFY', 'RELIANCE']
  },
  benchmark: {
    type: String,
    default: 'NIFTY50'
  },
  initialCapital: {
    type: Number,
    default: 100000,
    min: 1000,
    max: 100000000
  },
  positionSizing: {
    type: {
      type: String,
      enum: ['PERCENT_EQUITY', 'FIXED_AMOUNT', 'FIXED_QUANTITY'],
      default: 'PERCENT_EQUITY'
    },
    value: {
      type: Number,
      default: 10,
      min: 0.1
    }
  },
  costs: {
    brokerageRate: {
      type: Number,
      default: 0.0003, // 0.03%
      min: 0,
      max: 0.05
    },
    flatFeePerTrade: {
      type: Number,
      default: 20, // ₹20 flat fee
      min: 0,
      max: 500
    },
    slippageRate: {
      type: Number,
      default: 0.001, // 0.1%
      min: 0,
      max: 0.05
    }
  },
  entryRules: {
    type: [EntryRuleSchema],
    default: []
  },
  exitRules: {
    type: [ExitRuleSchema],
    default: []
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index for user query performance
StrategySchema.index({ user: 1, createdAt: -1 });

const StrategyModel = model("Strategy", StrategySchema);

module.exports = { StrategyModel };
