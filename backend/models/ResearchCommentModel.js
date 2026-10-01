const { Schema, model } = require("mongoose");

const ResearchCommentSchema = new Schema(
  {
    researchSession: {
      type: Schema.Types.ObjectId,
      ref: "ResearchSession",
      required: true,
      index: true
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    evidenceType: {
      type: String,
      enum: ["SUPPORTS_THESIS", "CONTRADICTS_THESIS", "NEUTRAL"],
      default: "NEUTRAL",
      required: true
    },
    evidenceDetails: {
      type: Schema.Types.Mixed,
      default: {}
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "ResearchComment",
      default: null
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

ResearchCommentSchema.index({ researchSession: 1, createdAt: 1 });
ResearchCommentSchema.index({ organization: 1, createdAt: -1 });

const ResearchCommentModel = model("ResearchComment", ResearchCommentSchema);

module.exports = {
  ResearchCommentModel
};
