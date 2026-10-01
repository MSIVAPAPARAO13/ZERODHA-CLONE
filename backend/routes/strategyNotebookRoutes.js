const express = require("express");
const {
  recordExperiment,
  getNotebookEntries,
  getNotebookEntryById,
  updateNotebookEntry,
  getInvestigationBridge
} = require("../controllers/strategyNotebookController");

const router = express.Router();

router.post("/", recordExperiment);
router.get("/", getNotebookEntries);
router.get("/:id", getNotebookEntryById);
router.patch("/:id", updateNotebookEntry);
router.get("/:id/investigate", getInvestigationBridge);

module.exports = router;
