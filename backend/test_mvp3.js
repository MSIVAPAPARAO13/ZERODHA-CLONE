require('dotenv').config();
const API_URL = 'http://localhost:3002/api/v1';

async function runTests() {
  try {
    console.log('--- Starting MVP-3 Integration Tests ---');
    
    // 1. Register User A & User B
    const resA = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: 'a_' + Date.now() + '@test.com', password: 'password123' })
    });
    const tokenA = (await resA.json()).data.token;

    const resB = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: 'b_' + Date.now() + '@test.com', password: 'password123' })
    });
    const tokenB = (await resB.json()).data.token;

    // 2. User A BUY 10 TESTSTOCK @ 2500
    console.log('User A buys 10 TESTSTOCK @ 2500');
    await fetch(`${API_URL}/orders/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'TESTSTOCK', qty: 10, price: 2500, mode: 'BUY' })
    });

    // 3. User B BUY 20 TESTSTOCK @ 2600
    console.log('User B buys 20 TESTSTOCK @ 2600');
    await fetch(`${API_URL}/orders/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'TESTSTOCK', qty: 20, price: 2600, mode: 'BUY' })
    });

    // 4. Verify Holdings (User Isolation)
    const holdA1 = await (await fetch(`${API_URL}/portfolio/holdings`, { headers: { Authorization: `Bearer ${tokenA}` } })).json();
    const holdB1 = await (await fetch(`${API_URL}/portfolio/holdings`, { headers: { Authorization: `Bearer ${tokenB}` } })).json();

    const stockA1 = holdA1.data.find(h => h.name === 'TESTSTOCK');
    const stockB1 = holdB1.data.find(h => h.name === 'TESTSTOCK');
    if (!stockA1 || stockA1.qty !== 10) throw new Error(`User A Qty mismatch, got ${stockA1?.qty}`);
    if (!stockB1 || stockB1.qty !== 20) throw new Error(`User B Qty mismatch, got ${stockB1?.qty}`);
    console.log('SUCCESS: Holdings isolated properly.');

    // 5. User A sells 5
    console.log('User A sells 5 TESTSTOCK @ 2550');
    await fetch(`${API_URL}/orders/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'TESTSTOCK', qty: 5, price: 2550, mode: 'SELL' })
    });

    const holdA2 = await (await fetch(`${API_URL}/portfolio/holdings`, { headers: { Authorization: `Bearer ${tokenA}` } })).json();
    const stockA2 = holdA2.data.find(h => h.name === 'TESTSTOCK');
    if (!stockA2 || stockA2.qty !== 5) throw new Error(`User A Qty mismatch after sell, got ${stockA2?.qty}`);
    console.log('SUCCESS: Sell executed correctly.');

    // 6. User A tries to sell 100 (Invalid - Insufficient qty)
    console.log('User A tries to sell 100 TESTSTOCK (Should Fail)');
    const failRes = await fetch(`${API_URL}/orders/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'TESTSTOCK', qty: 100, price: 2550, mode: 'SELL' })
    });
    if (failRes.status !== 400) throw new Error(`Expected 400 on over-sell, got ${failRes.status}`);
    console.log('SUCCESS: Over-sell prevented.');

    // 7. Verify transaction rollback (Qty should still be 5)
    const holdA3 = await (await fetch(`${API_URL}/portfolio/holdings`, { headers: { Authorization: `Bearer ${tokenA}` } })).json();
    const stockA3 = holdA3.data.find(h => h.name === 'TESTSTOCK');
    if (!stockA3 || stockA3.qty !== 5) throw new Error(`Transaction rollback failed. Qty is ${stockA3?.qty}`);
    console.log('SUCCESS: Transaction rollback verified.');

    // 8. User B Buys 10 MORE @ 2900 (Check average price calculation)
    console.log('User B buys 10 MORE TESTSTOCK @ 2900');
    await fetch(`${API_URL}/orders/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'TESTSTOCK', qty: 10, price: 2900, mode: 'BUY' })
    });
    const holdB2 = await (await fetch(`${API_URL}/portfolio/holdings`, { headers: { Authorization: `Bearer ${tokenB}` } })).json();
    const stockB2 = holdB2.data.find(h => h.name === 'TESTSTOCK');
    // Previous: 20 @ 2600 = 52000. New: 10 @ 2900 = 29000. Total 30 for 81000. Avg = 2700.
    if (!stockB2 || stockB2.qty !== 30) throw new Error(`User B Qty mismatch, got ${stockB2?.qty}`);
    if (stockB2.avg !== 2700) throw new Error(`User B Avg mismatch, got ${stockB2?.avg}`);
    console.log('SUCCESS: Average price properly calculated.');

    console.log('ALL MVP-3 TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

runTests();
