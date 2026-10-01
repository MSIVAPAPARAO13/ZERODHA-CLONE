require('dotenv').config();
const API_URL = 'http://localhost:3002/api/v1';

async function runTests() {
  try {
    console.log('--- Starting MVP-5 Market Data Integration Tests ---');
    
    // 1. Register test user to get JWT token
    const resAuth = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'MVP5 User', email: 'mvp5_' + Date.now() + '@test.com', password: 'password123' })
    });
    const token = (await resAuth.json()).data.token;

    // 2. Fetch single quote
    console.log('Fetching quote for RELIANCE...');
    const qRes = await fetch(`${API_URL}/market/quote/RELIANCE`, { headers: { Authorization: `Bearer ${token}` } });
    const qData = await qRes.json();
    if (qRes.status !== 200 || qData.data.symbol !== 'RELIANCE') throw new Error('Failed to fetch valid quote');
    console.log('SUCCESS: Fetched RELIANCE quote.');

    // 3. Fetch unknown quote -> 404
    console.log('Fetching quote for UNKNOWN_TICKER...');
    const unkRes = await fetch(`${API_URL}/market/quote/UNKNOWN_TICKER`, { headers: { Authorization: `Bearer ${token}` } });
    if (unkRes.status !== 404) throw new Error(`Expected 404 for unknown ticker, got ${unkRes.status}`);
    console.log('SUCCESS: Unknown ticker safely returned 404.');

    // 4. Search quotes
    console.log('Searching for "tata"...');
    const sRes = await fetch(`${API_URL}/market/search?q=tata`, { headers: { Authorization: `Bearer ${token}` } });
    const sData = await sRes.json();
    if (sData.data.length === 0 || sData.data[0].symbol !== 'TCS') throw new Error('Failed to find TCS in search');
    console.log('SUCCESS: Symbol search works correctly.');

    // 5. Fetch all mock quotes
    console.log('Fetching all watchlist quotes...');
    const allRes = await fetch(`${API_URL}/market/quotes`, { headers: { Authorization: `Bearer ${token}` } });
    const allData = await allRes.json();
    if (allData.data.length < 5) throw new Error('Failed to fetch multiple quotes');
    console.log('SUCCESS: Retrieved full watchlist dataset.');

    console.log('ALL MVP-5 MARKET DATA TESTS PASSED!');
    // Clean exit
    return;
  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

runTests();
