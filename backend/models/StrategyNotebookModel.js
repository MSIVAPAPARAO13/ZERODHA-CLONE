const { Schema, model } = require("mongoose");

const StrategyNotebookSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  strategy: {
    type: Schema.Types.ObjectId,
    ref: "Strategy",
    required: true,
    index: true
  },
  strategyVersion: {
    type: Number,
    required: true
  },
  parametersHash: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  hypothesis: {
    type: String,
    required: true,
    trim: true
  },
  datasetRange: {
    startDate: { type: String, default: "ALL" },
    endDate: { type: String, default: "ALL" },
    interval: { type: String, default: "1day" }
  },
  configuration: {
    capital: { type: Number, default: 100000 },
    universe: { type: [String], default: [] },
    costs: { type: Schema.Types.Mixed, default: {} }
  },
  results: {
    totalReturnPercent: { type: Number, default: 0 },
    maxDrawdownPercent: { type: Number, default: 0 },
    winRatePercent: { type: Number, default: 0 },
    profitFactor: { type: Number, default: 0 },
    tradeCount: { type: Number, default: 0 },
    benchmarkReturnPercent: { type: Number, default: 0 },
    alpha: { type: Number, default: 0 }
  },
  robustnessResults: {
    status: { type: String, default: "NOT_EVALUATED" },
    reason: { type: String, default: "" }
  },
  resultHash: {
    type: String,
    required: true,
    index: true
  },
  observations: {
    type: String,
    default: ""
  },
  limitations: {
    type: String,
    default: ""
  },
  nextExperiment: {
    type: String,
    default: ""
  },
  linkedDecisionId: {
    type: Schema.Types.ObjectId,
    ref: "DecisionJournal",
    default: null
  },
  linkedJournalEntryId: {
    type: Schema.Types.ObjectId,
    ref: "TradeJournal",
    default: null
  }
}, { timestamps: true });

StrategyNotebookSchema.index({ user: 1, strategy: 1, strategyVersion: -1 });

module.exports = model("StrategyNotebook", StrategyNotebookSchema);
