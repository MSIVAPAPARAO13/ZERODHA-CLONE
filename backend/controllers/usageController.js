const usageService = require("../services/usageService");

class UsageController {
  async getUsage(req, res, next) {
    try {
      const userId = req.user?.userId;
      const usage = await usageService.getUsage(userId);
      return res.status(200).json({
        success: true,
        data: usage,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getLimits(req, res, next) {
    try {
      const userId = req.user?.userId;
      const limits = await usageService.getLimits(userId);
      return res.status(200).json({
        success: true,
        data: limits,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getBillingPlan(req, res, next) {
    try {
      const userId = req.user?.userId;
      const plan = await usageService.getUserPlan(userId);
      return res.status(200).json({
        success: true,
        data: { plan },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UsageController();
