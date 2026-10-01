const learningCoachService = require("../services/learningCoachService");

const getLearningProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const profile = await learningCoachService.getLearningProfile(userId);
    res.json({ success: true, data: profile, error: null });
  } catch (err) {
    next(err);
  }
};

const getResearchQuestions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const data = await learningCoachService.getPersonalResearchQuestions(userId);
    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
};

const getKnowledgeGaps = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const data = await learningCoachService.getKnowledgeGaps(userId);
    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
};

const getLearningLoop = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const data = await learningCoachService.getLearningLoopStatus(userId);
    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLearningProfile,
  getResearchQuestions,
  getKnowledgeGaps,
  getLearningLoop
};
