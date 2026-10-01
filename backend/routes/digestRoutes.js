const express = require("express");
const router = express.Router();
const digestController = require("../controllers/digestController");

router.get("/today", (req, res, next) => digestController.getToday(req, res, next));
router.get("/week", (req, res, next) => digestController.getWeek(req, res, next));

module.exports = router;
