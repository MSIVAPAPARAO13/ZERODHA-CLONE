const mockData = {
  INFY: { symbol: 'INFY', name: 'Infosys Ltd', price: 1920.10, change: 16.20, changePercent: 0.85, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  TCS: { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4250.80, change: -19.20, changePercent: -0.45, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  RELIANCE: { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2985.40, change: 36.80, changePercent: 1.25, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  HDFCBANK: { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1695.50, change: 18.50, changePercent: 1.10, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  TATAMOTORS: { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: 1012.30, change: 23.70, changePercent: 2.40, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  ICICIBANK: { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1245.00, change: 8.00, changePercent: 0.65, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  BHARTIARTL: { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 1625.00, change: 28.70, changePercent: 1.80, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  ITC: { symbol: 'ITC', name: 'ITC Ltd', price: 512.40, change: -1.05, changePercent: -0.20, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  SBIN: { symbol: 'SBIN', name: 'State Bank of India', price: 815.50, change: 10.85, changePercent: 1.35, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  LT: { symbol: 'LT', name: 'Larsen & Toubro Ltd', price: 3680.00, change: 32.80, changePercent: 0.90, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  MARUTI: { symbol: 'MARUTI', name: 'Maruti Suzuki India', price: 12450.00, change: 115.00, changePercent: 0.93, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  SUNPHARMA: { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', price: 1780.00, change: -12.40, changePercent: -0.69, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  BAJFINANCE: { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', price: 7240.00, change: 84.50, changePercent: 1.18, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  AXISBANK: { symbol: 'AXISBANK', name: 'Axis Bank Ltd', price: 1210.00, change: 14.20, changePercent: 1.19, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  KOTAKBANK: { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1820.00, change: -7.50, changePercent: -0.41, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  TITAN: { symbol: 'TITAN', name: 'Titan Company Ltd', price: 3450.00, change: 28.00, changePercent: 0.82, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  WIPRO: { symbol: 'WIPRO', name: 'Wipro Ltd', price: 545.50, change: 3.20, changePercent: 0.59, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  NTPC: { symbol: 'NTPC', name: 'NTPC Ltd', price: 412.30, change: 4.80, changePercent: 1.18, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  ONGC: { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', price: 295.40, change: -2.10, changePercent: -0.71, timestamp: new Date().toISOString(), source: 'mock', isDown: true },
  COALINDIA: { symbol: 'COALINDIA', name: 'Coal India Ltd', price: 488.60, change: 6.20, changePercent: 1.28, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  NIFTY: { symbol: 'NIFTY 50', name: 'NIFTY 50 Index', price: 24535.80, change: 165.40, changePercent: 0.68, timestamp: new Date().toISOString(), source: 'mock', isDown: false },
  BANKNIFTY: { symbol: 'BANKNIFTY', name: 'NIFTY Bank Index', price: 52450.00, change: 312.20, changePercent: 0.60, timestamp: new Date().toISOString(), source: 'mock', isDown: false }
};

class MockMarketDataProvider {
  async getQuote(symbol) {
    const cleanSym = String(symbol || '').toUpperCase().trim();
    if (mockData[cleanSym]) {
      return { ...mockData[cleanSym], timestamp: new Date().toISOString() };
    }
    // Dynamic realistic fallback for options or other symbols
    const hash = cleanSym.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pseudoPrice = ((hash * 17) % 2500) + 120;
    const pseudoChange = ((hash % 40) - 18) / 10;
    return {
      symbol: cleanSym,
      name: cleanSym,
      price: Number(pseudoPrice.toFixed(2)),
      change: Number(pseudoChange.toFixed(2)),
      changePercent: Number(((pseudoChange / pseudoPrice) * 100).toFixed(2)),
      timestamp: new Date().toISOString(),
      source: 'mock',
      isDown: pseudoChange < 0
    };
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

  async getHistoricalData(symbol, options = {}) {
    const sym = symbol ? symbol.toUpperCase() : 'NIFTY';
    const basePrice = mockData[sym]?.price || 1000;
    const interval = options.interval || '1day';
    
    // Determine date range
    const endDate = options.endDate ? new Date(options.endDate) : new Date('2026-09-30');
    const days = options.days || (options.startDate ? Math.ceil((endDate - new Date(options.startDate)) / (1000 * 60 * 60 * 24)) : 120);
    const count = Math.max(10, Math.min(days, 500));
    
    const data = [];
    let currentPrice = basePrice * 0.85; // Start slightly lower for realistic historical trend
    
    for (let i = count; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      
      // Skip weekends
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const dateStr = d.toISOString().split('T')[0];
      
      // Deterministic pseudo-random variation based on date and symbol
      const seed = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() + sym.charCodeAt(0)) % 100;
      const variation = ((seed - 48) / 100) * 0.03; // -1.5% to +1.5%
      
      const open = Math.round(currentPrice * 100) / 100;
      const close = Math.round((open * (1 + variation)) * 100) / 100;
      const high = Math.round((Math.max(open, close) * 1.01) * 100) / 100;
      const low = Math.round((Math.min(open, close) * 0.99) * 100) / 100;
      const volume = Math.floor(100000 + (seed * 5000));
      
      data.push({
        timestamp: dateStr,
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = close;
    }

    return {
      symbol: sym,
      interval,
      data,
      source: 'mock',
      dataStatus: 'available'
    };
  }
}

module.exports = new MockMarketDataProvider();
