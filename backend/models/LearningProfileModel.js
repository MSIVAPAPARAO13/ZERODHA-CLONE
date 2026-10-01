const { Schema, model } = require("mongoose");

const KnowledgeGapSchema = new Schema({
  dimension: { type: String, required: true },
  status: {
    type: String,
    enum: ["STRONG", "MODERATE", "LIMITED", "NOT_STARTED", "UNAVAILABLE"],
    default: "NOT_STARTED"
  },
  evidence: { type: String, default: "" }
}, { _id: false });

const SuggestedQuestionSchema = new Schema({
  question: { type: String, required: true },
  rationale: { type: String, default: "" },
  category: {
    type: String,
    enum: ["SCENARIO", "ROBUSTNESS", "EXPERIMENT", "PORTFOLIO", "REVIEW", "GENERAL"],
    default: "GENERAL"
  },
  actionRoute: { type: String, default: "" }
}, { _id: false });

const LearningProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },
  researchActivity: {
    totalResearchSessions: { type: Number, default: 0 },
    totalMarketEventsViewed: { type: Number, default: 0 },
    totalScenariosSimulated: { type: Number, default: 0 },
    totalStrategyExperiments: { type: Number, default: 0 },
    totalDecisionsRecorded: { type: Number, default: 0 },
    totalJournalsReviewed: { type: Number, default: 0 }
  },
  knowledgeGaps: [KnowledgeGapSchema],
  recurringPatterns: [{
    patternType: String,
    description: String,
    observedCount: Number
  }],
  suggestedResearchQuestions: [SuggestedQuestionSchema],
  learningLoopStage: {
    type: String,
    enum: ["RESEARCH", "EXPERIMENT", "RESULT", "REVIEW", "LESSON", "NEXT_QUESTION"],
    default: "RESEARCH"
  },
  notes: {
    type: String,
    default: "PERSONAL_RESEARCH_COACH — META-ANALYSIS OF USER'S OWN RESEARCH PROCESS. NOT FINANCIAL ADVICE."
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = model("LearningProfile", LearningProfileSchema);
