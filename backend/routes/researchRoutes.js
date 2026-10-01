const express = require('express');
const router = express.Router();
const researchController = require('../controllers/researchController');

// Investigation & Synthesis
router.post('/agent', (req, res, next) => researchController.runAgent(req, res, next));
router.post('/investigate', (req, res, next) => researchController.investigate(req, res, next));
router.post('/compare', (req, res, next) => researchController.compare(req, res, next));
router.post('/deeper', (req, res, next) => researchController.deepen(req, res, next));
router.post('/explain', (req, res, next) => researchController.explain(req, res, next));

// Session CRUD
router.get('/sessions', (req, res, next) => researchController.getSessions(req, res, next));
router.get('/sessions/:id', (req, res, next) => researchController.getSessionById(req, res, next));
router.patch('/sessions/:id', (req, res, next) => researchController.updateSession(req, res, next));
router.delete('/sessions/:id', (req, res, next) => researchController.deleteSession(req, res, next));

// MVP-53 Research Workflows
const researchWorkflowController = require('../controllers/researchWorkflowController');
router.post('/workflows', (req, res, next) => researchWorkflowController.createWorkflow(req, res, next));
router.get('/workflows', (req, res, next) => researchWorkflowController.getWorkflows(req, res, next));
router.get('/workflows/:id', (req, res, next) => researchWorkflowController.getWorkflowById(req, res, next));
router.patch('/workflows/:id', (req, res, next) => researchWorkflowController.updateWorkflow(req, res, next));
router.delete('/workflows/:id', (req, res, next) => researchWorkflowController.deleteWorkflow(req, res, next));
router.post('/workflows/:id/duplicate', (req, res, next) => researchWorkflowController.duplicateWorkflow(req, res, next));
router.post('/workflows/:id/run', (req, res, next) => researchWorkflowController.runWorkflow(req, res, next));

module.exports = router;
