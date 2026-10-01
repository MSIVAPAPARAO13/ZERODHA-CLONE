const { Schema, model } = require("mongoose");

const DecisionTimelineEventSchema = new Schema({
  date: { type: Date, default: Date.now },
  eventType: {
    type: String,
    enum: ["RESEARCH_STARTED", "SCENARIO_TESTED", "DECISION_RECORDED", "ORDER_LINKED", "MARKET_EVENT_OBSERVED", "DECISION_REVIEWED"],
    required: true
  },
  description: { type: String, required: true },
  referenceId: { type: String, default: null }
}, { _id: false });

const DecisionJournalSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  symbol: {
    type: String,
    uppercase: true,
    trim: true,
    required: true,
    index: true
  },
  decisionType: {
    type: String,
    enum: ["OPEN_RESEARCH", "PAPER_BUY", "PAPER_SELL", "HOLD", "WATCH", "ABANDON"],
    required: true,
    index: true
  },
  thesis: {
    type: String,
    required: true,
    trim: true
  },
  evidenceReferences: [{
    sourceType: {
      type: String,
      enum: ["RESEARCH_SESSION", "MARKET_EVENT", "BACKTEST", "SCENARIO", "JOURNAL", "THESIS"],
      required: true
    },
    sourceId: { type: String, required: true },
    metric: { type: String, default: "" },
    value: { type: Schema.Types.Mixed, default: null },
    provider: { type: String, default: "mock" }
  }],
  scenarioReferences: [{
    scenarioId: { type: String, default: null },
    name: { type: String, default: "" },
    shockDetails: { type: Schema.Types.Mixed, default: {} },
    modeledImpact: { type: Number, default: 0 }
  }],
  expectedOutcome: {
    type: String,
    default: "",
    trim: true
  },
  riskFactors: [{
    type: String,
    trim: true
  }],
  invalidatingConditions: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ["DRAFT", "ACTIVE", "REVIEWED", "ARCHIVED"],
    default: "ACTIVE",
    index: true
  },
  reviewDate: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: "",
    trim: true
  },
  timeline: [DecisionTimelineEventSchema]
}, {
  timestamps: true
});

DecisionJournalSchema.index({ user: 1, symbol: 1, createdAt: -1 });
DecisionJournalSchema.index({ user: 1, status: 1 });

module.exports = model("DecisionJournal", DecisionJournalSchema);
