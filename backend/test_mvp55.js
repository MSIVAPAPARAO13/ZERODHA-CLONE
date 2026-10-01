const mongoose = require("mongoose");
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { OrdersModel } = require("./models/OrdersModel");
const { OrganizationModel } = require("./models/OrganizationModel");
const { MembershipModel } = require("./models/MembershipModel");
const organizationService = require("./services/organizationService");
const portfolioIntelligenceService = require("./services/portfolioIntelligenceService");

async function runMVP55Tests() {
  console.log("===================================================================");
  console.log("--- STARTING MVP-55 TEAM / ORGANIZATION WORKSPACE TEST SUITE ---");
  console.log("===================================================================\n");

  const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/tradeflow";
  await mongoose.connect(MONGO_URI);

  const testUserA = new mongoose.Types.ObjectId();
  const testUserB = new mongoose.Types.ObjectId();
  const testUserC = new mongoose.Types.ObjectId();
  const testUserD = new mongoose.Types.ObjectId();

  let passedTests = 0;
  let totalTests = 10;

  try {
    // Cleanup prior run data
    await UserModel.deleteMany({
      email: { $in: ["mvp55a@test.com", "mvp55b@test.com", "mvp55c@test.com", "mvp55d@test.com"] }
    });
    await OrganizationModel.deleteMany({ owner: testUserA });
    await MembershipModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC, testUserD] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC, testUserD] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC, testUserD] } });

    // Seed mock users
    await UserModel.create({
      _id: testUserA,
      name: "MVP55 Founder A",
      username: "mvp55_user_a",
      email: "mvp55a@test.com",
      password: "hashedpassword",
      virtualBalance: 1000000
    });

    await UserModel.create({
      _id: testUserB,
      name: "MVP55 Researcher B",
      username: "mvp55_user_b",
      email: "mvp55b@test.com",
      password: "hashedpassword",
      virtualBalance: 250000
    });

    await UserModel.create({
      _id: testUserC,
      name: "MVP55 Analyst C",
      username: "mvp55_user_c",
      email: "mvp55c@test.com",
      password: "hashedpassword",
      virtualBalance: 150000
    });

    await UserModel.create({
      _id: testUserD,
      name: "MVP55 Outsider D",
      username: "mvp55_user_d",
      email: "mvp55d@test.com",
      password: "hashedpassword",
      virtualBalance: 50000
    });

    // Seed private portfolio for User A
    await HoldingsModel.create([
      { user: testUserA, name: "TCS", qty: 50, avg: 3400, price: 3500, net: "+2.94%", day: "+0.5%" }
    ]);

    // -------------------------------------------------------------
    // TEST 1: Organization Creation & Automatic OWNER Role
    // -------------------------------------------------------------
    console.log("Test 1: Creating organization with initial OWNER membership...");
    const org = await organizationService.createOrganization(testUserA, {
      name: "Alpha Quant Capital",
      description: "Proprietary research and systematic strategy collaboration."
    });

    assert(org._id, "Organization must have _id");
    assert.strictEqual(org.name, "Alpha Quant Capital");
    assert(org.slug.startsWith("alpha-quant-capital-"), "Slug must be generated");

    const ownerMembership = await MembershipModel.findOne({ organization: org._id, user: testUserA });
    assert(ownerMembership, "Owner membership must exist");
    assert.strictEqual(ownerMembership.role, "OWNER");
    console.log(`  ✓ Organization '${org.name}' created with slug '${org.slug}' and OWNER role.\n`);
    passedTests++;

    // -------------------------------------------------------------
    // TEST 2: List User Organizations
    // -------------------------------------------------------------
    console.log("Test 2: Listing organizations for user...");
    const userAOrgs = await organizationService.getUserOrganizations(testUserA);
    assert.strictEqual(userAOrgs.length, 1);
    assert.strictEqual(userAOrgs[0].role, "OWNER");
    assert.strictEqual(userAOrgs[0].organization.name, "Alpha Quant Capital");
    console.log("  ✓ Organizations listed accurately with user role.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 3: Invite Member by Owner
    // -------------------------------------------------------------
    console.log("Test 3: Inviting member as RESEARCHER by OWNER...");
    const inviteB = await organizationService.inviteMember(testUserA, org._id, {
      email: "mvp55b@test.com",
      role: "RESEARCHER"
    });
    assert.strictEqual(inviteB.role, "RESEARCHER");
    assert.strictEqual(inviteB.user.email, "mvp55b@test.com");
    console.log("  ✓ User B successfully invited with RESEARCHER role.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 4: RBAC Rejection (RESEARCHER cannot invite)
    // -------------------------------------------------------------
    console.log("Test 4: Verifying RBAC: RESEARCHER cannot invite new members...");
    let caughtNonAdminInvite = false;
    try {
      await organizationService.inviteMember(testUserB, org._id, {
        email: "mvp55c@test.com",
        role: "VIEWER"
      });
    } catch (err) {
      caughtNonAdminInvite = err.message.includes("PERMISSION_DENIED");
    }
    assert(caughtNonAdminInvite, "RESEARCHER must not be permitted to invite members");
    console.log("  ✓ RBAC enforced: Non-admin invitation successfully blocked.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 5: Role Promotion by Owner
    // -------------------------------------------------------------
    console.log("Test 5: Promoting RESEARCHER to ADMIN by OWNER...");
    const updatedB = await organizationService.updateMemberRole(testUserA, org._id, inviteB.membershipId, "ADMIN");
    assert.strictEqual(updatedB.role, "ADMIN");
    console.log("  ✓ User B promoted to ADMIN.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 6: Admin Member Invitation
    // -------------------------------------------------------------
    console.log("Test 6: Inviting new member as VIEWER by newly promoted ADMIN...");
    const inviteC = await organizationService.inviteMember(testUserB, org._id, {
      email: "mvp55c@test.com",
      role: "VIEWER"
    });
    assert.strictEqual(inviteC.role, "VIEWER");
    assert.strictEqual(inviteC.user.email, "mvp55c@test.com");
    console.log("  ✓ ADMIN authorized to invite new member.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 7: Protecting OWNER from Demotion / Removal by Admin
    // -------------------------------------------------------------
    console.log("Test 7: Verifying OWNER protection from modification by ADMIN...");
    let caughtDemoteOwner = false;
    try {
      await organizationService.updateMemberRole(testUserB, org._id, ownerMembership._id, "RESEARCHER");
    } catch (err) {
      caughtDemoteOwner = err.message.includes("PERMISSION_DENIED");
    }
    assert(caughtDemoteOwner, "ADMIN must not be able to demote OWNER");

    let caughtRemoveOwner = false;
    try {
      await organizationService.removeMember(testUserB, org._id, ownerMembership._id);
    } catch (err) {
      caughtRemoveOwner = err.message.includes("OWNER_CANNOT_BE_REMOVED");
    }
    assert(caughtRemoveOwner, "ADMIN must not be able to remove OWNER");
    console.log("  ✓ OWNER immutability strictly enforced against administrative actions.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 8: Organization Isolation for Non-Members
    // -------------------------------------------------------------
    console.log("Test 8: Verifying complete access denial for unaffiliated outsider...");
    let caughtOutsider = false;
    try {
      await organizationService.getOrganizationById(testUserD, org._id);
    } catch (err) {
      caughtOutsider = err.message === "ORGANIZATION_ACCESS_DENIED";
    }
    assert(caughtOutsider, "Unaffiliated User D must be rejected with ORGANIZATION_ACCESS_DENIED");
    console.log("  ✓ Outsiders blocked from organization roster and metadata.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 9: Private Portfolio Data Protection
    // -------------------------------------------------------------
    console.log("Test 9: Verifying private portfolio data isolation across organization members...");
    // Member B queries their own portfolio
    const bPortfolio = await portfolioIntelligenceService.getPortfolioIntelligence(testUserB);
    // B has 0 holdings and 250000 balance
    assert.strictEqual(bPortfolio.holdings.length, 0, "Member B must not see User A's holdings");
    assert.strictEqual(bPortfolio.totalCapital, 250000, "Member B must see only their own capital");

    const aUser = await UserModel.findById(testUserA);
    assert.strictEqual(aUser.virtualBalance, 1000000, "User A balance remains 1,000,000");
    console.log("  ✓ Private portfolio and virtualBalance completely isolated from organization members.\n");
    passedTests++;

    // -------------------------------------------------------------
    // TEST 10: Member Removal & Financial Safety
    // -------------------------------------------------------------
    console.log("Test 10: Testing member removal & zero financial mutation...");
    const removeRes = await organizationService.removeMember(testUserA, org._id, inviteC.membershipId);
    assert.strictEqual(removeRes.removed, true);

    const postOrg = await organizationService.getOrganizationById(testUserA, org._id);
    assert.strictEqual(postOrg.members.length, 2, "Only 2 members remain after removal of User C");

    const aCheck = await UserModel.findById(testUserA);
    const bCheck = await UserModel.findById(testUserB);
    assert.strictEqual(aCheck.virtualBalance, 1000000);
    assert.strictEqual(bCheck.virtualBalance, 250000);
    console.log("  ✓ Member cleanly removed; zero financial ledger mutations.\n");
    passedTests++;

    console.log("===================================================================");
    console.log(`MVP-55 ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log("===================================================================\n");

  } catch (error) {
    console.error("MVP-55 TEST FAILED:", error);
    process.exit(1);
  } finally {
    // Cleanup
    await UserModel.deleteMany({
      email: { $in: ["mvp55a@test.com", "mvp55b@test.com", "mvp55c@test.com", "mvp55d@test.com"] }
    });
    await OrganizationModel.deleteMany({ owner: testUserA });
    await MembershipModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC, testUserD] } });
    await HoldingsModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC, testUserD] } });
    await OrdersModel.deleteMany({ user: { $in: [testUserA, testUserB, testUserC, testUserD] } });
    await mongoose.disconnect();
  }
}

runMVP55Tests();
