const demoService = require("../services/demoService");

class DemoController {
  getOverview(req, res, next) {
    try {
      const data = demoService.getDemoOverview();
      return res.status(200).json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async seedDemo(req, res, next) {
    try {
      const userId = req.user?.userId || req.body?.userId;
      if (!userId) {
        return res.status(400).json({ success: false, data: null, error: { message: "Authentication required to seed demo data" } });
      }
      const result = await demoService.seedUserData(userId);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DemoController();
