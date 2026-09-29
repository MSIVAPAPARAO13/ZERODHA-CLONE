const { AlertModel } = require('../models/AlertModel');
const marketDataService = require('./marketDataService');

class AlertService {
  async getAlerts(userId) {
    const alerts = await AlertModel.find({ user: userId }).sort({ createdAt: -1 });
    if (!alerts.length) return [];
    
    // Fetch live market data to enrich
    const symbols = [...new Set(alerts.map(a => a.symbol))];
    const quotes = await marketDataService.getQuotes(symbols);
    
    return alerts.map(alert => {
      const quote = quotes.find(q => q.symbol === alert.symbol);
      return {
        ...alert.toObject(),
        currentPrice: quote ? quote.price : null
      };
    });
  }

  async createAlert(userId, symbol, condition, targetPrice) {
    const upperSymbol = symbol.toUpperCase();
    
    // Validate symbol
    const quote = await marketDataService.getQuote(upperSymbol);
    if (!quote) throw new Error(`Unknown symbol: ${upperSymbol}`);
    
    // Check for exact duplicate active alert
    const existing = await AlertModel.findOne({ user: userId, symbol: upperSymbol, condition, targetPrice, isActive: true });
    if (existing) throw new Error('Identical active alert already exists');
    
    const alert = new AlertModel({ user: userId, symbol: upperSymbol, condition, targetPrice });
    await alert.save();
    return alert;
  }

  async updateAlert(userId, alertId, isActive) {
    const alert = await AlertModel.findOneAndUpdate(
      { _id: alertId, user: userId },
      { isActive },
      { new: true }
    );
    if (!alert) throw new Error('Alert not found');
    return alert;
  }

  async deleteAlert(userId, alertId) {
    const result = await AlertModel.deleteOne({ _id: alertId, user: userId });
    if (result.deletedCount === 0) throw new Error('Alert not found');
    return true;
  }

  async evaluateAlerts() {
    const activeAlerts = await AlertModel.find({ isActive: true });
    if (!activeAlerts.length) return [];

    const symbols = [...new Set(activeAlerts.map(a => a.symbol))];
    const quotes = await marketDataService.getQuotes(symbols);
    
    const triggered = [];
    
    for (const alert of activeAlerts) {
      const quote = quotes.find(q => q.symbol === alert.symbol);
      if (!quote) continue;
      
      let isTriggered = false;
      if (alert.condition === 'ABOVE' && quote.price >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === 'BELOW' && quote.price <= alert.targetPrice) {
        isTriggered = true;
      }
      
      if (isTriggered) {
        alert.isActive = false;
        alert.triggeredAt = new Date();
        await alert.save();
        triggered.push(alert);
      }
    }
    return triggered;
  }
}

module.exports = new AlertService();
