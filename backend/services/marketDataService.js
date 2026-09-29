const mockProvider = require('../providers/MockMarketDataProvider');
const twelveDataProvider = require('../providers/TwelveDataProvider');
const alphaVantageProvider = require('../providers/AlphaVantageProvider');

class MarketDataService {
  constructor() {
    const providerType = process.env.MARKET_DATA_PROVIDER || 'mock';
    if (providerType === 'twelvedata') {
      if (!process.env.TWELVE_DATA_API_KEY) throw new Error('TWELVE_DATA_API_KEY is required for TwelveDataProvider.');
      this.provider = twelveDataProvider;
    } else if (providerType === 'alphavantage') {
      if (!process.env.ALPHA_VANTAGE_API_KEY) throw new Error('ALPHA_VANTAGE_API_KEY is required for AlphaVantageProvider.');
      this.provider = alphaVantageProvider;
    } else {
      this.provider = mockProvider;
    }
  }

  async getQuote(symbol) {
    return this.provider.getQuote(symbol);
  }

  async getQuotes(symbols = []) {
    return this.provider.getQuotes(symbols);
  }

  async searchSymbols(query) {
    return this.provider.searchSymbols(query);
  }

  async getHistoricalData(symbol, options) {
    if (this.provider.getHistoricalData) {
      return this.provider.getHistoricalData(symbol, options);
    }
    throw new Error(`getHistoricalData not supported by ${process.env.MARKET_DATA_PROVIDER}`);
  }

  async getTechnicalIndicators(symbol, indicator, options) {
    if (this.provider.getTechnicalIndicators) {
      return this.provider.getTechnicalIndicators(symbol, indicator, options);
    }
    throw new Error(`getTechnicalIndicators not supported by ${process.env.MARKET_DATA_PROVIDER}`);
  }

  async getNewsSentiment(symbol, options) {
    if (this.provider.getNewsSentiment) {
      return this.provider.getNewsSentiment(symbol, options);
    }
    throw new Error(`getNewsSentiment not supported by ${process.env.MARKET_DATA_PROVIDER}`);
  }
}

module.exports = new MarketDataService();
