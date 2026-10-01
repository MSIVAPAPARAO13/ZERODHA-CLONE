const digestService = require("../services/digestService");

class DigestController {
  async getToday(req, res, next) {
    try {
      const userId = req.user?.userId;
      const digest = await digestService.getDailyDigest(userId);
      return res.status(200).json({
        success: true,
        data: digest,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getWeek(req, res, next) {
    try {
      const userId = req.user?.userId;
      const digest = await digestService.getWeeklyDigest(userId);
      return res.status(200).json({
        success: true,
        data: digest,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DigestController();
