const express = require('express');
const { getJournals, getJournalById, updateJournal, deleteJournal, getReplay } = require('../controllers/journalController');
const router = express.Router();

router.get('/', getJournals);
router.get('/:id', getJournalById);
router.patch('/:id', updateJournal);
router.delete('/:id', deleteJournal);
router.get('/:id/replay', getReplay);

module.exports = router;
