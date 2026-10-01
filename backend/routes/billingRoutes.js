const express = require("express");
const router = express.Router();
const usageController = require("../controllers/usageController");

router.get("/plan", (req, res, next) => usageController.getBillingPlan(req, res, next));

module.exports = router;
