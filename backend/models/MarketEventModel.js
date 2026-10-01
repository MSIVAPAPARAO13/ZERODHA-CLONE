const { Schema, model } = require("mongoose");

const ObservedDataItemSchema = new Schema({
  metric: { type: String, required: true },
  value: { type: Schema.Types.Mixed, default: null },
  unit: { type: String, default: "" },
  provider: { type: String, default: "mock" },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const SourceReferenceSchema = new Schema({
  sourceType: {
    type: String,
    enum: [
      "MARKET_DATA",
      "SCANNER",
      "ALERT",
      "WATCHLIST",
      "PORTFOLIO",
      "STRATEGY",
      "STRESS",
      "RESEARCH"
    ],
    required: true
  },
  sourceId: { type: String, default: null },
  details: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const CorrelatedSignalSchema = new Schema({
  symbol: { type: String, uppercase: true, trim: true },
  eventType: { type: String, required: true },
  description: { type: String, default: "" },
  metric: { type: String, default: "" },
  value: { type: Schema.Types.Mixed, default: null },
  severity: { type: String, default: "INFO" }
}, { _id: false });

const MarketEventSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  symbol: {
    type: String,
    uppercase: true,
    trim: true,
    required: true
  },
  eventType: {
    type: String,
    enum: [
      "PRICE_MOVE",
      "VOLUME_SURGE",
      "VOLATILITY_CHANGE",
      "TECHNICAL_BREAKOUT",
      "TECHNICAL_BREAKDOWN",
      "SCANNER_ENTRY",
      "SCANNER_EXIT",
      "MARKET_BREADTH_CHANGE",
      "SECTOR_CHANGE",
      "ALERT_TRIGGERED",
      "PORTFOLIO_EXPOSURE_CHANGE",
      "STRATEGY_SIGNAL_CHANGE",
      "RESEARCH_EVIDENCE_CHANGE",
      "CORRELATED_EVENT",
      "MARKET_REGIME_CHANGE"
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ["INFO", "WATCH", "SIGNIFICANT", "CRITICAL"],
    default: "INFO",
    index: true
  },
  category: {
    type: String,
    enum: ["MARKET", "WATCHLIST", "PORTFOLIO", "SCANNER", "ALERT", "STRATEGY", "RESEARCH"],
    default: "MARKET",
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },

  observedData: [ObservedDataItemSchema],
  sourceReferences: [SourceReferenceSchema],

  previousValue: { type: Number, default: null },
  currentValue: { type: Number, default: null },
  changeValue: { type: Number, default: null },
  changePercent: { type: Number, default: null },

  provider: { type: String, default: "mock" },
  occurredAt: { type: Date, default: Date.now, index: true },

  dedupeKey: { type: String, required: true },
  clusterId: { type: String, default: null, index: true },
  correlatedSignals: [CorrelatedSignalSchema],

  isRead: { type: Boolean, default: false, index: true },
  isDismissed: { type: Boolean, default: false, index: true },
  tags: [{ type: String }]
}, {
  timestamps: true
});

// Compound indexes for optimal query efficiency
MarketEventSchema.index({ user: 1, occurredAt: -1 });
MarketEventSchema.index({ user: 1, symbol: 1, occurredAt: -1 });
MarketEventSchema.index({ user: 1, dedupeKey: 1 }, { unique: true });
MarketEventSchema.index({ user: 1, isRead: 1, isDismissed: 1 });
MarketEventSchema.index({ user: 1, category: 1, occurredAt: -1 });

module.exports = model("MarketEvent", MarketEventSchema);
