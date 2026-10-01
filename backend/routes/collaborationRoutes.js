const express = require("express");
const router = express.Router();
const collaborationController = require("../controllers/collaborationController");

// Session Sharing
router.post("/sessions/:sessionId/share", (req, res, next) => collaborationController.shareSession(req, res, next));
router.get("/organizations/:organizationId/sessions", (req, res, next) => collaborationController.getSharedSessions(req, res, next));

// Comments & Counter-Evidence
router.post("/sessions/:sessionId/comments", (req, res, next) => collaborationController.addComment(req, res, next));
router.get("/sessions/:sessionId/comments", (req, res, next) => collaborationController.getComments(req, res, next));
router.patch("/comments/:commentId/resolve", (req, res, next) => collaborationController.resolveComment(req, res, next));

// Research Versioning
router.post("/sessions/:sessionId/versions", (req, res, next) => collaborationController.createSessionVersion(req, res, next));
router.get("/sessions/:sessionId/versions", (req, res, next) => collaborationController.getSessionVersions(req, res, next));

module.exports = router;
