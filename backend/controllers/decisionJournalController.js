const decisionJournalService = require("../services/decisionJournalService");

class DecisionJournalController {
  async createDecision(req, res, next) {
    try {
      const userId = req.user?.userId;
      const decision = await decisionJournalService.createDecision(userId, req.body);
      return res.status(201).json({
        success: true,
        data: decision,
        error: null
      });
    } catch (err) {
      if (err.message.includes("REQUIRED")) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async getDecisions(req, res, next) {
    try {
      const userId = req.user?.userId;
      const result = await decisionJournalService.getDecisions(userId, req.query);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getDecisionById(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const decision = await decisionJournalService.getDecisionById(userId, id);
      if (!decision) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Decision record not found or access denied." }
        });
      }
      return res.status(200).json({
        success: true,
        data: decision,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDecision(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const updated = await decisionJournalService.updateDecision(userId, id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Decision record not found or access denied." }
        });
      }
      return res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async addTimelineEvent(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const updated = await decisionJournalService.addTimelineEvent(userId, id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Decision record not found or access denied." }
        });
      }
      return res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteDecision(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const deleted = await decisionJournalService.deleteDecision(userId, id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Decision record not found or access denied." }
        });
      }
      return res.status(200).json({
        success: true,
        data: { message: "Decision deleted successfully." },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DecisionJournalController();
