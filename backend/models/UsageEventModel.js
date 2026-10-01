const { Schema, model } = require("mongoose");

const UsageEventSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true
    },
    feature: {
      type: String,
      required: true,
      enum: [
        "aiRequests",
        "backtests",
        "scans",
        "researchSessions",
        "automations",
        "workflowRuns",
        "events"
      ],
      index: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

UsageEventSchema.index({ user: 1, feature: 1, timestamp: -1 });

const UsageEventModel = model("UsageEvent", UsageEventSchema);

module.exports = {
  UsageEventModel
};
