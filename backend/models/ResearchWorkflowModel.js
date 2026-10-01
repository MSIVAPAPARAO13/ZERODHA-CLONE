const { Schema, model } = require("mongoose");

const WorkflowStepSchema = new Schema(
  {
    stepId: {
      type: String,
      required: true
    },
    toolName: {
      type: String,
      required: true
    },
    params: {
      type: Schema.Types.Mixed,
      default: {}
    },
    order: {
      type: Number,
      required: true,
      default: 0
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const ResearchWorkflowSchema = new Schema(
  {
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
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    steps: {
      type: [WorkflowStepSchema],
      default: []
    },
    version: {
      type: Number,
      default: 1
    },
    enabled: {
      type: Boolean,
      default: true
    },
    lastRunAt: {
      type: Date,
      default: null
    },
    lastRunStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "PARTIAL", "FAILED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

ResearchWorkflowSchema.index({ user: 1, name: 1 });

const ResearchWorkflowModel = model("ResearchWorkflow", ResearchWorkflowSchema);

module.exports = {
  ResearchWorkflowModel
};
