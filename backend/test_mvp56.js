const mongoose = require("mongoose");
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { OrdersModel } = require("./models/OrdersModel");
const { OrganizationModel } = require("./models/OrganizationModel");
const { MembershipModel } = require("./models/MembershipModel");
const { ResearchSessionModel } = require("./models/ResearchSessionModel");
const { ResearchCommentModel } = require("./models/ResearchCommentModel");
const collaborationService = require("./services/collaborationService");
const organizationService = require("./services/organizationService");

async function runMVP56Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-56 SHARED RESEARCH & COLLABORATION TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();
  const testUserC = new mongoose.Types.ObjectId();

  let passedTests = 0;
  let totalTests = 10;

  try {
    // Cleanup prior run data
    await UserModel.deleteMany({
      email: { $in: ["mvp56a@test.com", "mvp56b@test.com", "mvp56c@test.com"] }
    });
    await OrganizationModel.deleteMany({ owner: testUserA });
    await MembershipModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC] } });
    await ResearchSessionModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC] } });
    await ResearchCommentModel.deleteMany({ author: { $in: [testUserA, testUserB, testUserC] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP56 Lead Researcher A",
      username: "mvp56_user_a",
      email: "mvp56a@test.com",
      password: "hashedpassword",
      virtualBalance: 500000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP56 Collaborator B",
      username: "mvp56_user_b",
      email: "mvp56b@test.com",
      password: "hashedpassword",
      virtualBalance: 300000
    });

    await UserModel.create({
      _id: testUserC,
      name: "MVP56 External Analyst C",
      username: "mvp56_user_c",
      email: "mvp56c@test.com",
      password: "hashedpassword",
      virtualBalance: 150000
    });

    // Seed Organization and Memberships (A = OWNER, B = RESEARCHER)
    const org = await organizationService.createOrganization(testUserA, {
      name: "TradeFlow Quantitative Lab",
      description: "Collaborative alpha research"
    });

    await organizationService.inviteMember(testUserA, org._id, {
      email: "mvp56b@test.com",
      role: "RESEARCHER"
    });

    // Seed private Research Session for User A
    const session = await ResearchSessionModel.create({
      user: testUserA,
      title: "Breakout Thesis on TCS IT Sector",
      question: "Will TCS sustain its 50-day moving average breakout during upcoming earnings?",
      researchHash: "hash_tcs_breakout_session_1",
      status: "ACTIVE"
    });

    // -------------------------------------------------------------
    // TEST 1: Initial Private State & Sharing Session to Org
    // -------------------------------------------------------------
    console.log("Test 1: Sharing private research session with organization...");
    assert.strictEqual(session.sharedWithOrg, false);

    const shared = await collaborationService.shareSession(testUserA, session._id, org._id);
    assert.strictEqual(shared.sharedWithOrg, true);
    assert.strictEqual(shared.organization.toString(), org._id.toString());
    console.log("  ✓ Session shared successfully with 'TradeFlow Quantitative Lab'.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 2: Team Member Session Access
    // -------------------------------------------------------------
    console.log("Test 2: Verifying team member (User B) access to shared session...");
    const sharedSessions = await collaborationService.getSharedSessions(testUserB, org._id);
    assert.strictEqual(sharedSessions.length, 1);
    assert.strictEqual(sharedSessions[0]._id.toString(), session._id.toString());
    console.log("  ✓ Team member User B successfully discovered shared session.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 3: Threaded Comment with User Mention
    // -------------------------------------------------------------
    console.log("Test 3: Adding team comment with user mention...");
    const comment1 = await collaborationService.addComment(testUserB, session._id, {
      body: "Great thesis @mvp56_user_a. Checked order book depth around ₹3500 level.",
      mentions: [testUserA],
      evidenceType: "NEUTRAL"
    });
    assert(comment1._id);
    assert.strictEqual(comment1.author.email, "mvp56b@test.com");
    assert.strictEqual(comment1.mentions.length, 1);
    assert.strictEqual(comment1.mentions[0].email, "mvp56a@test.com");
    console.log("  ✓ Comment with mention successfully created and populated.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 4: First-Class Counter-Evidence Tagging
    // -------------------------------------------------------------
    console.log("Test 4: Tagging first-class CONTRADICTS_THESIS counter-evidence...");
    const counterEvidenceComment = await collaborationService.addComment(testUserB, session._id, {
      body: "Historical backtest shows 62% failure rate for tech breakouts when USD/INR volatility is elevated.",
      evidenceType: "CONTRADICTS_THESIS",
      evidenceDetails: {
        metric: "FAILURE_RATE",
        value: "62%",
        source: "BacktestEngine"
      }
    });
    assert.strictEqual(counterEvidenceComment.evidenceType, "CONTRADICTS_THESIS");
    assert.strictEqual(counterEvidenceComment.evidenceDetails.value, "62%");
    console.log("  ✓ First-class counter-evidence tagged (CONTRADICTS_THESIS).\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 5: Supports-Thesis Evidence Tagging
    // -------------------------------------------------------------
    console.log("Test 5: Tagging SUPPORTS_THESIS evidence...");
    const supportingComment = await collaborationService.addComment(testUserA, session._id, {
      body: "Recent institutional block deliveries rose 14% week-over-week.",
      evidenceType: "SUPPORTS_THESIS",
      evidenceDetails: { metric: "DELIVERY_VOLUME_SPIKE", value: "+14%" }
    });
    assert.strictEqual(supportingComment.evidenceType, "SUPPORTS_THESIS");
    console.log("  ✓ Supporting evidence successfully tagged (SUPPORTS_THESIS).\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 6: Threaded Discussion & Comment Retrieval
    // -------------------------------------------------------------
    console.log("Test 6: Retrieving chronological discussion thread...");
    const comments = await collaborationService.getComments(testUserB, session._id);
    assert.strictEqual(comments.length, 3);
    assert(comments.some(c => c.evidenceType === "CONTRADICTS_THESIS"));
    assert(comments.some(c => c.evidenceType === "SUPPORTS_THESIS"));
    console.log(`  ✓ Retrieved ${comments.length} comments spanning neutral, supportive, and counter evidence.\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 7: Comment Thread Resolution
    // -------------------------------------------------------------
    console.log("Test 7: Resolving discussion comment thread...");
    const resolved = await collaborationService.resolveComment(testUserA, counterEvidenceComment._id);
    assert.strictEqual(resolved.resolved, true);
    assert.strictEqual(resolved.resolvedBy.toString(), testUserA.toString());
    assert(resolved.resolvedAt instanceof Date);
    console.log("  ✓ Counter-evidence discussion thread marked as resolved.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 8: Research Versioning & Change Provenance
    // -------------------------------------------------------------
    console.log("Test 8: Creating version 2 with snapshot and change summary...");
    const v2Session = await collaborationService.createSessionVersion(
      testUserA,
      session._id,
      { question: "Will TCS sustain breakout given elevated USD/INR volatility?" },
      "Updated hypothesis following counter-evidence review"
    );
    assert.strictEqual(v2Session.version, 2);
    assert.strictEqual(v2Session.versions.length, 1);
    assert.strictEqual(v2Session.versions[0].version, 1);
    assert.strictEqual(v2Session.versions[0].summary, "Updated hypothesis following counter-evidence review");

    const history = await collaborationService.getSessionVersions(testUserB, session._id);
    assert.strictEqual(history.currentVersion, 2);
    assert.strictEqual(history.history.length, 1);
    console.log(`  ✓ Version 2 successfully created with full audit provenance (Who, What, When).\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 9: Organization Tenant Isolation (External User Blocked)
    // -------------------------------------------------------------
    console.log("Test 9: Verifying tenant isolation: Unaffiliated User C blocked...");
    let caughtCComments = false;
    try {
      await collaborationService.getComments(testUserC, session._id);
    } catch (err) {
      caughtCComments = err.message.includes("ACCESS_DENIED");
    }
    assert(caughtCComments, "User C must be blocked from reading shared comments");

    let caughtCAddComment = false;
    try {
      await collaborationService.addComment(testUserC, session._id, { body: "Intruder comment" });
    } catch (err) {
      caughtCAddComment = err.message.includes("ACCESS_DENIED");
    }
    assert(caughtCAddComment, "User C must be blocked from posting comments");
    console.log("  ✓ Strict tenant isolation verified: External users rejected.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 10: Zero Financial Ledger Mutation
    // -------------------------------------------------------------
    console.log("Test 10: Verifying zero financial-ledger mutation...");
    const userACheck = await UserModel.findById(testUserA);
    const userBCheck = await UserModel.findById(testUserB);
    const holdingsACheck = await HoldingsModel.find({ user: testUserA });
    const ordersACheck = await OrdersModel.find({ user: testUserA });

    assert.strictEqual(userACheck.virtualBalance, 500000);
    assert.strictEqual(userBCheck.virtualBalance, 300000);
    assert.strictEqual(holdingsACheck.length, 0);
    assert.strictEqual(ordersACheck.length, 0);
    console.log("  ✓ Zero financial mutations: virtualBalance, Holdings, and Orders untouched.\n");
    passedTests++;

    console.log("===================================================================");
    console.log(`MVP-56 ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log("===================================================================\n");

  } catch (error) {
    console.error("MVP-56 TEST FAILED:", error);
    process.exit(1);
  } finally {
    // Cleanup
    await UserModel.deleteMany({
      email: { $in: ["mvp56a@test.com", "mvp56b@test.com", "mvp56c@test.com"] }
    });
    await OrganizationModel.deleteMany({ owner: testUserA });
    await MembershipModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC] } });
    await ResearchSessionModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC] } });
    await ResearchCommentModel.deleteMany({ author: { $in: [testUserA, testUserB, testUserC] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC] } });
    await mongoose.disconnect();
  }
}

runMVP56Tests();
