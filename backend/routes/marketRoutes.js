const express = require('express');
const {
  getQuote,
  getQuotes,
  searchSymbols,
  getHistoricalData,
  getTechnicalIndicators,
  getNewsSentiment,
  getMarketIntelligence,
  getMarketRegime,
  getMarketRegimeHistory,
  getMarketNarrative
} = require('../controllers/marketController');
const router = express.Router();

router.get('/narrative', getMarketNarrative);
router.get('/regime', getMarketRegime);
router.get('/regime/history', getMarketRegimeHistory);
router.get('/quote/:symbol', getQuote);
router.get('/quotes', getQuotes);
router.get('/search', searchSymbols);
router.get('/history/:symbol', getHistoricalData);
router.get('/technical/:symbol', getTechnicalIndicators);
router.get('/news/:symbol', getNewsSentiment);
router.get('/intelligence/:symbol', getMarketIntelligence);

module.exports = router;
