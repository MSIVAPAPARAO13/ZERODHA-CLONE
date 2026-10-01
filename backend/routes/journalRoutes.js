const express = require('express');
const {
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  getReplay,
  recordTradeReview,
  getJournalPatterns
} = require('../controllers/journalController');
const router = express.Router();

router.get('/', getJournals);
router.get('/intelligence/patterns', getJournalPatterns);
router.get('/:id', getJournalById);
router.post('/:id/review', recordTradeReview);
router.patch('/:id', updateJournal);
router.delete('/:id', deleteJournal);
router.get('/:id/replay', getReplay);

module.exports = router;
