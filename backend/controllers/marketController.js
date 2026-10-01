const marketDataService = require('../services/marketDataService');

const handleError = (err, res, next) => {
  if (err.message === 'MARKET_DATA_RATE_LIMITED') {
    return res.status(429).json({ success: false, data: null, error: { code: 'MARKET_DATA_RATE_LIMITED', message: 'Market data provider rate limit reached.' } });
  }
  if (err.message.includes('DATA_UNAVAILABLE') || err.message.includes('not found') || err.message.includes('Unknown symbol')) {
    return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } });
  }
  if (err.message.includes('not supported')) {
    return res.status(501).json({ success: false, data: null, error: { code: 'NOT_SUPPORTED', message: err.message } });
  }
  next(err);
};

const getQuote = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await marketDataService.getQuote(symbol);
    if (!quote) {
      return res.status(404).json({ success: false, data: null, error: { message: `Symbol ${symbol} not found` } });
    }
    res.json({ success: true, data: quote, error: null });
  } catch (err) {
    handleError(err, res, next);
  }
};

const getQuotes = async (req, res, next) => {
  try {
    const { symbols } = req.query;
    const symbolArray = symbols ? symbols.split(',') : [];
    const quotes = await marketDataService.getQuotes(symbolArray);
    res.json({ success: true, data: quotes, error: null });
  } catch (err) {
    handleError(err, res, next);
  }
};

const searchSymbols = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, data: null, error: { message: 'Query parameter q is required' } });
    }
    const results = await marketDataService.searchSymbols(q);
    res.json({ success: true, data: results, error: null });
  } catch (err) {
    handleError(err, res, next);
  }
};

const getHistoricalData = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { interval } = req.query;
    const data = await marketDataService.getHistoricalData(symbol, { interval: interval || '1day' });
    if (!data) return res.status(404).json({ success: false, error: { message: 'History not found' } });
    res.json({ success: true, data, error: null });
  } catch (err) {
    handleError(err, res, next);
  }
};

const getTechnicalIndicators = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { indicator } = req.query;
    if (!indicator) return res.status(400).json({ success: false, error: { message: 'indicator query is required' } });
    const data = await marketDataService.getTechnicalIndicators(symbol, indicator, req.query);
    if (!data) return res.status(404).json({ success: false, error: { message: 'Indicator data not found' } });
    res.json({ success: true, data, error: null });
  } catch (err) {
    handleError(err, res, next);
  }
};

const getNewsSentiment = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const data = await marketDataService.getNewsSentiment(symbol, req.query);
    if (!data) return res.status(404).json({ success: false, error: { message: 'News not found' } });
    res.json({ success: true, data, error: null });
  } catch (err) {
    handleError(err, res, next);
  }
};

const getMarketIntelligence = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await marketDataService.getQuote(symbol).catch(e => null);
    let historical = null;
    let news = null;
    let technical = null;
    
    try { historical = await marketDataService.getHistoricalData(symbol, { interval: '1day' }); } catch(e){}
    try { news = await marketDataService.getNewsSentiment(symbol, {}); } catch(e){}
    try { technical = await marketDataService.getTechnicalIndicators(symbol, 'RSI', {}); } catch(e){}
    
    res.json({
      success: true,
      data: { quote, historical, news, technical, metadata: { provider: process.env.MARKET_DATA_PROVIDER } },
      error: null
    });
  } catch (err) {
    handleError(err, res, next);
  }
};

const marketRegimeService = require("../services/marketRegimeService");

const getMarketRegime = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const regimeData = await marketRegimeService.detectCurrentRegime(userId, req.query);
    res.json({
      success: true,
      data: regimeData,
      error: null
    });
  } catch (err) {
    handleError(err, res, next);
  }
};

const getMarketRegimeHistory = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { limit = 20 } = req.query;
    const history = await marketRegimeService.getRegimeHistory(userId, limit);
    res.json({
      success: true,
      data: history,
      error: null
    });
  } catch (err) {
    handleError(err, res, next);
  }
};

const marketNarrativeService = require("../services/marketNarrativeService");

const getMarketNarrative = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const narrative = await marketNarrativeService.generateMarketNarrative(userId, req.query);
    res.json({
      success: true,
      data: narrative,
      error: null
    });
  } catch (err) {
    handleError(err, res, next);
  }
};

module.exports = {
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
};
