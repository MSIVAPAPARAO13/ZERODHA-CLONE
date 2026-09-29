const express = require("express");
const { getHoldings, getPositions } = require("../controllers/portfolioController");
const router = express.Router();

router.get("/holdings", getHoldings);
router.get("/positions", getPositions);

module.exports = router;
