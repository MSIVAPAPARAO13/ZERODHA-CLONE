const mongoose = require("mongoose");
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { OrdersModel } = require("./models/OrdersModel");
const { IdempotencyKeyModel } = require("./models/IdempotencyKeyModel");
const idempotencyMiddleware = require("./middleware/idempotencyMiddleware");
const marketDataService = require("./services/marketDataService");
const orderController = require("./controllers/orderController");

async function runMVP59Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-59 PRODUCTION RELIABILITY & SECURITY TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  let passedTests = 0;
  let totalTests = 10;

  try {
    // Cleanup prior run data
    await UserModel.deleteMany({ email: { $in: ["mvp59a@test.com", "mvp59b@test.com"] } });
    await IdempotencyKeyModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });

    // Seed mock user
    await UserModel.create({
      _id: testUserA,
      name: "MVP59 Trader A",
      username: "mvp59_user_a",
      email: "mvp59a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    // -------------------------------------------------------------
    // TEST 1: Initial Order Creation with Idempotency-Key
    // -------------------------------------------------------------
    console.log("Test 1: Executing initial paper BUY order with Idempotency-Key...");
    const orderPayload = {
      name: "TCS",
      qty: 10,
      price: 3500,
      mode: "BUY"
    };

    let responseStatus1 = null;
    let responseBody1 = null;
    let headers1 = {};

    const req1 = {
      headers: { "idempotency-key": "idemp-key-order-101" },
      user: { userId: testUserA.toString() },
      body: orderPayload,
      path: "/api/v1/orders/new"
    };

    const res1 = {
      statusCode: 201,
      setHeader: (k, v) => { headers1[k] = v; },
      status: function(code) { this.statusCode = code; return this; },
      json: function(body) { responseStatus1 = this.statusCode; responseBody1 = body; return this; }
    };

    // Execute middleware chain
    await idempotencyMiddleware(req1, res1, async (err) => {
      if (err) throw err;
      await orderController.createOrder(req1, res1, (ctrlErr) => {
        if (ctrlErr) throw ctrlErr;
      });
    });

    assert.strictEqual(responseStatus1, 201, "First order creation must succeed with 201");
    assert(responseBody1.success, "Order must succeed");

    const userAfterFirst = await UserModel.findById(testUserA);
    const expectedBalance = 500000 - (10 * 3500); // 465,000
    assert.strictEqual(userAfterFirst.virtualBalance, expectedBalance);

    const ordersCount1 = await OrdersModel.countDocuments({ user: testUserA });
    assert.strictEqual(ordersCount1, 1, "Exactly 1 order created in DB");
    console.log(`  ✓ Initial order executed; virtual balance deducted from 500k to ${userAfterFirst.virtualBalance}.\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 2: Replay of Identical Request (Zero Duplicate Financial Mutation)
    // -------------------------------------------------------------
    console.log("Test 2: Replaying identical order creation with same Idempotency-Key...");
    let responseStatus2 = null;
    let responseBody2 = null;
    let headers2 = {};

    const req2 = {
      headers: { "idempotency-key": "idemp-key-order-101" },
      user: { userId: testUserA.toString() },
      body: orderPayload,
      path: "/api/v1/orders/new"
    };

    const res2 = {
      statusCode: 200,
      setHeader: (k, v) => { headers2[k] = v; },
      status: function(code) { this.statusCode = code; return this; },
      json: function(body) { responseStatus2 = this.statusCode; responseBody2 = body; return this; }
    };

    let controllerExecutedOnReplay = false;
    await idempotencyMiddleware(req2, res2, async () => {
      controllerExecutedOnReplay = true;
      await orderController.createOrder(req2, res2);
    });

    assert.strictEqual(controllerExecutedOnReplay, false, "Controller must NOT execute on idempotent replay");
    assert.strictEqual(headers2["X-Idempotent-Replay"], "true", "Must set X-Idempotent-Replay header");
    assert.strictEqual(responseStatus2, 201, "Replayed response must mirror original status");

    const userAfterReplay = await UserModel.findById(testUserA);
    assert.strictEqual(userAfterReplay.virtualBalance, expectedBalance, "Balance must NOT be deducted again");

    const ordersCount2 = await OrdersModel.countDocuments({ user: testUserA });
    assert.strictEqual(ordersCount2, 1, "Still exactly 1 order in DB (zero duplicates)");
    console.log("  ✓ Idempotent replay safely intercepted: zero balance deduction, zero duplicate orders.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 3: Idempotency Payload Mismatch Rejection (422)
    // -------------------------------------------------------------
    console.log("Test 3: Testing Idempotency-Key reuse with altered payload...");
    let responseStatus3 = null;
    let responseBody3 = null;

    const req3 = {
      headers: { "idempotency-key": "idemp-key-order-101" },
      user: { userId: testUserA.toString() },
      body: { name: "INFY", qty: 50, price: 1500, mode: "BUY" }, // altered payload
      path: "/api/v1/orders/new"
    };

    const res3 = {
      statusCode: 200,
      setHeader: () => {},
      status: function(code) { this.statusCode = code; return this; },
      json: function(body) { responseStatus3 = this.statusCode; responseBody3 = body; return this; }
    };

    await idempotencyMiddleware(req3, res3, async () => {
      assert.fail("Should not execute next on payload mismatch");
    });

    assert.strictEqual(responseStatus3, 422);
    assert.strictEqual(responseBody3.error.code, "IDEMPOTENCY_PAYLOAD_MISMATCH");
    console.log("  ✓ Altered payload with recycled key rejected with 422 IDEMPOTENCY_PAYLOAD_MISMATCH.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 4: Concurrent In-Flight Key Conflict (409)
    // -------------------------------------------------------------
    console.log("Test 4: Testing concurrent duplicate request race condition (409 Conflict)...");
    await IdempotencyKeyModel.create({
      key: "idemp-key-concurrent-202",
      user: testUserA,
      endpoint: "/api/v1/orders/new",
      requestHash: "somehash",
      status: "IN_PROGRESS"
    });

    let responseStatus4 = null;
    let responseBody4 = null;

    const req4 = {
      headers: { "idempotency-key": "idemp-key-concurrent-202" },
      user: { userId: testUserA.toString() },
      body: orderPayload,
      path: "/api/v1/orders/new"
    };

    const res4 = {
      statusCode: 200,
      setHeader: () => {},
      status: function(code) { this.statusCode = code; return this; },
      json: function(body) { responseStatus4 = this.statusCode; responseBody4 = body; return this; }
    };

    await idempotencyMiddleware(req4, res4, async () => {
      assert.fail("Should not execute next on in-progress key");
    });

    assert.strictEqual(responseStatus4, 409);
    assert.strictEqual(responseBody4.error.code, "OPERATION_IN_PROGRESS");
    console.log("  ✓ In-flight operation safely locked with 409 OPERATION_IN_PROGRESS.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 5: Market Provider Fallback Resilience
    // -------------------------------------------------------------
    console.log("Test 5: Testing transparent fallback when primary provider throws...");
    // Simulate primary failure by testing executeWithFallback with a throwing primary function
    const fallbackResult = await marketDataService.executeWithFallback(
      "testQuote",
      "MOCK_FALLBACK_TEST",
      async () => { throw new Error("UPSTREAM_PROVIDER_503_SERVICE_UNAVAILABLE"); },
      async () => ({ symbol: "TCS", price: 3550, source: "mock" })
    );

    assert(fallbackResult);
    assert.strictEqual(fallbackResult.symbol, "TCS");
    assert.strictEqual(fallbackResult.providerNotice, "SERVED_VIA_FALLBACK_PROVIDER");
    console.log("  ✓ Primary failure seamlessly fell back to secondary provider with provenance notice.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 6: Stale Cached Value Disclosure
    // -------------------------------------------------------------
    console.log("Test 6: Testing cached fallback with explicit staleness disclosure...");
    // Prime cache with historical data
    marketDataService.cache.set("CACHED_TEST_SYM", {
      data: { symbol: "CACHED_TEST_SYM", price: 3200 },
      timestamp: Date.now() - 30000 // 30 seconds ago
    });

    // Execute where both primary and secondary fail
    const cachedResult = await marketDataService.executeWithFallback(
      "testQuote",
      "CACHED_TEST_SYM",
      async () => { throw new Error("PRIMARY_DOWN"); },
      async () => { throw new Error("SECONDARY_DOWN"); }
    );

    assert.strictEqual(cachedResult.cached, true);
    assert.strictEqual(cachedResult.isStale, true);
    assert(typeof cachedResult.cacheAgeSeconds === "number");
    console.log(`  ✓ Data served from cache with explicit 'isStale: true' disclosure (${cachedResult.cacheAgeSeconds}s old).\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 7: Terminal State: DATA_UNAVAILABLE Error
    // -------------------------------------------------------------
    console.log("Test 7: Verifying DATA_UNAVAILABLE terminal state when all sources fail...");
    let caughtTerminal = false;
    try {
      await marketDataService.executeWithFallback(
        "testQuote",
        "COMPLETELY_UNAVAILABLE_ASSET",
        async () => { throw new Error("PRIMARY_DOWN"); },
        async () => { throw new Error("SECONDARY_DOWN"); }
      );
    } catch (err) {
      caughtTerminal = err.message.includes("DATA_UNAVAILABLE");
    }
    assert(caughtTerminal, "Must throw DATA_UNAVAILABLE when all tiers fail");
    console.log("  ✓ Terminal state correctly yields DATA_UNAVAILABLE without fabricating numbers.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 8: Anti-Duplication Guard on Trading Operations
    // -------------------------------------------------------------
    console.log("Test 8: Verifying automated financial retry prevention...");
    // Without Idempotency-Key, consecutive requests are legitimate distinct transactions
    const distinctReq = {
      headers: {}, // No key
      user: { userId: testUserA.toString() },
      body: { name: "TCS", qty: 1, price: 3500, mode: "BUY" }
    };
    const distinctRes = {
      statusCode: 200,
      setHeader: () => {},
      status: function(c) { this.statusCode = c; return this; },
      json: function() { return this; }
    };

    let distinctExecuted = false;
    await idempotencyMiddleware(distinctReq, distinctRes, () => {
      distinctExecuted = true;
    });
    assert.strictEqual(distinctExecuted, true, "Standard requests without key proceed normally");
    console.log("  ✓ Standard execution path preserved while idempotency guards sensitive retries.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 9: Database Indexes & Resilience Audit
    // -------------------------------------------------------------
    console.log("Test 9: Verifying critical database indexes for performance and race protection...");
    const indexes = await IdempotencyKeyModel.collection.indexes();
    const hasUniqueCompound = indexes.some(idx => idx.key.key === 1 && idx.key.user === 1 && idx.unique);
    assert(hasUniqueCompound, "IdempotencyKey must have unique compound index on { key: 1, user: 1 }");

    const hasTtl = indexes.some(idx => idx.key.expiresAt === 1 && idx.expireAfterSeconds !== undefined);
    assert(hasTtl, "IdempotencyKey must have TTL index on expiresAt");
    console.log("  ✓ Critical compound and TTL indexes verified on MongoDB.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 10: Financial Safety Audit Post-Resilience Testing
    // -------------------------------------------------------------
    console.log("Test 10: Verifying final financial ledger consistency...");
    const userFinal = await UserModel.findById(testUserA);
    const finalOrders = await OrdersModel.find({ user: testUserA });

    assert.strictEqual(userFinal.virtualBalance, expectedBalance);
    assert.strictEqual(finalOrders.length, 1);
    console.log("  ✓ Financial records strictly consistent with zero unauthorized mutations.\n");
    passedTests++;

    console.log("===================================================================");
    console.log(`MVP-59 ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log("===================================================================\n");

  } catch (error) {
    console.error("MVP-59 TEST FAILED:", error);
    process.exit(1);
  } finally {
    // Cleanup
    await UserModel.deleteMany({ email: { $in: ["mvp59a@test.com", "mvp59b@test.com"] } });
    await IdempotencyKeyModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP59Tests();
