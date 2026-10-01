const mongoose = require("mongoose");
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { OrdersModel } = require("./models/OrdersModel");
const { OrganizationModel } = require("./models/OrganizationModel");
const { SystemEventModel } = require("./models/SystemEventModel");
const adminService = require("./services/adminService");
const adminMiddleware = require("./middleware/adminMiddleware");

async function runMVP58Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-58 ADMIN + OBSERVABILITY CENTER TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const adminUserId = new mongoose.Types.ObjectId();
  const regularUserId = new mongoose.Types.ObjectId();

  let passedTests = 0;
  let totalTests = 10;

  try {
    // Cleanup prior run data
    await UserModel.deleteMany({ email: { $in: ["mvp58admin@test.com", "mvp58user@test.com"] } });
    await OrganizationModel.deleteMany({ owner: { $in: [adminUserId, regularUserId] } });
    await SystemEventModel.deleteMany({ userId: { $in: [adminUserId, regularUserId] } });
    await HoldingsModel.deleteMany({ user: { $in: [adminUserId, regularUserId] } });
    await OrdersModel.deleteMany({ user: { $in: [adminUserId, regularUserId] } });

    // Seed mock users (Admin + Regular)
    await UserModel.create({
      _id: adminUserId,
      name: "MVP58 System Administrator",
      username: "mvp58_admin",
      email: "mvp58admin@test.com",
      password: "supersecretpasswordhash",
      virtualBalance: 1000000,
      role: "ADMIN"
    });

    await UserModel.create({
      _id: regularUserId,
      name: "MVP58 Regular Trader",
      username: "mvp58_trader",
      email: "mvp58user@test.com",
      password: "traderpasswordhash",
      virtualBalance: 250000,
      role: "USER"
    });

    // -------------------------------------------------------------
    // TEST 1: Admin Authorization Middleware (Allow ADMIN)
    // -------------------------------------------------------------
    console.log("Test 1: Verifying admin authorization middleware for ADMIN role...");
    let nextCalled = false;
    const reqAdmin = { user: { userId: adminUserId.toString() } };
    const resMock = {
      status: (code) => ({
        json: (data) => ({ statusCode: code, data })
      })
    };

    await adminMiddleware(reqAdmin, resMock, () => {
      nextCalled = true;
    });
    assert(nextCalled, "adminMiddleware must invoke next() for ADMIN role");
    assert.strictEqual(reqAdmin.adminUser.role, "ADMIN");
    console.log("  ✓ Admin role verified and authorized successfully.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 2: Rejection of Regular Non-Admin User (403 Forbidden)
    // -------------------------------------------------------------
    console.log("Test 2: Verifying rejection of regular user by admin middleware...");
    let rejectionResponse = null;
    const reqRegular = { user: { userId: regularUserId.toString() } };
    const resReject = {
      status: (code) => ({
        json: (data) => {
          rejectionResponse = { statusCode: code, data };
          return rejectionResponse;
        }
      })
    };

    await adminMiddleware(reqRegular, resReject, () => {
      assert.fail("Should not call next() for non-admin");
    });
    assert(rejectionResponse, "Response must be sent");
    assert.strictEqual(rejectionResponse.statusCode, 403);
    assert(rejectionResponse.data.error.message.includes("Administrator privileges required"));
    console.log("  ✓ Non-admin user strictly rejected with 403 Forbidden.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 3: Admin Overview Metrics Aggregation
    // -------------------------------------------------------------
    console.log("Test 3: Fetching high-level administrative overview metrics...");
    const overview = await adminService.getOverview();
    assert(overview.metrics, "Overview must contain metrics");
    assert(typeof overview.metrics.users === "number");
    assert(typeof overview.metrics.organizations === "number");
    assert(typeof overview.metrics.totalApiRequests === "number");
    assert(typeof overview.metrics.errorRatePercent === "number");
    assert(typeof overview.metrics.averageLatencyMs === "number");
    console.log(`  ✓ Overview metrics aggregated: ${overview.metrics.users} users, ${overview.metrics.errorRatePercent}% error rate.\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 4: Paginated Users Roster & Password Hash Redaction
    // -------------------------------------------------------------
    console.log("Test 4: Verifying user roster pagination and security scrubbing...");
    const usersResult = await adminService.getUsers(1, 10);
    assert(Array.isArray(usersResult.users));
    assert(usersResult.total >= 2);
    // Crucial: passwords must NEVER be returned
    const foundAdmin = usersResult.users.find(u => u.email === "mvp58admin@test.com");
    assert(foundAdmin);
    assert.strictEqual(foundAdmin.password, undefined, "Password field must be excluded from admin user list");
    console.log("  ✓ User roster returned with credentials strictly excluded.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 5: Paginated Organizations Roster
    // -------------------------------------------------------------
    console.log("Test 5: Verifying organizations list for administration...");
    const orgsResult = await adminService.getOrganizations(1, 10);
    assert(Array.isArray(orgsResult.organizations));
    assert(typeof orgsResult.total === "number");
    console.log(`  ✓ Organizations listed cleanly (${orgsResult.total} total orgs).\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 6: Real-Time Market Provider Health Telemetry
    // -------------------------------------------------------------
    console.log("Test 6: Checking real-time market data provider health telemetry...");
    const providerHealth = await adminService.getProviderHealth();
    assert(providerHealth.providers);
    assert(providerHealth.providers.TWELVE_DATA);
    assert(providerHealth.providers.TWELVE_DATA.status === "HEALTHY" || providerHealth.providers.TWELVE_DATA.status === "DEGRADED");
    assert(typeof providerHealth.providers.TWELVE_DATA.latencyMs === "number");
    assert(typeof providerHealth.providers.TWELVE_DATA.errorCount === "number");
    console.log(`  ✓ Twelve Data provider telemetry: status=${providerHealth.providers.TWELVE_DATA.status}, latency=${providerHealth.providers.TWELVE_DATA.latencyMs}ms.\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 7: System Events Logging & Error Tracking
    // -------------------------------------------------------------
    console.log("Test 7: Logging system events and error conditions...");
    const event = await adminService.logSystemEvent(
      "AUTH_FAILURE",
      "WARNING",
      "Failed login attempt with invalid credential signature",
      { attemptedEmail: "attacker@bad.com" },
      regularUserId,
      "192.168.1.100"
    );
    assert(event._id);
    assert.strictEqual(event.type, "AUTH_FAILURE");
    assert.strictEqual(event.severity, "WARNING");
    assert.strictEqual(event.ip, "192.168.1.100");
    console.log("  ✓ System operational event successfully logged.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 8: Secrets Scrubbing in System Events (PII & Secret Protection)
    // -------------------------------------------------------------
    console.log("Test 8: Verifying automated scrubbing of secrets, tokens, and passwords...");
    const sensitiveEvent = await adminService.logSystemEvent(
      "SECURITY_ALERT",
      "CRITICAL",
      "Suspicious payload with leaked credentials",
      {
        password: "CleartextPassword123!",
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
        apiKey: "td_live_99887766554433",
        safeDiagnosticInfo: "Error parsing header"
      },
      adminUserId
    );

    assert.strictEqual(sensitiveEvent.details.password, "[REDACTED]", "Password must be redacted");
    assert.strictEqual(sensitiveEvent.details.jwt, "[REDACTED]", "JWT must be redacted");
    assert.strictEqual(sensitiveEvent.details.apiKey, "[REDACTED]", "API key must be redacted");
    assert.strictEqual(sensitiveEvent.details.safeDiagnosticInfo, "Error parsing header", "Non-sensitive data preserved");
    console.log("  ✓ Sensitive credentials automatically redacted from telemetry logs.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 9: Filtered System Events Query
    // -------------------------------------------------------------
    console.log("Test 9: Querying system events stream by severity and type...");
    const filtered = await adminService.getSystemEvents({ severity: "CRITICAL" });
    assert(Array.isArray(filtered.events));
    assert(filtered.events.every(e => e.severity === "CRITICAL"));
    console.log(`  ✓ System events query filtered accurately (${filtered.events.length} critical events).\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 10: Financial Safety & Zero Ledger Mutation
    // -------------------------------------------------------------
    console.log("Test 10: Verifying zero financial-ledger mutation...");
    const adminCheck = await UserModel.findById(adminUserId);
    const traderCheck = await UserModel.findById(regularUserId);
    const holdingsCheck = await HoldingsModel.find({ user: { $in: [adminUserId, regularUserId] } });
    const ordersCheck = await OrdersModel.find({ user: { $in: [adminUserId, regularUserId] } });

    assert.strictEqual(adminCheck.virtualBalance, 1000000);
    assert.strictEqual(traderCheck.virtualBalance, 250000);
    assert.strictEqual(holdingsCheck.length, 0);
    assert.strictEqual(ordersCheck.length, 0);
    console.log("  ✓ Zero financial mutations: virtualBalance, Holdings, and Orders untouched.\n");
    passedTests++;

    console.log("===================================================================");
    console.log(`MVP-58 ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log("===================================================================\n");

  } catch (error) {
    console.error("MVP-58 TEST FAILED:", error);
    process.exit(1);
  } finally {
    // Cleanup
    await UserModel.deleteMany({ email: { $in: ["mvp58admin@test.com", "mvp58user@test.com"] } });
    await OrganizationModel.deleteMany({ owner: { $in: [adminUserId, regularUserId] } });
    await SystemEventModel.deleteMany({ userId: { $in: [adminUserId, regularUserId] } });
    await HoldingsModel.deleteMany({ user: { $in: [adminUserId, regularUserId] } });
    await OrdersModel.deleteMany({ user: { $in: [adminUserId, regularUserId] } });
    await mongoose.disconnect();
  }
}

runMVP58Tests();
