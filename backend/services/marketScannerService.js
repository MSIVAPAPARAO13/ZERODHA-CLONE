const crypto = require('crypto');
const { ScannerModel } = require('../models/ScannerModel');
const marketDataService = require('./marketDataService');
const backtestEngine = require('./backtestEngine');
const scenarioEngine = require('./scenarioEngine');
const watchlistService = require('./watchlistService');
const { getVerifiedMetadata } = require('../config/marketMetadata');

const ENGINE_VERSION = '1.0.0-mvp36-scanner';

// In-memory cache for scanner indicators
const scannerCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Curated Scanner Research Presets
const CURATED_SCANS = [
  {
    _id: 'preset-momentum',
    name: 'Momentum Research',
    description: 'Screens for securities exhibiting bullish trend alignment (SMA20 > SMA50), solid momentum (RSI > 55), and positive daily price action.',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditionGroup: 'AND',
    version: 1,
    conditions: [
      {
        indicator: 'SMA',
        period: 20,
        operator: 'GREATER_THAN',
        compareTo: { indicator: 'SMA', period: 50 }
      },
      {
        indicator: 'RSI',
        period: 14,
        operator: 'GREATER_THAN',
        threshold: 55
      },
      {
        indicator: 'PRICE_CHANGE',
        period: 1,
        operator: 'GREATER_THAN',
        threshold: 0
      }
    ]
  },
  {
    _id: 'preset-breakout',
    name: 'Breakout Research',
    description: 'Screens for securities breaking above their 20-day high with expanding volume (> 1.2x 20-day volume average).',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditionGroup: 'AND',
    version: 1,
    conditions: [
      {
        indicator: 'DONCHIAN_BREAKOUT',
        period: 20,
        operator: 'CROSS_ABOVE',
        threshold: null
      },
      {
        indicator: 'VOLUME_SMA',
        period: 20,
        operator: 'GREATER_THAN_MULTIPLE',
        threshold: 1.2
      }
    ]
  },
  {
    _id: 'preset-trend',
    name: 'Trend Alignment',
    description: 'Identifies strong trending assets where current price trades above the 20-day EMA and the 20-day EMA exceeds the 50-day EMA.',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditionGroup: 'AND',
    version: 1,
    conditions: [
      {
        indicator: 'EMA',
        period: 20,
        operator: 'GREATER_THAN',
        compareTo: { indicator: 'PRICE' } // Price > EMA20 checked in evaluate
      },
      {
        indicator: 'EMA',
        period: 20,
        operator: 'GREATER_THAN',
        compareTo: { indicator: 'EMA', period: 50 }
      }
    ]
  },
  {
    _id: 'preset-volume-expansion',
    name: 'Volume Expansion',
    description: 'Identifies securities trading with abnormal institutional volume (> 1.5x 20-day volume average) and positive price advance.',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditionGroup: 'AND',
    version: 1,
    conditions: [
      {
        indicator: 'VOLUME_SMA',
        period: 20,
        operator: 'GREATER_THAN_MULTIPLE',
        threshold: 1.5
      },
      {
        indicator: 'PRICE_CHANGE',
        period: 1,
        operator: 'GREATER_THAN',
        threshold: 0.5
      }
    ]
  },
  {
    _id: 'preset-oversold-mean-reversion',
    name: 'Oversold Mean-Reversion Research',
    description: 'Identifies deeply oversold securities (RSI < 35) trading below their short-term moving average for counter-trend research.',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditionGroup: 'AND',
    version: 1,
    conditions: [
      {
        indicator: 'RSI',
        period: 14,
        operator: 'LESS_THAN',
        threshold: 35
      },
      {
        indicator: 'SMA',
        period: 20,
        operator: 'LESS_THAN',
        compareTo: { indicator: 'PRICE' }
      }
    ]
  },
  {
    _id: 'preset-relative-strength',
    name: 'Relative Strength Outperformance',
    description: 'Identifies securities outperforming the benchmark index (NIFTY 50) over the trailing 20 trading sessions.',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditionGroup: 'AND',
    version: 1,
    conditions: [
      {
        indicator: 'RELATIVE_STRENGTH',
        period: 20,
        operator: 'GREATER_THAN',
        threshold: 0
      }
    ]
  }
];

const DEFAULT_NIFTY_SYMBOLS = ['TCS', 'INFY', 'WIPRO', 'RELIANCE', 'ONGC', 'HUL', 'M&M', 'KPITTECH', 'QUICKHEAL'];

class MarketScannerService {
  constructor() {
    this.engineVersion = ENGINE_VERSION;
  }

  // --- 1. SCANNER RUN CORE ---

  async runScan(scannerOrDef, options = {}, userId = null) {
    const scanner = await this._resolveScanner(scannerOrDef, userId);
    const universe = await this._resolveUniverse(scanner, options, userId);
    const matchMode = options.matchMode || scanner.matchMode || 'STRICT';
    const conditionGroup = options.conditionGroup || scanner.conditionGroup || 'AND';
    const conditions = scanner.conditions || [];

    if (conditions.length === 0) {
      throw new Error('Scanner must contain at least one valid condition.');
    }

    if (universe.length === 0) {
      throw new Error('Scan universe is empty or contains no valid securities.');
    }

    // Benchmark candles for relative strength calculations
    const benchmarkCandles = await this._getBenchmarkCandles(options.benchmark || 'NIFTY50');

    const scanTimestamp = new Date().toISOString();
    const evaluatedCandidates = [];

    let advancingCount = 0;
    let decliningCount = 0;
    let unchangedCount = 0;
    let aboveSMA20Count = 0;
    let aboveSMA50Count = 0;

    for (const sym of universe) {
      try {
        const symbolData = await this._getSymbolMetrics(sym, benchmarkCandles);
        if (!symbolData) continue;

        const { currentPrice, changePercent, candles, indicators, relativeStrength20, dataSource } = symbolData;

        // Market breadth tracking
        if (changePercent > 0) advancingCount++;
        else if (changePercent < 0) decliningCount++;
        else unchangedCount++;

        const sma20 = indicators.sma20[indicators.sma20.length - 1];
        const sma50 = indicators.sma50[indicators.sma50.length - 1];
        if (sma20 && currentPrice > sma20) aboveSMA20Count++;
        if (sma50 && currentPrice > sma50) aboveSMA50Count++;

        // Evaluate conditions
        const ruleBreakdown = [];
        let matchedCount = 0;

        for (const cond of conditions) {
          const evalRes = this._evaluateCondition(cond, symbolData, candles);
          ruleBreakdown.push(evalRes);
          if (evalRes.passed) matchedCount++;
        }

        const coveragePercent = Math.round((matchedCount / conditions.length) * 100);

        let isMatch = false;
        if (conditionGroup === 'OR') {
          isMatch = matchedCount >= 1;
        } else {
          // AND logic
          if (matchMode === 'STRICT') {
            isMatch = matchedCount === conditions.length;
          } else {
            // NEAR match: at least 60% of conditions pass
            isMatch = matchedCount >= Math.ceil(conditions.length * 0.6);
          }
        }

        const metadata = getVerifiedMetadata(sym);

        evaluatedCandidates.push({
          symbol: sym,
          name: metadata?.name || sym,
          sector: metadata?.sector || 'Diversified',
          industry: metadata?.industry || 'General',
          currentPrice,
          changePercent,
          relativeStrength20,
          dataSource,
          isMatch,
          matchScore: `${matchedCount}/${conditions.length}`,
          coveragePercent,
          ruleBreakdown,
          timestamp: scanTimestamp
        });
      } catch (err) {
        // Continue scanning other symbols on individual symbol failure
      }
    }

    const matches = evaluatedCandidates.filter(c => c.isMatch);

    // Compute sector breakdown
    const sectorBreakdown = this._calculateSectorBreakdown(evaluatedCandidates, matches);

    // Compute deterministic result hash
    const resultHash = crypto.createHash('sha256')
      .update(`${scanner.name}_${scanner.version}_${universe.length}_${matches.length}_${scanTimestamp}_${ENGINE_VERSION}`)
      .digest('hex')
      .slice(0, 16);

    return {
      scanner: {
        id: scanner._id || scanner.id || 'custom-scan',
        name: scanner.name,
        version: scanner.version || 1,
        matchMode,
        conditionGroup,
        conditions
      },
      metadata: {
        engineVersion: ENGINE_VERSION,
        resultHash,
        scanTimestamp,
        dataSource: evaluatedCandidates.length > 0 ? evaluatedCandidates[0].dataSource : 'MOCK',
        universeType: scanner.universe,
        totalScanned: evaluatedCandidates.length,
        matchedCount: matches.length,
        matchRatePercent: evaluatedCandidates.length > 0 ? Math.round((matches.length / evaluatedCandidates.length) * 100) : 0,
        fundamentalStatus: 'PLANNED / Requires fundamental corporate data provider tier'
      },
      marketBreadth: {
        advancing: advancingCount,
        declining: decliningCount,
        unchanged: unchangedCount,
        aboveSMA20: aboveSMA20Count,
        aboveSMA50: aboveSMA50Count
      },
      sectorBreakdown,
      matches,
      allCandidates: evaluatedCandidates
    };
  }

  // --- 2. CONDITION EVALUATION ENGINE ---

  _evaluateCondition(cond, symbolData, candles) {
    const { currentPrice, indicators, relativeStrength20 } = symbolData;
    const lastIdx = candles.length - 1;
    const condName = this._formatConditionName(cond);

    if (candles.length < 2) {
      return {
        conditionName: condName,
        passed: false,
        calculatedValue: 'UNAVAILABLE',
        comparisonValue: 'N/A',
        statement: `✗ Insufficient historical data for ${cond.indicator}`
      };
    }

    let calculatedValue = null;
    let comparisonValue = null;
    let passed = false;

    if (cond.indicator === 'SMA') {
      const p = cond.period || 20;
      calculatedValue = indicators[`sma${p}`] ? indicators[`sma${p}`][lastIdx] : backtestEngine.calculateSMA(candles, p)[lastIdx];

      if (calculatedValue === null) {
        return {
          conditionName: condName,
          passed: false,
          calculatedValue: 'UNAVAILABLE',
          comparisonValue: 'N/A',
          statement: `✗ Insufficient history to calculate SMA(${p})`
        };
      }

      if (cond.compareTo?.indicator === 'SMA') {
        const slowP = cond.compareTo.period || 50;
        comparisonValue = indicators[`sma${slowP}`] ? indicators[`sma${slowP}`][lastIdx] : backtestEngine.calculateSMA(candles, slowP)[lastIdx];
      } else if (cond.compareTo?.indicator === 'PRICE') {
        comparisonValue = currentPrice;
      } else {
        comparisonValue = Number(cond.threshold);
      }

      if (cond.operator === 'GREATER_THAN') passed = calculatedValue > comparisonValue;
      if (cond.operator === 'LESS_THAN') passed = calculatedValue < comparisonValue;
      if (cond.operator === 'CROSS_ABOVE') {
        const prevCalc = indicators[`sma${p}`] ? indicators[`sma${p}`][lastIdx - 1] : calculatedValue;
        passed = prevCalc <= comparisonValue && calculatedValue > comparisonValue;
      }
    }

    if (cond.indicator === 'EMA') {
      const p = cond.period || 20;
      calculatedValue = indicators[`ema${p}`] ? indicators[`ema${p}`][lastIdx] : backtestEngine.calculateEMA(candles, p)[lastIdx];

      if (calculatedValue === null) {
        return {
          conditionName: condName,
          passed: false,
          calculatedValue: 'UNAVAILABLE',
          comparisonValue: 'N/A',
          statement: `✗ Insufficient history to calculate EMA(${p})`
        };
      }

      if (cond.compareTo?.indicator === 'EMA') {
        const slowP = cond.compareTo.period || 50;
        comparisonValue = indicators[`ema${slowP}`] ? indicators[`ema${slowP}`][lastIdx] : backtestEngine.calculateEMA(candles, slowP)[lastIdx];
      } else if (cond.compareTo?.indicator === 'PRICE') {
        // Special case: Price > EMA
        comparisonValue = calculatedValue;
        calculatedValue = currentPrice;
      } else {
        comparisonValue = Number(cond.threshold);
      }

      if (cond.operator === 'GREATER_THAN') passed = calculatedValue > comparisonValue;
      if (cond.operator === 'LESS_THAN') passed = calculatedValue < comparisonValue;
    }

    if (cond.indicator === 'RSI') {
      const p = cond.period || 14;
      calculatedValue = indicators[`rsi${p}`] ? indicators[`rsi${p}`][lastIdx] : backtestEngine.calculateRSI(candles, p)[lastIdx];

      if (calculatedValue === null) {
        return {
          conditionName: condName,
          passed: false,
          calculatedValue: 'UNAVAILABLE',
          comparisonValue: 'N/A',
          statement: `✗ Insufficient history to calculate RSI(${p})`
        };
      }

      comparisonValue = Number(cond.threshold);
      if (cond.operator === 'GREATER_THAN') passed = calculatedValue > comparisonValue;
      if (cond.operator === 'LESS_THAN') passed = calculatedValue < comparisonValue;
    }

    if (cond.indicator === 'VOLUME_SMA') {
      const p = cond.period || 20;
      const volSma = indicators[`volumeSma${p}`] ? indicators[`volumeSma${p}`][lastIdx] : backtestEngine.calculateVolumeSMA(candles, p)[lastIdx];
      const currVol = candles[lastIdx].volume || 1;

      if (!volSma || volSma === 0) {
        return {
          conditionName: condName,
          passed: false,
          calculatedValue: 'UNAVAILABLE',
          comparisonValue: 'N/A',
          statement: `✗ Volume history unavailable`
        };
      }

      const ratio = Math.round((currVol / volSma) * 100) / 100;
      calculatedValue = ratio;
      comparisonValue = Number(cond.threshold) || 1.2;

      passed = ratio >= comparisonValue;
    }

    if (cond.indicator === 'DONCHIAN_BREAKOUT') {
      const p = cond.period || 20;
      const breakout = indicators[`breakout${p}`] || backtestEngine.calculateBreakout(candles, p);
      const highChannel = breakout.highestHighs[lastIdx];

      if (highChannel === null) {
        return {
          conditionName: condName,
          passed: false,
          calculatedValue: 'UNAVAILABLE',
          comparisonValue: 'N/A',
          statement: `✗ Insufficient history for ${p}-day channel`
        };
      }

      calculatedValue = currentPrice;
      comparisonValue = highChannel;
      passed = currentPrice > highChannel;
    }

    if (cond.indicator === 'PRICE_CHANGE') {
      const p = cond.period || 1;
      calculatedValue = indicators[`priceChange${p}`] ? indicators[`priceChange${p}`][lastIdx] : backtestEngine.calculatePriceChange(candles, p)[lastIdx];
      comparisonValue = Number(cond.threshold) || 0;

      if (cond.operator === 'GREATER_THAN') passed = calculatedValue > comparisonValue;
      if (cond.operator === 'LESS_THAN') passed = calculatedValue < comparisonValue;
    }

    if (cond.indicator === 'RELATIVE_STRENGTH') {
      calculatedValue = relativeStrength20;
      comparisonValue = Number(cond.threshold) || 0;
      passed = relativeStrength20 > comparisonValue;
    }

    const statement = passed
      ? `✓ ${condName} (${calculatedValue} vs ${comparisonValue})`
      : `✗ ${condName} (${calculatedValue} vs ${comparisonValue})`;

    return {
      conditionName: condName,
      passed,
      calculatedValue,
      comparisonValue,
      statement
    };
  }

  // --- 3. CROSS-ENGINE INTEGRATION BRIDGES ---

  // Translate scanner rules to StrategyModel configuration for Strategy Lab
  translateToStrategy(scannerDef) {
    const entryRules = [];
    const exitRules = [{ type: 'STOP_LOSS', threshold: 5 }];

    for (const cond of (scannerDef.conditions || [])) {
      if (cond.indicator === 'SMA' && cond.compareTo?.indicator === 'SMA') {
        entryRules.push({
          indicator: 'SMA',
          params: { fastPeriod: cond.period, slowPeriod: cond.compareTo.period },
          condition: cond.operator === 'GREATER_THAN' ? 'CROSS_ABOVE' : 'CROSS_BELOW'
        });
        exitRules.unshift({
          type: 'SIGNAL',
          indicator: 'SMA',
          params: { fastPeriod: cond.period, slowPeriod: cond.compareTo.period },
          condition: 'CROSS_BELOW'
        });
      } else if (cond.indicator === 'RSI') {
        entryRules.push({
          indicator: 'RSI',
          params: { period: cond.period },
          condition: cond.operator,
          threshold: cond.threshold
        });
      } else if (cond.indicator === 'DONCHIAN_BREAKOUT') {
        entryRules.push({
          indicator: 'DONCHIAN_BREAKOUT',
          params: { period: cond.period },
          condition: 'CROSS_ABOVE'
        });
      }
    }

    return {
      name: `Strategy from Scan: ${scannerDef.name || 'Scanner Strategy'}`,
      description: `Automated backtesting strategy converted from scanner rules: ${scannerDef.name}`,
      universe: scannerDef.universe === 'NIFTY50' ? DEFAULT_NIFTY_SYMBOLS : (scannerDef.customSymbols || DEFAULT_NIFTY_SYMBOLS),
      benchmark: 'NIFTY50',
      initialCapital: 100000,
      positionSizing: { type: 'PERCENT_EQUITY', value: 20 },
      costs: { brokerageRate: 0.0003, flatFeePerTrade: 20, slippageRate: 0.001 },
      entryRules,
      exitRules
    };
  }

  async backtestScan(scannerDef, options = {}, userId = null) {
    const stratConfig = this.translateToStrategy(scannerDef);
    return await backtestEngine.runBacktest(stratConfig, options, userId);
  }

  async stressTestCandidates(symbols = [], scenarioIdOrDef = 'preset-it-correction', userId = null) {
    if (!symbols || symbols.length === 0) {
      throw new Error('Symbols basket cannot be empty for stress testing.');
    }

    // Execute scenario against current user portfolio, highlighting candidate basket
    // Also inject candidates as what-if positions if not already in portfolio so simulation is always rich
    const whatIfCandidates = symbols.map(sym => ({ symbol: sym.toUpperCase(), qty: 10, price: 1000 }));
    const scenarioRes = await scenarioEngine.runScenario(userId, scenarioIdOrDef, { 
      useLedgerPrices: false,
      whatIfPositions: whatIfCandidates
    });
    const symbolSet = new Set(symbols.map(s => s.toUpperCase()));

    let candidateImpact = 0;
    const candidatesAttribution = [];

    const allAttributions = [
      ...(scenarioRes.holdingAttribution || []),
      ...(scenarioRes.whatIfSimulation?.whatIfPositions || []).map(p => ({
        symbol: p.symbol,
        qty: p.qty,
        baselineValue: p.baselineValue,
        scenarioValue: p.scenarioValue,
        absoluteImpact: p.absoluteImpact,
        percentageImpact: p.percentageImpact,
        primaryShock: p.primaryShock
      }))
    ];

    for (const h of allAttributions) {
      if (symbolSet.has(h.symbol.toUpperCase())) {
        candidateImpact += (h.absoluteImpact || 0);
        candidatesAttribution.push(h);
      }
    }

    return {
      candidates: symbols,
      scenario: scenarioRes.scenario,
      totalPortfolioImpact: scenarioRes.portfolioImpact?.absoluteImpact || 0,
      candidateGroupImpact: candidateImpact,
      candidatesAttribution,
      statement: `Selected candidate basket (${symbols.join(', ')}) contributes ₹${candidateImpact.toLocaleString()} to modeled scenario drawdown.`
    };
  }

  synthesizeResearchQuestion(scanResult) {
    const scanName = scanResult.scanner?.name || 'Current Market Scan';
    const matchCount = scanResult.metadata?.matchedCount || 0;
    const topMatch = scanResult.matches?.[0]?.symbol || 'NIFTY Leader';

    return {
      question: `What structural factor characteristics unite the ${matchCount} securities matching "${scanName}", and how did candidates like ${topMatch} perform historically following similar technical alignment?`,
      components: {
        scanName,
        matchedCount: matchCount,
        topCandidate: topMatch,
        dataSource: scanResult.metadata?.dataSource || 'MarketDataService',
        unknown: 'Whether upcoming macro events and sector rotation will validate the scanned technical criteria.'
      }
    };
  }

  // --- HELPER METHODS ---

  async _resolveScanner(scannerOrDef, userId) {
    if (typeof scannerOrDef === 'string') {
      const preset = CURATED_SCANS.find(p => p._id === scannerOrDef);
      if (preset) return preset;

      const found = await ScannerModel.findOne({ _id: scannerOrDef, ...(userId ? { user: userId } : {}) });
      if (found) return found;

      throw new Error(`Scanner not found: ${scannerOrDef}`);
    }

    if (scannerOrDef && scannerOrDef.name) {
      return scannerOrDef;
    }

    throw new Error('Invalid scanner definition.');
  }

  async _resolveUniverse(scanner, options, userId) {
    const uniType = options.universe || scanner.universe || 'NIFTY50';

    if (uniType === 'WATCHLIST' && userId) {
      const wl = await watchlistService.getWatchlist(userId);
      const syms = wl.map(w => w.symbol).filter(Boolean);
      return syms.length > 0 ? syms : DEFAULT_NIFTY_SYMBOLS;
    }

    if (uniType === 'CUSTOM' && (options.customSymbols || scanner.customSymbols)) {
      const custom = options.customSymbols || scanner.customSymbols || [];
      return custom.length > 0 ? custom.slice(0, 100) : DEFAULT_NIFTY_SYMBOLS;
    }

    return DEFAULT_NIFTY_SYMBOLS;
  }

  async _getSymbolMetrics(symbol, benchmarkCandles) {
    // Check in-memory cache
    const cacheKey = `scan_metrics_${symbol.toUpperCase()}`;
    const cached = scannerCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const hist = await marketDataService.getHistoricalData(symbol, { days: 80, interval: '1day' });
    if (!hist || !hist.data || hist.data.length < 2) return null;

    const candles = [...hist.data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];

    const currentPrice = lastCandle.close;
    const changePercent = prevCandle.close > 0
      ? Math.round(((currentPrice - prevCandle.close) / prevCandle.close) * 10000) / 100
      : 0;

    const indicators = backtestEngine.precomputeIndicators(candles);

    // Calculate Relative Strength over 20 bars vs benchmark
    let relativeStrength20 = 0;
    if (candles.length >= 20 && benchmarkCandles.length >= 20) {
      const symRet = ((currentPrice - candles[candles.length - 20].close) / candles[candles.length - 20].close) * 100;
      const bLast = benchmarkCandles[benchmarkCandles.length - 1].close;
      const bPrev = benchmarkCandles[benchmarkCandles.length - 20].close;
      const bRet = bPrev > 0 ? ((bLast - bPrev) / bPrev) * 100 : 0;
      relativeStrength20 = Math.round((symRet - bRet) * 100) / 100;
    }

    const payload = {
      symbol: symbol.toUpperCase(),
      currentPrice,
      changePercent,
      candles,
      indicators,
      relativeStrength20,
      dataSource: hist.source || 'MOCK'
    };

    scannerCache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return payload;
  }

  async _getBenchmarkCandles(benchmarkSymbol) {
    try {
      const bHist = await marketDataService.getHistoricalData(benchmarkSymbol, { days: 80, interval: '1day' });
      if (bHist && bHist.data) {
        return [...bHist.data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }
    } catch (err) {
      // Fallback
    }
    return [];
  }

  _calculateSectorBreakdown(allCandidates, matches) {
    const sectorStats = {};
    for (const c of allCandidates) {
      const sec = c.sector || 'Diversified';
      if (!sectorStats[sec]) sectorStats[sec] = { sector: sec, totalInUniverse: 0, matchesCount: 0 };
      sectorStats[sec].totalInUniverse++;
    }

    for (const m of matches) {
      const sec = m.sector || 'Diversified';
      if (sectorStats[sec]) sectorStats[sec].matchesCount++;
    }

    return Object.values(sectorStats).map(s => ({
      ...s,
      matchPercentage: s.totalInUniverse > 0 ? Math.round((s.matchesCount / s.totalInUniverse) * 100) : 0
    }));
  }

  _formatConditionName(cond) {
    if (cond.indicator === 'SMA' && cond.compareTo?.indicator === 'SMA') {
      return `SMA(${cond.period}) ${cond.operator} SMA(${cond.compareTo.period})`;
    }
    if (cond.indicator === 'EMA' && cond.compareTo?.indicator === 'EMA') {
      return `EMA(${cond.period}) ${cond.operator} EMA(${cond.compareTo.period})`;
    }
    if (cond.indicator === 'VOLUME_SMA') {
      return `Volume > ${cond.threshold}× SMA(${cond.period})`;
    }
    if (cond.indicator === 'DONCHIAN_BREAKOUT') {
      return `Close > ${cond.period}-Day High`;
    }
    if (cond.indicator === 'RELATIVE_STRENGTH') {
      return `Relative Strength(${cond.period}) > ${cond.threshold}%`;
    }
    return `${cond.indicator}(${cond.period}) ${cond.operator} ${cond.threshold || ''}`;
  }

  getCuratedPresets() {
    return CURATED_SCANS;
  }
}

module.exports = new MarketScannerService();
