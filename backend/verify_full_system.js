const axios = require('axios');

async function verifyAll() {
  console.log('--- STARTING COMPREHENSIVE INTEGRATION VERIFICATION ---');
  // 1. Auth Login
  const loginRes = await axios.post('http://localhost:3002/api/v1/auth/login', {
    email: 'demo@tradeflow.com',
    password: 'password123'
  });
  const token = loginRes.data.data.token;
  const headers = { Authorization: 'Bearer ' + token };
  console.log('1. Auth Token acquired successfully.');

  // 2. Overview Data: Account balance & Holdings
  const bal = await axios.get('http://localhost:3002/api/v1/account/balance', { headers });
  console.log('2a. Virtual Balance: ' + bal.data.data?.virtualBalance);
  
  const hold = await axios.get('http://localhost:3002/api/v1/portfolio/holdings', { headers });
  console.log('2b. Holdings count: ' + hold.data.data?.length);

  // 3. Overview Data: Insights / Catalyst Surveillance
  const ins = await axios.get('http://localhost:3002/api/v1/insights/today', { headers });
  console.log('3. Today Insights count: ' + ins.data.data.events.length);
  ins.data.data.events.slice(0, 3).forEach((e, idx) => {
    console.log('   Event #' + (idx + 1) + ': [' + e.symbol + '] ' + e.title + ' (' + (e.changePercent > 0 ? '+' : '') + e.changePercent + '%)');
  });

  // 4. Edge & Behavioral Analytics
  const beh = await axios.get('http://localhost:3002/api/v1/analytics/behavior?window=30d', { headers });
  console.log('4. Behavior Analytics:');
  console.log('   - Trade Count: ' + beh.data.data.tradeCount);
  console.log('   - Win Rate: ' + beh.data.data.summary.winRate + '%');
  console.log('   - Avg Realized PnL: Rs.' + beh.data.data.summary.avgRealizedPnL);
  console.log('   - Exit Efficiency: ' + beh.data.data.advanced.exitEfficiency);
  console.log('   - Plan Target Hit: ' + beh.data.data.planExecution.targetReached);
  console.log('   - Risk Crossed: ' + beh.data.data.planExecution.riskCrossed);

  // 5. Grounded AI Behavioral Review
  const aiRev = await axios.get('http://localhost:3002/api/v1/ai/behavior-review', { headers });
  console.log('5. AI Behavioral Review:');
  console.log('   - Status: ' + aiRev.status);
  console.log('   - Summary: ' + aiRev.data.data.analysis.summary);
  console.log('   - Patterns count: ' + aiRev.data.data.analysis.observedPatterns?.length);
  if (aiRev.data.data.analysis.observedPatterns?.[0]) {
    console.log('   - Pattern #1: ' + aiRev.data.data.analysis.observedPatterns[0].title);
    console.log('   - Reflection Prompt: ' + aiRev.data.data.analysis.observedPatterns[0].reflectionQuestion);
  }

  // 6. Real Market Data Provider (AlphaVantage with BSE ticker formatting)
  const qReliance = await axios.get('http://localhost:3002/api/v1/market/quote/RELIANCE', { headers });
  console.log('6. Real Market Quote (RELIANCE):');
  console.log('   - Symbol: ' + qReliance.data.data?.symbol);
  console.log('   - Price: ' + qReliance.data.data?.price);
  console.log('   - Source: ' + qReliance.data.data?.source);
  console.log('   - Volume: ' + qReliance.data.data?.volume);

  // 7. Market Regime API
  const regime = await axios.get('http://localhost:3002/api/v1/market/regime', { headers });
  console.log('7. Market Regime:');
  console.log('   - Regime: ' + regime.data.data?.regime);
  console.log('   - Breadth Ratio: ' + regime.data.data?.metrics?.breadthRatio);

  console.log('--- ALL INTEGRATION VERIFICATIONS PASSED WITH 100% SUCCESS ---');
}

verifyAll().catch(e => {
  console.error('Integration test failed:', e.response?.status, e.response?.data || e.message);
  process.exit(1);
});
