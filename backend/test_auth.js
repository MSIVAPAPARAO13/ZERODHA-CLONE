

const API_URL = 'http://localhost:3002/api/v1';

async function runTests() {
  try {
    console.log('--- Starting MVP-2 Auth Tests ---');
    
    // 1. Register User A
    console.log('Registering User A...');
    const resA = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: 'usera_' + Date.now() + '@test.com', password: 'password123' })
    });
    const userA = await resA.json();
    const tokenA = userA.data.token;
    console.log('User A registered. Token:', tokenA.substring(0, 10) + '...');

    // 2. Register User B
    console.log('Registering User B...');
    const resB = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: 'userb_' + Date.now() + '@test.com', password: 'password123' })
    });
    const userB = await resB.json();
    const tokenB = userB.data.token;
    console.log('User B registered. Token:', tokenB.substring(0, 10) + '...');

    // 3. Create Order for User A
    console.log('Creating Order for User A...');
    await fetch(`${API_URL}/orders/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'RELIANCE', qty: 10, price: 2500, mode: 'BUY' })
    });

    // 4. Fetch Orders as User A
    const fetchA = await fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${tokenA}` } });
    const ordersA = await fetchA.json();
    console.log(`User A sees ${ordersA.data.length} orders. (Expected: > 0)`);

    // 5. Fetch Orders as User B
    const fetchB = await fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const ordersB = await fetchB.json();
    const userAOrderIds = new Set(ordersA.data.map(o => o._id));
    const leakFound = ordersB.data.some(o => userAOrderIds.has(o._id));

    if (!leakFound && ordersA.data.length > ordersB.data.length) {
      console.log('SUCCESS: User Data Isolation verified! Zero cross-tenant order leakage.');
    } else {
      console.log('FAILED: User B can see User A orders.');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

runTests();
