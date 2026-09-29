const behaviorAnalyticsService = require('./behaviorAnalyticsService');

class AIContextService {
  // ... previous methods left as-is, we will just add the new behavior review method
  
  async getTradeReviewContext(journalId, userId) {
    const tradeReplayService = require('./tradeReplayService');
    const replay = await tradeReplayService.getReplay(journalId, userId);
    return {
      type: 'TRADE_REVIEW',
      trade: {
        symbol: replay.journal.symbol,
        side: replay.journal.side,
        quantity: replay.journal.quantity,
        entryPrice: replay.journal.entryPrice,
      },
      journal: {
        strategy: replay.journal.strategy,
        reason: replay.journal.reason,
        confidence: replay.journal.confidence,
        targetPrice: replay.journal.targetPrice,
        riskPrice: replay.journal.riskPrice,
        thesis: replay.journal.thesis,
      },
      outcome: {
        status: replay.outcome.status,
        holdingDurationDays: replay.outcome.holdingDurationDays,
        targetReached: replay.outcome.targetReached,
        targetReachedDate: replay.outcome.targetReachedDate,
        riskCrossed: replay.outcome.riskCrossed,
        riskCrossedDate: replay.outcome.riskCrossedDate,
        actualExitPrice: replay.outcome.exitPrice,
        realizedPnl: replay.outcome.realizedPnl,
        unrealizedPnl: replay.outcome.unrealizedPnl,
        currentMarketPrice: replay.outcome.currentMarketPrice
      }
    };
  }

  async getPortfolioContext(userId) {
    const { UserModel } = require('../models/UserModel');
    const { HoldingsModel } = require('../models/HoldingsModel');
    const { PositionsModel } = require('../models/PositionsModel');
    const { TransactionModel } = require('../models/TransactionModel');
    
    const user = await UserModel.findById(userId).lean();
    const holdings = await HoldingsModel.find({ user: userId }).lean();
    const positions = await PositionsModel.find({ user: userId }).lean();
    const recentTransactions = await TransactionModel.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean();

    return {
      type: 'PORTFOLIO_REVIEW',
      balance: user.virtualBalance,
      holdings: holdings.map(h => ({ symbol: h.symbol, avgPrice: h.averagePrice, qty: h.quantity })),
      positions: positions.map(p => ({ symbol: p.symbol, side: p.side, avgPrice: p.averagePrice, qty: p.quantity, realizedPnl: p.realizedPnl })),
      recentTransactions: recentTransactions.map(t => ({ type: t.type, symbol: t.symbol, qty: t.quantity, price: t.price, date: t.createdAt }))
    };
  }

  async getPatternContext(userId) {
    const { TradeJournalModel } = require('../models/TradeJournalModel');
    const journals = await TradeJournalModel.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean();
    return {
      type: 'PATTERN_REVIEW',
      journals: journals.map(j => ({
        symbol: j.symbol,
        side: j.side,
        strategy: j.strategy,
        reason: j.reason,
        confidence: j.confidence,
        hasTarget: !!j.targetPrice,
        hasRisk: !!j.riskPrice,
        date: j.createdAt
      }))
    };
  }

  async getDailyDebriefContext(userId) {
    const { TradeJournalModel } = require('../models/TradeJournalModel');
    const { TransactionModel } = require('../models/TransactionModel');
    const today = new Date();
    today.setHours(0,0,0,0);

    const transactions = await TransactionModel.find({ user: userId, createdAt: { $gte: today } }).lean();
    const journals = await TradeJournalModel.find({ user: userId, createdAt: { $gte: today } }).lean();

    return {
      type: 'DAILY_DEBRIEF',
      today: new Date().toISOString(),
      transactionsToday: transactions.map(t => ({ type: t.type, symbol: t.symbol, qty: t.quantity, price: t.price })),
      journalsToday: journals.map(j => ({ symbol: j.symbol, strategy: j.strategy, thesis: j.thesis }))
    };
  }

  async getBehaviorReviewContext(userId, windowQuery = '30d') {
    const analytics = await behaviorAnalyticsService.getAnalytics(userId, windowQuery);
    return {
      type: 'BEHAVIOR_REVIEW',
      analytics
    };
  }

  async getPlaybookSuggestionContext(patternPayload) {
    return {
      type: 'PLAYBOOK_SUGGESTION',
      pattern: patternPayload.pattern,
      desc: patternPayload.desc
    };
  }

  async getPlaybookReviewContext(userId) {
    const playbookService = require('./playbookService');
    const stats = await playbookService.getPlaybookStats(userId);
    return {
      type: 'PLAYBOOK_REVIEW',
      playbookStats: stats
    };
  }
}

module.exports = new AIContextService();
