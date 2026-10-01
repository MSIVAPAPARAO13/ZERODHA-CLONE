const { StrategyModel } = require('../models/StrategyModel');
const backtestEngine = require('../services/backtestEngine');
const aiAnalystService = require('../services/aiAnalystService');

// GET /api/v1/strategies
exports.getStrategies = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const custom = await StrategyModel.find({ user: userId, isArchived: false }).sort({ updatedAt: -1 });
    const presets = backtestEngine.getCuratedPresets();

    res.json({
      success: true,
      data: {
        presets,
        custom
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/strategies/:id
exports.getStrategyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const preset = backtestEngine.getCuratedPresets().find(p => p._id === id);
    if (preset) {
      return res.json({ success: true, data: preset });
    }

    const strategy = await StrategyModel.findOne({ _id: id, user: userId, isArchived: false });
    if (!strategy) {
      return res.status(404).json({ success: false, error: 'Strategy not found' });
    }

    res.json({ success: true, data: strategy });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/strategies
exports.createStrategy = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      description,
      universe,
      benchmark,
      initialCapital,
      positionSizing,
      costs,
      entryRules,
      exitRules
    } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Strategy name is required' });
    }

    const strategy = new StrategyModel({
      user: userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      version: 1,
      universe: Array.isArray(universe) && universe.length > 0 ? universe : ['TCS', 'INFY', 'RELIANCE'],
      benchmark: benchmark || 'NIFTY50',
      initialCapital: Number(initialCapital) || 100000,
      positionSizing: positionSizing || { type: 'PERCENT_EQUITY', value: 10 },
      costs: costs || { brokerageRate: 0.0003, flatFeePerTrade: 20, slippageRate: 0.001 },
      entryRules: entryRules || [],
      exitRules: exitRules || []
    });

    await strategy.save();
    res.status(201).json({ success: true, data: strategy });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/strategies/:id
exports.updateStrategy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const strategy = await StrategyModel.findOne({ _id: id, user: userId, isArchived: false });
    if (!strategy) {
      return res.status(404).json({ success: false, error: 'Strategy not found' });
    }

    const updates = req.body;
    if (updates.name) strategy.name = updates.name.trim();
    if (updates.description !== undefined) strategy.description = updates.description.trim();
    if (updates.universe) strategy.universe = updates.universe;
    if (updates.benchmark) strategy.benchmark = updates.benchmark;
    if (updates.initialCapital) strategy.initialCapital = updates.initialCapital;
    if (updates.positionSizing) strategy.positionSizing = updates.positionSizing;
    if (updates.costs) strategy.costs = updates.costs;
    if (updates.entryRules) strategy.entryRules = updates.entryRules;
    if (updates.exitRules) strategy.exitRules = updates.exitRules;

    // Increment version on update
    strategy.version += 1;

    await strategy.save();
    res.json({ success: true, data: strategy });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/strategies/:id
exports.deleteStrategy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const strategy = await StrategyModel.findOne({ _id: id, user: userId });
    if (!strategy) {
      return res.status(404).json({ success: false, error: 'Strategy not found' });
    }

    strategy.isArchived = true;
    await strategy.save();

    res.json({ success: true, data: { message: 'Strategy archived successfully' } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/backtests/run
exports.runBacktest = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { strategy, options } = req.body;

    if (!strategy) {
      return res.status(400).json({ success: false, error: 'Strategy or Strategy ID is required' });
    }

    const result = await backtestEngine.runBacktest(strategy, options || {}, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/backtests/optimize
exports.runOptimization = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { strategy, parameterGrid, options } = req.body;

    if (!strategy) {
      return res.status(400).json({ success: false, error: 'Strategy is required' });
    }

    const result = await backtestEngine.runParameterOptimization(strategy, parameterGrid || {}, options || {}, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/backtests/split-test
exports.runSplitTest = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { strategy, trainWindow, testWindow, options } = req.body;

    if (!strategy || !trainWindow || !testWindow) {
      return res.status(400).json({ success: false, error: 'Strategy, trainWindow, and testWindow are required' });
    }

    const result = await backtestEngine.runSplitTest(strategy, trainWindow, testWindow, options || {}, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/backtests/walk-forward
exports.runWalkForward = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { strategy, windows, options } = req.body;

    if (!strategy) {
      return res.status(400).json({ success: false, error: 'Strategy is required' });
    }

    const result = await backtestEngine.runWalkForward(strategy, windows || [], options || {}, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/backtests/compare
exports.compareStrategies = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { strategyIds, options } = req.body;

    if (!Array.isArray(strategyIds) || strategyIds.length === 0) {
      return res.status(400).json({ success: false, error: 'strategyIds array is required' });
    }

    const result = await backtestEngine.compareStrategies(strategyIds, options || {}, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/backtests/stress-test
exports.stressTestStrategy = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { strategy, scenarioId } = req.body;

    if (!strategy || !scenarioId) {
      return res.status(400).json({ success: false, error: 'Strategy and scenarioId are required' });
    }

    const result = await backtestEngine.stressTestStrategyExposure(strategy, scenarioId, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/backtests/research-question
exports.generateResearchQuestion = async (req, res, next) => {
  try {
    const { backtestResult } = req.body;
    if (!backtestResult) {
      return res.status(400).json({ success: false, error: 'backtestResult is required' });
    }

    const result = backtestEngine.synthesizeResearchQuestion(backtestResult);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/backtests/explain
exports.explainBacktest = async (req, res, next) => {
  try {
    const { backtestResult } = req.body;
    if (!backtestResult) {
      return res.status(400).json({ success: false, error: 'backtestResult payload is required' });
    }

    let explanation;
    try {
      explanation = await aiAnalystService.generateAnalysis({
        type: 'STRATEGY_RESEARCH_EXPLANATION',
        ...backtestResult
      });
    } catch (aiErr) {
      explanation = aiAnalystService.generateDeterministicBacktestExplanation(backtestResult);
    }

    res.json({ success: true, data: explanation });
  } catch (err) {
    next(err);
  }
};

const strategyVersioningService = require('../services/strategyVersioningService');

// POST /api/v1/strategies/versioned
exports.saveVersionedStrategy = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { strategyData, existingStrategyId } = req.body;
    if (!strategyData) {
      return res.status(400).json({ success: false, error: 'strategyData is required' });
    }

    const result = await strategyVersioningService.saveStrategyVersion(userId, strategyData, existingStrategyId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/strategies/:id/versions
exports.getStrategyVersions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const history = await strategyVersioningService.getStrategyVersionHistory(userId, id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/strategies/compare-experiments
exports.compareExperiments = async (req, res, next) => {
  try {
    const { experimentA, experimentB, labelA, labelB } = req.body;
    if (!experimentA || !experimentB) {
      return res.status(400).json({ success: false, error: 'experimentA and experimentB are required' });
    }

    const comparison = strategyVersioningService.compareExperiments(experimentA, experimentB, labelA, labelB);
    res.json({ success: true, data: comparison });
  } catch (err) {
    next(err);
  }
};

const strategyRobustnessService = require('../services/strategyRobustnessService');

// POST /api/v1/strategies/robustness
exports.runRobustnessEvaluation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { strategy, options } = req.body;
    if (!strategy) {
      return res.status(400).json({ success: false, error: 'strategy is required' });
    }

    const evaluation = await strategyRobustnessService.evaluateStrategyRobustness(strategy, options || {}, userId);
    res.json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
};
