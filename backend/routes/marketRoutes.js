const express = require('express');
const { getQuote, getQuotes, searchSymbols, getHistoricalData, getTechnicalIndicators, getNewsSentiment, getMarketIntelligence } = require('../controllers/marketController');
const router = express.Router();

router.get('/quote/:symbol', getQuote);
router.get('/quotes', getQuotes);
router.get('/search', searchSymbols);
router.get('/history/:symbol', getHistoricalData);
router.get('/technical/:symbol', getTechnicalIndicators);
router.get('/news/:symbol', getNewsSentiment);
router.get('/intelligence/:symbol', getMarketIntelligence);

module.exports = router;
