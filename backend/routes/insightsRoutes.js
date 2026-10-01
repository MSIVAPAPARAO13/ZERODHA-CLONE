const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');

router.get('/today', (req, res, next) => insightsController.getToday(req, res, next));
router.get('/history', (req, res, next) => insightsController.getHistory(req, res, next));
router.patch('/:id/read', (req, res, next) => insightsController.markRead(req, res, next));
router.patch('/:id/dismiss', (req, res, next) => insightsController.dismiss(req, res, next));

module.exports = router;
