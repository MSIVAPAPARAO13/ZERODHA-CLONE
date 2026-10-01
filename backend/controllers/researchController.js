const researchCopilotService = require('../services/researchCopilotService');
const aiAnalystService = require('../services/aiAnalystService');
const researchAgentService = require('../services/researchAgentService');

class ResearchController {
  async runAgent(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { question, maxIterations } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: 'Question string is required for research agent.' }
        });
      }

      const result = await researchAgentService.runAgent(userId, { question, maxIterations });

      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async investigate(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { question, options, symbol, symbols, scannerName } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: 'Question string is required for investigation.' }
        });
      }

      const mergedOptions = {
        ...(options || {}),
        symbol,
        symbols,
        scannerName
      };

      const result = await researchCopilotService.investigate(question, mergedOptions, userId);

      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async compare(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { symbols } = req.body;

      if (!symbols || !Array.isArray(symbols) || symbols.length < 2) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: 'Comparison requires an array of at least 2 symbols.' }
        });
      }

      const result = await researchCopilotService.compareSymbols(symbols, userId);

      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async deepen(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { sessionId, deepType } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: 'Session ID is required to deepen research.' }
        });
      }

      const result = await researchCopilotService.deepenResearch(sessionId, deepType || 'BACKTEST', userId);

      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async explain(req, res, next) {
    try {
      const { question, evidenceList, options } = req.body;

      if (!question) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: 'Question is required for AI explainer.' }
        });
      }

      const explanation = aiAnalystService.generateResearchCopilotReport(question, evidenceList || [], options || {});

      return res.status(200).json({
        success: true,
        data: { explanation },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getSessions(req, res, next) {
    try {
      const userId = req.user?.userId;
      const sessions = await researchCopilotService.getUserSessions(userId);

      return res.status(200).json({
        success: true,
        data: { sessions },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getSessionById(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const session = await researchCopilotService.getSessionById(id, userId);
      if (!session) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Research session not found.' }
        });
      }

      return res.status(200).json({
        success: true,
        data: { session },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSession(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const updated = await researchCopilotService.updateSession(id, req.body, userId);
      if (!updated) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Research session not found.' }
        });
      }

      return res.status(200).json({
        success: true,
        data: { session: updated },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteSession(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const deleted = await researchCopilotService.deleteSession(id, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Research session not found.' }
        });
      }

      return res.status(200).json({
        success: true,
        data: { message: 'Research session removed successfully.' },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ResearchController();
