const mockData = {
  INFY: { symbol: 'INFY', name: 'Infosys', price: 1555.45, change: -25.2, changePercent: -1.60, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  ONGC: { symbol: 'ONGC', name: 'ONGC', price: 116.80, change: -0.1, changePercent: -0.09, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  TCS: { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3194.80, change: -8.0, changePercent: -0.25, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  KPITTECH: { symbol: 'KPITTECH', name: 'KPIT Technologies', price: 266.45, change: 9.1, changePercent: 3.54, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  QUICKHEAL: { symbol: 'QUICKHEAL', name: 'Quick Heal', price: 308.55, change: -0.45, changePercent: -0.15, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  WIPRO: { symbol: 'WIPRO', name: 'Wipro', price: 577.75, change: 1.85, changePercent: 0.32, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  'M&M': { symbol: 'M&M', name: 'Mahindra & Mahindra', price: 779.80, change: -0.07, changePercent: -0.01, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  RELIANCE: { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2112.40, change: 30.0, changePercent: 1.44, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  HUL: { symbol: 'HUL', name: 'Hindustan Unilever', price: 512.40, change: 5.25, changePercent: 1.04, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
};

class MockMarketDataProvider {
  async getQuote(symbol) {
    const data = mockData[symbol.toUpperCase()];
    if (!data) return null;
    return { ...data, timestamp: new Date().toISOString() };
  }

  async getQuotes(symbols) {
    if (!symbols || symbols.length === 0) {
      return Object.values(mockData).map(data => ({ ...data, timestamp: new Date().toISOString() }));
    }
    const result = [];
    for (const sym of symbols) {
      const q = await this.getQuote(sym);
      if (q) result.push(q);
    }
    return result;
  }

  async searchSymbols(query) {
    const lowerQuery = query.toLowerCase();
    return Object.values(mockData)
      .filter(s => s.symbol.toLowerCase().includes(lowerQuery) || s.name.toLowerCase().includes(lowerQuery))
      .map(s => ({ symbol: s.symbol, name: s.name }));
  }
}

module.exports = new MockMarketDataProvider();
