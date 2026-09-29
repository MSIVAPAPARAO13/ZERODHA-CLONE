const { HoldingsModel } = require("../models/HoldingsModel");
const { PositionsModel } = require("../models/PositionsModel");

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

module.exports = { getHoldings, getPositions };
