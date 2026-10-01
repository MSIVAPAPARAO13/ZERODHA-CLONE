const mongoose = require('mongoose');

const ShockSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['MARKET', 'SECTOR', 'ASSET'],
    required: true
  },
  target: {
    type: String,
    required: true,
    trim: true
  },
  percentage: {
    type: Number,
    required: true,
    min: -100,
    max: 500
  }
}, { _id: false });

const ScenarioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    default: '',
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['CUSTOM', 'PRESET', 'HISTORICAL_REPLAY'],
    default: 'CUSTOM'
  },
  shocks: {
    type: [ShockSchema],
    validate: [val => val.length > 0, 'Scenario must define at least one shock.']
  },
  horizon: {
    type: String,
    enum: ['1D', '3D', '1W', '1M', '3M'],
    default: '1D'
  },
  severity: {
    type: String,
    enum: ['MILD', 'MODERATE', 'SEVERE', 'EXTREME'],
    default: 'MODERATE'
  },
  version: {
    type: Number,
    default: 1
  },
  historicalDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Compound indexes for user query performance
ScenarioSchema.index({ user: 1, createdAt: -1 });

const ScenarioModel = mongoose.model('Scenario', ScenarioSchema);

module.exports = { ScenarioModel };
