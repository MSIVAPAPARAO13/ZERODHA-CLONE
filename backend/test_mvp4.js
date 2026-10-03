require('dotenv').config();
const API_URL = 'http://localhost:3002/api/v1';

async function runTests() {
  try {
    console.log('--- Starting MVP-4 Virtual Balance Integration Tests ---');
    
    // 1. Register User A & User B
    const resA = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: 'mvp4_a_' + Date.now() + '@test.com', password: 'password123' })
    });
    const tokenA = (await resA.json()).data.token;

    const resB = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: 'mvp4_b_' + Date.now() + '@test.com', password: 'password123' })
    });
    const tokenB = (await resB.json()).data.token;

    // 2. Fetch Initial Balance for A
    console.log('Fetching Initial Balance for A...');
    const accRes1 = await fetch(`${API_URL}/account/balance`, { headers: { Authorization: `Bearer ${tokenA}` } });
    let balA = (await accRes1.json()).data.virtualBalance;
    if (balA !== 150000) throw new Error(`Initial balance should be 150000, got ${balA}`);
    console.log('SUCCESS: Initial balance is 150,000');

    const txRes0 = await fetch(`${API_URL}/account/transactions`, { headers: { Authorization: `Bearer ${tokenA}` } });
    const initialTxCount = (await txRes0.json()).data.length;

    // 3. User A buys 10 RELIANCE @ 2500 = 25000
    console.log('User A buys 10 RELIANCE @ 2500 (Total: 25,000)');
    await fetch(`${API_URL}/orders/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'RELIANCE', qty: 10, price: 2500, mode: 'BUY' })
    });

    // 4. Verify Balance Deduction
    const accRes2 = await fetch(`${API_URL}/account/balance`, { headers: { Authorization: `Bearer ${tokenA}` } });
    balA = (await accRes2.json()).data.virtualBalance;
    if (balA !== 125000) throw new Error(`Balance after buy should be 125000, got ${balA}`);
    console.log('SUCCESS: Balance correctly deducted after BUY.');

    // 5. Check Transaction History
    const txRes1 = await fetch(`${API_URL}/account/transactions`, { headers: { Authorization: `Bearer ${tokenA}` } });
    let txsA = (await txRes1.json()).data;
    if (txsA.length !== initialTxCount + 1 || txsA[0].type !== 'BUY') throw new Error(`Expected ${initialTxCount + 1} txs, got ${txsA.length}`);
    console.log('SUCCESS: Transaction history successfully recorded BUY.');

    // 6. User B isolation check (Should still be 150000)
    const accResB = await fetch(`${API_URL}/account/balance`, { headers: { Authorization: `Bearer ${tokenB}` } });
    let balB = (await accResB.json()).data.virtualBalance;
    if (balB !== 150000) throw new Error(`User B balance leaked, got ${balB}`);
    console.log('SUCCESS: User balance strictly isolated.');

    // 7. Insufficient balance rejection
    console.log('User A tries to buy 1000 RELIANCE @ 2500 (Total: 2,500,000)');
    const failBuy = await fetch(`${API_URL}/orders/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'RELIANCE', qty: 1000, price: 2500, mode: 'BUY' })
    });
    if (failBuy.status !== 400) throw new Error(`Expected 400 for insufficient balance, got ${failBuy.status}`);
    
    // Balance should remain unchanged (125000)
    const accRes3 = await fetch(`${API_URL}/account/balance`, { headers: { Authorization: `Bearer ${tokenA}` } });
    balA = (await accRes3.json()).data.virtualBalance;
    if (balA !== 125000) throw new Error(`Balance leaked/modified during failed BUY: ${balA}`);
    console.log('SUCCESS: Insufficient balance rejected safely.');

    // 8. User A sells 5 RELIANCE @ 3000 = 15000 (Balance should jump from 125000 to 140000)
    console.log('User A sells 5 RELIANCE @ 3000 (Total: 15,000)');
    await fetch(`${API_URL}/orders/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'RELIANCE', qty: 5, price: 3000, mode: 'SELL' })
    });

    const accRes4 = await fetch(`${API_URL}/account/balance`, { headers: { Authorization: `Bearer ${tokenA}` } });
    balA = (await accRes4.json()).data.virtualBalance;
    if (balA !== 140000) throw new Error(`Balance after SELL should be 140000, got ${balA}`);
    console.log('SUCCESS: Balance correctly increased after SELL.');

    // 9. Check Transaction History again
    const txRes2 = await fetch(`${API_URL}/account/transactions`, { headers: { Authorization: `Bearer ${tokenA}` } });
    txsA = (await txRes2.json()).data;
    if (txsA.length !== initialTxCount + 2 || txsA[0].type !== 'SELL') throw new Error(`Expected ${initialTxCount + 2} txs, newest should be SELL, got ${txsA[0].type}`);
    console.log('SUCCESS: Transaction history successfully recorded SELL.');

    console.log('ALL MVP-4 ACCOUNTING TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

runTests();
