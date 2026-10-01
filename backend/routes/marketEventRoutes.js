const express = require('express');
const {
  getMarketEvents,
  getMarketEventById,
  getEventCascade,
  getEventImpact,
  submitThesisReview,
  saveResearchQuestion,
  explainCascade
} = require('../controllers/marketEventController');

const router = express.Router();

router.get('/', getMarketEvents);
router.get('/:id', getMarketEventById);
router.get('/:id/cascade', getEventCascade);
router.get('/:id/impact', getEventImpact);
router.post('/:id/thesis-review', submitThesisReview);
router.post('/:id/research-question', saveResearchQuestion);
router.post('/:id/ai-explain', explainCascade);

module.exports = router;
