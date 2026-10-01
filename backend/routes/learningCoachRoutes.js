const express = require("express");
const {
  getLearningProfile,
  getResearchQuestions,
  getKnowledgeGaps,
  getLearningLoop
} = require("../controllers/learningCoachController");

const router = express.Router();

router.get("/profile", getLearningProfile);
router.get("/questions", getResearchQuestions);
router.get("/gaps", getKnowledgeGaps);
router.get("/loop", getLearningLoop);

module.exports = router;
