const MarketRegime = require("../models/MarketRegimeModel");
const MarketEvent = require("../models/MarketEventModel");
const marketDataService = require("./marketDataService");
const marketEventService = require("./marketEventService");

const DEFAULT_MARKET_UNIVERSE = [
  "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK",
  "SBIN", "BHARTIARTL", "ITC", "LT", "HINDUNILVR"
];

class MarketRegimeService {
  /**
   * Deterministically classify market regime from observable market metrics.
   * Not a predictive engine.
   */
  classifyRegime(metrics) {
    const { sampleSize, advancingPercent, decliningPercent, averageVolatility } = metrics;

    if (!sampleSize || sampleSize < 2) {
      return "DATA_LIMITED";
    }

    if (averageVolatility >= 3.0) {
      return "HIGH_VOLATILITY";
    }

    if (advancingPercent >= 65) {
      return "TRENDING_UP";
    }

    if (decliningPercent >= 65) {
      return "TRENDING_DOWN";
    }

    if (averageVolatility < 1.0 && Math.abs(advancingPercent - 50) < 15) {
      return "LOW_VOLATILITY";
    }

    if (Math.abs(advancingPercent - decliningPercent) < 20 && averageVolatility < 2.5) {
      return "RANGE_BOUND";
    }

    return "MIXED";
  }

  /**
   * Compute transparent market metrics from quotes
   */
  computeMetrics(quotes) {
    if (!quotes || quotes.length === 0) {
      return {
        trend: "UNKNOWN",
        advancingPercent: 0,
        decliningPercent: 0,
        breadthRatio: 1,
        averageVolatility: 0,
        volatilityLevel: "UNKNOWN",
        sampleSize: 0
      };
    }

    let advancing = 0;
    let declining = 0;
    let totalAbsChange = 0;

    quotes.forEach(q => {
      const pct = typeof q.percentChange === "number" ? q.percentChange : (q.changePercent || 0);
      if (pct > 0.05) advancing++;
      else if (pct < -0.05) declining++;
      totalAbsChange += Math.abs(pct);
    });

    const sampleSize = quotes.length;
    const advancingPercent = Math.round((advancing / sampleSize) * 100);
    const decliningPercent = Math.round((declining / sampleSize) * 100);
    const breadthRatio = declining === 0 ? (advancing || 1) : Number((advancing / declining).toFixed(2));
    const averageVolatility = Number((totalAbsChange / sampleSize).toFixed(2));

    let volatilityLevel = "NORMAL";
    if (averageVolatility >= 2.5) volatilityLevel = "ELEVATED";
    else if (averageVolatility < 1.0) volatilityLevel = "LOW";

    let trend = "FLAT";
    if (advancingPercent >= 60) trend = "UP";
    else if (decliningPercent >= 60) trend = "DOWN";

    return {
      trend,
      advancingPercent,
      decliningPercent,
      breadthRatio,
      averageVolatility,
      volatilityLevel,
      sampleSize
    };
  }

  /**
   * Builds deterministic evidence lines
   */
  generateEvidence(metrics, regime) {
    const { trend, advancingPercent, decliningPercent, breadthRatio, averageVolatility, volatilityLevel, sampleSize } = metrics;
    return [
      `Universe Sample Size: ${sampleSize} tracked benchmark & monitored assets`,
      `Observable Trend Direction: ${trend} (${advancingPercent}% advancing vs ${decliningPercent}% declining)`,
      `Market Breadth Ratio: ${breadthRatio} advance/decline ratio`,
      `Average Absolute Price Volatility: ${averageVolatility}% (${volatilityLevel})`,
      `Deterministic Regime Classification: ${regime}`
    ];
  }

  /**
   * Evaluates current market regime for a user, records history, and emits event if changed
   */
  async detectCurrentRegime(userId, options = {}) {
    let symbols = options.symbols;
    if (!symbols || symbols.length === 0) {
      // Gather user's monitored symbols or fallback to benchmark
      try {
        const monitored = await marketEventService.getMonitoredSymbols(userId);
        symbols = monitored && monitored.size >= 3 ? Array.from(monitored) : DEFAULT_MARKET_UNIVERSE;
      } catch (err) {
        symbols = DEFAULT_MARKET_UNIVERSE;
      }
    }

    // Fetch quotes through MarketDataService
    let quotes = [];
    try {
      quotes = await marketDataService.getQuotes(symbols);
    } catch (err) {
      quotes = [];
    }

    const metrics = this.computeMetrics(quotes);
    const regime = this.classifyRegime(metrics);
    const evidence = this.generateEvidence(metrics, regime);

    // Check previous regime to detect transition
    const lastRecord = await MarketRegime.findOne({ user: userId }).sort({ createdAt: -1 });

    let previousRegime = lastRecord ? lastRecord.regime : null;
    let changedAt = lastRecord ? lastRecord.changedAt : new Date();
    let transitionDetected = false;

    if (lastRecord && lastRecord.regime !== regime && regime !== "DATA_LIMITED") {
      transitionDetected = true;
      previousRegime = lastRecord.regime;
      changedAt = new Date();

      // Emit MARKET_REGIME_CHANGE event into MarketEventModel
      try {
        const dedupeKey = marketEventService.generateDedupeKey(userId, "MARKET", "MARKET_REGIME_CHANGE", changedAt);
        await MarketEvent.findOneAndUpdate(
          { dedupeKey },
          {
            $set: {
              user: userId,
              symbol: "MARKET",
              eventType: "MARKET_REGIME_CHANGE",
              severity: "CRITICAL",
              category: "MARKET",
              title: `Market Regime Transition: ${previousRegime} → ${regime}`,
              description: `Observable market state transitioned from ${previousRegime} to ${regime}. Breadth: ${metrics.advancingPercent}% advancing, Volatility: ${metrics.averageVolatility}%.`,
              observedData: [
                { metric: "previousRegime", value: previousRegime },
                { metric: "currentRegime", value: regime },
                { metric: "breadthRatio", value: metrics.breadthRatio },
                { metric: "averageVolatility", value: metrics.averageVolatility, unit: "%" }
              ],
              sources: [{ sourceType: "MARKET_DATA", details: { sampleSize: metrics.sampleSize } }],
              dedupeKey,
              timestamp: changedAt
            }
          },
          { upsert: true, new: true }
        );
      } catch (eventErr) {
        // Safe logging without breaking regime detection
      }
    }

    // Persist current snapshot
    const savedRegime = await MarketRegime.create({
      user: userId,
      regime,
      previousRegime,
      changedAt,
      metrics,
      evidence,
      notes: "DETERMINISTIC_REGIME_CLASSIFICATION — NOT A FINANCIAL PREDICTION"
    });

    return {
      regime,
      previousRegime,
      changedAt,
      transitionDetected,
      metrics,
      evidence,
      notes: savedRegime.notes,
      _id: savedRegime._id
    };
  }

  /**
   * Retrieves historical market regime snapshots
   */
  async getRegimeHistory(userId, limit = 20) {
    return MarketRegime.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
  }
}

module.exports = new MarketRegimeService();
