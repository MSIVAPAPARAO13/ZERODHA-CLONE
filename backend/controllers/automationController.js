const automationService = require("../services/automationService");

const createAutomation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const automation = await automationService.createAutomation(userId, req.body);
    res.status(201).json({ success: true, data: automation, error: null });
  } catch (err) {
    next(err);
  }
};

const listAutomations = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const automations = await automationService.listAutomations(userId);
    res.json({ success: true, data: automations, error: null });
  } catch (err) {
    next(err);
  }
};

const getAutomationById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const automation = await automationService.getAutomationById(userId, id);
    if (!automation) {
      return res.status(404).json({ success: false, data: null, error: { message: "Automation not found" } });
    }
    res.json({ success: true, data: automation, error: null });
  } catch (err) {
    next(err);
  }
};

const updateAutomation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updated = await automationService.updateAutomation(userId, id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, data: null, error: { message: "Automation not found" } });
    }
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
};

const deleteAutomation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const deleted = await automationService.deleteAutomation(userId, id);
    if (!deleted) {
      return res.status(404).json({ success: false, data: null, error: { message: "Automation not found" } });
    }
    res.json({ success: true, data: { message: "Automation deleted successfully" }, error: null });
  } catch (err) {
    next(err);
  }
};

const runAutomation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const execution = await automationService.runAutomation(userId, id);
    res.json({ success: true, data: execution, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAutomation,
  listAutomations,
  getAutomationById,
  updateAutomation,
  deleteAutomation,
  runAutomation
};
