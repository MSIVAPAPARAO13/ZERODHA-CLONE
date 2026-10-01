const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminMiddleware = require("../middleware/adminMiddleware");

// Enforce admin role on all admin routes
router.use(adminMiddleware);

router.get("/overview", (req, res, next) => adminController.getOverview(req, res, next));
router.get("/users", (req, res, next) => adminController.getUsers(req, res, next));
router.get("/organizations", (req, res, next) => adminController.getOrganizations(req, res, next));
router.get("/providers", (req, res, next) => adminController.getProviders(req, res, next));
router.get("/system-events", (req, res, next) => adminController.getSystemEvents(req, res, next));

module.exports = router;
