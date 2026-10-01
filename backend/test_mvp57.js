const mongoose = require("mongoose");
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { OrdersModel } = require("./models/OrdersModel");
const { UsageEventModel } = require("./models/UsageEventModel");
const { UsageCounterModel } = require("./models/UsageCounterModel");
const usageService = require("./services/usageService");
const { getPlanLimits, PLANS } = require("./config/planConfig");

async function runMVP57Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-57 USAGE & SUBSCRIPTION FOUNDATION TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  let passedTests = 0;
  let totalTests = 10;

  try {
    // Cleanup prior run data
    await UserModel.deleteMany({ email: { $in: ["mvp57a@test.com", "mvp57b@test.com"] } });
    await UsageEventModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UsageCounterModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP57 Trader A",
      username: "mvp57_user_a",
      email: "mvp57a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP57 Trader B",
      username: "mvp57_user_b",
      email: "mvp57b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // -------------------------------------------------------------
    // TEST 1: Default FREE Plan Lookup
    // -------------------------------------------------------------
    console.log("Test 1: Verifying default FREE plan assignment...");
    const plan = await usageService.getUserPlan(testUserA);
    assert.strictEqual(plan.id, "FREE");
    assert.strictEqual(plan.priceMonthlyInr, 0);
    assert.strictEqual(plan.limits.aiRequests, 25);
    console.log("  ✓ Default plan is FREE with configured quotas.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 2: Record Feature Usage Event & Aggregate Counter
    // -------------------------------------------------------------
    console.log("Test 2: Recording usage event and updating monthly counter...");
    const rec1 = await usageService.recordUsage(testUserA, "aiRequests", 2, { prompt: "Analyze TCS" });
    assert.strictEqual(rec1.feature, "aiRequests");
    assert.strictEqual(rec1.quantityRecorded, 2);
    assert.strictEqual(rec1.newTotal, 2);

    const eventCount = await UsageEventModel.countDocuments({ user: testUserA, feature: "aiRequests" });
    assert.strictEqual(eventCount, 1);
    console.log("  ✓ Usage event persisted and counter incremented to 2.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 3: Multiple Feature Metering
    // -------------------------------------------------------------
    console.log("Test 3: Metering diverse features (backtests, scans, workflows)...");
    await usageService.recordUsage(testUserA, "backtests", 3);
    await usageService.recordUsage(testUserA, "scans", 10);
    await usageService.recordUsage(testUserA, "workflowRuns", 1);

    const summary = await usageService.getUsage(testUserA);
    assert.strictEqual(summary.usage.aiRequests, 2);
    assert.strictEqual(summary.usage.backtests, 3);
    assert.strictEqual(summary.usage.scans, 10);
    assert.strictEqual(summary.usage.workflowRuns, 1);
    console.log("  ✓ Multiple features metered accurately in parallel.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 4: Quota Check (Within Quota)
    // -------------------------------------------------------------
    console.log("Test 4: Checking quota for allowable request...");
    const quotaCheck = await usageService.checkQuota(testUserA, "aiRequests", 5);
    assert.strictEqual(quotaCheck.allowed, true);
    assert.strictEqual(quotaCheck.current, 2);
    assert.strictEqual(quotaCheck.limit, 25);
    assert.strictEqual(quotaCheck.remaining, 23);
    console.log("  ✓ Quota check passed: 5 additional requests permitted (remaining: 23).\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 5: Quota Check (Quota Exceeded)
    // -------------------------------------------------------------
    console.log("Test 5: Checking quota when request would exceed limit...");
    const exceededCheck = await usageService.checkQuota(testUserA, "aiRequests", 24); // 2 + 24 = 26 > 25
    assert.strictEqual(exceededCheck.allowed, false);
    assert.strictEqual(exceededCheck.remaining, 23);
    console.log("  ✓ Quota check accurately rejected request exceeding FREE limit.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 6: User Plan Upgrade to PRO
    // -------------------------------------------------------------
    console.log("Test 6: Upgrading user subscription plan to PRO...");
    const upgraded = await usageService.setUserPlan(testUserA, "PRO");
    assert.strictEqual(upgraded.id, "PRO");
    assert.strictEqual(upgraded.limits.aiRequests, 500);

    const currentPlan = await usageService.getUserPlan(testUserA);
    assert.strictEqual(currentPlan.id, "PRO");
    console.log("  ✓ Plan successfully upgraded to PRO (aiRequests limit: 500).\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 7: Quota Enforcement Post-Upgrade
    // -------------------------------------------------------------
    console.log("Test 7: Re-checking previously blocked request under PRO quota...");
    const postUpgradeCheck = await usageService.checkQuota(testUserA, "aiRequests", 24);
    assert.strictEqual(postUpgradeCheck.allowed, true);
    assert.strictEqual(postUpgradeCheck.limit, 500);
    assert.strictEqual(postUpgradeCheck.remaining, 498);
    console.log("  ✓ Request permitted under upgraded PRO limits.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 8: Usage Reset Logic
    // -------------------------------------------------------------
    console.log("Test 8: Testing monthly usage counter reset...");
    await usageService.resetUsage(testUserA);
    const postReset = await usageService.getUsage(testUserA);
    assert.strictEqual(postReset.usage.aiRequests, 0);
    assert.strictEqual(postReset.usage.backtests, 0);
    console.log("  ✓ Counters cleanly reset to zero.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 9: Strict User Isolation in Usage Metering
    // -------------------------------------------------------------
    console.log("Test 9: Verifying strict user isolation across usage meters...");
    await usageService.recordUsage(testUserA, "scans", 15);
    const userAUsage = await usageService.getUsage(testUserA);
    const userBUsage = await usageService.getUsage(testUserB);

    assert.strictEqual(userAUsage.usage.scans, 15);
    assert.strictEqual(userBUsage.usage.scans, 0);
    assert.strictEqual(userBUsage.plan, "FREE");
    console.log("  ✓ User B usage completely isolated from User A meters.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 10: Financial Safety & Zero Ledger Mutation
    // -------------------------------------------------------------
    console.log("Test 10: Verifying zero financial-ledger mutation...");
    const userACheck = await UserModel.findById(testUserA);
    const userBCheck = await UserModel.findById(testUserB);
    const holdingsACheck = await HoldingsModel.find({ user: testUserA });
    const ordersACheck = await OrdersModel.find({ user: testUserA });

    assert.strictEqual(userACheck.virtualBalance, 500000);
    assert.strictEqual(userBCheck.virtualBalance, 200000);
    assert.strictEqual(holdingsACheck.length, 0);
    assert.strictEqual(ordersACheck.length, 0);
    console.log("  ✓ Zero financial mutations: virtualBalance, Holdings, and Orders untouched.\n");
    passedTests++;

    console.log("===================================================================");
    console.log(`MVP-57 ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log("===================================================================\n");

  } catch (error) {
    console.error("MVP-57 TEST FAILED:", error);
    process.exit(1);
  } finally {
    // Cleanup
    await UserModel.deleteMany({ email: { $in: ["mvp57a@test.com", "mvp57b@test.com"] } });
    await UsageEventModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await UsageCounterModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP57Tests();
