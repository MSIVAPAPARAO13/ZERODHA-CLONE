const strategyNotebookService = require("../services/strategyNotebookService");

const recordExperiment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const entry = await strategyNotebookService.recordExperiment(userId, req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

const getNotebookEntries = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await strategyNotebookService.getNotebookEntries(userId, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getNotebookEntryById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const entry = await strategyNotebookService.getNotebookEntryById(userId, id);
    if (!entry) {
      return res.status(404).json({ success: false, error: "Notebook entry not found" });
    }
    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

const updateNotebookEntry = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updated = await strategyNotebookService.updateNotebookEntry(userId, id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Notebook entry not found" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const getInvestigationBridge = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const bridge = await strategyNotebookService.getInvestigationContext(userId, id);
    res.json({ success: true, data: bridge });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  recordExperiment,
  getNotebookEntries,
  getNotebookEntryById,
  updateNotebookEntry,
  getInvestigationBridge
};
