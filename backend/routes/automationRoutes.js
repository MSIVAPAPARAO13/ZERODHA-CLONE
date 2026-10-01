const express = require("express");
const {
  createAutomation,
  listAutomations,
  getAutomationById,
  updateAutomation,
  deleteAutomation,
  runAutomation
} = require("../controllers/automationController");

const router = express.Router();

router.post("/", createAutomation);
router.get("/", listAutomations);
router.get("/:id", getAutomationById);
router.patch("/:id", updateAutomation);
router.delete("/:id", deleteAutomation);
router.post("/:id/run", runAutomation);

module.exports = router;
