const crypto = require("crypto");
const { StrategyModel } = require("../models/StrategyModel");
const backtestEngine = require("./backtestEngine");

class StrategyVersioningService {
  /**
   * Deterministically compute a hash of all functional strategy parameters
   */
  computeParametersHash(strategyData) {
    const canonical = {
      universe: (strategyData.universe || []).slice().sort(),
      timeframe: strategyData.timeframe || "1day",
      benchmark: strategyData.benchmark || "NIFTY50",
      initialCapital: Number(strategyData.initialCapital) || 100000,
      positionSizing: {
        type: strategyData.positionSizing?.type || "PERCENT_EQUITY",
        value: Number(strategyData.positionSizing?.value) || 10
      },
      costs: {
        brokerageRate: Number(strategyData.costs?.brokerageRate) || 0.0003,
        flatFeePerTrade: Number(strategyData.costs?.flatFeePerTrade) || 20,
        slippageRate: Number(strategyData.costs?.slippageRate) || 0.001
      },
      entryRules: (strategyData.entryRules || []).map(r => ({
        indicator: r.indicator,
        condition: r.condition,
        params: r.params || {},
        threshold: r.threshold !== undefined ? r.threshold : null
      })),
      exitRules: (strategyData.exitRules || []).map(r => ({
        type: r.type,
        indicator: r.indicator || null,
        condition: r.condition || null,
        params: r.params || {},
        threshold: r.threshold !== undefined ? r.threshold : null
      }))
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(canonical))
      .digest("hex")
      .slice(0, 16);
  }

  /**
   * Save strategy with immutable versioning
   * If parameters changed, a new Strategy record is created rather than overwriting historical experiments
   */
  async saveStrategyVersion(userId, strategyData, existingStrategyId = null) {
    const parametersHash = this.computeParametersHash(strategyData);

    if (existingStrategyId) {
      const existing = await StrategyModel.findOne({
        _id: existingStrategyId,
        user: userId
      });

      if (existing) {
        // If parameters are identical, update metadata only (name, description)
        if (existing.parametersHash === parametersHash) {
          existing.name = strategyData.name ? strategyData.name.trim() : existing.name;
          if (strategyData.description !== undefined) {
            existing.description = strategyData.description.trim();
          }
          await existing.save();
          return { strategy: existing, isNewVersion: false };
        }

        // Parameters changed -> create a NEW immutable version
        const newVersionNumber = (existing.strategyVersion || existing.version || 1) + 1;
        const newVersionStrategy = await StrategyModel.create({
          user: userId,
          name: strategyData.name ? strategyData.name.trim() : existing.name,
          description: strategyData.description !== undefined ? strategyData.description.trim() : existing.description,
          version: newVersionNumber,
          strategyVersion: newVersionNumber,
          parametersHash,
          timeframe: strategyData.timeframe || existing.timeframe || "1day",
          universe: strategyData.universe || existing.universe,
          benchmark: strategyData.benchmark || existing.benchmark,
          initialCapital: strategyData.initialCapital || existing.initialCapital,
          positionSizing: strategyData.positionSizing || existing.positionSizing,
          costs: strategyData.costs || existing.costs,
          entryRules: strategyData.entryRules || existing.entryRules,
          exitRules: strategyData.exitRules || existing.exitRules,
          parentStrategyId: existing._id,
          rootStrategyId: existing.rootStrategyId || existing._id,
          createdAt: new Date()
        });

        return { strategy: newVersionStrategy, isNewVersion: true, previousVersionId: existing._id };
      }
    }

    // Completely new strategy
    const newStrategy = await StrategyModel.create({
      user: userId,
      name: strategyData.name ? strategyData.name.trim() : "Untitled Strategy",
      description: strategyData.description ? strategyData.description.trim() : "",
      version: 1,
      strategyVersion: 1,
      parametersHash,
      timeframe: strategyData.timeframe || "1day",
      universe: strategyData.universe || ["TCS", "INFY", "RELIANCE"],
      benchmark: strategyData.benchmark || "NIFTY50",
      initialCapital: strategyData.initialCapital || 100000,
      positionSizing: strategyData.positionSizing || { type: "PERCENT_EQUITY", value: 10 },
      costs: strategyData.costs || { brokerageRate: 0.0003, flatFeePerTrade: 20, slippageRate: 0.001 },
      entryRules: strategyData.entryRules || [],
      exitRules: strategyData.exitRules || [],
      parentStrategyId: null,
      rootStrategyId: null,
      createdAt: new Date()
    });

    return { strategy: newStrategy, isNewVersion: true, previousVersionId: null };
  }

  /**
   * Retrieves full version history of a strategy
   */
  async getStrategyVersionHistory(userId, strategyId) {
    const current = await StrategyModel.findOne({ _id: strategyId, user: userId }).lean();
    if (!current) return [];

    const rootId = current.rootStrategyId || current._id;

    const versions = await StrategyModel.find({
      user: userId,
      $or: [
        { _id: rootId },
        { rootStrategyId: rootId }
      ]
    })
      .sort({ strategyVersion: 1 })
      .lean();

    return versions;
  }

  /**
   * Compare two backtest experiments side-by-side
   */
  compareExperiments(resultA, resultB, labelA = "Strategy A", labelB = "Strategy B") {
    const summaryA = resultA?.summary || resultA || {};
    const summaryB = resultB?.summary || resultB || {};

    const retA = summaryA.totalReturnPercent || 0;
    const retB = summaryB.totalReturnPercent || 0;
    const ddA = summaryA.maxDrawdownPercent || 0;
    const ddB = summaryB.maxDrawdownPercent || 0;
    const winRateA = summaryA.winRatePercent || 0;
    const winRateB = summaryB.winRatePercent || 0;
    const pfA = summaryA.profitFactor || 0;
    const pfB = summaryB.profitFactor || 0;
    const tradesA = summaryA.totalTrades || 0;
    const tradesB = summaryB.totalTrades || 0;
    const benchA = summaryA.benchmarkReturnPercent || 0;
    const benchB = summaryB.benchmarkReturnPercent || 0;

    return {
      labelA,
      labelB,
      metrics: {
        totalReturn: { a: retA, b: retB, delta: Number((retA - retB).toFixed(2)) },
        maxDrawdown: { a: ddA, b: ddB, delta: Number((ddA - ddB).toFixed(2)) },
        winRate: { a: winRateA, b: winRateB, delta: Number((winRateA - winRateB).toFixed(2)) },
        profitFactor: { a: pfA, b: pfB, delta: Number((pfA - pfB).toFixed(2)) },
        tradeCount: { a: tradesA, b: tradesB, delta: tradesA - tradesB },
        benchmarkReturn: { a: benchA, b: benchB, delta: Number((benchA - benchB).toFixed(2)) }
      },
      conclusion: retA >= retB
        ? `${labelA} outperformed ${labelB} by ${Number((retA - retB).toFixed(2))}% return.`
        : `${labelB} outperformed ${labelA} by ${Number((retB - retA).toFixed(2))}% return.`,
      disclaimer: "HISTORICAL_BACKTEST_COMPARISON — NOT A GUARANTEE OF FUTURE PERFORMANCE"
    };
  }
}

module.exports = new StrategyVersioningService();
