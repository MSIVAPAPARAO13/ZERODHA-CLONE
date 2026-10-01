const { Schema, model } = require("mongoose");

const AutomationSchema = new Schema({
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
  type: {
    type: String,
    enum: [
      "DAILY_BRIEF",
      "PORTFOLIO_REVIEW",
      "RESEARCH_REVIEW",
      "STRATEGY_REVIEW",
      "JOURNAL_REVIEW",
      "EVENT_DIGEST"
    ],
    required: true,
    index: true
  },
  schedule: {
    type: String,
    enum: ["DAILY_8AM", "DAILY_EOD", "WEEKLY_MONDAY", "HOURLY", "CUSTOM"],
    default: "DAILY_8AM"
  },
  enabled: {
    type: Boolean,
    default: true
  },
  configuration: {
    type: Schema.Types.Mixed,
    default: {}
  },
  lastRunAt: {
    type: Date,
    default: null
  },
  nextRunAt: {
    type: Date,
    default: null
  },
  lastStatus: {
    type: String,
    enum: ["PENDING", "RUNNING", "SUCCESS", "FAILED"],
    default: "PENDING"
  },
  lastRunResult: {
    type: Schema.Types.Mixed,
    default: null
  },
  executionCount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: "RESEARCH_AUTOMATION_ONLY — ZERO AUTOMATED BROKER TRADING"
  }
}, { timestamps: true });

AutomationSchema.index({ user: 1, type: 1, enabled: 1 });

const Automation = model("Automation", AutomationSchema);
module.exports = Automation;
module.exports.Automation = Automation;
module.exports.AutomationModel = Automation;
