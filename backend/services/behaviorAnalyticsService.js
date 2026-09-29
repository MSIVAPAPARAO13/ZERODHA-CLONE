const { TradeJournalModel } = require('../models/TradeJournalModel');
const { TransactionModel } = require('../models/TransactionModel');
const tradeReplayService = require('./tradeReplayService');

const MIN_PATTERN_SAMPLE = 5;

class BehaviorAnalyticsService {
  
  async getAnalytics(userId, windowQuery = '30d') {
    const windowDate = this._parseWindow(windowQuery);
    
    // Fetch base journals in window
    const query = { user: userId };
    if (windowDate) {
      query.createdAt = { $gte: windowDate };
    }
    const journals = await TradeJournalModel.find(query).lean();
    
    // Fetch full replay for each journal to build deterministic facts
    const replays = [];
    for (const journal of journals) {
      try {
        const replay = await tradeReplayService.getReplay(journal._id, userId);
        replays.push(replay);
      } catch (err) {
        // Skip if replay fails
      }
    }

    const tradeCount = replays.length;
    
    if (tradeCount < MIN_PATTERN_SAMPLE) {
      return {
        window: windowQuery,
        tradeCount,
        message: 'Not enough data for behavioral patterns yet. Continue journaling trades to unlock insights.'
      };
    }

    // Build aggregations
    const analytics = this._calculateMetrics(replays);
    
    return {
      window: windowQuery,
      tradeCount,
      ...analytics
    };
  }

  _parseWindow(windowQuery) {
    const now = new Date();
    switch (windowQuery.toLowerCase()) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case 'all': return null;
      default: return new Date(now.setDate(now.getDate() - 30));
    }
  }

  _calculateMetrics(replays) {
    const totalTrades = replays.length;
    let closedTrades = 0;
    let profitableTrades = 0;
    let lossTrades = 0;
    let totalRealizedPnl = 0;
    
    let sumConfidence = 0;
    let totalTargetRecorded = 0;
    let totalRiskRecorded = 0;
    
    let totalTargetReached = 0;
    let totalRiskCrossed = 0;
    let exitBeforeTarget = 0;
    let exitEfficiencySum = 0;
    let exitEfficiencyCount = 0;

    let totalHoldingDays = 0;
    
    let mfeSum = 0, maeSum = 0;
    let mfeCount = 0, maeCount = 0;

    const strategies = {};
    const confidences = {};
    const completeness = { thesis: 0, strategy: 0, reason: 0, confidence: 0, target: 0, risk: 0 };
    
    const patterns = [];

    replays.forEach(r => {
      const j = r.journal;
      const out = r.outcome;

      // Grouping stats
      if (!strategies[j.strategy]) strategies[j.strategy] = { count: 0, wins: 0, pnl: 0, hold: 0 };
      strategies[j.strategy].count++;
      if (out.realizedPnl > 0) strategies[j.strategy].wins++;
      strategies[j.strategy].pnl += out.realizedPnl || 0;
      strategies[j.strategy].hold += out.holdingDurationDays || 0;

      const confKey = j.confidence || 0;
      if (!confidences[confKey]) confidences[confKey] = { count: 0, wins: 0, pnl: 0 };
      confidences[confKey].count++;
      if (out.realizedPnl > 0) confidences[confKey].wins++;
      confidences[confKey].pnl += out.realizedPnl || 0;

      // Completeness
      if (j.thesis) completeness.thesis++;
      if (j.strategy) completeness.strategy++;
      if (j.reason) completeness.reason++;
      if (j.confidence) completeness.confidence++;
      if (j.targetPrice) completeness.target++;
      if (j.riskPrice) completeness.risk++;

      // Base stats
      sumConfidence += j.confidence || 0;
      if (j.targetPrice) totalTargetRecorded++;
      if (j.riskPrice) totalRiskRecorded++;

      if (out.status === 'CLOSED') {
        closedTrades++;
        totalRealizedPnl += out.realizedPnl || 0;
        if (out.realizedPnl > 0) profitableTrades++;
        if (out.realizedPnl < 0) lossTrades++;
      }
      totalHoldingDays += out.holdingDurationDays || 0;

      // Behavioral execution facts
      if (out.targetReached) totalTargetReached++;
      if (out.riskCrossed) totalRiskCrossed++;

      if (out.targetReached && out.status === 'CLOSED' && out.exitPrice && j.targetPrice) {
        if ((j.side === 'BUY' && out.exitPrice < j.targetPrice) || (j.side === 'SELL' && out.exitPrice > j.targetPrice)) {
          exitBeforeTarget++;
        }
      }

      // Very rough MVP MFE / MAE estimation based on outcome markers if actual high/low arrays aren't fully persisted
      // In a real app we'd scan candles. For MVP, we simulate MFE/MAE via actual extremes if available.
      if (r.marketData && r.marketData.data) {
        // Assume marketData.data contains historical candles from entry to exit/now
        const candles = r.marketData.data;
        if (candles.length > 0) {
           let high = -Infinity;
           let low = Infinity;
           candles.forEach(c => {
               if (c.high > high) high = c.high;
               if (c.low < low) low = c.low;
           });
           if (j.side === 'BUY') {
               const mfe = high - j.entryPrice;
               const mae = low - j.entryPrice;
               mfeSum += mfe; mfeCount++;
               maeSum += mae; maeCount++;
               
               if (out.status === 'CLOSED' && mfe > 0 && out.realizedPnl > 0) {
                   const maxProfit = (high - j.entryPrice) * j.quantity;
                   if (maxProfit > 0) {
                      exitEfficiencySum += (out.realizedPnl / maxProfit);
                      exitEfficiencyCount++;
                   }
               }
           }
        }
      }
    });

    // Patterns
    if (totalTargetRecorded > 0 && totalRiskRecorded === 0) patterns.push({ type: 'TARGET_WITHOUT_RISK', desc: `${totalTargetRecorded} trades had targets but no recorded risk.` });
    if (totalRiskRecorded > 0 && totalTargetRecorded === 0) patterns.push({ type: 'RISK_WITHOUT_TARGET', desc: `${totalRiskRecorded} trades had risk but no recorded target.` });
    if (exitBeforeTarget >= Math.min(3, Math.floor(totalTrades/3))) patterns.push({ type: 'EXIT_BEFORE_TARGET', desc: `${exitBeforeTarget} trades exited before the target was later reached.` });

    const strategyStats = Object.keys(strategies).map(k => ({
      strategy: k,
      trades: strategies[k].count,
      winRate: (strategies[k].wins / strategies[k].count * 100).toFixed(1),
      avgPnl: (strategies[k].pnl / strategies[k].count).toFixed(2),
      avgHold: (strategies[k].hold / strategies[k].count).toFixed(1)
    })).filter(s => s.trades >= MIN_PATTERN_SAMPLE); // Filter by min sample

    const confidenceStats = Object.keys(confidences).map(k => ({
      confidence: k,
      trades: confidences[k].count,
      winRate: (confidences[k].wins / confidences[k].count * 100).toFixed(1),
      avgPnl: (confidences[k].pnl / confidences[k].count).toFixed(2)
    })).filter(c => c.trades >= MIN_PATTERN_SAMPLE);

    return {
      summary: {
        journaledTrades: totalTrades,
        closedTrades,
        winRate: closedTrades > 0 ? ((profitableTrades / closedTrades) * 100).toFixed(1) : 0,
        avgPnl: closedTrades > 0 ? (totalRealizedPnl / closedTrades).toFixed(2) : 0,
        avgHoldDays: (totalHoldingDays / totalTrades).toFixed(1),
        avgConfidence: (sumConfidence / totalTrades).toFixed(1)
      },
      dataQuality: {
        thesis: ((completeness.thesis / totalTrades) * 100).toFixed(1) + '%',
        strategy: ((completeness.strategy / totalTrades) * 100).toFixed(1) + '%',
        reason: ((completeness.reason / totalTrades) * 100).toFixed(1) + '%',
        confidence: ((completeness.confidence / totalTrades) * 100).toFixed(1) + '%',
        target: ((completeness.target / totalTrades) * 100).toFixed(1) + '%',
        risk: ((completeness.risk / totalTrades) * 100).toFixed(1) + '%'
      },
      planExecution: {
        targetReached: `${totalTargetReached} / ${totalTargetRecorded}`,
        riskCrossed: `${totalRiskCrossed} / ${totalRiskRecorded}`,
        exitBeforeTarget
      },
      advanced: {
        avgMfe: mfeCount > 0 ? (mfeSum / mfeCount).toFixed(2) : null,
        avgMae: maeCount > 0 ? (maeSum / maeCount).toFixed(2) : null,
        exitEfficiency: exitEfficiencyCount > 0 ? ((exitEfficiencySum / exitEfficiencyCount) * 100).toFixed(1) + '%' : null,
        dataResolution: 'Daily' // based on our marketDataService resolution
      },
      strategyStats,
      confidenceStats,
      patterns
    };
  }
}

module.exports = new BehaviorAnalyticsService();
