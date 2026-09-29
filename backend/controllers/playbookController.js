const playbookService = require('../services/playbookService');

const getPlaybooks = async (req, res, next) => {
  try {
    const playbooks = await playbookService.getPlaybookStats(req.user.userId);
    res.json({ success: true, data: playbooks });
  } catch (err) {
    next(err);
  }
};

const getPlaybook = async (req, res, next) => {
  try {
    const playbook = await playbookService.getPlaybook(req.params.id, req.user.userId);
    if (!playbook) return res.status(404).json({ success: false, error: { message: 'Playbook not found' } });
    res.json({ success: true, data: playbook });
  } catch (err) {
    next(err);
  }
};

const createPlaybook = async (req, res, next) => {
  try {
    const playbook = await playbookService.createPlaybook(req.user.userId, req.body);
    res.status(201).json({ success: true, data: playbook });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
};

const updatePlaybook = async (req, res, next) => {
  try {
    const playbook = await playbookService.updatePlaybook(req.params.id, req.user.userId, req.body);
    res.json({ success: true, data: playbook });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
};

const deletePlaybook = async (req, res, next) => {
  try {
    await playbookService.deletePlaybook(req.params.id, req.user.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
};

module.exports = {
  getPlaybooks,
  getPlaybook,
  createPlaybook,
  updatePlaybook,
  deletePlaybook
};
