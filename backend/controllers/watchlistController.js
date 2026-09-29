const watchlistService = require('../services/watchlistService');

const getWatchlist = async (req, res, next) => {
  try {
    const data = await watchlistService.getWatchlist(req.user.userId);
    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
};

const addSymbol = async (req, res, next) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ success: false, data: null, error: { message: 'Symbol is required' } });
    
    const quote = await watchlistService.addSymbol(req.user.userId, symbol);
    res.status(201).json({ success: true, data: quote, error: null });
  } catch (err) {
    if (err.message.startsWith('Unknown symbol') || err.message.includes('already in watchlist')) {
      return res.status(400).json({ success: false, data: null, error: { message: err.message } });
    }
    // Handle mongoose duplicate key error if somehow triggered
    if (err.code === 11000) {
      return res.status(409).json({ success: false, data: null, error: { message: 'Symbol already in watchlist' } });
    }
    next(err);
  }
};

const removeSymbol = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    await watchlistService.removeSymbol(req.user.userId, symbol);
    res.json({ success: true, data: null, error: null });
  } catch (err) {
    if (err.message.includes('not found in your watchlist')) {
      return res.status(404).json({ success: false, data: null, error: { message: err.message } });
    }
    next(err);
  }
};

module.exports = { getWatchlist, addSymbol, removeSymbol };
