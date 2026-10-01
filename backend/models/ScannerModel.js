const { Schema, model } = require("mongoose");

const ConditionSchema = new Schema({
  indicator: {
    type: String,
    enum: ['SMA', 'EMA', 'RSI', 'PRICE_CHANGE', 'VOLUME_SMA', 'DONCHIAN_BREAKOUT', 'RELATIVE_STRENGTH'],
    required: true
  },
  period: {
    type: Number,
    default: 20
  },
  operator: {
    type: String,
    enum: ['GREATER_THAN', 'LESS_THAN', 'CROSS_ABOVE', 'CROSS_BELOW', 'GREATER_THAN_MULTIPLE'],
    required: true
  },
  threshold: {
    type: Schema.Types.Mixed,
    default: null
  },
  compareTo: {
    indicator: {
      type: String,
      enum: ['SMA', 'EMA', 'PRICE', 'BENCHMARK', null],
      default: null
    },
    period: {
      type: Number,
      default: null
    }
  }
}, { _id: false });

const ScannerSchema = new Schema({
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
  universe: {
    type: String,
    enum: ['NIFTY50', 'WATCHLIST', 'CUSTOM'],
    default: 'NIFTY50'
  },
  customSymbols: {
    type: [String],
    default: []
  },
  matchMode: {
    type: String,
    enum: ['STRICT', 'NEAR'],
    default: 'STRICT'
  },
  conditionGroup: {
    type: String,
    enum: ['AND', 'OR'],
    default: 'AND'
  },
  conditions: {
    type: [ConditionSchema],
    default: []
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

ScannerSchema.index({ user: 1, createdAt: -1 });

const ScannerModel = model("Scanner", ScannerSchema);

module.exports = { ScannerModel };
