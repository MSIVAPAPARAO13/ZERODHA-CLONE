const { TradeJournalModel } = require('../models/TradeJournalModel');
const { TransactionModel } = require('../models/TransactionModel');
const marketDataService = require('./marketDataService');

class TradeReplayService {
  async getReplay(journalId, userId) {
    const journal = await TradeJournalModel.findOne({ _id: journalId, user: userId }).populate('order').lean();
    if (!journal) {
      throw new Error('Journal not found');
    }

    const entryTx = await TransactionModel.findOne({ order: journal.order._id, user: userId }).lean();
    if (!entryTx) {
      throw new Error('Entry transaction not found');
    }

    const symbol = journal.symbol;
    const entryTime = entryTx.createdAt;
    const targetQty = entryTx.quantity;
    const entryPrice = entryTx.price;

    // Determine Exit based on FIFO
    // Find all SELL transactions for this symbol after the entry time
    const subsequentSells = await TransactionModel.find({
      user: userId,
      symbol: symbol,
      type: 'SELL',
      createdAt: { $gte: entryTime }
    }).sort({ createdAt: 1 }).lean();

    let matchedQty = 0;
    let totalExitValue = 0;
    let exitTime = null;

    for (const sell of subsequentSells) {
      const remainingToMatch = targetQty - matchedQty;
      if (remainingToMatch <= 0) break;

      const qtyToMatch = Math.min(sell.quantity, remainingToMatch);
      matchedQty += qtyToMatch;
      totalExitValue += qtyToMatch * sell.price;
      exitTime = sell.createdAt; // Last sell time that matched
    }

    const isClosed = matchedQty >= targetQty;
    const status = isClosed ? 'CLOSED' : 'OPEN';
    const exitPrice = matchedQty > 0 ? totalExitValue / matchedQty : null;

    // Get Historical Data
    let history = null;
    try {
      // Best effort historical data
      const histData = await marketDataService.getHistoricalData(symbol, { interval: '1day' });
      if (histData && histData.data) {
        history = histData;
      }
    } catch (err) {
      console.warn('Could not fetch historical data for replay', err.message);
    }

    // Evaluate Target / Risk
    let targetReached = false;
    let targetReachedDate = null;
    let riskCrossed = false;
    let riskCrossedDate = null;

    let currentMarketPrice = null;

    if (history && history.data) {
      // Sort chronologically ascending
      const sortedData = history.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Get the latest available price for open trades
      if (sortedData.length > 0) {
        currentMarketPrice = sortedData[sortedData.length - 1].close;
      }

      for (const candle of sortedData) {
        const candleDate = new Date(candle.timestamp);
        // Only evaluate candles that happened ON or AFTER the entry day
        // (Roughly, ignoring time zone specifics for MVP)
        if (candleDate >= new Date(entryTime).setHours(0,0,0,0)) {
          // If we have an exit time and the candle is AFTER the exit time, stop evaluating
          if (isClosed && exitTime && candleDate > new Date(exitTime)) {
            continue;
          }

          if (journal.targetPrice && !targetReached && candle.high >= journal.targetPrice) {
            targetReached = true;
            targetReachedDate = candle.timestamp;
          }

          if (journal.riskPrice && !riskCrossed && candle.low <= journal.riskPrice) {
            riskCrossed = true;
            riskCrossedDate = candle.timestamp;
          }
        }
      }
    } else {
       // If no history but we can get a current quote
       try {
         const quote = await marketDataService.getQuote(symbol);
         if (quote) currentMarketPrice = quote.price;
       } catch (err) {}
    }

    // Calculations
    const realizedPnl = isClosed ? (exitPrice - entryPrice) * targetQty : null;
    const unrealizedPnl = !isClosed && currentMarketPrice ? (currentMarketPrice - entryPrice) * targetQty : null;
    
    const holdingDurationMs = isClosed 
      ? new Date(exitTime).getTime() - new Date(entryTime).getTime()
      : Date.now() - new Date(entryTime).getTime();
    
    const holdingDurationDays = Math.max(0, Math.floor(holdingDurationMs / (1000 * 60 * 60 * 24)));

    const outcome = {
      status,
      entryTime,
      exitTime: isClosed ? exitTime : null,
      exitPrice,
      realizedPnl,
      unrealizedPnl,
      currentMarketPrice,
      holdingDurationDays,
      targetReached,
      targetReachedDate,
      riskCrossed,
      riskCrossedDate
    };

    return {
      journal,
      outcome,
      marketData: history ? { source: history.source, resolution: history.interval, data: history.data } : null
    };
  }
}

module.exports = new TradeReplayService();
