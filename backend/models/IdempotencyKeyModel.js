const { Schema, model } = require("mongoose");

const IdempotencyKeySchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    endpoint: {
      type: String,
      required: true
    },
    requestHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "IN_PROGRESS",
      index: true
    },
    responseStatus: {
      type: Number,
      default: null
    },
    responseBody: {
      type: Schema.Types.Mixed,
      default: null
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr TTL
      index: { expires: 0 }
    }
  },
  { timestamps: true }
);

IdempotencyKeySchema.index({ key: 1, user: 1 }, { unique: true });

const IdempotencyKeyModel = model("IdempotencyKey", IdempotencyKeySchema);

module.exports = {
  IdempotencyKeyModel
};
