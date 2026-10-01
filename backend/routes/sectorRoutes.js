const express = require("express");
const {
  getSectorDashboard,
  getSectorDetails,
  compareSectors,
  emitSectorEvents
} = require("../controllers/sectorController");

const router = express.Router();

router.get("/", getSectorDashboard);
router.get("/compare", compareSectors);
router.post("/events/detect", emitSectorEvents);
router.get("/:sectorName", getSectorDetails);

module.exports = router;
