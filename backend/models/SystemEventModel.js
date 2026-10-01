const { Schema, model } = require("mongoose");

const SystemEventSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "AUTH_FAILURE",
        "RATE_LIMIT_VIOLATION",
        "PROVIDER_FAILURE",
        "WORKFLOW_FAILURE",
        "AI_FAILURE",
        "DATABASE_ERROR",
        "SECURITY_ALERT"
      ],
      index: true
    },
    severity: {
      type: String,
      enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
      default: "INFO",
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    ip: {
      type: String,
      default: "127.0.0.1"
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

SystemEventSchema.index({ type: 1, timestamp: -1 });
SystemEventSchema.index({ severity: 1, timestamp: -1 });

const SystemEventModel = model("SystemEvent", SystemEventSchema);

module.exports = {
  SystemEventModel
};
