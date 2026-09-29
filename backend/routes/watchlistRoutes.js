const express = require('express');
const { getWatchlist, addSymbol, removeSymbol } = require('../controllers/watchlistController');
const router = express.Router();

router.get('/', getWatchlist);
router.post('/', addSymbol);
router.delete('/:symbol', removeSymbol);

module.exports = router;
