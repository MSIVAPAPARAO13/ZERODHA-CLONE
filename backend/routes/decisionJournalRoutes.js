const express = require('express');
const router = express.Router();
const decisionJournalController = require('../controllers/decisionJournalController');

router.post('/', (req, res, next) => decisionJournalController.createDecision(req, res, next));
router.get('/', (req, res, next) => decisionJournalController.getDecisions(req, res, next));
router.get('/:id', (req, res, next) => decisionJournalController.getDecisionById(req, res, next));
router.patch('/:id', (req, res, next) => decisionJournalController.updateDecision(req, res, next));
router.post('/:id/timeline', (req, res, next) => decisionJournalController.addTimelineEvent(req, res, next));
router.delete('/:id', (req, res, next) => decisionJournalController.deleteDecision(req, res, next));

module.exports = router;
