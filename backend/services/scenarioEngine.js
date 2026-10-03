const crypto = require('crypto');
const mongoose = require('mongoose');
const { ScenarioModel } = require('../models/ScenarioModel');
const { HoldingsModel } = require('../models/HoldingsModel');
const { PositionsModel } = require('../models/PositionsModel');
const { PlaybookModel } = require('../models/PlaybookModel');
const { TradeJournalModel } = require('../models/TradeJournalModel');
const marketDataService = require('./marketDataService');
const { getVerifiedMetadata } = require('../config/marketMetadata');

// In-memory cache for deterministic scenario runs
const scenarioCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Curated deterministic presets
const CURATED_PRESETS = [
  {
    _id: 'preset-it-correction',
    name: 'IT Sector Correction',
    description: 'Technology and IT export services face valuation compression due to delayed enterprise spending.',
    type: 'PRESET',
    shocks: [
      { targetType: 'SECTOR', target: 'Information Technology', percentage: -15 }
    ],
    horizon: '1D',
    severity: 'MODERATE',
    version: 1
  },
  {
    _id: 'preset-broad-selloff',
    name: 'Broad Market Selloff',
    description: 'Macro liquidity squeeze triggers an across-the-board correction across benchmark indices.',
    type: 'PRESET',
    shocks: [
      { targetType: 'MARKET', target: 'NIFTY', percentage: -10 }
    ],
    horizon: '3D',
    severity: 'MODERATE',
    version: 1
  },
  {
    _id: 'preset-severe-tech',
    name: 'Severe Tech Valuation Drawdown',
    description: 'Dual headwind: broad market contraction combined with heavy technology de-rating.',
    type: 'PRESET',
    shocks: [
      { targetType: 'MARKET', target: 'NIFTY', percentage: -12 },
      { targetType: 'SECTOR', target: 'Information Technology', percentage: -25 }
    ],
    horizon: '1M',
    severity: 'SEVERE',
    version: 1
  },
  {
    _id: 'preset-energy-crisis',
    name: 'Energy Supply Disruption',
    description: 'Surge in crude oil and refining margins creates positive energy tailwind while weighing on broad equities.',
    type: 'PRESET',
    shocks: [
      { targetType: 'SECTOR', target: 'Energy', percentage: 12 },
      { targetType: 'MARKET', target: 'NIFTY', percentage: -4 }
    ],
    horizon: '1W',
    severity: 'MODERATE',
    version: 1
  },
  {
    _id: 'preset-hist-covid-2020',
    name: 'Historical Replay: March 2020 Liquidity Shock',
    description: 'Deterministic replay of peak single-day pandemic volatility (2020-03-23 circuit breaker event).',
    type: 'HISTORICAL_REPLAY',
    shocks: [
      { targetType: 'MARKET', target: 'NIFTY', percentage: -12.98 },
      { targetType: 'SECTOR', target: 'Energy', percentage: -14.20 },
      { targetType: 'SECTOR', target: 'Information Technology', percentage: -9.50 }
    ],
    horizon: '1D',
    severity: 'EXTREME',
    version: 1,
    historicalDate: '2020-03-23T00:00:00.000Z'
  }
];

class ScenarioEngine {
  /**
   * List all user-saved scenarios and system presets
   */
  async getScenarios(userId) {
    const userScenarios = await ScenarioModel.find({ user: userId }).sort({ createdAt: -1 }).lean();
    return [...CURATED_PRESETS, ...userScenarios];
  }

  /**
   * Find a scenario by ID (user-saved or preset)
   */
  async getScenarioById(id, userId) {
    if (!id) return null;
    const stringId = id.toString();
    const preset = CURATED_PRESETS.find(p => p._id === stringId);
    if (preset) return preset;

    if (!mongoose.Types.ObjectId.isValid(stringId)) return null;
    return await ScenarioModel.findOne({ _id: stringId, user: userId }).lean();
  }

  /**
   * Create a new custom scenario
   */
  async createScenario(userId, data) {
    const { name, description, shocks, horizon, severity } = data;
    if (!name || !shocks || shocks.length === 0) {
      throw new Error('SCENARIO_NAME_AND_SHOCKS_REQUIRED');
    }

    this._validateShocks(shocks);

    const scenario = new ScenarioModel({
      user: userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      type: 'CUSTOM',
      shocks,
      horizon: horizon || '1D',
      severity: severity || this._determineSeverity(shocks),
      version: 1
    });

    return await scenario.save();
  }

  /**
   * Update an existing custom scenario
   */
  async updateScenario(id, userId, data) {
    if (!id) throw new Error('SCENARIO_NOT_FOUND');
    const stringId = id.toString();
    if (!mongoose.Types.ObjectId.isValid(stringId)) throw new Error('SCENARIO_NOT_FOUND');

    const scenario = await ScenarioModel.findOne({ _id: stringId, user: userId });
    if (!scenario) throw new Error('SCENARIO_NOT_FOUND');

    if (data.name) scenario.name = data.name.trim();
    if (data.description !== undefined) scenario.description = data.description.trim();
    if (data.horizon) scenario.horizon = data.horizon;
    if (data.severity) scenario.severity = data.severity;

    if (data.shocks) {
      this._validateShocks(data.shocks);
      scenario.shocks = data.shocks;
      scenario.version += 1;
    }

    return await scenario.save();
  }

  /**
   * Delete a custom scenario
   */
  async deleteScenario(id, userId) {
    if (!id) throw new Error('SCENARIO_NOT_FOUND');
    const stringId = id.toString();
    if (!mongoose.Types.ObjectId.isValid(stringId)) throw new Error('SCENARIO_NOT_FOUND');

    const deleted = await ScenarioModel.findOneAndDelete({ _id: stringId, user: userId });
    if (!deleted) throw new Error('SCENARIO_NOT_FOUND');
    return true;
  }

  /**
   * Run a scenario simulation against the user's paper portfolio
   * @param {string} userId 
   * @param {object} scenarioDef { id, shocks, horizon, severity, name } or saved ID
   * @param {object} options { asOf, whatIfPositions }
   */
  async runScenario(userId, scenarioDef, options = {}) {
    let scenario = null;

    if (typeof scenarioDef === 'string' || (scenarioDef && scenarioDef._bsontype === 'ObjectID') || mongoose.isObjectIdOrHexString(scenarioDef)) {
      scenario = await this.getScenarioById(scenarioDef, userId);
      if (!scenario) throw new Error('SCENARIO_NOT_FOUND');
    } else if (scenarioDef && scenarioDef._id && !scenarioDef.shocks) {
      scenario = await this.getScenarioById(scenarioDef._id, userId);
      if (!scenario) throw new Error('SCENARIO_NOT_FOUND');
    } else if (scenarioDef && scenarioDef.id && !scenarioDef.shocks) {
      scenario = await this.getScenarioById(scenarioDef.id, userId);
      if (!scenario) throw new Error('SCENARIO_NOT_FOUND');
    } else {
      scenario = scenarioDef;
    }

    if (!scenario || !scenario.shocks || scenario.shocks.length === 0) {
      throw new Error('INVALID_SCENARIO_DEFINITION');
    }

    this._validateShocks(scenario.shocks);

    const asOf = options.asOf ? new Date(options.asOf) : null;
    const whatIfPositions = options.whatIfPositions || [];

    // 1. Fetch current portfolio holdings and positions
    const holdingsQuery = { user: userId };
    const positionsQuery = { user: userId };
    if (asOf) {
      holdingsQuery.createdAt = { $lte: asOf };
      positionsQuery.createdAt = { $lte: asOf };
    }

    const [holdings, positions] = await Promise.all([
      HoldingsModel.find(holdingsQuery).lean(),
      PositionsModel.find(positionsQuery).lean()
    ]);

    // Aggregate holdings by symbol
    const assetMap = new Map();
    [...holdings, ...positions].forEach(item => {
      const sym = item.name.toUpperCase().trim();
      const qty = item.qty || 0;
      const refPrice = item.price || item.avg || 0;
      if (assetMap.has(sym)) {
        const existing = assetMap.get(sym);
        existing.qty += qty;
      } else {
        assetMap.set(sym, {
          symbol: sym,
          qty,
          referencePrice: refPrice,
          source: 'INTERNAL_LEDGER'
        });
      }
    });

    // 2. Resolve fresh reference prices where available
    if (options.referencePrices) {
      for (const [sym, asset] of assetMap.entries()) {
        if (options.referencePrices[sym] !== undefined) {
          asset.referencePrice = options.referencePrices[sym];
        }
      }
    } else if (!options.useLedgerPrices) {
      for (const [sym, asset] of assetMap.entries()) {
        try {
          const liveQuote = await marketDataService.getQuote(sym).catch(() => null);
          if (liveQuote && liveQuote.price > 0) {
            asset.referencePrice = liveQuote.price;
            asset.source = liveQuote.source || 'MarketDataService';
          }
        } catch (err) {
          // Graceful fallback to existing ledger price
        }
      }
    }

    // 3. Compute Baseline & Modeled Scenario Impact
    const calculationResult = this._computePortfolioImpact(Array.from(assetMap.values()), scenario.shocks);

    // 4. If What-If positions are requested, compute simulation comparison
    let whatIfComparison = null;
    if (whatIfPositions.length > 0) {
      whatIfComparison = this._computeWhatIfSimulation(Array.from(assetMap.values()), whatIfPositions, scenario.shocks);
    }

    // 5. Strategy & Playbook Intersections
    const strategyExposures = await this._computeStrategyExposures(userId, Array.from(assetMap.values()), asOf);

    // 6. Thesis Intersections
    const thesisLinks = await this._computeThesisLinks(userId, Array.from(assetMap.values()), scenario, asOf);

    // 7. Research Question Synthesis
    const researchQuestions = this._synthesizeResearchQuestions(scenario, calculationResult);

    // Generate deterministic snapshot hash for auditability
    const snapshotHash = crypto.createHash('sha256')
      .update(JSON.stringify({
        userId: userId.toString(),
        assets: Array.from(assetMap.values()).map(a => `${a.symbol}:${a.qty}:${a.referencePrice}`),
        shocks: scenario.shocks,
        asOf: asOf ? asOf.toISOString() : 'now'
      }))
      .digest('hex').substring(0, 16);

    return {
      scenario: {
        id: scenario._id || scenario.id || 'custom',
        name: scenario.name || 'Custom Stress Scenario',
        description: scenario.description || '',
        horizon: scenario.horizon || '1D',
        severity: scenario.severity || this._determineSeverity(scenario.shocks),
        shocks: scenario.shocks,
        isHistorical: scenario.type === 'HISTORICAL_REPLAY',
        historicalDate: scenario.historicalDate || null
      },
      baseline: {
        totalValue: calculationResult.baselineValue,
        holdingCount: calculationResult.holdings.length,
        asOf: asOf ? asOf.toISOString() : new Date().toISOString()
      },
      modeledResult: {
        scenarioValue: calculationResult.scenarioValue,
        absoluteImpact: calculationResult.absoluteImpact,
        percentageImpact: calculationResult.percentageImpact,
        largestDrag: calculationResult.topContributors.length > 0 ? calculationResult.topContributors[0] : null,
        largestOffset: calculationResult.topOffsets.length > 0 ? calculationResult.topOffsets[0] : null
      },
      holdingAttribution: calculationResult.holdings,
      topContributors: calculationResult.topContributors,
      topOffsets: calculationResult.topOffsets,
      affectedHoldings: calculationResult.holdings.filter(h => Math.abs(h.absoluteImpact) > 0.001),
      unaffectedHoldings: calculationResult.holdings.filter(h => Math.abs(h.absoluteImpact) <= 0.001),
      disclaimer: 'MODELLED SCENARIO — NOT A PREDICTION',
      investigationPrompt: `How would my portfolio perform under the ${scenario.name || 'custom stress'} scenario where ${scenario.shocks?.map(s => `${s.target} moves ${s.percentage}%`).join(', ')}?`,
      strategyExposure: strategyExposures,
      thesisLinks,
      whatIfComparison,
      researchQuestions,
      methodology: {
        model: 'Multiplicative Linear Factor Shock',
        combinationFormula: 'S_combined = (1 + S_mkt) * (1 + S_sec) * (1 + S_asset) - 1',
        doubleCountingProtection: 'Multiplicative cross-layer interaction',
        calculationVersion: '2.0.0-MVP41',
        snapshotHash,
        reproducible: true,
        disclaimer: 'MODELLED SCENARIO — NOT A PREDICTION'
      }
    };
  }

  /**
   * Compare multiple scenarios side-by-side
   */
  async compareScenarios(userId, scenarioIdsOrDefs, options = {}) {
    if (!Array.isArray(scenarioIdsOrDefs) || scenarioIdsOrDefs.length < 2) {
      throw new Error('AT_LEAST_TWO_SCENARIOS_REQUIRED_FOR_COMPARISON');
    }

    const firstRun = await this.runScenario(userId, scenarioIdsOrDefs[0], options);
    const referencePrices = {};
    if (firstRun.holdingAttribution) {
      firstRun.holdingAttribution.forEach(h => {
        referencePrices[h.symbol] = h.referencePrice;
      });
    }

    const runs = [firstRun];
    for (let i = 1; i < scenarioIdsOrDefs.length; i++) {
      const runRes = await this.runScenario(userId, scenarioIdsOrDefs[i], {
        ...options,
        referencePrices
      });
      runs.push(runRes);
    }

    const baselineValue = runs[0].baseline.totalValue;
    const comparisonTable = runs.map(r => ({
      scenarioId: r.scenario.id,
      name: r.scenario.name,
      severity: r.scenario.severity,
      modeledValue: r.modeledResult.scenarioValue,
      absoluteImpact: r.modeledResult.absoluteImpact,
      percentageImpact: r.modeledResult.percentageImpact,
      largestDrag: r.modeledResult.largestDrag ? r.modeledResult.largestDrag.symbol : 'None',
      largestOffset: r.modeledResult.largestOffset ? r.modeledResult.largestOffset.symbol : 'None'
    }));

    return {
      baselineValue,
      comparison: comparisonTable,
      scenariosCount: runs.length,
      comparedAt: new Date().toISOString()
    };
  }

  /**
   * Internal portfolio impact calculation
   */
  _computePortfolioImpact(assetList, shocks) {
    let totalBaseline = 0;
    let totalScenario = 0;

    const holdingResults = assetList.map(asset => {
      const currentPrice = asset.referencePrice;
      const baselineVal = parseFloat((asset.qty * currentPrice).toFixed(2));
      totalBaseline += baselineVal;

      // Extract taxonomy
      const meta = getVerifiedMetadata(asset.symbol);
      const sector = meta ? meta.sector : null;

      // Multiplicative shock components
      let mktFactor = 1.0;
      let secFactor = 1.0;
      let assetFactor = 1.0;
      const appliedShocks = [];

      shocks.forEach(shock => {
        const pct = shock.percentage / 100.0;
        if (shock.targetType === 'MARKET') {
          mktFactor *= (1.0 + pct);
          appliedShocks.push({ type: 'MARKET', target: shock.target, percentage: shock.percentage });
        } else if (shock.targetType === 'SECTOR' && sector && sector.toUpperCase() === shock.target.toUpperCase()) {
          secFactor *= (1.0 + pct);
          appliedShocks.push({ type: 'SECTOR', target: shock.target, percentage: shock.percentage });
        } else if (shock.targetType === 'ASSET' && asset.symbol.toUpperCase() === shock.target.toUpperCase()) {
          assetFactor *= (1.0 + pct);
          appliedShocks.push({ type: 'ASSET', target: shock.target, percentage: shock.percentage });
        }
      });

      // Combined multiplicative shock formula
      let combinedShock = (mktFactor * secFactor * assetFactor) - 1.0;
      // Clamp bounds: -100% to +500%
      combinedShock = Math.max(-1.0, Math.min(5.0, combinedShock));

      const scenarioPrice = parseFloat((currentPrice * (1.0 + combinedShock)).toFixed(2));
      const scenarioVal = parseFloat((asset.qty * scenarioPrice).toFixed(2));
      totalScenario += scenarioVal;

      const absImpact = parseFloat((scenarioVal - baselineVal).toFixed(2));
      const pctImpact = baselineVal > 0 ? parseFloat(((absImpact / baselineVal) * 100).toFixed(2)) : 0;

      return {
        symbol: asset.symbol,
        quantity: asset.qty,
        sector: sector || 'RELATIONSHIP UNAVAILABLE',
        referencePrice: currentPrice,
        scenarioPrice,
        baselineValue: baselineVal,
        scenarioValue: scenarioVal,
        absoluteImpact: absImpact,
        percentageImpact: pctImpact,
        appliedShocks,
        contributionPercent: 0 // calculated below
      };
    });

    totalBaseline = parseFloat(totalBaseline.toFixed(2));
    totalScenario = parseFloat(totalScenario.toFixed(2));
    const totalAbsImpact = parseFloat((totalScenario - totalBaseline).toFixed(2));
    const totalPctImpact = totalBaseline > 0 ? parseFloat(((totalAbsImpact / totalBaseline) * 100).toFixed(2)) : 0;

    // Calculate contribution percentages
    holdingResults.forEach(h => {
      if (totalAbsImpact !== 0) {
        h.contributionPercent = parseFloat(((h.absoluteImpact / totalAbsImpact) * 100).toFixed(2));
      } else {
        h.contributionPercent = 0;
      }
    });

    // Sort into top contributors (largest negative impact) and offsets (positive impact)
    const sortedNegative = [...holdingResults].filter(h => h.absoluteImpact < 0).sort((a, b) => a.absoluteImpact - b.absoluteImpact);
    const sortedPositive = [...holdingResults].filter(h => h.absoluteImpact > 0).sort((a, b) => b.absoluteImpact - a.absoluteImpact);

    return {
      baselineValue: totalBaseline,
      scenarioValue: totalScenario,
      absoluteImpact: totalAbsImpact,
      percentageImpact: totalPctImpact,
      holdings: holdingResults,
      topContributors: sortedNegative.slice(0, 5),
      topOffsets: sortedPositive.slice(0, 5)
    };
  }

  /**
   * Compute What-If Position Simulation
   */
  _computeWhatIfSimulation(existingAssets, whatIfPositions, shocks) {
    const simulatedAssets = existingAssets.map(a => ({ ...a }));

    whatIfPositions.forEach(w => {
      const sym = w.symbol.toUpperCase().trim();
      const qty = parseInt(w.qty, 10);
      const price = parseFloat(w.price);
      const action = w.action || 'ADD';

      const idx = simulatedAssets.findIndex(a => a.symbol === sym);
      if (action === 'ADD') {
        if (idx >= 0) {
          simulatedAssets[idx].qty += qty;
        } else {
          simulatedAssets.push({ symbol: sym, qty, referencePrice: price, source: 'WHAT_IF_SIMULATOR' });
        }
      } else if (action === 'REMOVE') {
        if (idx >= 0) {
          simulatedAssets[idx].qty = Math.max(0, simulatedAssets[idx].qty - qty);
          if (simulatedAssets[idx].qty === 0) {
            simulatedAssets.splice(idx, 1);
          }
        }
      }
    });

    const baselineRun = this._computePortfolioImpact(existingAssets, shocks);
    const simulatedRun = this._computePortfolioImpact(simulatedAssets, shocks);

    return {
      before: {
        portfolioValue: baselineRun.baselineValue,
        scenarioValue: baselineRun.scenarioValue,
        modeledImpact: baselineRun.percentageImpact,
        holdingCount: existingAssets.length
      },
      after: {
        portfolioValue: simulatedRun.baselineValue,
        scenarioValue: simulatedRun.scenarioValue,
        modeledImpact: simulatedRun.percentageImpact,
        holdingCount: simulatedAssets.length
      },
      delta: {
        capitalDifference: parseFloat((simulatedRun.baselineValue - baselineRun.baselineValue).toFixed(2)),
        impactDifferencePct: parseFloat((simulatedRun.percentageImpact - baselineRun.percentageImpact).toFixed(2))
      }
    };
  }

  /**
   * Strategy & Playbook Exposure
   */
  async _computeStrategyExposures(userId, assets, asOf) {
    const playbookQuery = { user: userId, isActive: true };
    if (asOf) playbookQuery.createdAt = { $lte: asOf };

    const playbooks = await PlaybookModel.find(playbookQuery).lean();
    if (playbooks.length === 0) return [];

    let totalVal = assets.reduce((sum, a) => sum + (a.qty * a.referencePrice), 0);
    if (totalVal === 0) return [];

    return playbooks.map(pb => {
      const pbText = `${pb.name} ${pb.description || ''} ${pb.strategy || ''}`.toUpperCase();
      let linkedVal = 0;
      const linkedSymbols = [];

      assets.forEach(a => {
        const meta = getVerifiedMetadata(a.symbol);
        const sector = meta ? meta.sector : '';
        if (pbText.includes(a.symbol) || (sector && pbText.includes(sector.toUpperCase())) || pb.strategy === 'MOMENTUM') {
          linkedVal += (a.qty * a.referencePrice);
          linkedSymbols.push(a.symbol);
        }
      });

      const expPct = parseFloat(((linkedVal / totalVal) * 100).toFixed(2));
      return {
        playbookId: pb._id,
        name: pb.name,
        strategy: pb.strategy || 'EXECUTION',
        linkedHoldings: linkedSymbols,
        exposurePercent: expPct,
        linkedValue: parseFloat(linkedVal.toFixed(2))
      };
    });
  }

  /**
   * Trade Journal Thesis Linkages
   */
  async _computeThesisLinks(userId, assets, scenario, asOf) {
    const symbols = assets.map(a => a.symbol);
    const journalQuery = { user: userId, symbol: { $in: symbols } };
    if (asOf) journalQuery.createdAt = { $lte: asOf };

    const journals = await TradeJournalModel.find(journalQuery).lean();
    return journals.filter(j => j.thesis).map(j => ({
      journalId: j._id,
      symbol: j.symbol,
      strategy: j.strategy,
      storedThesis: j.thesis,
      targetPrice: j.targetPrice,
      riskPrice: j.riskPrice,
      status: 'SCENARIO REQUIRES REVIEW',
      note: `Hypothetical shock (${scenario.name}) conditionally impacts ${j.symbol}; verify assumptions against simulated drawdown.`
    }));
  }

  /**
   * Synthesize non-predictive research questions
   */
  _synthesizeResearchQuestions(scenario, calculationResult) {
    const questions = [];
    const topDrag = calculationResult.topContributors[0];

    if (topDrag) {
      questions.push({
        question: `Which portfolio concentrations cause the majority of modeled downside under "${scenario.name}", and how does ${topDrag.symbol}'s ${topDrag.contributionPercent}% loss contribution inform risk allocation?`,
        context: `${topDrag.symbol} accounts for ₹${Math.abs(topDrag.absoluteImpact)} of the total ₹${Math.abs(calculationResult.absoluteImpact)} modeled drawdown.`,
        generatedAt: new Date().toISOString()
      });
    }

    questions.push({
      question: `Under what market conditions would the offsetting exposure from ${calculationResult.topOffsets[0] ? calculationResult.topOffsets[0].symbol : 'non-correlated assets'} fail to dampen portfolio drawdowns?`,
      context: `Evaluating correlation assumptions under a ${scenario.horizon} stress horizon.`,
      generatedAt: new Date().toISOString()
    });

    return questions;
  }

  /**
   * Validate shocks array
   */
  _validateShocks(shocks) {
    if (!Array.isArray(shocks) || shocks.length === 0) {
      throw new Error('AT_LEAST_ONE_SHOCK_REQUIRED');
    }

    shocks.forEach(s => {
      if (!s.targetType || !['MARKET', 'SECTOR', 'ASSET'].includes(s.targetType)) {
        throw new Error(`INVALID_SHOCK_TARGET_TYPE: ${s.targetType}`);
      }
      if (!s.target || typeof s.target !== 'string') {
        throw new Error('SHOCK_TARGET_REQUIRED');
      }
      if (typeof s.percentage !== 'number' || isNaN(s.percentage)) {
        throw new Error('SHOCK_PERCENTAGE_MUST_BE_NUMERIC');
      }
      if (s.percentage < -100 || s.percentage > 500) {
        throw new Error(`SHOCK_PERCENTAGE_OUT_OF_BOUNDS: ${s.percentage}% (must be between -100% and +500%)`);
      }
    });
  }

  /**
   * Helper to classify scenario severity
   */
  _determineSeverity(shocks) {
    const maxDrop = Math.min(...shocks.map(s => s.percentage));
    if (maxDrop <= -25) return 'EXTREME';
    if (maxDrop <= -15) return 'SEVERE';
    if (maxDrop <= -8) return 'MODERATE';
    return 'MILD';
  }
}

module.exports = new ScenarioEngine();
