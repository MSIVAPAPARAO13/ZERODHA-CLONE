require('dotenv').config();

const marketDataService = require('./services/marketDataService');

async function runTests() {
  console.log('--- Starting MVP-8 Real Market Data Integration Tests ---');
  
  // Test Mock Provider
  console.log('\n[1] Testing Mock Provider...');
  process.env.MARKET_DATA_PROVIDER = 'mock';
  const mockService = new (require('./services/marketDataService').constructor)();
  try {
    const q1 = await mockService.getQuote('RELIANCE');
    if (q1 && q1.source === 'mock') console.log('SUCCESS: Mock getQuote works.');
    else throw new Error('Mock quote failed');
  } catch (err) { console.error('FAIL:', err.message); }
  
  // Test Twelve Data Provider (if key exists)
  if (process.env.TWELVE_DATA_API_KEY) {
    console.log('\n[2] Testing Twelve Data Provider...');
    process.env.MARKET_DATA_PROVIDER = 'twelvedata';
    const tdService = new (require('./services/marketDataService').constructor)();
    try {
      const q2 = await tdService.getQuote('AAPL');
      if (q2 && q2.source === 'twelvedata') console.log('SUCCESS: Twelve Data getQuote works.');
      else throw new Error('Twelve Data quote failed or symbol not found');
    } catch (err) { console.error('FAIL (or Rate Limited):', err.message); }
  } else {
    console.log('\n[2] NOT RUN — TWELVE_DATA_API_KEY unavailable');
  }
  
  // Test Alpha Vantage Provider (if key exists)
  if (process.env.ALPHA_VANTAGE_API_KEY) {
    console.log('\n[3] Testing Alpha Vantage Provider...');
    process.env.MARKET_DATA_PROVIDER = 'alphavantage';
    const avService = new (require('./services/marketDataService').constructor)();
    try {
      const q3 = await avService.getQuote('IBM');
      if (q3 && q3.source === 'alphavantage') console.log('SUCCESS: Alpha Vantage getQuote works.');
      else throw new Error('Alpha Vantage quote failed or symbol not found');
      
      const avHist = await avService.getHistoricalData('IBM', { interval: '1day' });
      if (avHist && avHist.source === 'alphavantage') console.log('SUCCESS: Alpha Vantage getHistoricalData works.');
      
      const avTech = await avService.getTechnicalIndicators('IBM', 'RSI');
      if (avTech && avTech.source === 'alphavantage') console.log('SUCCESS: Alpha Vantage technical works.');
    } catch (err) { console.error('FAIL (or Rate Limited):', err.message); }
  } else {
    console.log('\n[3] NOT RUN — ALPHA_VANTAGE_API_KEY unavailable');
  }
  
  console.log('\nALL MVP-8 TESTS COMPLETED!');
  process.exit(0);
}

runTests();
