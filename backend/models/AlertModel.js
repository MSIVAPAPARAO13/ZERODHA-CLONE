const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true },
  condition: { type: String, enum: ['ABOVE', 'BELOW'], required: true },
  targetPrice: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true },
  triggeredAt: { type: Date, default: null }
}, { timestamps: true });

AlertSchema.index({ user: 1, isActive: 1 });
AlertSchema.index({ symbol: 1, isActive: 1 });

const AlertModel = mongoose.model('Alert', AlertSchema);

module.exports = { AlertModel };
