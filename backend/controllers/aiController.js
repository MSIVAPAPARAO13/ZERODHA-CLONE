const aiContextService = require('../services/aiContextService');
const aiAnalystService = require('../services/aiAnalystService');

const tradeReview = async (req, res, next) => {
  try {
    const context = await aiContextService.getTradeReviewContext(req.params.journalId, req.user.userId);
    const analysis = await aiAnalystService.generateAnalysis(context);
    res.json({ success: true, data: { analysis }, error: null });
  } catch (err) {
    if (err.message === 'AI_UNAVAILABLE' || err.message === 'AI_INVALID_RESPONSE') {
      return res.status(503).json({ success: false, data: null, error: { code: err.message, message: 'AI analysis is temporarily unavailable.' } });
    }
    next(err);
  }
};

const portfolioReview = async (req, res, next) => {
  try {
    const context = await aiContextService.getPortfolioContext(req.user.userId);
    const analysis = await aiAnalystService.generateAnalysis(context);
    res.json({ success: true, data: { analysis }, error: null });
  } catch (err) {
    if (err.message === 'AI_UNAVAILABLE' || err.message === 'AI_INVALID_RESPONSE') {
      return res.status(503).json({ success: false, data: null, error: { code: err.message, message: 'AI analysis is temporarily unavailable.' } });
    }
    next(err);
  }
};

const patternReview = async (req, res, next) => {
  try {
    const context = await aiContextService.getPatternContext(req.user.userId);
    const analysis = await aiAnalystService.generateAnalysis(context);
    res.json({ success: true, data: { analysis }, error: null });
  } catch (err) {
    if (err.message === 'AI_UNAVAILABLE' || err.message === 'AI_INVALID_RESPONSE') {
      return res.status(503).json({ success: false, data: null, error: { code: err.message, message: 'AI analysis is temporarily unavailable.' } });
    }
    next(err);
  }
};

const dailyDebrief = async (req, res, next) => {
  try {
    const context = await aiContextService.getDailyDebriefContext(req.user.userId);
    const analysis = await aiAnalystService.generateAnalysis(context);
    res.json({ success: true, data: { analysis }, error: null });
  } catch (err) {
    if (err.message === 'AI_UNAVAILABLE' || err.message === 'AI_INVALID_RESPONSE') {
      return res.status(503).json({ success: false, data: null, error: { code: err.message, message: 'AI analysis is temporarily unavailable.' } });
    }
    next(err);
  }
};

const whatChangedToday = async (req, res, next) => {
  try {
    const context = await aiContextService.getDailyDebriefContext(req.user.userId);
    // Overriding the type for the specific prompt
    context.type = 'DAILY_DEBRIEF'; 
    // This is essentially similar to daily debrief but could have its own prompt in the future.
    // For MVP we will just reuse daily debrief.
    const analysis = await aiAnalystService.generateAnalysis(context);
    res.json({ success: true, data: { analysis }, error: null });
  } catch (err) {
    next(err);
  }
};

const behaviorReview = async (req, res, next) => {
  try {
    const windowQuery = req.query.window || '30d';
    const context = await aiContextService.getBehaviorReviewContext(req.user.userId, windowQuery);
    
    // If not enough data, just return early without burning AI
    if (context.analytics && context.analytics.message) {
        return res.json({ success: true, data: { analysis: { summary: context.analytics.message, observedPatterns: [] } }, error: null });
    }

    const analysis = await aiAnalystService.generateAnalysis(context);
    res.json({ success: true, data: { analysis }, error: null });
  } catch (err) {
    if (err.message === 'AI_UNAVAILABLE' || err.message === 'AI_INVALID_RESPONSE') {
      return res.status(503).json({ success: false, data: null, error: { code: err.message, message: 'AI analysis is temporarily unavailable.' } });
    }
    next(err);
  }
};

const playbookSuggestion = async (req, res, next) => {
  try {
    const context = await aiContextService.getPlaybookSuggestionContext(req.body);
    const analysis = await aiAnalystService.generateAnalysis(context);
    res.json({ success: true, data: { analysis }, error: null });
  } catch (err) {
    next(err);
  }
};

const playbookReview = async (req, res, next) => {
  try {
    const context = await aiContextService.getPlaybookReviewContext(req.user.userId);
    const analysis = await aiAnalystService.generateAnalysis(context);
    res.json({ success: true, data: { analysis }, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  tradeReview,
  portfolioReview,
  patternReview,
  dailyDebrief,
  whatChangedToday,
  behaviorReview,
  playbookSuggestion,
  playbookReview
};
