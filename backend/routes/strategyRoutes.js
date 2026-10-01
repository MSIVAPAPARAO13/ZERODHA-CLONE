const express = require('express');
const router = express.Router();
const strategyController = require('../controllers/strategyController');

// Strategy CRUD
router.get('/', strategyController.getStrategies);
router.post('/', strategyController.createStrategy);
router.post('/versioned', strategyController.saveVersionedStrategy);
router.post('/compare-experiments', strategyController.compareExperiments);
router.post('/robustness', strategyController.runRobustnessEvaluation);
router.get('/:id', strategyController.getStrategyById);
router.get('/:id/versions', strategyController.getStrategyVersions);
router.patch('/:id', strategyController.updateStrategy);
router.delete('/:id', strategyController.deleteStrategy);

// Backtesting & Research APIs
router.post('/backtest/run', strategyController.runBacktest);
router.post('/backtest/optimize', strategyController.runOptimization);
router.post('/backtest/split-test', strategyController.runSplitTest);
router.post('/backtest/walk-forward', strategyController.runWalkForward);
router.post('/backtest/compare', strategyController.compareStrategies);
router.post('/backtest/stress-test', strategyController.stressTestStrategy);
router.post('/backtest/research-question', strategyController.generateResearchQuestion);
router.post('/backtest/explain', strategyController.explainBacktest);

module.exports = router;
