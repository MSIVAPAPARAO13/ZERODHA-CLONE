const mongoose = require('mongoose');

const ThesisReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    index: true
  },
  thesisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeJournal',
    required: false,
    default: null,
    index: true
  },
  playbookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playbook',
    default: null
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  thesisVersion: {
    type: Number,
    default: 1
  },
  previousStatus: {
    type: String,
    enum: ['SUPPORTED', 'UNCHANGED', 'REQUIRES_REVIEW', 'CONTRADICTED', 'UNKNOWN', 'STILL_VALID', 'NEEDS_UPDATE', 'NO_LONGER_RELEVANT'],
    default: 'REQUIRES_REVIEW'
  },
  newStatus: {
    type: String,
    enum: ['STILL_VALID', 'NEEDS_UPDATE', 'NO_LONGER_RELEVANT', 'REQUIRES_REVIEW'],
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Generated or user-saved research questions associated with this review
  researchQuestions: [{
    question: { type: String, required: true },
    context: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  // Snapshot of thesis assumptions at the time of review
  thesisSnapshot: {
    thesisText: String,
    strategy: String,
    reason: String,
    targetPrice: Number,
    riskPrice: Number,
    expectedHoldingPeriod: String
  },
  auditTrail: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    fromStatus: String,
    toStatus: String,
    note: String
  }]
}, { timestamps: true });

// Compound indexes for user isolation and fast temporal queries
ThesisReviewSchema.index({ user: 1, eventId: 1, thesisId: 1 });
ThesisReviewSchema.index({ user: 1, reviewedAt: -1 });

const ThesisReviewModel = mongoose.model('ThesisReview', ThesisReviewSchema);

module.exports = { ThesisReviewModel };
