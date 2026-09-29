require('dotenv').config();
const mongoose = require('mongoose');

const API_URL = 'http://localhost:3002/api/v1';

async function runTests() {
  try {
    console.log('--- Starting MVP-6 Watchlist Integration Tests ---');
    
    // 1. Register User A
    const resA = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: 'usera_' + Date.now() + '@test.com', password: 'password123' })
    });
    const tokenA = (await resA.json()).data.token;

    // 2. Register User B
    const resB = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: 'userb_' + Date.now() + '@test.com', password: 'password123' })
    });
    const tokenB = (await resB.json()).data.token;

    // 3. User A Adds TCS
    console.log('User A adds TCS...');
    let res = await fetch(`${API_URL}/watchlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ symbol: 'TCS' })
    });
    if (res.status !== 201) throw new Error('User A failed to add TCS');
    
    // 4. User A Adds INFY
    console.log('User A adds INFY...');
    res = await fetch(`${API_URL}/watchlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ symbol: 'INFY' })
    });
    if (res.status !== 201) throw new Error('User A failed to add INFY');

    // 5. User A Duplicate Add
    console.log('User A adds TCS again...');
    res = await fetch(`${API_URL}/watchlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ symbol: 'TCS' })
    });
    if (res.status !== 400 && res.status !== 409) throw new Error(`Expected 400/409 for duplicate, got ${res.status}`);
    console.log('SUCCESS: Duplicate rejected.');

    // 6. User A Unknown Symbol Add
    console.log('User A adds UNKNOWN...');
    res = await fetch(`${API_URL}/watchlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ symbol: 'UNKNOWN' })
    });
    if (res.status !== 400) throw new Error(`Expected 400 for unknown, got ${res.status}`);
    console.log('SUCCESS: Unknown symbol rejected.');

    // 7. User B Add RELIANCE
    console.log('User B adds RELIANCE...');
    res = await fetch(`${API_URL}/watchlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ symbol: 'RELIANCE' })
    });
    if (res.status !== 201) throw new Error('User B failed to add RELIANCE');

    // 8. User B Reads Watchlist
    console.log('User B reads watchlist...');
    res = await fetch(`${API_URL}/watchlist`, { headers: { Authorization: `Bearer ${tokenB}` }});
    let data = (await res.json()).data;
    if (data.length !== 1 || data[0].symbol !== 'RELIANCE') throw new Error('User B watchlist isolation failed');
    console.log('SUCCESS: User B isolation passed.');

    // 9. User A Deletes TCS
    console.log('User A deletes TCS...');
    res = await fetch(`${API_URL}/watchlist/TCS`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenA}` }});
    if (res.status !== 200) throw new Error('User A failed to delete TCS');
    
    res = await fetch(`${API_URL}/watchlist`, { headers: { Authorization: `Bearer ${tokenA}` }});
    data = (await res.json()).data;
    if (data.length !== 1 || data[0].symbol !== 'INFY') throw new Error('User A delete failed');
    console.log('SUCCESS: User A deleted TCS properly.');

    // 10. User B Tries to Delete User A's INFY
    console.log('User B attempts to delete INFY...');
    res = await fetch(`${API_URL}/watchlist/INFY`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenB}` }});
    if (res.status !== 404) throw new Error('User B should get 404 when deleting symbol they do not own');
    console.log('SUCCESS: Security cross-delete prevented.');

    console.log('ALL MVP-6 WATCHLIST TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

runTests();
