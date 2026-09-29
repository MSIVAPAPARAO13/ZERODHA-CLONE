const { WatchlistModel } = require('../models/WatchlistModel');
const marketDataService = require('./marketDataService');

class WatchlistService {
  async getWatchlist(userId) {
    const records = await WatchlistModel.find({ user: userId }).sort({ createdAt: 1 });
    if (!records.length) return [];
    const symbols = records.map(r => r.symbol);
    
    // Fetch live/mock market data
    const quotes = await marketDataService.getQuotes(symbols);
    
    // Normalize into a single list
    const enriched = symbols.map(sym => {
      const quote = quotes.find(q => q.symbol === sym);
      return quote || { symbol: sym, error: 'Data unavailable' };
    });
    
    return enriched;
  }

  async addSymbol(userId, symbol) {
    const upperSymbol = symbol.toUpperCase();
    
    // Validate symbol exists in market
    const quote = await marketDataService.getQuote(upperSymbol);
    if (!quote) throw new Error(`Unknown symbol: ${upperSymbol}`);
    
    // Check if already in watchlist
    const existing = await WatchlistModel.findOne({ user: userId, symbol: upperSymbol });
    if (existing) throw new Error(`Symbol ${upperSymbol} already in watchlist`);
    
    const newEntry = new WatchlistModel({ user: userId, symbol: upperSymbol });
    await newEntry.save();
    
    return quote; // return the market data for convenience
  }

  async removeSymbol(userId, symbol) {
    const upperSymbol = symbol.toUpperCase();
    const result = await WatchlistModel.deleteOne({ user: userId, symbol: upperSymbol });
    if (result.deletedCount === 0) throw new Error(`Symbol ${upperSymbol} not found in your watchlist`);
    return true;
  }
}

module.exports = new WatchlistService();
