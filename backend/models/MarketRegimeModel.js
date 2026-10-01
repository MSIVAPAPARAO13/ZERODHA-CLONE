const { Schema, model } = require("mongoose");

const MarketRegimeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  regime: {
    type: String,
    enum: [
      "TRENDING_UP",
      "TRENDING_DOWN",
      "RANGE_BOUND",
      "HIGH_VOLATILITY",
      "LOW_VOLATILITY",
      "MIXED",
      "DATA_LIMITED"
    ],
    required: true,
    index: true
  },
  previousRegime: {
    type: String,
    default: null
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  metrics: {
    trend: { type: String, enum: ["UP", "DOWN", "FLAT", "UNKNOWN"], default: "UNKNOWN" },
    advancingPercent: { type: Number, default: 0 },
    decliningPercent: { type: Number, default: 0 },
    breadthRatio: { type: Number, default: 1 },
    averageVolatility: { type: Number, default: 0 },
    volatilityLevel: { type: String, enum: ["ELEVATED", "NORMAL", "LOW", "UNKNOWN"], default: "UNKNOWN" },
    sampleSize: { type: Number, default: 0 }
  },
  evidence: [{
    type: String
  }],
  notes: {
    type: String,
    default: "DETERMINISTIC_REGIME_CLASSIFICATION — NOT A FINANCIAL PREDICTION"
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

MarketRegimeSchema.index({ user: 1, createdAt: -1 });

module.exports = model("MarketRegime", MarketRegimeSchema);
