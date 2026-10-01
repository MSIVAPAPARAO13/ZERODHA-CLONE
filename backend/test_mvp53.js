const mongoose = require("mongoose");
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { OrdersModel } = require("./models/OrdersModel");
const { ResearchWorkflowModel } = require("./models/ResearchWorkflowModel");
const researchWorkflowService = require("./services/researchWorkflowService");

async function runMVP53Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-53 RESEARCH WORKFLOW BUILDER TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();

  let passedTests = 0;
  let totalTests = 10;

  try {
    // Cleanup prior run data
    await UserModel.deleteMany({ email: { $in: ["mvp53a@test.com", "mvp53b@test.com"] } });
    await ResearchWorkflowModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP53 Workflow User A",
      username: "mvp53_user_a",
      email: "mvp53a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP53 Workflow User B",
      username: "mvp53_user_b",
      email: "mvp53b@test.com",
      password: "hashedpassword",
      virtualBalance: 200000
    });

    // -------------------------------------------------------------
    // TEST 1: Workflow Creation with Allowlisted Steps
    // -------------------------------------------------------------
    console.log("Test 1: Creating research workflow with allowlisted tools...");
    const wf1 = await researchWorkflowService.createWorkflow(testUserA, {
      name: "Evaluate Momentum Candidate",
      description: "Pipeline to screen, check quote, backtest, and simulate stress",
      steps: [
        { toolName: "runScanner", params: { universe: ["TCS", "INFY"] }, order: 0 },
        { toolName: "getQuote", params: { symbol: "TCS" }, order: 1 },
        { toolName: "runBacktest", params: { symbol: "TCS" }, order: 2 }
      ]
    });

    assert(wf1._id, "Workflow must have _id");
    assert.strictEqual(wf1.name, "Evaluate Momentum Candidate");
    assert.strictEqual(wf1.steps.length, 3);
    assert.strictEqual(wf1.version, 1);
    console.log("  ✓ Research workflow successfully persisted with 3 allowlisted steps.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 2: Rejection of Unauthorized Tools / Arbitrary Execution
    // -------------------------------------------------------------
    console.log("Test 2: Verifying rejection of unauthorized steps...");
    let caughtToolRejection = false;
    try {
      await researchWorkflowService.createWorkflow(testUserA, {
        name: "Malicious Workflow",
        steps: [
          { toolName: "arbitraryBashScript", params: { cmd: "rm -rf /" }, order: 0 }
        ]
      });
    } catch (err) {
      caughtToolRejection = err.message.includes("INVALID_STEP_TOOL");
    }
    assert(caughtToolRejection, "Must reject steps not in allowlisted tool registry");
    console.log("  ✓ System strictly rejected unauthorized tool step.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 3: Step Reordering & Version Increment
    // -------------------------------------------------------------
    console.log("Test 3: Testing step reordering and version tracking...");
    const updatedWf = await researchWorkflowService.updateWorkflow(testUserA, wf1._id, {
      steps: [
        { toolName: "getQuote", params: { symbol: "INFY" }, order: 0 },
        { toolName: "runScanner", params: {}, order: 1 },
        { toolName: "runBacktest", params: { symbol: "INFY" }, order: 2 },
        { toolName: "getPortfolio", params: {}, order: 3 }
      ]
    });
    assert.strictEqual(updatedWf.version, 2, "Workflow version must increment on step modification");
    assert.strictEqual(updatedWf.steps.length, 4, "Must contain 4 steps after update");
    assert.strictEqual(updatedWf.steps[0].toolName, "getQuote", "Step 0 must now be getQuote");
    console.log("  ✓ Steps reordered and version bumped to v2.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 4: Duplicating a Workflow
    // -------------------------------------------------------------
    console.log("Test 4: Duplicating workflow...");
    const dupWf = await researchWorkflowService.duplicateWorkflow(testUserA, wf1._id);
    assert.strictEqual(dupWf.name, "Evaluate Momentum Candidate (Copy)");
    assert.strictEqual(dupWf.steps.length, 4);
    assert.strictEqual(dupWf.version, 1);
    assert.notStrictEqual(dupWf._id.toString(), wf1._id.toString());
    console.log("  ✓ Workflow duplicated successfully with new ID and '(Copy)' designation.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 5: User Isolation on Read and Execution
    // -------------------------------------------------------------
    console.log("Test 5: Verifying strict user isolation...");
    let userBAccessBlocked = false;
    try {
      await researchWorkflowService.getWorkflowById(testUserB, wf1._id);
    } catch (err) {
      userBAccessBlocked = err.message === "WORKFLOW_NOT_FOUND";
    }
    assert(userBAccessBlocked, "User B must not access User A's workflow");

    let userBRunBlocked = false;
    try {
      await researchWorkflowService.runWorkflow(testUserB, wf1._id);
    } catch (err) {
      userBRunBlocked = err.message === "WORKFLOW_NOT_FOUND";
    }
    assert(userBRunBlocked, "User B must not execute User A's workflow");
    console.log("  ✓ User isolation strictly preserved across CRUD and run invocations.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 6: Sequential Workflow Pipeline Execution
    // -------------------------------------------------------------
    console.log("Test 6: Executing research workflow pipeline...");
    const execWf = await researchWorkflowService.createWorkflow(testUserA, {
      name: "Fast Verification Pipeline",
      steps: [
        { toolName: "getQuote", params: { symbol: "TCS" }, order: 0 },
        { toolName: "getMarketEvents", params: { symbol: "TCS" }, order: 1 }
      ]
    });

    const runReport = await researchWorkflowService.runWorkflow(testUserA, execWf._id);
    assert.strictEqual(runReport.workflowName, "Fast Verification Pipeline");
    assert.strictEqual(runReport.status, "SUCCESS");
    assert.strictEqual(runReport.executedStepsCount, 2);
    assert(runReport.totalDurationMs >= 0, "Execution duration must be non-negative");
    assert(runReport.stepResults.every(s => s.success), "All steps must succeed");
    console.log(`  ✓ Pipeline completed in ${runReport.totalDurationMs}ms with status SUCCESS.\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 7: Step Resilience & Partial Failure Handling
    // -------------------------------------------------------------
    console.log("Test 7: Testing step failure handling and status reporting...");
    const partialWf = await researchWorkflowService.createWorkflow(testUserA, {
      name: "Resilience Test Pipeline",
      steps: [
        { toolName: "getQuote", params: { symbol: "TCS" }, order: 0 },
        { toolName: "getHistoricalData", params: { symbol: "NONEXISTENT_STOCK_9999" }, order: 1 }
      ]
    });

    const partialRunReport = await researchWorkflowService.runWorkflow(testUserA, partialWf._id);
    assert(partialRunReport.executedStepsCount === 2);
    assert(partialRunReport.stepResults[0].success === true);
    console.log(`  ✓ Handled partial step failure gracefully with status ${partialRunReport.status}.\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 8: Step Enable/Disable Filter
    // -------------------------------------------------------------
    console.log("Test 8: Testing step toggle (skipping disabled steps)...");
    const toggleWf = await researchWorkflowService.createWorkflow(testUserA, {
      name: "Toggled Pipeline",
      steps: [
        { toolName: "getQuote", params: { symbol: "TCS" }, order: 0, enabled: true },
        { toolName: "runScanner", params: {}, order: 1, enabled: false }, // Disabled
        { toolName: "getMarketEvents", params: {}, order: 2, enabled: true }
      ]
    });

    const toggleRun = await researchWorkflowService.runWorkflow(testUserA, toggleWf._id);
    assert.strictEqual(toggleRun.executedStepsCount, 2, "Only enabled steps must be executed");
    assert(!toggleRun.stepResults.some(s => s.toolName === "runScanner"), "Disabled scanner step must be skipped");
    console.log("  ✓ Disabled steps accurately bypassed during pipeline run.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 9: Workflow Deletion
    // -------------------------------------------------------------
    console.log("Test 9: Testing workflow deletion...");
    const deleteRes = await researchWorkflowService.deleteWorkflow(testUserA, dupWf._id);
    assert.strictEqual(deleteRes.deleted, true);
    const checkDeleted = await ResearchWorkflowModel.findById(dupWf._id);
    assert.strictEqual(checkDeleted, null, "Deleted workflow must not exist");
    console.log("  ✓ Workflow successfully removed from database.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 10: Financial Safety & Zero Ledger Mutation
    // -------------------------------------------------------------
    console.log("Test 10: Verifying zero financial-ledger mutation...");
    const userACheck = await UserModel.findById(testUserA);
    const holdingsACheck = await HoldingsModel.find({ user: testUserA });
    const ordersACheck = await OrdersModel.find({ user: testUserA });

    assert.strictEqual(userACheck.virtualBalance, 500000, "virtualBalance must be unchanged");
    assert.strictEqual(holdingsACheck.length, 0, "No unauthorized holdings created");
    assert.strictEqual(ordersACheck.length, 0, "No unauthorized orders placed");
    console.log("  ✓ Zero financial mutations: virtualBalance, Holdings, and Orders untouched.\n");
    passedTests++;

    console.log("===================================================================");
    console.log(`MVP-53 ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log("===================================================================\n");

  } catch (error) {
    console.error("MVP-53 TEST FAILED:", error);
    process.exit(1);
  } finally {
    // Cleanup
    await UserModel.deleteMany({ email: { $in: ["mvp53a@test.com", "mvp53b@test.com"] } });
    await ResearchWorkflowModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB] } });
    await mongoose.disconnect();
  }
}

runMVP53Tests();
