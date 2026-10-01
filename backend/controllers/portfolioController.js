const { HoldingsModel } = require("../models/HoldingsModel");
const { PositionsModel } = require("../models/PositionsModel");
const portfolioIntelligenceService = require("../services/portfolioIntelligenceService");

const getHoldings = async (req, res, next) => {
  try {
    const allHoldings = await HoldingsModel.find({ user: req.user.userId });
    res.json({ success: true, data: allHoldings, error: null });
  } catch (error) {
    next(error);
  }
};

const getPositions = async (req, res, next) => {
  try {
    const allPositions = await PositionsModel.find({ user: req.user.userId });
    res.json({ success: true, data: allPositions, error: null });
  } catch (error) {
    next(error);
  }
};

const getIntelligence = async (req, res, next) => {
  try {
    const intelligence = await portfolioIntelligenceService.getPortfolioIntelligence(req.user.userId);
    res.json({ success: true, data: intelligence, error: null });
  } catch (error) {
    next(error);
  }
};

const getExposure = async (req, res, next) => {
  try {
    const exposure = await portfolioIntelligenceService.getExposure(req.user.userId);
    res.json({ success: true, data: exposure, error: null });
  } catch (error) {
    next(error);
  }
};

const getConcentration = async (req, res, next) => {
  try {
    const concentration = await portfolioIntelligenceService.getConcentration(req.user.userId);
    res.json({ success: true, data: concentration, error: null });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHoldings,
  getPositions,
  getIntelligence,
  getExposure,
  getConcentration
};
