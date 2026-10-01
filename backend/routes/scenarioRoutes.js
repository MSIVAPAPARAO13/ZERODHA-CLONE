const express = require('express');
const {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario,
  runScenario,
  compareScenarios,
  explainScenario
} = require('../controllers/scenarioController');

const router = express.Router();

router.get('/', getScenarios);
router.post('/', createScenario);
router.post('/run', runScenario);
router.post('/compare', compareScenarios);
router.post('/ai-explain', explainScenario);
router.get('/:id', getScenarioById);
router.patch('/:id', updateScenario);
router.delete('/:id', deleteScenario);
router.post('/:id/run', runScenario);

module.exports = router;
