const alertService = require('../services/alertService');

const getAlerts = async (req, res, next) => {
  try {
    const data = await alertService.getAlerts(req.user.userId);
    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
};

const createAlert = async (req, res, next) => {
  try {
    const { symbol, condition, targetPrice } = req.body;
    if (!symbol || !condition || targetPrice === undefined) {
      return res.status(400).json({ success: false, data: null, error: { message: 'Symbol, condition, and targetPrice are required' } });
    }
    if (!['ABOVE', 'BELOW'].includes(condition)) {
      return res.status(400).json({ success: false, data: null, error: { message: 'Condition must be ABOVE or BELOW' } });
    }
    if (targetPrice <= 0) {
      return res.status(400).json({ success: false, data: null, error: { message: 'Target price must be greater than 0' } });
    }

    const alert = await alertService.createAlert(req.user.userId, symbol, condition, targetPrice);
    res.status(201).json({ success: true, data: alert, error: null });
  } catch (err) {
    if (err.message.startsWith('Unknown symbol') || err.message.includes('Identical active alert already exists')) {
      return res.status(400).json({ success: false, data: null, error: { message: err.message } });
    }
    next(err);
  }
};

const updateAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, data: null, error: { message: 'isActive must be a boolean' } });
    }
    const alert = await alertService.updateAlert(req.user.userId, id, isActive);
    res.json({ success: true, data: alert, error: null });
  } catch (err) {
    if (err.message === 'Alert not found') {
      return res.status(404).json({ success: false, data: null, error: { message: err.message } });
    }
    next(err);
  }
};

const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    await alertService.deleteAlert(req.user.userId, id);
    res.json({ success: true, data: null, error: null });
  } catch (err) {
    if (err.message === 'Alert not found') {
      return res.status(404).json({ success: false, data: null, error: { message: err.message } });
    }
    next(err);
  }
};

const evaluateAlerts = async (req, res, next) => {
  try {
    const triggered = await alertService.evaluateAlerts();
    res.json({ success: true, data: triggered, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAlerts, createAlert, updateAlert, deleteAlert, evaluateAlerts };
