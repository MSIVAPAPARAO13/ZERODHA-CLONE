const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

router.get('/', (req, res, next) => eventsController.getEvents(req, res, next));
router.get('/:id', (req, res, next) => eventsController.getEventById(req, res, next));
router.patch('/read-all', (req, res, next) => eventsController.markAllRead(req, res, next));
router.patch('/:id/read', (req, res, next) => eventsController.markRead(req, res, next));
router.post('/evaluate', (req, res, next) => eventsController.evaluate(req, res, next));

module.exports = router;
