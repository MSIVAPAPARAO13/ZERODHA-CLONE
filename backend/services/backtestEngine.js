const crypto = require('crypto');
const { StrategyModel } = require('../models/StrategyModel');
const { PlaybookModel } = require('../models/PlaybookModel');
const { TradeJournalModel } = require('../models/TradeJournalModel');
const marketDataService = require('./marketDataService');
const scenarioEngine = require('./scenarioEngine');

const ENGINE_VERSION = '2.0.0-mvp35-research';

// In-memory cache for deterministic backtest runs
const backtestCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Curated Strategy Presets
const CURATED_STRATEGIES = [
  {
    _id: 'preset-momentum-sma',
    name: 'Momentum Moving Average Breakout',
    description: 'Trend-following strategy that buys when the short-term trend crosses above the medium-term trend and rides the momentum.',
    version: 1,
    universe: ['TCS', 'INFY', 'RELIANCE'],
    benchmark: 'NIFTY50',
    initialCapital: 100000,
    positionSizing: { type: 'PERCENT_EQUITY', value: 20 },
    costs: { brokerageRate: 0.0003, flatFeePerTrade: 20, slippageRate: 0.001 },
    entryRules: [
      {
        indicator: 'SMA',
        params: { fastPeriod: 10, slowPeriod: 30 },
        condition: 'CROSS_ABOVE',
        threshold: null
      }
    ],
    exitRules: [
      {
        type: 'SIGNAL',
        indicator: 'SMA',
        params: { fastPeriod: 10, slowPeriod: 30 },
        condition: 'CROSS_BELOW',
        threshold: null
      },
      {
        type: 'STOP_LOSS',
        threshold: 5 // 5% stop loss
      }
    ]
  },
  {
    _id: 'preset-rsi-oversold',
    name: 'Mean Reversion RSI Oversold',
    description: 'Counter-trend strategy entering when market is deeply oversold (RSI < 30) and exiting on mean reversion (RSI > 60) or strict stop loss.',
    version: 1,
    universe: ['TCS', 'INFY', 'WIPRO'],
    benchmark: 'NIFTY50',
    initialCapital: 100000,
    positionSizing: { type: 'PERCENT_EQUITY', value: 25 },
    costs: { brokerageRate: 0.0003, flatFeePerTrade: 20, slippageRate: 0.001 },
    entryRules: [
      {
        indicator: 'RSI',
        params: { period: 14 },
        condition: 'LESS_THAN',
        threshold: 35
      }
    ],
    exitRules: [
      {
        type: 'SIGNAL',
        indicator: 'RSI',
        params: { period: 14 },
        condition: 'GREATER_THAN',
        threshold: 60
      },
      {
        type: 'STOP_LOSS',
        threshold: 4
      }
    ]
  },
  {
    _id: 'preset-donchian-breakout',
    name: 'Donchian Channel Breakout',
    description: 'Richard Dennis Turtle-style breakout buying new 20-day highs and exiting on 10-day lows.',
    version: 1,
    universe: ['RELIANCE', 'TCS', 'ONGC'],
    benchmark: 'NIFTY50',
    initialCapital: 100000,
    positionSizing: { type: 'PERCENT_EQUITY', value: 30 },
    costs: { brokerageRate: 0.0003, flatFeePerTrade: 20, slippageRate: 0.001 },
    entryRules: [
      {
        indicator: 'DONCHIAN_BREAKOUT',
        params: { period: 20 },
        condition: 'CROSS_ABOVE',
        threshold: null
      }
    ],
    exitRules: [
      {
        type: 'SIGNAL',
        indicator: 'DONCHIAN_BREAKOUT',
        params: { period: 10 },
        condition: 'CROSS_BELOW',
        threshold: null
      },
      {
        type: 'STOP_LOSS',
        threshold: 6
      }
    ]
  }
];

class BacktestEngine {
  constructor() {
    this.engineVersion = ENGINE_VERSION;
  }

  // --- 1. TECHNICAL INDICATORS MATH ---

  calculateSMA(candles, period) {
    const results = new Array(candles.length).fill(null);
    if (!candles || candles.length < period) return results;

    let sum = 0;
    for (let i = 0; i < candles.length; i++) {
      sum += candles[i].close;
      if (i >= period) {
        sum -= candles[i - period].close;
      }
      if (i >= period - 1) {
        results[i] = Math.round((sum / period) * 100) / 100;
      }
    }
    return results;
  }

  calculateEMA(candles, period) {
    const results = new Array(candles.length).fill(null);
    if (!candles || candles.length < period) return results;

    const k = 2 / (period + 1);
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += candles[i].close;
    }
    let ema = sum / period;
    results[period - 1] = Math.round(ema * 100) / 100;

    for (let i = period; i < candles.length; i++) {
      ema = candles[i].close * k + ema * (1 - k);
      results[i] = Math.round(ema * 100) / 100;
    }
    return results;
  }

  calculateRSI(candles, period = 14) {
    const results = new Array(candles.length).fill(null);
    if (!candles || candles.length <= period) return results;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change >= 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    if (avgLoss === 0) results[period] = 100;
    else {
      const rs = avgGain / avgLoss;
      results[period] = Math.round((100 - (100 / (1 + rs))) * 100) / 100;
    }

    for (let i = period + 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      const currentGain = change > 0 ? change : 0;
      const currentLoss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

      if (avgLoss === 0) results[i] = 100;
      else {
        const rs = avgGain / avgLoss;
        results[i] = Math.round((100 - (100 / (1 + rs))) * 100) / 100;
      }
    }
    return results;
  }

  calculatePriceChange(candles, period = 1) {
    const results = new Array(candles.length).fill(null);
    if (!candles || candles.length <= period) return results;

    for (let i = period; i < candles.length; i++) {
      const prev = candles[i - period].close;
      const curr = candles[i].close;
      results[i] = prev > 0 ? Math.round(((curr - prev) / prev) * 10000) / 100 : 0;
    }
    return results;
  }

  calculateVolumeSMA(candles, period = 20) {
    const results = new Array(candles.length).fill(null);
    if (!candles || candles.length < period) return results;

    let sum = 0;
    for (let i = 0; i < candles.length; i++) {
      sum += candles[i].volume || 0;
      if (i >= period) {
        sum -= candles[i - period].volume || 0;
      }
      if (i >= period - 1) {
        results[i] = Math.round(sum / period);
      }
    }
    return results;
  }

  calculateBreakout(candles, period = 20) {
    // Strictly uses PRIOR period bars [i - period ... i - 1] to prevent look-ahead bias
    const highestHighs = new Array(candles.length).fill(null);
    const lowestLows = new Array(candles.length).fill(null);

    if (!candles || candles.length <= period) return { highestHighs, lowestLows };

    for (let i = period; i < candles.length; i++) {
      let maxH = -Infinity;
      let minL = Infinity;
      for (let j = i - period; j < i; j++) {
        if (candles[j].high > maxH) maxH = candles[j].high;
        if (candles[j].low < minL) minL = candles[j].low;
      }
      highestHighs[i] = maxH;
      lowestLows[i] = minL;
    }
    return { highestHighs, lowestLows };
  }

  // Precompute indicator series for a symbol's candle list
  precomputeIndicators(candles) {
    return {
      sma10: this.calculateSMA(candles, 10),
      sma20: this.calculateSMA(candles, 20),
      sma30: this.calculateSMA(candles, 30),
      sma50: this.calculateSMA(candles, 50),
      sma100: this.calculateSMA(candles, 100),
      ema10: this.calculateEMA(candles, 10),
      ema20: this.calculateEMA(candles, 20),
      ema50: this.calculateEMA(candles, 50),
      rsi14: this.calculateRSI(candles, 14),
      priceChange1: this.calculatePriceChange(candles, 1),
      priceChange5: this.calculatePriceChange(candles, 5),
      volumeSma20: this.calculateVolumeSMA(candles, 20),
      breakout20: this.calculateBreakout(candles, 20),
      breakout10: this.calculateBreakout(candles, 10)
    };
  }

  // Evaluate rule on bar index t
  evaluateRule(rule, barIdx, candles, indicators, openPosition = null) {
    if (barIdx < 1 || !candles[barIdx]) return false;

    // Stop Loss / Take Profit / Max Holding Days checks
    if (rule.type === 'STOP_LOSS') {
      if (!openPosition) return false;
      const stopPercent = Number(rule.threshold) || 5;
      const entryPrice = openPosition.entryPrice;
      const stopPrice = entryPrice * (1 - stopPercent / 100);
      return candles[barIdx].low <= stopPrice;
    }

    if (rule.type === 'TAKE_PROFIT') {
      if (!openPosition) return false;
      const targetPercent = Number(rule.threshold) || 10;
      const entryPrice = openPosition.entryPrice;
      const targetPrice = entryPrice * (1 + targetPercent / 100);
      return candles[barIdx].high >= targetPrice;
    }

    if (rule.type === 'MAX_HOLDING_DAYS') {
      if (!openPosition) return false;
      const maxDays = Number(rule.threshold) || 30;
      return openPosition.barsHeld >= maxDays;
    }

    // Indicator Rules
    const ind = rule.indicator;
    const cond = rule.condition;

    if (ind === 'SMA') {
      const fastP = rule.params?.fastPeriod || 10;
      const slowP = rule.params?.slowPeriod || 30;
      const fastSeries = indicators[`sma${fastP}`] || this.calculateSMA(candles, fastP);
      const slowSeries = indicators[`sma${slowP}`] || this.calculateSMA(candles, slowP);

      const fastCurr = fastSeries[barIdx];
      const fastPrev = fastSeries[barIdx - 1];
      const slowCurr = slowSeries[barIdx];
      const slowPrev = slowSeries[barIdx - 1];

      if (fastCurr === null || slowCurr === null || fastPrev === null || slowPrev === null) return false;

      if (cond === 'CROSS_ABOVE') return fastPrev <= slowPrev && fastCurr > slowCurr;
      if (cond === 'CROSS_BELOW') return fastPrev >= slowPrev && fastCurr < slowCurr;
      if (cond === 'GREATER_THAN') return fastCurr > slowCurr;
      if (cond === 'LESS_THAN') return fastCurr < slowCurr;
    }

    if (ind === 'EMA') {
      const fastP = rule.params?.fastPeriod || 10;
      const slowP = rule.params?.slowPeriod || 20;
      const fastSeries = indicators[`ema${fastP}`] || this.calculateEMA(candles, fastP);
      const slowSeries = indicators[`ema${slowP}`] || this.calculateEMA(candles, slowP);

      const fastCurr = fastSeries[barIdx];
      const fastPrev = fastSeries[barIdx - 1];
      const slowCurr = slowSeries[barIdx];
      const slowPrev = slowSeries[barIdx - 1];

      if (fastCurr === null || slowCurr === null) return false;

      if (cond === 'CROSS_ABOVE') return fastPrev <= slowPrev && fastCurr > slowCurr;
      if (cond === 'CROSS_BELOW') return fastPrev >= slowPrev && fastCurr < slowCurr;
      if (cond === 'GREATER_THAN') return fastCurr > slowCurr;
      if (cond === 'LESS_THAN') return fastCurr < slowCurr;
    }

    if (ind === 'RSI') {
      const period = rule.params?.period || 14;
      const rsiSeries = indicators[`rsi${period}`] || this.calculateRSI(candles, period);
      const rsiCurr = rsiSeries[barIdx];
      const rsiPrev = rsiSeries[barIdx - 1];
      const thresh = Number(rule.threshold) || 30;

      if (rsiCurr === null) return false;

      if (cond === 'LESS_THAN') return rsiCurr < thresh;
      if (cond === 'GREATER_THAN') return rsiCurr > thresh;
      if (cond === 'CROSS_ABOVE') return rsiPrev !== null && rsiPrev <= thresh && rsiCurr > thresh;
      if (cond === 'CROSS_BELOW') return rsiPrev !== null && rsiPrev >= thresh && rsiCurr < thresh;
    }

    if (ind === 'DONCHIAN_BREAKOUT') {
      const period = rule.params?.period || 20;
      const breakout = indicators[`breakout${period}`] || this.calculateBreakout(candles, period);
      const highChannel = breakout.highestHighs[barIdx];
      const lowChannel = breakout.lowestLows[barIdx];

      if (highChannel === null || lowChannel === null) return false;

      if (cond === 'CROSS_ABOVE') return candles[barIdx].close > highChannel;
      if (cond === 'CROSS_BELOW') return candles[barIdx].close < lowChannel;
    }

    if (ind === 'PRICE_CHANGE') {
      const period = rule.params?.period || 1;
      const pcSeries = indicators[`priceChange${period}`] || this.calculatePriceChange(candles, period);
      const pcCurr = pcSeries[barIdx];
      const thresh = Number(rule.threshold) || 0;

      if (pcCurr === null) return false;
      if (cond === 'GREATER_THAN') return pcCurr > thresh;
      if (cond === 'LESS_THAN') return pcCurr < thresh;
    }

    return false;
  }

  // --- 2. BACKTEST SIMULATION CORE ---

  async runBacktest(strategyOrDef, options = {}, userId = null) {
    const strategy = await this._resolveStrategy(strategyOrDef, userId);
    const universe = options.universe || (strategy.universe && strategy.universe.length > 0 ? strategy.universe : null) || ['TCS', 'INFY', 'RELIANCE'];
    if (!options.universe && strategy.universe && strategy.universe.length === 0) {
      throw new Error('Strategy universe cannot be empty.');
    }
    if (options.universe && options.universe.length === 0) {
      throw new Error('Strategy universe cannot be empty.');
    }
    const benchmarkSymbol = options.benchmark || strategy.benchmark || 'NIFTY50';
    const initialCapital = Number(options.initialCapital || strategy.initialCapital || 100000);
    const costs = {
      brokerageRate: options.costs?.brokerageRate !== undefined ? Number(options.costs.brokerageRate) : (strategy.costs?.brokerageRate ?? 0.0003),
      flatFeePerTrade: options.costs?.flatFeePerTrade !== undefined ? Number(options.costs.flatFeePerTrade) : (strategy.costs?.flatFeePerTrade ?? 20),
      slippageRate: options.costs?.slippageRate !== undefined ? Number(options.costs.slippageRate) : (strategy.costs?.slippageRate ?? 0.001)
    };
    const positionSizing = options.positionSizing || strategy.positionSizing || { type: 'PERCENT_EQUITY', value: 10 };

    // Fetch historical candles for each symbol and benchmark
    const symbolCandles = {};
    const symbolIndicators = {};
    let allDatesSet = new Set();

    for (const sym of universe) {
      const hist = await marketDataService.getHistoricalData(sym, {
        startDate: options.startDate,
        endDate: options.endDate,
        interval: '1day'
      });
      if (hist && hist.data && hist.data.length > 0) {
        // Sort chronologically oldest -> newest
        const sorted = [...hist.data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        symbolCandles[sym] = sorted;
        symbolIndicators[sym] = this.precomputeIndicators(sorted);
        sorted.forEach(c => allDatesSet.add(c.timestamp));
      }
    }

    // Benchmark candles
    let benchmarkCandles = [];
    const bHist = await marketDataService.getHistoricalData(benchmarkSymbol, {
      startDate: options.startDate,
      endDate: options.endDate,
      interval: '1day'
    });
    if (bHist && bHist.data && bHist.data.length > 0) {
      benchmarkCandles = [...bHist.data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      benchmarkCandles.forEach(c => allDatesSet.add(c.timestamp));
    }

    const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));

    if (sortedDates.length === 0) {
      throw new Error('Historical data unavailable for requested universe and date range.');
    }

    // Build index mappings by date for fast lookup
    const dateToSymbolBar = {};
    for (const sym of Object.keys(symbolCandles)) {
      dateToSymbolBar[sym] = {};
      symbolCandles[sym].forEach((c, idx) => {
        dateToSymbolBar[sym][c.timestamp] = { candle: c, idx };
      });
    }

    const dateToBenchmarkPrice = {};
    benchmarkCandles.forEach(c => {
      dateToBenchmarkPrice[c.timestamp] = c.close;
    });

    // --- SIMULATION LEDGER ---
    let simulatedCash = initialCapital;
    let openPositions = {}; // symbol -> { symbol, quantity, entryPrice, entryDate, barsHeld, stopLossPrice, takeProfitPrice }
    const tradeLedger = [];
    const equityCurve = [];

    let peakEquity = initialCapital;
    let maxDrawdown = 0;
    let maxDrawdownDurationDays = 0;
    let currentDdStart = null;
    let currentDdDuration = 0;
    const topDrawdowns = [];

    // Signals queued on Bar T for execution on Bar T+1 (Strict zero look-ahead)
    let pendingSignals = []; // array of { action: 'BUY'|'SELL', symbol, signalDate, reason }

    const initialBenchmarkPrice = benchmarkCandles.length > 0 ? benchmarkCandles[0].close : null;

    for (let t = 0; t < sortedDates.length; t++) {
      const currentDate = sortedDates[t];

      // 1. EXECUTE PENDING SIGNALS FROM BAR T-1 AT TODAY'S OPEN / REFERENCE PRICE
      for (const sig of pendingSignals) {
        const barInfo = dateToSymbolBar[sig.symbol]?.[currentDate];
        if (!barInfo) continue;
        const candle = barInfo.candle;
        const refPrice = candle.open || candle.close;

        if (sig.action === 'SELL' && openPositions[sig.symbol]) {
          const pos = openPositions[sig.symbol];
          const execPrice = Math.round((refPrice * (1 - costs.slippageRate)) * 100) / 100;
          const grossValue = pos.quantity * execPrice;
          const fee = costs.flatFeePerTrade + Math.round((grossValue * costs.brokerageRate) * 100) / 100;
          const netValue = grossValue - fee;

          simulatedCash += netValue;
          const entryValue = pos.quantity * pos.entryPrice;
          const grossPnL = grossValue - entryValue;
          const netPnL = grossPnL - fee - pos.entryFee;
          const returnPct = entryValue > 0 ? Math.round((netPnL / entryValue) * 10000) / 100 : 0;

          tradeLedger.push({
            tradeId: `TRD-${tradeLedger.length + 1}`,
            symbol: sig.symbol,
            side: 'SELL',
            quantity: pos.quantity,
            entryDate: pos.entryDate,
            exitDate: currentDate,
            entryPrice: pos.entryPrice,
            exitPrice: execPrice,
            fees: Math.round((pos.entryFee + fee) * 100) / 100,
            slippageCost: Math.round((pos.quantity * refPrice * costs.slippageRate * 2) * 100) / 100,
            grossPnL: Math.round(grossPnL * 100) / 100,
            netPnL: Math.round(netPnL * 100) / 100,
            returnPercent: returnPct,
            holdingPeriodDays: pos.barsHeld,
            exitReason: sig.reason || 'SIGNAL'
          });

          delete openPositions[sig.symbol];
        } else if (sig.action === 'BUY' && !openPositions[sig.symbol]) {
          // Calculate allocation
          const currentTotalEquity = simulatedCash + Object.values(openPositions).reduce((acc, p) => {
            const pCandle = dateToSymbolBar[p.symbol]?.[currentDate]?.candle;
            return acc + (p.quantity * (pCandle ? pCandle.close : p.entryPrice));
          }, 0);

          let targetCashAllocation = 0;
          if (positionSizing.type === 'PERCENT_EQUITY') {
            targetCashAllocation = currentTotalEquity * ((positionSizing.value || 10) / 100);
          } else if (positionSizing.type === 'FIXED_AMOUNT') {
            targetCashAllocation = Number(positionSizing.value) || 20000;
          } else if (positionSizing.type === 'FIXED_QUANTITY') {
            targetCashAllocation = (Number(positionSizing.value) || 10) * refPrice;
          }

          // Cap target allocation to available cash
          const cashAvailableForBuy = Math.min(simulatedCash * 0.98, targetCashAllocation);
          const execPrice = Math.round((refPrice * (1 + costs.slippageRate)) * 100) / 100;
          const quantity = Math.floor(cashAvailableForBuy / execPrice);

          if (quantity > 0) {
            const grossValue = quantity * execPrice;
            const fee = costs.flatFeePerTrade + Math.round((grossValue * costs.brokerageRate) * 100) / 100;
            const totalOutlay = grossValue + fee;

            if (simulatedCash >= totalOutlay) {
              simulatedCash -= totalOutlay;
              openPositions[sig.symbol] = {
                symbol: sig.symbol,
                quantity,
                entryPrice: execPrice,
                entryFee: fee,
                entryDate: currentDate,
                barsHeld: 0
              };
            }
          }
        }
      }
      pendingSignals = [];

      // 2. CHECK EXITS & INTRADAY STOP LOSS / TAKE PROFIT FOR TODAY
      const symbolsToExitToday = [];
      for (const sym of Object.keys(openPositions)) {
        const pos = openPositions[sym];
        pos.barsHeld += 1;

        const barInfo = dateToSymbolBar[sym]?.[currentDate];
        if (!barInfo) continue;
        const candle = barInfo.candle;
        const indObj = symbolIndicators[sym];

        // Evaluate exit rules
        for (const eRule of (strategy.exitRules || [])) {
          const triggers = this.evaluateRule(eRule, barInfo.idx, symbolCandles[sym], indObj, pos);
          if (triggers) {
            symbolsToExitToday.push({
              symbol: sym,
              reason: eRule.type === 'STOP_LOSS' ? 'STOP_LOSS' : (eRule.type === 'TAKE_PROFIT' ? 'TAKE_PROFIT' : 'SIGNAL')
            });
            break;
          }
        }
      }

      // Execute today's triggered exits at today's close or queue for next bar
      for (const exitSig of symbolsToExitToday) {
        const pos = openPositions[exitSig.symbol];
        if (!pos) continue;
        const barInfo = dateToSymbolBar[exitSig.symbol]?.[currentDate];
        const candle = barInfo?.candle;
        const refPrice = candle ? candle.close : pos.entryPrice;
        const execPrice = Math.round((refPrice * (1 - costs.slippageRate)) * 100) / 100;
        const grossValue = pos.quantity * execPrice;
        const fee = costs.flatFeePerTrade + Math.round((grossValue * costs.brokerageRate) * 100) / 100;
        const netValue = grossValue - fee;

        simulatedCash += netValue;
        const entryValue = pos.quantity * pos.entryPrice;
        const grossPnL = grossValue - entryValue;
        const netPnL = grossPnL - fee - pos.entryFee;
        const returnPct = entryValue > 0 ? Math.round((netPnL / entryValue) * 10000) / 100 : 0;

        tradeLedger.push({
          tradeId: `TRD-${tradeLedger.length + 1}`,
          symbol: exitSig.symbol,
          side: 'SELL',
          quantity: pos.quantity,
          entryDate: pos.entryDate,
          exitDate: currentDate,
          entryPrice: pos.entryPrice,
          exitPrice: execPrice,
          fees: Math.round((pos.entryFee + fee) * 100) / 100,
          slippageCost: Math.round((pos.quantity * refPrice * costs.slippageRate * 2) * 100) / 100,
          grossPnL: Math.round(grossPnL * 100) / 100,
          netPnL: Math.round(netPnL * 100) / 100,
          returnPercent: returnPct,
          holdingPeriodDays: pos.barsHeld,
          exitReason: exitSig.reason
        });

        delete openPositions[exitSig.symbol];
      }

      // 3. EVALUATE ENTRY RULES ON BAR T CLOSE -> QUEUE PENDING SIGNALS FOR BAR T+1
      for (const sym of universe) {
        if (openPositions[sym]) continue; // Already holding
        const barInfo = dateToSymbolBar[sym]?.[currentDate];
        if (!barInfo) continue;
        const indObj = symbolIndicators[sym];

        const entryRules = strategy.entryRules || [];
        if (entryRules.length > 0) {
          const allRulesMatch = entryRules.every(r => this.evaluateRule(r, barInfo.idx, symbolCandles[sym], indObj, null));
          if (allRulesMatch) {
            pendingSignals.push({
              action: 'BUY',
              symbol: sym,
              signalDate: currentDate,
              reason: 'ENTRY_SIGNAL'
            });
          }
        }
      }

      // 4. COMPUTE END-OF-DAY PORTFOLIO VALUATION & EQUITY CURVE POINT
      let positionsMarketValue = 0;
      for (const sym of Object.keys(openPositions)) {
        const pos = openPositions[sym];
        const barInfo = dateToSymbolBar[sym]?.[currentDate];
        const currentClose = barInfo ? barInfo.candle.close : pos.entryPrice;
        positionsMarketValue += pos.quantity * currentClose;
      }

      const totalEquity = Math.round((simulatedCash + positionsMarketValue) * 100) / 100;

      if (totalEquity > peakEquity) {
        peakEquity = totalEquity;
        currentDdDuration = 0;
      } else {
        currentDdDuration += 1;
      }

      const ddPct = peakEquity > 0 ? Math.round(((totalEquity - peakEquity) / peakEquity) * 10000) / 100 : 0;
      if (ddPct < maxDrawdown) {
        maxDrawdown = ddPct;
        maxDrawdownDurationDays = Math.max(maxDrawdownDurationDays, currentDdDuration);
      }

      // Benchmark point
      const bPrice = dateToBenchmarkPrice[currentDate] || initialBenchmarkPrice || 100;
      const benchmarkReturnPct = initialBenchmarkPrice ? Math.round(((bPrice - initialBenchmarkPrice) / initialBenchmarkPrice) * 10000) / 100 : 0;

      equityCurve.push({
        date: currentDate,
        portfolioValue: totalEquity,
        cash: Math.round(simulatedCash * 100) / 100,
        positionValue: Math.round(positionsMarketValue * 100) / 100,
        drawdownPercent: ddPct,
        benchmarkReturnPercent: benchmarkReturnPct
      });
    }

    // Close any remaining open positions at the final bar's close for metric consistency
    const finalDate = sortedDates[sortedDates.length - 1];
    for (const sym of Object.keys(openPositions)) {
      const pos = openPositions[sym];
      const barInfo = dateToSymbolBar[sym]?.[finalDate];
      const candle = barInfo?.candle;
      const refPrice = candle ? candle.close : pos.entryPrice;
      const execPrice = Math.round((refPrice * (1 - costs.slippageRate)) * 100) / 100;
      const grossValue = pos.quantity * execPrice;
      const fee = costs.flatFeePerTrade + Math.round((grossValue * costs.brokerageRate) * 100) / 100;
      const netValue = grossValue - fee;

      simulatedCash += netValue;
      const entryValue = pos.quantity * pos.entryPrice;
      const grossPnL = grossValue - entryValue;
      const netPnL = grossPnL - fee - pos.entryFee;
      const returnPct = entryValue > 0 ? Math.round((netPnL / entryValue) * 10000) / 100 : 0;

      tradeLedger.push({
        tradeId: `TRD-${tradeLedger.length + 1}`,
        symbol: sym,
        side: 'SELL',
        quantity: pos.quantity,
        entryDate: pos.entryDate,
        exitDate: finalDate,
        entryPrice: pos.entryPrice,
        exitPrice: execPrice,
        fees: Math.round((pos.entryFee + fee) * 100) / 100,
        slippageCost: Math.round((pos.quantity * refPrice * costs.slippageRate * 2) * 100) / 100,
        grossPnL: Math.round(grossPnL * 100) / 100,
        netPnL: Math.round(netPnL * 100) / 100,
        returnPercent: returnPct,
        holdingPeriodDays: pos.barsHeld,
        exitReason: 'END_OF_BACKTEST'
      });
    }

    const finalEquity = Math.round(simulatedCash * 100) / 100;
    const netProfit = Math.round((finalEquity - initialCapital) * 100) / 100;
    const returnPercentage = initialCapital > 0 ? Math.round((netProfit / initialCapital) * 10000) / 100 : 0;

    // Benchmark final return
    const finalBenchmarkReturn = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].benchmarkReturnPercent : 0;
    const alphaDifference = Math.round((returnPercentage - finalBenchmarkReturn) * 100) / 100;

    // Trade stats
    const winningTrades = tradeLedger.filter(t => t.netPnL > 0);
    const losingTrades = tradeLedger.filter(t => t.netPnL < 0);
    const breakevenTrades = tradeLedger.filter(t => t.netPnL === 0);

    const winRate = tradeLedger.length > 0 ? Math.round((winningTrades.length / tradeLedger.length) * 10000) / 100 : 0;
    const grossProfit = Math.round(winningTrades.reduce((acc, t) => acc + t.netPnL, 0) * 100) / 100;
    const grossLoss = Math.round(Math.abs(losingTrades.reduce((acc, t) => acc + t.netPnL, 0)) * 100) / 100;

    let profitFactor = 'N/A';
    if (grossLoss > 0) {
      profitFactor = Math.round((grossProfit / grossLoss) * 100) / 100;
    } else if (grossProfit > 0 && grossLoss === 0) {
      profitFactor = 'N/A (No Losses)';
    }

    const averageWin = winningTrades.length > 0 ? Math.round((grossProfit / winningTrades.length) * 100) / 100 : 0;
    const averageLoss = losingTrades.length > 0 ? Math.round((grossLoss / losingTrades.length) * 100) / 100 : 0;
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.netPnL)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.netPnL)) : 0;
    const avgHoldingPeriod = tradeLedger.length > 0 ? Math.round((tradeLedger.reduce((a, t) => a + t.holdingPeriodDays, 0) / tradeLedger.length) * 10) / 10 : 0;

    // Regime breakdown
    const regimeAnalysis = this._calculateRegimeBreakdown(equityCurve, tradeLedger);

    // Snapshot Hash
    const snapshotHash = crypto.createHash('sha256')
      .update(`${strategy.name}_${strategy.version}_${initialCapital}_${returnPercentage}_${tradeLedger.length}_${ENGINE_VERSION}`)
      .digest('hex')
      .slice(0, 16);

    return {
      strategy: {
        id: strategy._id || strategy.id,
        name: strategy.name,
        version: strategy.version || 1,
        universe,
        benchmark: benchmarkSymbol
      },
      metadata: {
        engineVersion: ENGINE_VERSION,
        snapshotHash,
        startDate: sortedDates[0],
        endDate: sortedDates[sortedDates.length - 1],
        totalBars: sortedDates.length,
        lookAheadProtection: 'STRICT_BAR_T_SIGNAL_T_PLUS_1_EXECUTION',
        survivorshipBiasDisclaimer: 'Historical constituent changes are unavailable from market data provider. Results reflect listed survivors.'
      },
      metrics: {
        initialCapital,
        finalEquity,
        netProfit,
        returnPercentage,
        benchmarkReturn: finalBenchmarkReturn,
        alphaDifference,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        maxDrawdownDurationDays,
        tradeCount: tradeLedger.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        breakevenTrades: breakevenTrades.length,
        winRate,
        profitFactor,
        grossProfit,
        grossLoss,
        averageWin,
        averageLoss,
        largestWin,
        largestLoss,
        avgHoldingPeriodDays: avgHoldingPeriod
      },
      equityCurve: equityCurve.filter((_, idx) => idx % Math.max(1, Math.floor(equityCurve.length / 100)) === 0 || idx === equityCurve.length - 1),
      tradeLedger,
      regimeAnalysis
    };
  }

  // --- 3. PARAMETER OPTIMIZATION GRID & SENSITIVITY ---

  async runParameterOptimization(strategyOrDef, parameterGrid = {}, options = {}, userId = null) {
    const baseStrategy = await this._resolveStrategy(strategyOrDef, userId);
    const fastSMAValues = parameterGrid.fastSMA || [10, 20, 30];
    const slowSMAValues = parameterGrid.slowSMA || [30, 50, 100];

    const results = [];
    const combinationsCount = fastSMAValues.length * slowSMAValues.length;

    if (combinationsCount > 50) {
      throw new Error('Experiment exceeds configured computation limits (maximum 50 parameter combinations).');
    }

    for (const fast of fastSMAValues) {
      for (const slow of slowSMAValues) {
        if (fast >= slow) continue; // Skip invalid fast >= slow combinations

        const clonedStrategy = JSON.parse(JSON.stringify(baseStrategy));
        clonedStrategy.name = `${baseStrategy.name} (${fast}/${slow})`;
        clonedStrategy.entryRules = [
          {
            indicator: 'SMA',
            params: { fastPeriod: fast, slowPeriod: slow },
            condition: 'CROSS_ABOVE'
          }
        ];
        clonedStrategy.exitRules = [
          {
            type: 'SIGNAL',
            indicator: 'SMA',
            params: { fastPeriod: fast, slowPeriod: slow },
            condition: 'CROSS_BELOW'
          },
          {
            type: 'STOP_LOSS',
            threshold: 5
          }
        ];

        try {
          const runRes = await this.runBacktest(clonedStrategy, options, userId);
          results.push({
            parameters: { fastPeriod: fast, slowPeriod: slow },
            returnPercentage: runRes.metrics.returnPercentage,
            maxDrawdown: runRes.metrics.maxDrawdown,
            tradeCount: runRes.metrics.tradeCount,
            winRate: runRes.metrics.winRate,
            profitFactor: runRes.metrics.profitFactor
          });
        } catch (err) {
          // Continue on individual combination failure
        }
      }
    }

    // Compute parameter sensitivity (standard deviation of returns across parameter grid)
    const returns = results.map(r => r.returnPercentage);
    let sensitivityScore = 'LOW';
    let stdDev = 0;

    if (returns.length > 1) {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

      if (stdDev > 15) sensitivityScore = 'HIGH';
      else if (stdDev > 5) sensitivityScore = 'MEDIUM';
      else sensitivityScore = 'LOW';
    }

    return {
      strategyName: baseStrategy.name,
      combinationsTested: results.length,
      sensitivityScore,
      returnStdDev: stdDev,
      overfittingWarning: results.length >= 4 
        ? 'Research Warning: Testing multiple parameter combinations significantly increases the risk of data snooping and curve-fitting. Robust strategies exhibit gradual performance degradation across parameter neighbors rather than sharp isolated spikes.'
        : null,
      results
    };
  }

  // --- 4. TRAIN / TEST SPLIT & OUT-OF-SAMPLE ---

  async runSplitTest(strategyOrDef, trainWindow, testWindow, options = {}, userId = null) {
    if (!trainWindow?.endDate || !testWindow?.startDate) {
      throw new Error('Train and test windows must provide valid boundaries.');
    }

    const trainEnd = new Date(trainWindow.endDate);
    const testStart = new Date(testWindow.startDate);

    if (trainEnd >= testStart) {
      throw new Error('Data leakage violation: Train window end date must strictly precede Test window start date.');
    }

    // In-Sample Run
    const inSampleRun = await this.runBacktest(strategyOrDef, {
      ...options,
      startDate: trainWindow.startDate,
      endDate: trainWindow.endDate
    }, userId);

    // Out-of-Sample Run
    const outOfSampleRun = await this.runBacktest(strategyOrDef, {
      ...options,
      startDate: testWindow.startDate,
      endDate: testWindow.endDate
    }, userId);

    const returnDelta = Math.round((outOfSampleRun.metrics.returnPercentage - inSampleRun.metrics.returnPercentage) * 100) / 100;
    const drawdownDelta = Math.round((outOfSampleRun.metrics.maxDrawdown - inSampleRun.metrics.maxDrawdown) * 100) / 100;

    return {
      trainWindow: { startDate: trainWindow.startDate, endDate: trainWindow.endDate },
      testWindow: { startDate: testWindow.startDate, endDate: testWindow.endDate },
      inSampleMetrics: inSampleRun.metrics,
      outOfSampleMetrics: outOfSampleRun.metrics,
      comparison: {
        returnDelta,
        drawdownDelta,
        performanceDegradation: returnDelta < -10,
        observation: returnDelta < -10 
          ? 'Substantial performance degradation observed out-of-sample; indicates potential historical curve-fitting during the in-sample period.'
          : 'Strategy maintained consistent risk-reward characteristics across in-sample and out-of-sample periods.'
      }
    };
  }

  // --- 5. WALK-FORWARD ROLLING RUNNER ---

  async runWalkForward(strategyOrDef, windows = [], options = {}, userId = null) {
    if (!windows || windows.length < 2) {
      // Default to 2 rolling segments if not provided
      windows = [
        { trainStart: '2022-01-01', trainEnd: '2023-12-31', testStart: '2024-01-01', testEnd: '2024-12-31' },
        { trainStart: '2023-01-01', trainEnd: '2024-12-31', testStart: '2025-01-01', testEnd: '2026-06-30' }
      ];
    }

    const segments = [];
    for (let i = 0; i < windows.length; i++) {
      const win = windows[i];
      const splitRes = await this.runSplitTest(strategyOrDef, 
        { startDate: win.trainStart, endDate: win.trainEnd },
        { startDate: win.testStart, endDate: win.testEnd },
        options, userId
      );
      segments.push({
        segment: i + 1,
        ...splitRes
      });
    }

    return {
      strategyName: strategyOrDef.name || 'Strategy',
      totalSegments: segments.length,
      methodology: 'Rolling train-then-test walk-forward validation',
      segments
    };
  }

  // --- 6. SIDE-BY-SIDE STRATEGY COMPARISON ---

  async compareStrategies(strategyIdsOrDefs = [], options = {}, userId = null) {
    const comparisonTable = [];
    for (const item of strategyIdsOrDefs) {
      try {
        const res = await this.runBacktest(item, options, userId);
        comparisonTable.push({
          strategyId: res.strategy.id,
          name: res.strategy.name,
          version: res.strategy.version,
          returnPercentage: res.metrics.returnPercentage,
          benchmarkReturn: res.metrics.benchmarkReturn,
          alphaDifference: res.metrics.alphaDifference,
          maxDrawdown: res.metrics.maxDrawdown,
          winRate: res.metrics.winRate,
          profitFactor: res.metrics.profitFactor,
          tradeCount: res.metrics.tradeCount,
          avgHoldingPeriodDays: res.metrics.avgHoldingPeriodDays
        });
      } catch (err) {
        // Skip failed comparisons
      }
    }

    return {
      comparedCount: comparisonTable.length,
      strategies: comparisonTable
    };
  }

  // --- 7. STRESS STUDIO INTEGRATION ---

  async stressTestStrategyExposure(strategyOrDef, scenarioIdOrDef, userId = null) {
    const strategy = await this._resolveStrategy(strategyOrDef, userId);
    // Pass strategy universe to scenarioEngine
    const scenarioRes = await scenarioEngine.runScenario(scenarioIdOrDef, {
      userId,
      useLedgerPrices: false
    });

    const universeSet = new Set((strategy.universe || []).map(s => s.toUpperCase()));
    let strategyHoldingImpact = 0;
    let totalPortfolioImpact = scenarioRes.portfolioImpact?.absoluteImpact || 0;

    for (const h of (scenarioRes.holdingAttribution || [])) {
      if (universeSet.has(h.symbol.toUpperCase())) {
        strategyHoldingImpact += h.absoluteImpact;
      }
    }

    const exposurePct = totalPortfolioImpact !== 0 
      ? Math.round((Math.abs(strategyHoldingImpact) / Math.abs(totalPortfolioImpact)) * 10000) / 100
      : 0;

    return {
      strategy: {
        id: strategy._id || strategy.id,
        name: strategy.name
      },
      scenario: scenarioRes.scenario,
      modeledStrategyExposure: exposurePct,
      strategyLinkedImpact: strategyHoldingImpact,
      totalPortfolioImpact,
      statement: `Strategy-linked holdings account for ${exposurePct}% of modeled portfolio impact under this defined scenario.`
    };
  }

  // --- 8. SYNTHESIS OF GROUNDED RESEARCH QUESTIONS ---

  synthesizeResearchQuestion(backtestResult) {
    const stratName = backtestResult.strategy?.name || 'Tested Strategy';
    const maxDD = backtestResult.metrics?.maxDrawdown || 0;
    const winRate = backtestResult.metrics?.winRate || 0;
    const returnPct = backtestResult.metrics?.returnPercentage || 0;

    return {
      question: `What structural market regimes caused ${stratName} to experience its maximum drawdown of ${maxDD}%, and does the historical win rate of ${winRate}% persist during trend transitions?`,
      components: {
        strategy: stratName,
        testedReturn: `${returnPct}%`,
        maxDrawdown: `${maxDD}%`,
        winRate: `${winRate}%`,
        unknown: 'Whether upcoming macro and market conditions reflect the historical distribution modeled in this backtest.'
      }
    };
  }

  // --- HELPER METHODS ---

  async _resolveStrategy(strategyOrDef, userId) {
    if (typeof strategyOrDef === 'string') {
      // Check curated presets first
      const preset = CURATED_STRATEGIES.find(p => p._id === strategyOrDef);
      if (preset) return preset;

      // Otherwise query MongoDB
      const found = await StrategyModel.findOne({ _id: strategyOrDef, ...(userId ? { user: userId } : {}) });
      if (found) return found;

      // Also check PlaybookModel
      const playbook = await PlaybookModel.findOne({ _id: strategyOrDef, ...(userId ? { user: userId } : {}) });
      if (playbook) {
        return {
          _id: playbook._id,
          name: playbook.name,
          version: 1,
          universe: ['TCS', 'INFY', 'RELIANCE'],
          benchmark: 'NIFTY50',
          initialCapital: 100000,
          costs: { brokerageRate: 0.0003, flatFeePerTrade: 20, slippageRate: 0.001 },
          positionSizing: { type: 'PERCENT_EQUITY', value: 20 },
          entryRules: [
            { indicator: 'SMA', params: { fastPeriod: 10, slowPeriod: 30 }, condition: 'CROSS_ABOVE' }
          ],
          exitRules: [
            { type: 'SIGNAL', indicator: 'SMA', params: { fastPeriod: 10, slowPeriod: 30 }, condition: 'CROSS_BELOW' }
          ]
        };
      }

      throw new Error(`Strategy not found: ${strategyOrDef}`);
    }

    if (strategyOrDef && strategyOrDef.name) {
      return strategyOrDef;
    }

    throw new Error('Invalid strategy definition.');
  }

  _calculateRegimeBreakdown(equityCurve, tradeLedger) {
    if (!equityCurve || equityCurve.length < 2) return null;

    let bullTrades = 0;
    let bearTrades = 0;
    let neutralTrades = 0;

    let bullProfit = 0;
    let bearProfit = 0;
    let neutralProfit = 0;

    tradeLedger.forEach(t => {
      // Map trade exit date to equity curve benchmark return
      const eqPoint = equityCurve.find(e => e.date === t.exitDate);
      const bPct = eqPoint ? eqPoint.benchmarkReturnPercent : 0;

      if (bPct > 3) {
        bullTrades++;
        bullProfit += t.netPnL;
      } else if (bPct < -3) {
        bearTrades++;
        bearProfit += t.netPnL;
      } else {
        neutralTrades++;
        neutralProfit += t.netPnL;
      }
    });

    return [
      { regime: 'Bull (Benchmark > +3%)', trades: bullTrades, netPnL: Math.round(bullProfit * 100) / 100 },
      { regime: 'Bear (Benchmark < -3%)', trades: bearTrades, netPnL: Math.round(bearProfit * 100) / 100 },
      { regime: 'Neutral (-3% to +3%)', trades: neutralTrades, netPnL: Math.round(neutralProfit * 100) / 100 }
    ];
  }

  getCuratedPresets() {
    return CURATED_STRATEGIES;
  }
}

module.exports = new BacktestEngine();
