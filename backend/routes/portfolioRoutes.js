const express = require("express");
const {
  getHoldings,
  getPositions,
  getIntelligence,
  getExposure,
  getConcentration
} = require("../controllers/portfolioController");
const router = express.Router();

router.get("/holdings", getHoldings);
router.get("/positions", getPositions);
router.get("/intelligence", getIntelligence);
router.get("/exposure", getExposure);
router.get("/concentration", getConcentration);

module.exports = router;
