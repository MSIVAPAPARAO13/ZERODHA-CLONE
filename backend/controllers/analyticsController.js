const behaviorAnalyticsService = require('../services/behaviorAnalyticsService');

const getBehaviorAnalytics = async (req, res, next) => {
  try {
    const windowQuery = req.query.window || '30d';
    const analytics = await behaviorAnalyticsService.getAnalytics(req.user.userId, windowQuery);
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBehaviorAnalytics
};
