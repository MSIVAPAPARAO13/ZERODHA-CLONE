const express = require('express');
const { getBehaviorAnalytics } = require('../controllers/analyticsController');
const router = express.Router();

router.get('/behavior', getBehaviorAnalytics);

module.exports = router;
