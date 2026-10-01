const insightsService = require("../services/insightsService");
const marketEventService = require("../services/marketEventService");

class InsightsController {
  async getToday(req, res, next) {
    try {
      const userId = req.user?.userId;
      const feed = await insightsService.getTodayFeed(userId);
      return res.status(200).json({
        success: true,
        data: feed,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const userId = req.user?.userId;
      const history = await insightsService.getHistoryFeed(userId, req.query);
      return res.status(200).json({
        success: true,
        data: history,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const updated = await marketEventService.markRead(userId, id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Insight event not found or access denied." }
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

  async dismiss(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const dismissed = await marketEventService.dismissEvent(userId, id);
      if (!dismissed) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Insight event not found or access denied." }
        });
      }
      return res.status(200).json({
        success: true,
        data: dismissed,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InsightsController();
