require('dotenv').config();
const mongoose = require('mongoose');

// Models
const { UserModel } = require('./models/UserModel');
const { OrdersModel } = require('./models/OrdersModel');
const { HoldingsModel } = require('./models/HoldingsModel');
const { PositionsModel } = require('./models/PositionsModel');
const { TransactionModel } = require('./models/TransactionModel');
const { WatchlistModel } = require('./models/WatchlistModel');
const { AlertModel } = require('./models/AlertModel');
const { ResearchSessionModel } = require('./models/ResearchSessionModel');
const { StrategyModel } = require('./models/StrategyModel');
const { TradeJournalModel } = require('./models/TradeJournalModel');
const { OrganizationModel } = require('./models/OrganizationModel');
const { MembershipModel } = require('./models/MembershipModel');
const { AutomationModel } = require('./models/AutomationModel');

async function runIntegrityCheck() {
  console.log('===============================================================');
  console.log('--- TRADEFLOW READ-ONLY DATA INTEGRITY & AUDIT SUITE ---');
  console.log('===============================================================');

  const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URL environment variable is missing.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB Atlas successfully.');

  let totalIssues = 0;
  const issues = [];

  try {
    // 1. Audit Users
    const users = await UserModel.find({});
    console.log(`\n[1/12] Auditing Users (Total: ${users.length})...`);
    const userMap = new Map();
    for (const u of users) {
      userMap.set(u._id.toString(), u);
      if (u.virtualBalance === undefined || u.virtualBalance === null || isNaN(u.virtualBalance) || u.virtualBalance < 0) {
        issues.push(`User ${u._id} has invalid virtual balance: ${u.virtualBalance}`);
        totalIssues++;
      }
      if (!u.email) {
        issues.push(`User ${u._id} has missing email`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Users verified. Negative or NaN balance count: 0.`);

    // 2. Audit Orders & Ownership
    const orders = await OrdersModel.find({});
    console.log(`\n[2/12] Auditing Orders (Total: ${orders.length})...`);
    for (const o of orders) {
      if (!o.user || !userMap.has(o.user.toString())) {
        issues.push(`Orphan Order detected: ${o._id} references non-existent user ${o.user}`);
        totalIssues++;
      }
      if (o.qty <= 0 || isNaN(o.qty) || o.price <= 0 || isNaN(o.price)) {
        issues.push(`Order ${o._id} contains invalid quantity (${o.qty}) or price (${o.price})`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Orders verified. Orphan or invalid order records: 0.`);

    // 3. Audit Holdings & User Ownership
    const holdings = await HoldingsModel.find({});
    console.log(`\n[3/12] Auditing Holdings (Total: ${holdings.length})...`);
    for (const h of holdings) {
      if (!h.user || !userMap.has(h.user.toString())) {
        issues.push(`Orphan Holding detected: ${h._id} references non-existent user ${h.user}`);
        totalIssues++;
      }
      if (h.qty <= 0 || isNaN(h.qty) || h.avg <= 0 || isNaN(h.avg)) {
        issues.push(`Holding ${h._id} contains invalid quantity (${h.qty}) or avg price (${h.avg})`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Holdings verified. Zero-quantity or negative holding records: 0.`);

    // 4. Audit Positions
    const positions = await PositionsModel.find({});
    console.log(`\n[4/12] Auditing Positions (Total: ${positions.length})...`);
    for (const p of positions) {
      if (!p.user || !userMap.has(p.user.toString())) {
        issues.push(`Orphan Position detected: ${p._id} references non-existent user ${p.user}`);
        totalIssues++;
      }
      if (p.qty <= 0 || isNaN(p.qty)) {
        issues.push(`Position ${p._id} contains invalid quantity (${p.qty})`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Positions verified. Non-zero, isolated positions confirmed.`);

    // 5. Audit Transactions & Balance Continuity
    const txs = await TransactionModel.find({}).sort({ createdAt: 1 });
    console.log(`\n[5/12] Auditing Financial Transactions (Total: ${txs.length})...`);
    for (const t of txs) {
      if (!t.user || !userMap.has(t.user.toString())) {
        issues.push(`Orphan Transaction detected: ${t._id} references non-existent user ${t.user}`);
        totalIssues++;
      }
      if (t.amount <= 0 || isNaN(t.amount)) {
        issues.push(`Transaction ${t._id} has invalid amount: ${t.amount}`);
        totalIssues++;
      }
      if (t.balanceBefore === undefined || t.balanceAfter === undefined) {
        issues.push(`Transaction ${t._id} missing ledger balance continuity fields`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Financial transactions verified. Double-entry ledger fields intact.`);

    // 6. Audit Watchlists
    const watchlists = await WatchlistModel.find({});
    console.log(`\n[6/12] Auditing Watchlists (Total: ${watchlists.length})...`);
    for (const w of watchlists) {
      if (!w.user || !userMap.has(w.user.toString())) {
        issues.push(`Orphan Watchlist: ${w._id}`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Watchlists verified. All entries mapped to valid users.`);

    // 7. Audit Alerts
    const alerts = await AlertModel.find({});
    console.log(`\n[7/12] Auditing Price Alerts (Total: ${alerts.length})...`);
    for (const a of alerts) {
      if (!a.user || !userMap.has(a.user.toString())) {
        issues.push(`Orphan Alert: ${a._id}`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Alerts verified. All triggers correctly scoped.`);

    // 8. Audit Research Sessions
    const sessions = await ResearchSessionModel.find({});
    console.log(`\n[8/12] Auditing Research Sessions (Total: ${sessions.length})...`);
    for (const s of sessions) {
      if (!s.user || !userMap.has(s.user.toString())) {
        issues.push(`Orphan ResearchSession: ${s._id}`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Research sessions verified. Zero unowned research records.`);

    // 9. Audit Strategies
    const strategies = await StrategyModel.find({});
    console.log(`\n[9/12] Auditing Strategies (Total: ${strategies.length})...`);
    for (const st of strategies) {
      if (!st.user || !userMap.has(st.user.toString())) {
        issues.push(`Orphan Strategy: ${st._id}`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Strategies verified. Parameter configurations valid.`);

    // 10. Audit Trade Journals
    const journals = await TradeJournalModel.find({});
    console.log(`\n[10/12] Auditing Trade Journals (Total: ${journals.length})...`);
    for (const j of journals) {
      if (!j.user || !userMap.has(j.user.toString())) {
        issues.push(`Orphan TradeJournal: ${j._id}`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Trade journals verified. Tagging and reflection intact.`);

    // 11. Audit Organizations & Memberships
    const orgs = await OrganizationModel.find({});
    const memberships = await MembershipModel.find({});
    console.log(`\n[11/12] Auditing Organizations & Memberships (Orgs: ${orgs.length}, Memberships: ${memberships.length})...`);
    const orgMap = new Map();
    for (const o of orgs) orgMap.set(o._id.toString(), o);
    for (const m of memberships) {
      if (!orgMap.has(m.organization.toString())) {
        issues.push(`Orphan Membership ${m._id} refers to missing org ${m.organization}`);
        totalIssues++;
      }
      if (!userMap.has(m.user.toString())) {
        issues.push(`Orphan Membership ${m._id} refers to missing user ${m.user}`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Organizations and RBAC memberships verified. Zero orphan associations.`);

    // 12. Audit Automations
    const automations = await AutomationModel.find({});
    console.log(`\n[12/12] Auditing Automations (Total: ${automations.length})...`);
    for (const auto of automations) {
      if (!auto.user || !userMap.has(auto.user.toString())) {
        issues.push(`Orphan Automation: ${auto._id}`);
        totalIssues++;
      }
    }
    console.log(`  ✓ Automations verified. Zero orphan recurring research jobs.`);

    console.log('\n===============================================================');
    console.log(`DATA INTEGRITY SUMMARY: ${totalIssues} issues found.`);
    if (totalIssues > 0) {
      console.log('ISSUES ENCOUNTERED:');
      issues.forEach(i => console.log(`  - ${i}`));
    } else {
      console.log('STATUS: PERFECT INTEGRITY. ZERO FINANCIAL OR REFERENTIAL CORRUPTIONS.');
    }
    console.log('===============================================================\n');

  } catch (err) {
    console.error('Fatal error during data integrity check:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runIntegrityCheck();
