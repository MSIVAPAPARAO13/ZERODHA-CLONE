const express = require("express");
const router = express.Router();
const demoController = require("../controllers/demoController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", (req, res, next) => demoController.getOverview(req, res, next));
router.post("/seed", authMiddleware, (req, res, next) => demoController.seedDemo(req, res, next));

module.exports = router;
