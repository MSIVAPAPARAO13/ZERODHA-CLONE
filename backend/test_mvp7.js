require('dotenv').config();
const mongoose = require('mongoose');

const API_URL = 'http://localhost:3002/api/v1';

async function runTests() {
  try {
    console.log('--- Starting MVP-7 Alerts Integration Tests ---');
    
    // 1. Register User A
    const resA = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: 'user_a_alert_' + Date.now() + '@test.com', password: 'password123' })
    });
    const tokenA = (await resA.json()).data.token;

    // 2. Register User B
    const resB = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: 'user_b_alert_' + Date.now() + '@test.com', password: 'password123' })
    });
    const tokenB = (await resB.json()).data.token;

    // Clear starter alerts via API so test operates on fresh alerts baseline
    const currA = await (await fetch(`${API_URL}/alerts`, { headers: { Authorization: `Bearer ${tokenA}` } })).json();
    for (const a of (currA.data || [])) {
      await fetch(`${API_URL}/alerts/${a._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenA}` } });
    }
    const currB = await (await fetch(`${API_URL}/alerts`, { headers: { Authorization: `Bearer ${tokenB}` } })).json();
    for (const a of (currB.data || [])) {
      await fetch(`${API_URL}/alerts/${a._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenB}` } });
    }

    // 3. Create Valid Alert
    console.log('User A creates TCS alert...');
    let res = await fetch(`${API_URL}/alerts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ symbol: 'TCS', condition: 'ABOVE', targetPrice: 3500 })
    });
    let alertData = await res.json();
    if (res.status !== 201) throw new Error('User A failed to create TCS alert');
    const alertIdA = alertData.data._id;
    console.log('SUCCESS: Alert created.');

    // 4. Duplicate Exact Alert
    console.log('User A creates exact duplicate TCS alert...');
    res = await fetch(`${API_URL}/alerts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ symbol: 'TCS', condition: 'ABOVE', targetPrice: 3500 })
    });
    if (res.status !== 400) throw new Error(`Expected 400 for exact duplicate, got ${res.status}`);
    console.log('SUCCESS: Duplicate alert rejected.');

    // 5. Invalid Symbol
    console.log('User A creates UNKNOWN alert...');
    res = await fetch(`${API_URL}/alerts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ symbol: 'UNKNOWN', condition: 'ABOVE', targetPrice: 3500 })
    });
    if (res.status !== 400) throw new Error(`Expected 400 for unknown symbol, got ${res.status}`);
    console.log('SUCCESS: Unknown symbol rejected.');

    // 6. User Isolation (GET)
    console.log('User B creates INFY alert...');
    res = await fetch(`${API_URL}/alerts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ symbol: 'INFY', condition: 'BELOW', targetPrice: 1500 })
    });
    if (res.status !== 201) throw new Error('User B failed to create alert');
    const alertIdB = (await res.json()).data._id;

    console.log('User B fetches alerts...');
    res = await fetch(`${API_URL}/alerts`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const alertsB = (await res.json()).data;
    if (alertsB.length !== 1 || alertsB[0].symbol !== 'INFY') throw new Error('User B isolation failed');
    console.log('SUCCESS: User B sees only their alerts.');

    // 7. Modification Security
    console.log('User B attempts to modify User A alert...');
    res = await fetch(`${API_URL}/alerts/${alertIdA}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ isActive: false })
    });
    if (res.status !== 404) throw new Error('User B should get 404 modifying User A alert');
    console.log('SUCCESS: Cross-modification prevented.');

    // 8. Evaluation Trigger
    // Ensure we trigger INFY BELOW 2000 (Mock price is 1555.45)
    console.log('User A creates INFY BELOW 2000 alert (should trigger)...');
    res = await fetch(`${API_URL}/alerts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ symbol: 'INFY', condition: 'BELOW', targetPrice: 2000 })
    });
    const triggerAlertId = (await res.json()).data._id;

    console.log('Evaluating alerts...');
    res = await fetch(`${API_URL}/alerts/evaluate`, {
      method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } // Assuming evaluate is open or accessible
    });
    const evalData = await res.json();
    if (!evalData.data.find(a => a._id === triggerAlertId)) throw new Error('Alert failed to trigger');
    console.log('SUCCESS: Alert evaluation triggers correctly.');

    // 9. Verify One-Time Trigger
    console.log('Evaluating alerts again...');
    res = await fetch(`${API_URL}/alerts/evaluate`, { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } });
    const evalData2 = await res.json();
    if (evalData2.data.find(a => a._id === triggerAlertId)) throw new Error('Alert triggered repeatedly');
    console.log('SUCCESS: Alert is one-time only.');

    console.log('ALL MVP-7 ALERTS TESTS PASSED!');
    return;
  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

runTests();
