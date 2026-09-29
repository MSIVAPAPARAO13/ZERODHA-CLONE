const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true }
}, { timestamps: true });

WatchlistSchema.index({ user: 1, symbol: 1 }, { unique: true });

const WatchlistModel = mongoose.model('Watchlist', WatchlistSchema);

module.exports = { WatchlistModel };
