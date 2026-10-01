const collaborationService = require("../services/collaborationService");

class CollaborationController {
  async shareSession(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { sessionId } = req.params;
      const { organizationId } = req.body;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: "organizationId is required to share a session." }
        });
      }

      const result = await collaborationService.shareSession(userId, sessionId, organizationId);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message.startsWith("ORGANIZATION_ACCESS_DENIED") || err.message.startsWith("SESSION_ACCESS_DENIED")) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      if (err.message.includes("NOT_FOUND")) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async getSharedSessions(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { organizationId } = req.params;
      const result = await collaborationService.getSharedSessions(userId, organizationId);
      return res.status(200).json({
        success: true,
        data: { sessions: result },
        error: null
      });
    } catch (err) {
      if (err.message.startsWith("ORGANIZATION_ACCESS_DENIED")) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async addComment(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { sessionId } = req.params;
      const result = await collaborationService.addComment(userId, sessionId, req.body);
      return res.status(201).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "COMMENT_BODY_REQUIRED") {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      if (err.message.startsWith("SESSION_ACCESS_DENIED") || err.message.startsWith("ORGANIZATION_ACCESS_DENIED")) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      if (err.message.includes("NOT_FOUND")) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async getComments(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { sessionId } = req.params;
      const result = await collaborationService.getComments(userId, sessionId);
      return res.status(200).json({
        success: true,
        data: { comments: result },
        error: null
      });
    } catch (err) {
      if (err.message.startsWith("SESSION_ACCESS_DENIED") || err.message.startsWith("ORGANIZATION_ACCESS_DENIED")) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async resolveComment(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { commentId } = req.params;
      const result = await collaborationService.resolveComment(userId, commentId);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "COMMENT_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async createSessionVersion(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { sessionId } = req.params;
      const { updates, changeSummary } = req.body;
      const result = await collaborationService.createSessionVersion(userId, sessionId, updates, changeSummary);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message.startsWith("SESSION_ACCESS_DENIED")) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async getSessionVersions(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { sessionId } = req.params;
      const result = await collaborationService.getSessionVersions(userId, sessionId);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message.startsWith("SESSION_ACCESS_DENIED")) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }
}

module.exports = new CollaborationController();
