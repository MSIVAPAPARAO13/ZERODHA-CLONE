const axios = require('axios');

class TwelveDataProvider {
  constructor() {
    this.apiKey = process.env.TWELVE_DATA_API_KEY;
    this.baseUrl = 'https://api.twelvedata.com';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000
    });
  }

  async getQuote(symbol) {
    try {
      const response = await this.client.get(`/quote`, {
        params: { symbol, apikey: this.apiKey }
      });
      
      if (response.data.code === 429) {
        throw new Error('MARKET_DATA_RATE_LIMITED');
      }
      
      if (response.data.status === 'error') {
        throw new Error(response.data.message);
      }
      
      const data = response.data;
      return {
        symbol: data.symbol,
        name: data.name,
        price: parseFloat(data.close),
        open: parseFloat(data.open),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        previousClose: parseFloat(data.previous_close),
        change: parseFloat(data.change),
        changePercent: parseFloat(data.percent_change),
        volume: parseInt(data.volume, 10),
        timestamp: new Date(data.timestamp * 1000).toISOString(),
        source: 'twelvedata',
        dataStatus: 'available',
        isDown: parseFloat(data.change) < 0
      };
    } catch (err) {
      if (err.message === 'MARKET_DATA_RATE_LIMITED') throw err;
      if (err.response && err.response.status === 429) throw new Error('MARKET_DATA_RATE_LIMITED');
      console.error('TwelveData getQuote Error:', err.message);
      return null;
    }
  }

  async getQuotes(symbols) {
    if (!symbols || symbols.length === 0) return [];
    const results = [];
    // Twelve Data allows bulk requests, but for MVP simplicity and robustness, we can batch or do sequential.
    // Sequential to avoid complex parsing for now, or just use their batch endpoint.
    try {
      const response = await this.client.get(`/quote`, {
        params: { symbol: symbols.join(','), apikey: this.apiKey }
      });
      
      if (response.data.code === 429) throw new Error('MARKET_DATA_RATE_LIMITED');
      
      if (symbols.length === 1) {
         if (response.data.status !== 'error') {
            const data = response.data;
            results.push({
              symbol: data.symbol, name: data.name, price: parseFloat(data.close),
              open: parseFloat(data.open), high: parseFloat(data.high), low: parseFloat(data.low),
              previousClose: parseFloat(data.previous_close), change: parseFloat(data.change),
              changePercent: parseFloat(data.percent_change), volume: parseInt(data.volume, 10),
              timestamp: new Date(data.timestamp * 1000).toISOString(), source: 'twelvedata', dataStatus: 'available', isDown: parseFloat(data.change) < 0
            });
         }
      } else {
        for (const key of Object.keys(response.data)) {
          const data = response.data[key];
          if (data && data.status !== 'error') {
            results.push({
              symbol: data.symbol, name: data.name, price: parseFloat(data.close),
              open: parseFloat(data.open), high: parseFloat(data.high), low: parseFloat(data.low),
              previousClose: parseFloat(data.previous_close), change: parseFloat(data.change),
              changePercent: parseFloat(data.percent_change), volume: parseInt(data.volume, 10),
              timestamp: new Date(data.timestamp * 1000).toISOString(), source: 'twelvedata', dataStatus: 'available', isDown: parseFloat(data.change) < 0
            });
          }
        }
      }
      return results;
    } catch (err) {
      if (err.message === 'MARKET_DATA_RATE_LIMITED') throw err;
      if (err.response && err.response.status === 429) throw new Error('MARKET_DATA_RATE_LIMITED');
      console.error('TwelveData getQuotes Error:', err.message);
      return [];
    }
  }

  async searchSymbols(query) {
    try {
      const response = await this.client.get(`/symbol_search`, {
        params: { symbol: query } // Doesn't require API key usually, but good practice
      });
      if (response.data.code === 429) throw new Error('MARKET_DATA_RATE_LIMITED');
      
      if (response.data.data) {
        return response.data.data.map(s => ({
          symbol: s.symbol,
          name: s.instrument_name
        }));
      }
      return [];
    } catch (err) {
      if (err.message === 'MARKET_DATA_RATE_LIMITED') throw err;
      console.error('TwelveData search Error:', err.message);
      return [];
    }
  }
  
  async getHistoricalData(symbol, options = { interval: '1day' }) {
    try {
      const response = await this.client.get(`/time_series`, {
         params: { symbol, interval: options.interval, apikey: this.apiKey, outputsize: 30 }
      });
      if (response.data.code === 429) throw new Error('MARKET_DATA_RATE_LIMITED');
      if (response.data.status === 'error') throw new Error(response.data.message);
      
      return {
        symbol: response.data.meta.symbol,
        interval: options.interval,
        data: response.data.values.map(v => ({
           timestamp: v.datetime,
           open: parseFloat(v.open),
           high: parseFloat(v.high),
           low: parseFloat(v.low),
           close: parseFloat(v.close),
           volume: parseInt(v.volume, 10)
        })),
        source: 'twelvedata'
      };
    } catch (err) {
      if (err.message === 'MARKET_DATA_RATE_LIMITED') throw err;
      console.error('TwelveData history Error:', err.message);
      return null;
    }
  }

  async getTechnicalIndicators(symbol, indicator, options = {}) {
     throw new Error('Unsupported capability in TwelveData MVP-8 implementation');
  }

  async getNewsSentiment(symbol, options = {}) {
     throw new Error('Unsupported capability in TwelveData MVP-8 implementation');
  }
}

module.exports = new TwelveDataProvider();
