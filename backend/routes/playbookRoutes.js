const express = require('express');
const { getPlaybooks, getPlaybook, createPlaybook, updatePlaybook, deletePlaybook } = require('../controllers/playbookController');
const router = express.Router();

router.get('/', getPlaybooks);
router.post('/', createPlaybook);
router.get('/:id', getPlaybook);
router.patch('/:id', updatePlaybook);
router.delete('/:id', deletePlaybook);

module.exports = router;
