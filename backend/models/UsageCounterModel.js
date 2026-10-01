const { Schema, model } = require("mongoose");

const UsageCounterSchema = new Schema(
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
    period: {
      type: String,
      required: true,
      index: true
    },
    plan: {
      type: String,
      enum: ["FREE", "PRO", "TEAM"],
      default: "FREE"
    },
    counters: {
      type: Map,
      of: Number,
      default: () => new Map()
    }
  },
  { timestamps: true }
);

UsageCounterSchema.index({ user: 1, period: 1 }, { unique: true });

const UsageCounterModel = model("UsageCounter", UsageCounterSchema);

module.exports = {
  UsageCounterModel
};
