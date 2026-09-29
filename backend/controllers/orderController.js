const { OrdersModel } = require("../models/OrdersModel");
const { TradeJournalModel } = require("../models/TradeJournalModel");
const mongoose = require("mongoose");
const { placeBuyOrder, placeSellOrder } = require("../services/tradingService");
const marketDataService = require("../services/marketDataService");

const createOrder = async (req, res, next) => {
  let marketSnapshot = { status: 'unavailable' };
  
  // 1. If journal fields are present, attempt to grab a market snapshot BEFORE the transaction
  const { journal } = req.body;
  if (journal) {
    try {
      const quote = await marketDataService.getQuote(req.body.name);
      if (quote) {
        marketSnapshot = {
          price: quote.price,
          changePercent: quote.changePercent,
          timestamp: quote.timestamp,
          source: quote.source,
          status: 'available'
        };
      }
    } catch (err) {
      // Ignore API limits/failures; snapshot is best-effort
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { mode, name, qty, price } = req.body;
    
    // Basic validation
    if (!name || !qty || !price || !mode || qty <= 0 || price <= 0) {
      throw new Error('Invalid order parameters');
    }

    let order;
    if (mode.toUpperCase() === 'BUY') {
      order = await placeBuyOrder(req.user.userId, req.body, session);
    } else if (mode.toUpperCase() === 'SELL') {
      order = await placeSellOrder(req.user.userId, req.body, session);
    } else {
      throw new Error('Invalid order mode');
    }

    // 2. Create the TradeJournal record if requested
    if (journal) {
      const newJournal = new TradeJournalModel({
        user: req.user.userId,
        order: order._id,
        symbol: name,
        side: mode.toUpperCase(),
        strategy: journal.strategy || 'OTHER',
        reason: journal.reason || 'OTHER',
        confidence: journal.confidence,
        thesis: journal.thesis,
        targetPrice: journal.targetPrice,
        riskPrice: journal.riskPrice,
        expectedHoldingPeriod: journal.expectedHoldingPeriod || 'UNSPECIFIED',
        entryPrice: Number(price),
        quantity: Number(qty),
        marketSnapshot,
        playbook: journal.playbook,
        checklist: journal.checklist
      });
      await newJournal.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: order, error: null });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    if (error.code === 11000) { // Should not happen since order is new, but just in case
      return res.status(400).json({ success: false, data: null, error: { message: 'JOURNAL_ALREADY_EXISTS' } });
    }
    
    if (error.message === 'Insufficient quantity to sell' || error.message === 'Invalid order parameters' || error.message === 'Invalid order mode' || error.message === 'Insufficient virtual balance') {
      return res.status(400).json({ success: false, data: null, error: { message: error.message } });
    }
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const allOrders = await OrdersModel.find({ user: req.user.userId });
    res.json({ success: true, data: allOrders, error: null });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getOrders };
