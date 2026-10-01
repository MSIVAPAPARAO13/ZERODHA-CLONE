const marketEventService = require("../services/marketEventService");

class EventsController {
  async getEvents(req, res, next) {
    try {
      const userId = req.user?.userId;
      const result = await marketEventService.getEvents(userId, req.query);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getEventById(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const event = await marketEventService.getEventById(userId, id);

      if (!event) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Market event not found or access denied." }
        });
      }

      return res.status(200).json({
        success: true,
        data: event,
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
          error: { message: "Market event not found or access denied." }
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

  async markAllRead(req, res, next) {
    try {
      const userId = req.user?.userId;
      const result = await marketEventService.markAllRead(userId);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async evaluate(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { specificSymbols } = req.body || {};
      const events = await marketEventService.evaluateMarketEvents(userId, { specificSymbols });
      return res.status(200).json({
        success: true,
        data: {
          evaluatedCount: events.length,
          events
        },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EventsController();
