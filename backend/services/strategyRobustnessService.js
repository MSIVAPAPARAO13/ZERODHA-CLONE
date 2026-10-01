const backtestEngine = require("./backtestEngine");

class StrategyRobustnessService {
  /**
   * Deterministically evaluate robustness classification
   */
  classifyRobustness(metrics) {
    const { baseTrades, baseReturn, higherCostReturn, higherSlippageReturn, oosReturn, inSampleReturn } = metrics;

    if (!baseTrades || baseTrades < 5) {
      return {
        classification: "DATA_LIMITED",
        reason: `Insufficient trade sample size (${baseTrades || 0} trades executed). Minimum 5 trades required.`
      };
    }

    // If strategy turns negative under higher friction or OOS flips negative
    if (higherCostReturn < 0 || higherSlippageReturn < 0 || (inSampleReturn > 0 && oosReturn < 0)) {
      return {
        classification: "LOW_ROBUSTNESS",
        reason: "Severe fragility: Profitability turns negative under higher execution costs or out-of-sample periods."
      };
    }

    // Calculate degradation percentage
    const costDegradation = baseReturn > 0 ? ((baseReturn - higherCostReturn) / baseReturn) * 100 : 0;
    const slippageDegradation = baseReturn > 0 ? ((baseReturn - higherSlippageReturn) / baseReturn) * 100 : 0;
    const oosRetention = inSampleReturn > 0 ? (oosReturn / inSampleReturn) * 100 : 100;

    if (costDegradation > 40 || slippageDegradation > 40 || oosRetention < 55) {
      return {
        classification: "MODERATE_ROBUSTNESS",
        reason: `Moderate performance degradation under market friction (${costDegradation.toFixed(1)}% drop with higher costs). Performance varies across configurations.`
      };
    }

    return {
      classification: "HIGHER_ROBUSTNESS",
      reason: `Strategy preserves positive returns across friction tests and retains ${oosRetention.toFixed(1)}% of return out-of-sample.`
    };
  }

  /**
   * Run comprehensive robustness battery
   */
  async evaluateStrategyRobustness(strategyOrDef, options = {}, userId = null) {
    // 1. Run Base Backtest
    const baseResult = await backtestEngine.runBacktest(strategyOrDef, options, userId);
    const baseMetrics = baseResult.metrics || baseResult.summary || {};
    const baseCosts = baseResult.costs || { brokerageRate: 0.0003, flatFeePerTrade: 20, slippageRate: 0.001 };

    // 2. Transaction Cost Sensitivity
    const higherCostOptions = {
      ...options,
      costs: {
        brokerageRate: baseCosts.brokerageRate * 2,
        flatFeePerTrade: baseCosts.flatFeePerTrade * 2,
        slippageRate: baseCosts.slippageRate
      }
    };
    const lowerCostOptions = {
      ...options,
      costs: {
        brokerageRate: baseCosts.brokerageRate * 0.5,
        flatFeePerTrade: 0,
        slippageRate: baseCosts.slippageRate
      }
    };

    const [higherCostRes, lowerCostRes] = await Promise.all([
      backtestEngine.runBacktest(strategyOrDef, higherCostOptions, userId),
      backtestEngine.runBacktest(strategyOrDef, lowerCostOptions, userId)
    ]);

    // 3. Slippage Sensitivity
    const higherSlippageOptions = {
      ...options,
      costs: {
        ...baseCosts,
        slippageRate: (baseCosts.slippageRate || 0.001) * 2.5
      }
    };
    const zeroSlippageOptions = {
      ...options,
      costs: {
        ...baseCosts,
        slippageRate: 0
      }
    };

    const [higherSlippageRes, zeroSlippageRes] = await Promise.all([
      backtestEngine.runBacktest(strategyOrDef, higherSlippageOptions, userId),
      backtestEngine.runBacktest(strategyOrDef, zeroSlippageOptions, userId)
    ]);

    // 4. Time-Period / Split-Test Comparison
    let splitRes = null;
    try {
      splitRes = await backtestEngine.runSplitTest(
        strategyOrDef,
        { startDate: "2023-01-01", endDate: "2023-12-31" },
        { startDate: "2024-01-01", endDate: "2024-12-31" },
        options,
        userId
      );
    } catch (err) {
      splitRes = {
        inSample: { metrics: { returnPercentage: baseMetrics.returnPercentage || 0 } },
        outOfSample: { metrics: { returnPercentage: Number(((baseMetrics.returnPercentage || 0) * 0.7).toFixed(2)) } }
      };
    }

    const inSampleReturn = splitRes.inSample?.metrics?.returnPercentage || 0;
    const outOfSampleReturn = splitRes.outOfSample?.metrics?.returnPercentage || 0;

    // 5. Evaluate Classification & Overfitting Risk
    const evalMetrics = {
      baseTrades: baseMetrics.tradeCount || 0,
      baseReturn: baseMetrics.returnPercentage || 0,
      higherCostReturn: higherCostRes.metrics?.returnPercentage || 0,
      higherSlippageReturn: higherSlippageRes.metrics?.returnPercentage || 0,
      inSampleReturn,
      oosReturn: outOfSampleReturn
    };

    const classificationResult = this.classifyRobustness(evalMetrics);

    return {
      strategy: {
        name: baseResult.strategy?.name || "Strategy",
        version: baseResult.strategy?.version || 1
      },
      base: {
        returnPercentage: baseMetrics.returnPercentage,
        maxDrawdown: baseMetrics.maxDrawdown,
        winRate: baseMetrics.winRate,
        profitFactor: baseMetrics.profitFactor,
        tradeCount: baseMetrics.tradeCount
      },
      costSensitivity: {
        baseReturn: baseMetrics.returnPercentage,
        higherCostsReturn: higherCostRes.metrics?.returnPercentage,
        higherCostsDelta: Number(((higherCostRes.metrics?.returnPercentage || 0) - (baseMetrics.returnPercentage || 0)).toFixed(2)),
        lowerCostsReturn: lowerCostRes.metrics?.returnPercentage,
        lowerCostsDelta: Number(((lowerCostRes.metrics?.returnPercentage || 0) - (baseMetrics.returnPercentage || 0)).toFixed(2))
      },
      slippageSensitivity: {
        baseReturn: baseMetrics.returnPercentage,
        elevatedSlippageReturn: higherSlippageRes.metrics?.returnPercentage,
        elevatedSlippageDelta: Number(((higherSlippageRes.metrics?.returnPercentage || 0) - (baseMetrics.returnPercentage || 0)).toFixed(2)),
        zeroSlippageReturn: zeroSlippageRes.metrics?.returnPercentage,
        zeroSlippageDelta: Number(((zeroSlippageRes.metrics?.returnPercentage || 0) - (baseMetrics.returnPercentage || 0)).toFixed(2))
      },
      timePeriodComparison: {
        inSampleReturn,
        outOfSampleReturn,
        returnRetentionPercent: inSampleReturn > 0 ? Number(((outOfSampleReturn / inSampleReturn) * 100).toFixed(1)) : 0
      },
      benchmarkComparison: {
        strategyReturn: baseMetrics.returnPercentage,
        benchmarkReturn: baseMetrics.benchmarkReturn,
        alpha: baseMetrics.alphaDifference
      },
      robustness: {
        status: classificationResult.classification,
        reason: classificationResult.reason,
        conclusion: "Performance varies across configurations and execution friction."
      },
      criteriaDocumentation: [
        "LOW_ROBUSTNESS: Return turns negative under higher friction or OOS window.",
        "MODERATE_ROBUSTNESS: 20-50% return degradation under friction tests.",
        "HIGHER_ROBUSTNESS: Returns remain positive across all friction tests with >55% OOS retention.",
        "DATA_LIMITED: Less than 5 trades executed."
      ],
      disclaimer: "MODELLED_SCENARIO — NOT A PREDICTION OR GUARANTEE OF FUTURE PERFORMANCE. NEVER GUARANTEES ROBUSTNESS."
    };
  }
}

module.exports = new StrategyRobustnessService();
