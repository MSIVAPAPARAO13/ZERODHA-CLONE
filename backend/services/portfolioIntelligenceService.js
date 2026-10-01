const { HoldingsModel } = require("../models/HoldingsModel");
const { PositionsModel } = require("../models/PositionsModel");
const { UserModel } = require("../models/UserModel");
const MarketEvent = require("../models/MarketEventModel");
const marketDataService = require("./marketDataService");
const { getVerifiedMetadata } = require("../config/marketMetadata");

class PortfolioIntelligenceService {
  /**
   * Determine portfolio health status deterministically
   */
  classifyPortfolioHealth(stats) {
    if (!stats || stats.totalPositions === 0) {
      return {
        status: "DATA_LIMITED",
        reason: "No active equity positions found in portfolio."
      };
    }

    if (stats.cashWeight >= 0.60) {
      return {
        status: "CASH_HEAVY",
        reason: `Cash allocation is ${(stats.cashWeight * 100).toFixed(1)}%, exceeding the 60% threshold.`
      };
    }

    if (stats.top1Weight >= 0.50 || stats.top3Weight >= 0.80) {
      return {
        status: "HIGHLY_CONCENTRATED",
        reason: `Extreme capital concentration: Top asset constitutes ${(stats.top1Weight * 100).toFixed(1)}% of total equity.`
      };
    }

    if (stats.top1Weight >= 0.30 || stats.top3Weight >= 0.60 || stats.hhi > 2500) {
      return {
        status: "CONCENTRATED",
        reason: `Moderate concentration: Top 3 assets constitute ${(stats.top3Weight * 100).toFixed(1)}% of portfolio equity.`
      };
    }

    return {
      status: "BALANCED",
      reason: "Asset allocation and sector distribution remain diversified within standard parameters."
    };
  }

  /**
   * Main calculation engine for portfolio intelligence
   */
  async getPortfolioIntelligence(userId) {
    // 1. Fetch user account, holdings, and positions
    const [user, holdings, positions] = await Promise.all([
      UserModel.findById(userId).lean(),
      HoldingsModel.find({ user: userId }).lean(),
      PositionsModel.find({ user: userId }).lean()
    ]);

    const cashBalance = user?.virtualBalance || 0;

    if ((!holdings || holdings.length === 0) && (!positions || positions.length === 0)) {
      return {
        totalCapital: cashBalance,
        totalEquity: 0,
        cashBalance,
        cashWeight: 1.0,
        totalInvested: 0,
        totalUnrealizedPnL: 0,
        returnPercent: 0,
        totalPositions: 0,
        holdings: [],
        sectors: [],
        concentration: {
          top1Symbol: null,
          top1Weight: 0,
          top3Weight: 0,
          top5Weight: 0,
          hhi: 0
        },
        health: {
          status: "DATA_LIMITED",
          reason: "No active equity positions found in portfolio."
        },
        recentEventCrossLinks: []
      };
    }

    // Combine holdings and positions into unified asset list
    const assetMap = new Map();

    holdings.forEach(h => {
      const sym = (h.name || h.symbol || "").toUpperCase();
      if (!sym) return;
      const qty = Number(h.qty) || 0;
      const avg = Number(h.avg) || Number(h.buyPrice) || 0;
      assetMap.set(sym, {
        symbol: sym,
        qty,
        avgCost: avg,
        invested: qty * avg,
        currentPrice: Number(h.price) || avg
      });
    });

    positions.forEach(p => {
      const sym = (p.name || p.symbol || "").toUpperCase();
      if (!sym) return;
      const qty = Number(p.qty) || 0;
      const avg = Number(p.avg) || Number(p.buyPrice) || 0;
      if (assetMap.has(sym)) {
        const existing = assetMap.get(sym);
        existing.qty += qty;
        existing.invested += qty * avg;
        existing.avgCost = existing.qty > 0 ? existing.invested / existing.qty : 0;
      } else {
        assetMap.set(sym, {
          symbol: sym,
          qty,
          avgCost: avg,
          invested: qty * avg,
          currentPrice: Number(p.price) || avg
        });
      }
    });

    const symbols = Array.from(assetMap.keys());

    // 2. Fetch fresh quotes in parallel through provider abstraction
    const quotes = await marketDataService.getQuotes(symbols).catch(() => []);
    const quoteMap = new Map();
    quotes.forEach(q => {
      if (q && q.symbol) quoteMap.set(q.symbol.toUpperCase(), q);
    });

    let totalEquity = 0;
    let totalInvested = 0;
    const enrichedHoldings = [];

    // 3. Compute per-holding metrics & sector mapping
    symbols.forEach(sym => {
      const item = assetMap.get(sym);
      const quote = quoteMap.get(sym);
      const currentPrice = quote?.price !== undefined ? Number(quote.price) : item.currentPrice;
      const currentValue = item.qty * currentPrice;
      const unrealizedPnL = currentValue - item.invested;
      const pnlPercent = item.invested > 0 ? (unrealizedPnL / item.invested) * 100 : 0;

      const metadata = getVerifiedMetadata(sym);
      const sector = metadata?.sector || "Unclassified Sector";
      const industry = metadata?.industry || "General Industry";

      totalEquity += currentValue;
      totalInvested += item.invested;

      enrichedHoldings.push({
        symbol: sym,
        name: metadata?.name || sym,
        sector,
        industry,
        quantity: item.qty,
        averagePrice: item.avgCost,
        currentPrice,
        investedValue: item.invested,
        currentValue,
        unrealizedPnL,
        pnlPercent,
        weight: 0 // Will compute below once totalEquity is known
      });
    });

    // 4. Compute weights and concentration
    enrichedHoldings.forEach(h => {
      h.weight = totalEquity > 0 ? h.currentValue / totalEquity : 0;
    });

    // Sort holdings descending by value
    enrichedHoldings.sort((a, b) => b.currentValue - a.currentValue);

    const totalCapital = totalEquity + cashBalance;
    const cashWeight = totalCapital > 0 ? cashBalance / totalCapital : 0;
    const totalUnrealizedPnL = totalEquity - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;

    // Concentration math (Top 1, Top 3, Top 5, HHI)
    const top1Weight = enrichedHoldings.length > 0 ? enrichedHoldings[0].weight : 0;
    const top3Weight = enrichedHoldings.slice(0, 3).reduce((acc, h) => acc + h.weight, 0);
    const top5Weight = enrichedHoldings.slice(0, 5).reduce((acc, h) => acc + h.weight, 0);
    const hhi = enrichedHoldings.reduce((sum, h) => sum + Math.pow(h.weight * 100, 2), 0);

    // 5. Aggregate Sector Exposure
    const sectorMap = new Map();
    enrichedHoldings.forEach(h => {
      const existingVal = sectorMap.get(h.sector) || 0;
      sectorMap.set(h.sector, existingVal + h.currentValue);
    });

    const sectors = Array.from(sectorMap.entries()).map(([sectorName, val]) => ({
      sector: sectorName,
      value: val,
      percentage: totalEquity > 0 ? (val / totalEquity) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    // 6. Cross-link active MVP-38 MarketEvents on user holdings
    const recentEvents = await MarketEvent.find({
      user: userId,
      symbol: { $in: symbols },
      isDismissed: false
    }).sort({ occurredAt: -1 }).limit(10).lean().catch(() => []);

    const recentEventCrossLinks = recentEvents.map(evt => {
      const holding = enrichedHoldings.find(h => h.symbol === evt.symbol);
      return {
        eventId: evt._id,
        symbol: evt.symbol,
        title: evt.title,
        severity: evt.severity,
        portfolioWeight: holding ? Number((holding.weight * 100).toFixed(1)) : 0,
        occurredAt: evt.occurredAt
      };
    });

    // 7. Health Classification
    const health = this.classifyPortfolioHealth({
      totalPositions: enrichedHoldings.length,
      cashWeight,
      top1Weight,
      top3Weight,
      hhi
    });

    return {
      totalCapital,
      totalEquity,
      cashBalance,
      cashWeight,
      totalInvested,
      totalUnrealizedPnL,
      returnPercent,
      totalPositions: enrichedHoldings.length,
      holdings: enrichedHoldings,
      sectors,
      concentration: {
        top1Symbol: enrichedHoldings[0]?.symbol || null,
        top1Weight: Number((top1Weight * 100).toFixed(2)),
        top3Weight: Number((top3Weight * 100).toFixed(2)),
        top5Weight: Number((top5Weight * 100).toFixed(2)),
        hhi: Math.round(hhi)
      },
      health,
      recentEventCrossLinks
    };
  }

  /**
   * Dedicated exposure breakdown
   */
  async getExposure(userId) {
    const data = await this.getPortfolioIntelligence(userId);
    return {
      totalEquity: data.totalEquity,
      sectors: data.sectors,
      assetExposure: data.holdings.map(h => ({
        symbol: h.symbol,
        sector: h.sector,
        currentValue: h.currentValue,
        weightPercent: Number((h.weight * 100).toFixed(2))
      }))
    };
  }

  /**
   * Dedicated concentration metrics
   */
  async getConcentration(userId) {
    const data = await this.getPortfolioIntelligence(userId);
    return {
      totalPositions: data.totalPositions,
      concentration: data.concentration,
      health: data.health,
      topHoldings: data.holdings.slice(0, 5).map(h => ({
        symbol: h.symbol,
        value: h.currentValue,
        weight: Number((h.weight * 100).toFixed(2))
      }))
    };
  }
}

module.exports = new PortfolioIntelligenceService();
