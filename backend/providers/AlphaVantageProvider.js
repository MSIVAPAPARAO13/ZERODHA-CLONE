const axios = require('axios');

class AlphaVantageProvider {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000
    });
  }

  _formatSymbol(symbol) {
    if (!symbol) return '';
    let s = String(symbol).toUpperCase().trim();
    if (!s.includes('.') && !s.includes(':')) {
      return `${s}.BSE`;
    }
    return s;
  }

  async getQuote(symbol) {
    try {
      const formattedSymbol = this._formatSymbol(symbol);
      const response = await this.client.get(`/query`, {
        params: { function: 'GLOBAL_QUOTE', symbol: formattedSymbol, apikey: this.apiKey }
      });
      
      if (response.data.Information && response.data.Information.includes('rate limit')) {
        throw new Error('MARKET_DATA_RATE_LIMITED');
      }
      
      const quote = response.data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) return null;
      
      return {
        symbol: quote['01. symbol'],
        name: quote['01. symbol'], // Alpha Vantage Global Quote doesn't return name
        price: parseFloat(quote['05. price']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume'], 10),
        timestamp: new Date().toISOString(), // Use current time as quote timestamp fallback if not provided
        source: 'alphavantage',
        dataStatus: 'available',
        isDown: parseFloat(quote['09. change']) < 0
      };
    } catch (err) {
      if (err.message === 'MARKET_DATA_RATE_LIMITED') throw err;
      if (err.response && err.response.status === 429) throw new Error('MARKET_DATA_RATE_LIMITED');
      console.error('AlphaVantage getQuote Error:', err.message);
      return null;
    }
  }

  async getQuotes(symbols) {
    if (!symbols || symbols.length === 0) return [];
    const results = [];
    // Alpha Vantage does not have a true bulk quote endpoint on free tier. 
    // We will do sequential, but this is prone to rate limits (5/min).
    for (const sym of symbols) {
      try {
        const q = await this.getQuote(sym);
        if (q) results.push(q);
      } catch (err) {
         if (err.message === 'MARKET_DATA_RATE_LIMITED') throw err;
      }
    }
    return results;
  }

  async searchSymbols(query) {
    try {
      const response = await this.client.get(`/query`, {
        params: { function: 'SYMBOL_SEARCH', keywords: query, apikey: this.apiKey }
      });
      if (response.data.Information && response.data.Information.includes('rate limit')) {
        throw new Error('MARKET_DATA_RATE_LIMITED');
      }
      
      if (response.data.bestMatches) {
        return response.data.bestMatches.map(m => ({
          symbol: m['1. symbol'],
          name: m['2. name']
        }));
      }
      return [];
    } catch (err) {
       if (err.message === 'MARKET_DATA_RATE_LIMITED') throw err;
       console.error('AlphaVantage search Error:', err.message);
       return [];
    }
  }

  async getHistoricalData(symbol, options = {}) {
     try {
      const formattedSymbol = this._formatSymbol(symbol);
      const response = await this.client.get(`/query`, {
        params: { function: 'TIME_SERIES_DAILY', symbol: formattedSymbol, apikey: this.apiKey }
      });
      if (response.data.Note && response.data.Note.includes('call frequency')) {
        throw new Error('MARKET_DATA_RATE_LIMITED');
      }
      if (response.data.Information && response.data.Information.includes('rate limit')) {
        throw new Error('MARKET_DATA_RATE_LIMITED');
      }
      
      const ts = response.data['Time Series (Daily)'];
      if (!ts) {
        throw new Error('DATA_UNAVAILABLE: No daily series returned by AlphaVantage');
      }
      
      const limit = options.days || 60;
      const data = Object.keys(ts).slice(0, limit).map(date => ({
         timestamp: date,
         open: parseFloat(ts[date]['1. open']),
         high: parseFloat(ts[date]['2. high']),
         low: parseFloat(ts[date]['3. low']),
         close: parseFloat(ts[date]['4. close']),
         volume: parseInt(ts[date]['5. volume'], 10)
      }));
      
      return {
         symbol,
         interval: '1day',
         data,
         source: 'alphavantage'
      };
     } catch(err) {
        throw err;
     }
  }

  async getTechnicalIndicators(symbol, indicator, options = {}) {
     try {
       const functionName = indicator.toUpperCase();
       const formattedSymbol = this._formatSymbol(symbol);
       const response = await this.client.get(`/query`, {
         params: { function: functionName, symbol: formattedSymbol, interval: 'daily', time_period: 14, series_type: 'close', apikey: this.apiKey }
       });
       if (response.data.Information && response.data.Information.includes('rate limit')) {
        throw new Error('MARKET_DATA_RATE_LIMITED');
       }
       const key = `Technical Analysis: ${functionName}`;
       const data = response.data[key];
       if (!data) return null;
       
       const latestDate = Object.keys(data)[0];
       return {
          symbol,
          indicator: functionName,
          value: data[latestDate],
          timestamp: latestDate,
          source: 'alphavantage'
       };
     } catch (err) {
        if (err.message === 'MARKET_DATA_RATE_LIMITED') throw err;
        return null;
     }
  }

  async getNewsSentiment(symbol, options = {}) {
     try {
       const response = await this.client.get(`/query`, {
         params: { function: 'NEWS_SENTIMENT', tickers: symbol, apikey: this.apiKey, limit: 5 }
       });
       if (response.data.Information && response.data.Information.includes('rate limit')) {
        throw new Error('MARKET_DATA_RATE_LIMITED');
       }
       if (!response.data.feed) return null;
       
       return {
          symbol,
          articles: response.data.feed.map(a => ({
             title: a.title,
             summary: a.summary,
             url: a.url,
             source: a.source,
             publishedAt: a.time_published,
             sentiment: a.overall_sentiment_label,
             sentimentScore: parseFloat(a.overall_sentiment_score)
          })),
          source: 'alphavantage'
       };
     } catch (err) {
        if (err.message === 'MARKET_DATA_RATE_LIMITED') throw err;
        return null;
     }
  }
}

module.exports = new AlphaVantageProvider();
