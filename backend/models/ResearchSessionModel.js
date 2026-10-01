const { Schema, model } = require("mongoose");

const EvidenceReferenceSchema = new Schema({
  sourceType: {
    type: String,
    enum: ['QUOTE', 'HISTORICAL_SERIES', 'SCANNER_RUN', 'WATCHLIST', 'ALERT', 'PORTFOLIO', 'JOURNAL', 'PLAYBOOK', 'THESIS', 'BACKTEST_SIMULATION', 'STRESS_SCENARIO'],
    required: true
  },
  sourceId: { type: String, default: null },
  symbol: { type: String, uppercase: true, trim: true },
  metric: { type: String, required: true },
  value: { type: Schema.Types.Mixed, default: null },
  unit: { type: String, default: '' },
  context: { type: String, default: '' },
  confidence: {
    type: String,
    enum: ['OBSERVED', 'DERIVED', 'INTERPRETED', 'UNKNOWN', 'LIMITATION'],
    default: 'OBSERVED'
  },
  provider: { type: String, default: 'TradeFlow Internal' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ResearchSessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  intent: {
    type: String,
    enum: [
      'SECURITY_RESEARCH',
      'SCANNER_RESEARCH',
      'STRATEGY_RESEARCH',
      'PORTFOLIO_RESEARCH',
      'STRESS_RESEARCH',
      'THESIS_RESEARCH',
      'COMPARISON_RESEARCH',
      'ALERT_RESEARCH',
      'EVENT_RESEARCH',
      'EVENT_INVESTIGATION',
      'GENERAL_RESEARCH'
    ],
    default: 'SECURITY_RESEARCH'
  },
  symbols: [{
    type: String,
    uppercase: true,
    trim: true
  }],
  plan: {
    intent: { type: String },
    requiredTools: [{ type: String }],
    symbols: [{ type: String }],
    options: { type: Schema.Types.Mixed, default: {} }
  },
  evidenceReferences: [EvidenceReferenceSchema],
  report: {
    summary: { type: String, default: '' },
    observedData: [{ type: String }],
    derivedMetrics: [{ type: String }],
    historicalEvidence: [{ type: String }],
    stressEvidence: [{ type: String }],
    researchInterpretation: [{ type: String }],
    limitations: [{ type: String }],
    unknowns: [{ type: String }],
    nextQuestions: [{ type: String }],
    gaps: [{
      dimension: { type: String },
      status: { type: String, enum: ['AVAILABLE', 'UNAVAILABLE', 'PLANNED'] },
      detail: { type: String }
    }],
    timeline: [{
      date: { type: String },
      eventType: { type: String },
      description: { type: String },
      source: { type: String }
    }],
    evidenceGraph: {
      nodes: [{
        id: { type: String },
        label: { type: String },
        type: { type: String },
        status: { type: String }
      }],
      edges: [{
        source: { type: String },
        target: { type: String },
        relationship: { type: String }
      }]
    }
  },
  researchHash: {
    type: String,
    required: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    default: null,
    index: true
  },
  sharedWithOrg: {
    type: Boolean,
    default: false,
    index: true
  },
  version: {
    type: Number,
    default: 1
  },
  versions: [{
    version: { type: Number, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    summary: { type: String, required: true },
    snapshot: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

ResearchSessionSchema.index({ user: 1, createdAt: -1 });

const ResearchSessionModel = model("ResearchSession", ResearchSessionSchema);

module.exports = { ResearchSessionModel };
