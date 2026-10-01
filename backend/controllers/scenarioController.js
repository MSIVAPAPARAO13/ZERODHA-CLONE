const scenarioEngine = require('../services/scenarioEngine');
const aiAnalystService = require('../services/aiAnalystService');

/**
 * List user scenarios and presets
 */
const getScenarios = async (req, res, next) => {
  try {
    const list = await scenarioEngine.getScenarios(req.user.userId);
    res.json({ success: true, data: list, error: null });
  } catch (err) {
    next(err);
  }
};

/**
 * Get scenario by ID
 */
const getScenarioById = async (req, res, next) => {
  try {
    const scenario = await scenarioEngine.getScenarioById(req.params.id, req.user.userId);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SCENARIO_NOT_FOUND', message: 'Scenario not found' }
      });
    }
    res.json({ success: true, data: scenario, error: null });
  } catch (err) {
    next(err);
  }
};

/**
 * Create custom scenario
 */
const createScenario = async (req, res, next) => {
  try {
    const scenario = await scenarioEngine.createScenario(req.user.userId, req.body);
    res.status(201).json({ success: true, data: scenario, error: null });
  } catch (err) {
    if (err.message.includes('REQUIRED') || err.message.includes('SHOCK')) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'BAD_REQUEST', message: err.message }
      });
    }
    next(err);
  }
};

/**
 * Update custom scenario
 */
const updateScenario = async (req, res, next) => {
  try {
    const scenario = await scenarioEngine.updateScenario(req.params.id, req.user.userId, req.body);
    res.json({ success: true, data: scenario, error: null });
  } catch (err) {
    if (err.message === 'SCENARIO_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SCENARIO_NOT_FOUND', message: 'Scenario not found' }
      });
    }
    if (err.message.includes('SHOCK') || err.message.includes('REQUIRED')) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'BAD_REQUEST', message: err.message }
      });
    }
    next(err);
  }
};

/**
 * Delete custom scenario
 */
const deleteScenario = async (req, res, next) => {
  try {
    await scenarioEngine.deleteScenario(req.params.id, req.user.userId);
    res.json({ success: true, data: { message: 'Scenario deleted successfully' }, error: null });
  } catch (err) {
    if (err.message === 'SCENARIO_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SCENARIO_NOT_FOUND', message: 'Scenario not found' }
      });
    }
    next(err);
  }
};

/**
 * Run scenario simulation
 */
const runScenario = async (req, res, next) => {
  try {
    const scenarioDef = req.params.id || req.body.scenario || req.body;
    const options = {
      asOf: req.body.asOf || req.query.asOf,
      whatIfPositions: req.body.whatIfPositions || []
    };

    const result = await scenarioEngine.runScenario(req.user.userId, scenarioDef, options);
    res.json({ success: true, data: result, error: null });
  } catch (err) {
    if (err.message === 'SCENARIO_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SCENARIO_NOT_FOUND', message: 'Scenario not found' }
      });
    }
    if (err.message.includes('INVALID') || err.message.includes('SHOCK') || err.message.includes('REQUIRED')) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'BAD_REQUEST', message: err.message }
      });
    }
    next(err);
  }
};

/**
 * Compare multiple scenarios side-by-side
 */
const compareScenarios = async (req, res, next) => {
  try {
    const { scenarios } = req.body;
    if (!scenarios || !Array.isArray(scenarios) || scenarios.length < 2) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'BAD_REQUEST', message: 'Array of at least 2 scenarios is required for comparison.' }
      });
    }

    const comparison = await scenarioEngine.compareScenarios(req.user.userId, scenarios, req.body.options || {});
    res.json({ success: true, data: comparison, error: null });
  } catch (err) {
    next(err);
  }
};

/**
 * Grounded AI explanation of scenario analysis
 */
const explainScenario = async (req, res, next) => {
  try {
    const scenarioDef = req.body.scenario || req.body;
    const runResult = await scenarioEngine.runScenario(req.user.userId, scenarioDef, req.body.options || {});

    const context = {
      type: 'SCENARIO_STRESS_EXPLANATION',
      scenario: runResult.scenario,
      baseline: runResult.baseline,
      modeledResult: runResult.modeledResult,
      holdingContributions: runResult.topContributors,
      offsets: runResult.topOffsets,
      strategyExposure: runResult.strategyExposure,
      thesisLinks: runResult.thesisLinks,
      methodology: runResult.methodology
    };

    let explanation;
    try {
      explanation = await aiAnalystService.generateAnalysis(context);
    } catch (aiErr) {
      // Deterministic fallback if Gemini key is missing or offline
      explanation = aiAnalystService.generateDeterministicScenarioExplanation(context);
    }

    res.json({ success: true, data: { explanation, runResult }, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario,
  runScenario,
  compareScenarios,
  explainScenario
};
