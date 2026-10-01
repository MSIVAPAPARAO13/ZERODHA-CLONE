const cascadeEngine = require('../services/cascadeEngine');
const aiAnalystService = require('../services/aiAnalystService');

/**
 * List normalized market events
 */
const getMarketEvents = async (req, res, next) => {
  try {
    const events = await cascadeEngine.getMarketEvents(req.query);
    res.json({ success: true, data: events, error: null });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single market event by ID
 */
const getMarketEventById = async (req, res, next) => {
  try {
    const event = await cascadeEngine.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'EVENT_NOT_FOUND', message: `Event ${req.params.id} not found` }
      });
    }
    res.json({ success: true, data: event, error: null });
  } catch (err) {
    next(err);
  }
};

/**
 * Get multi-hop event cascade graph
 * GET /api/v1/market-events/:id/cascade
 */
const getEventCascade = async (req, res, next) => {
  try {
    const { depth, relationshipTypes, asOf } = req.query;

    // Parameter validation
    if (depth !== undefined) {
      const parsedDepth = parseInt(depth, 10);
      if (isNaN(parsedDepth) || parsedDepth < 1 || parsedDepth > 3) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { code: 'INVALID_DEPTH', message: 'Parameter depth must be an integer between 1 and 3.' }
        });
      }
    }

    if (asOf && isNaN(Date.parse(asOf))) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_AS_OF', message: 'Parameter asOf must be a valid ISO-8601 date string.' }
      });
    }

    const cascade = await cascadeEngine.generateCascade(
      req.params.id,
      req.user.userId,
      { depth, relationshipTypes, asOf }
    );

    res.json({ success: true, data: cascade, error: null });
  } catch (err) {
    if (err.message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'EVENT_NOT_FOUND', message: 'Market event not found' }
      });
    }
    next(err);
  }
};

/**
 * Legacy/Direct Impact endpoint (MVP-32 compatibility)
 * GET /api/v1/market-events/:id/impact
 */
const getEventImpact = async (req, res, next) => {
  try {
    const cascade = await cascadeEngine.generateCascade(
      req.params.id,
      req.user.userId,
      { depth: 1 }
    );
    res.json({
      success: true,
      data: {
        event: cascade.event,
        portfolioImpact: cascade.portfolioImpact,
        directMatch: cascade.portfolioImpact.isHeld
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit user thesis review
 * POST /api/v1/market-events/:id/thesis-review
 */
const submitThesisReview = async (req, res, next) => {
  try {
    const { thesisId, status, reason } = req.body;
    if (!thesisId || !status) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'BAD_REQUEST', message: 'thesisId and status are required' }
      });
    }

    const review = await cascadeEngine.submitThesisReview(
      req.user.userId,
      req.params.id,
      { thesisId, status, reason }
    );

    res.json({ success: true, data: review, error: null });
  } catch (err) {
    if (err.message === 'INVALID_REVIEW_STATUS') {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_STATUS', message: 'Status must be STILL_VALID, NEEDS_UPDATE, or NO_LONGER_RELEVANT' }
      });
    }
    if (err.message === 'THESIS_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'THESIS_NOT_FOUND', message: 'Trade thesis record not found' }
      });
    }
    next(err);
  }
};

/**
 * Save synthesized research question
 * POST /api/v1/market-events/:id/research-question
 */
const saveResearchQuestion = async (req, res, next) => {
  try {
    const { question, context, thesisId, affectedSymbol } = req.body;
    if (!question) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'BAD_REQUEST', message: 'question string is required' }
      });
    }

    const result = await cascadeEngine.saveResearchQuestion(
      req.user.userId,
      req.params.id,
      { question, context, thesisId, affectedSymbol }
    );

    res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
};

/**
 * Grounded AI explanation of cascade evidence
 * POST /api/v1/market-events/:id/ai-explain
 */
const explainCascade = async (req, res, next) => {
  try {
    const cascade = await cascadeEngine.generateCascade(req.params.id, req.user.userId, req.body || {});
    const context = {
      type: 'EVENT_CASCADE_EXPLANATION',
      event: cascade.event,
      cascade: {
        nodeCount: cascade.nodes.length,
        edgeCount: cascade.edges.length,
        depth: cascade.meta.depth
      },
      portfolio: cascade.portfolioImpact,
      strategies: cascade.strategies,
      theses: cascade.theses,
      research: cascade.researchQuestions,
      evidence: cascade.edges.map(e => ({
        relation: e.relationshipType,
        source: e.source,
        target: e.target,
        confidence: e.confidence,
        evidence: e.evidence
      }))
    };

    let explanation;
    try {
      explanation = await aiAnalystService.generateAnalysis(context);
    } catch (aiErr) {
      // Deterministic fallback if Gemini key is missing or offline
      explanation = aiAnalystService.generateDeterministicCascadeExplanation(context);
    }

    res.json({ success: true, data: { explanation, groundedEvidence: context.evidence }, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMarketEvents,
  getMarketEventById,
  getEventCascade,
  getEventImpact,
  submitThesisReview,
  saveResearchQuestion,
  explainCascade
};
