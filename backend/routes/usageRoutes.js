const express = require("express");
const router = express.Router();
const usageController = require("../controllers/usageController");

router.get("/", (req, res, next) => usageController.getUsage(req, res, next));
router.get("/limits", (req, res, next) => usageController.getLimits(req, res, next));

module.exports = router;
