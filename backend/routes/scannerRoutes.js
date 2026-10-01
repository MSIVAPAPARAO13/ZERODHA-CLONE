const express = require('express');
const router = express.Router();
const scannerController = require('../controllers/scannerController');

// Scanner CRUD
router.get('/', scannerController.getScanners);
router.post('/', scannerController.createScanner);
router.get('/:id', scannerController.getScannerById);
router.patch('/:id', scannerController.updateScanner);
router.delete('/:id', scannerController.deleteScanner);

// Execution & Integration Bridges
router.post('/run', scannerController.runScan);
router.post('/backtest', scannerController.backtestScan);
router.post('/stress', scannerController.stressTestCandidates);
router.post('/research-question', scannerController.generateResearchQuestion);
router.post('/explain', scannerController.explainScan);

module.exports = router;
