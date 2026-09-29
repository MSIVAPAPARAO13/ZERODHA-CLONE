const express = require('express');
const { getAlerts, createAlert, updateAlert, deleteAlert, evaluateAlerts } = require('../controllers/alertController');
const router = express.Router();

router.get('/', getAlerts);
router.post('/', createAlert);
router.patch('/:id', updateAlert);
router.delete('/:id', deleteAlert);

// Note: Usually evaluation might be an admin/system route, but placing here for MVP evaluation.
router.post('/evaluate', evaluateAlerts);

module.exports = router;
