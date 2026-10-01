const { ScannerModel } = require('../models/ScannerModel');
const marketScannerService = require('../services/marketScannerService');
const aiAnalystService = require('../services/aiAnalystService');

// GET /api/v1/scanners
exports.getScanners = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const custom = await ScannerModel.find({ user: userId, isArchived: false }).sort({ updatedAt: -1 });
    const presets = marketScannerService.getCuratedPresets();

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

// GET /api/v1/scanners/:id
exports.getScannerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const preset = marketScannerService.getCuratedPresets().find(p => p._id === id);
    if (preset) {
      return res.json({ success: true, data: preset });
    }

    const scanner = await ScannerModel.findOne({ _id: id, user: userId, isArchived: false });
    if (!scanner) {
      return res.status(404).json({ success: false, error: 'Scanner not found' });
    }

    res.json({ success: true, data: scanner });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scanners
exports.createScanner = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      description,
      universe,
      customSymbols,
      matchMode,
      conditionGroup,
      conditions
    } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Scanner name is required' });
    }

    const scanner = new ScannerModel({
      user: userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      universe: universe || 'NIFTY50',
      customSymbols: customSymbols || [],
      matchMode: matchMode || 'STRICT',
      conditionGroup: conditionGroup || 'AND',
      conditions: conditions || [],
      version: 1
    });

    await scanner.save();
    res.status(201).json({ success: true, data: scanner });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/scanners/:id
exports.updateScanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const scanner = await ScannerModel.findOne({ _id: id, user: userId, isArchived: false });
    if (!scanner) {
      return res.status(404).json({ success: false, error: 'Scanner not found' });
    }

    const updates = req.body;
    if (updates.name) scanner.name = updates.name.trim();
    if (updates.description !== undefined) scanner.description = updates.description.trim();
    if (updates.universe) scanner.universe = updates.universe;
    if (updates.customSymbols) scanner.customSymbols = updates.customSymbols;
    if (updates.matchMode) scanner.matchMode = updates.matchMode;
    if (updates.conditionGroup) scanner.conditionGroup = updates.conditionGroup;
    if (updates.conditions) scanner.conditions = updates.conditions;

    // Increment version
    scanner.version += 1;

    await scanner.save();
    res.json({ success: true, data: scanner });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/scanners/:id
exports.deleteScanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const scanner = await ScannerModel.findOne({ _id: id, user: userId });
    if (!scanner) {
      return res.status(404).json({ success: false, error: 'Scanner not found' });
    }

    scanner.isArchived = true;
    await scanner.save();

    res.json({ success: true, data: { message: 'Scanner archived successfully' } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scanners/run
exports.runScan = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { scanner, options } = req.body;

    if (!scanner) {
      return res.status(400).json({ success: false, error: 'Scanner or Scanner ID is required' });
    }

    const result = await marketScannerService.runScan(scanner, options || {}, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scanners/backtest
exports.backtestScan = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { scanner, options } = req.body;

    if (!scanner) {
      return res.status(400).json({ success: false, error: 'Scanner is required' });
    }

    const result = await marketScannerService.backtestScan(scanner, options || {}, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scanners/stress
exports.stressTestCandidates = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { symbols, scenarioId } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ success: false, error: 'Symbols array is required' });
    }

    const result = await marketScannerService.stressTestCandidates(symbols, scenarioId || 'preset-it-correction', userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scanners/research-question
exports.generateResearchQuestion = async (req, res, next) => {
  try {
    const { scanResult } = req.body;
    if (!scanResult) {
      return res.status(400).json({ success: false, error: 'scanResult is required' });
    }

    const result = marketScannerService.synthesizeResearchQuestion(scanResult);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scanners/explain
exports.explainScan = async (req, res, next) => {
  try {
    const { scanResult } = req.body;
    if (!scanResult) {
      return res.status(400).json({ success: false, error: 'scanResult payload is required' });
    }

    let explanation;
    try {
      explanation = await aiAnalystService.generateAnalysis({
        type: 'MARKET_SCANNER_EXPLANATION',
        ...scanResult
      });
    } catch (aiErr) {
      explanation = aiAnalystService.generateDeterministicScannerExplanation(scanResult);
    }

    res.json({ success: true, data: explanation });
  } catch (err) {
    next(err);
  }
};
