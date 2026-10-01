const { OrganizationModel } = require("../models/OrganizationModel");
const { MembershipModel } = require("../models/MembershipModel");
const { UserModel } = require("../models/UserModel");

class OrganizationService {
  /**
   * Helper to generate slug from name
   */
  generateSlug(name) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `${base}-${Date.now().toString(36)}`;
  }

  /**
   * Create an organization
   */
  async createOrganization(userId, data) {
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
      throw new Error("ORGANIZATION_NAME_REQUIRED");
    }

    const name = data.name.trim();
    const slug = this.generateSlug(name);

    const org = await OrganizationModel.create({
      name,
      slug,
      owner: userId,
      description: data.description || ""
    });

    await MembershipModel.create({
      organization: org._id,
      user: userId,
      role: "OWNER",
      status: "ACTIVE"
    });

    return org;
  }

  /**
   * List organizations for a user
   */
  async getUserOrganizations(userId) {
    const memberships = await MembershipModel.find({ user: userId, status: "ACTIVE" })
      .populate("organization")
      .lean();

    return memberships.map(m => ({
      organization: m.organization,
      role: m.role,
      joinedAt: m.createdAt
    }));
  }

  /**
   * Get organization details and member roster
   */
  async getOrganizationById(userId, orgId) {
    const membership = await MembershipModel.findOne({
      organization: orgId,
      user: userId,
      status: "ACTIVE"
    }).lean();

    if (!membership) {
      throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const [org, members] = await Promise.all([
      OrganizationModel.findById(orgId).lean(),
      MembershipModel.find({ organization: orgId, status: "ACTIVE" })
        .populate("user", "name email username")
        .lean()
    ]);

    if (!org) {
      throw new Error("ORGANIZATION_NOT_FOUND");
    }

    return {
      organization: org,
      currentUserRole: membership.role,
      members: members.map(m => ({
        memberId: m._id,
        user: m.user,
        role: m.role,
        joinedAt: m.createdAt
      }))
    };
  }

  /**
   * Invite / Add member to organization
   */
  async inviteMember(userId, orgId, inviteData) {
    const callerMembership = await MembershipModel.findOne({
      organization: orgId,
      user: userId,
      status: "ACTIVE"
    });

    if (!callerMembership || (callerMembership.role !== "OWNER" && callerMembership.role !== "ADMIN")) {
      throw new Error("PERMISSION_DENIED: Only OWNER or ADMIN can invite members.");
    }

    const { email, role = "RESEARCHER" } = inviteData;
    if (!email) {
      throw new Error("INVITE_EMAIL_REQUIRED");
    }

    const targetUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      throw new Error("USER_NOT_FOUND");
    }

    const existingMember = await MembershipModel.findOne({
      organization: orgId,
      user: targetUser._id
    });

    if (existingMember) {
      throw new Error("USER_ALREADY_MEMBER");
    }

    const assignedRole = ["OWNER", "ADMIN", "RESEARCHER", "VIEWER"].includes(role) ? role : "RESEARCHER";
    if (assignedRole === "OWNER" && callerMembership.role !== "OWNER") {
      throw new Error("PERMISSION_DENIED: Only OWNER can assign OWNER role.");
    }

    const newMembership = await MembershipModel.create({
      organization: orgId,
      user: targetUser._id,
      role: assignedRole,
      invitedBy: userId,
      status: "ACTIVE"
    });

    return {
      membershipId: newMembership._id,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email
      },
      role: newMembership.role,
      status: newMembership.status
    };
  }

  /**
   * Update member role
   */
  async updateMemberRole(userId, orgId, memberId, newRole) {
    const callerMembership = await MembershipModel.findOne({
      organization: orgId,
      user: userId,
      status: "ACTIVE"
    });

    if (!callerMembership || (callerMembership.role !== "OWNER" && callerMembership.role !== "ADMIN")) {
      throw new Error("PERMISSION_DENIED: Only OWNER or ADMIN can update roles.");
    }

    const targetMembership = await MembershipModel.findOne({
      _id: memberId,
      organization: orgId
    });

    if (!targetMembership) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    if (targetMembership.role === "OWNER" && callerMembership.role !== "OWNER") {
      throw new Error("PERMISSION_DENIED: Cannot change role of OWNER.");
    }

    if (!["OWNER", "ADMIN", "RESEARCHER", "VIEWER"].includes(newRole)) {
      throw new Error("INVALID_ROLE");
    }

    targetMembership.role = newRole;
    await targetMembership.save();

    return targetMembership;
  }

  /**
   * Remove member or leave organization
   */
  async removeMember(userId, orgId, memberId) {
    const callerMembership = await MembershipModel.findOne({
      organization: orgId,
      user: userId,
      status: "ACTIVE"
    });

    if (!callerMembership) {
      throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const targetMembership = await MembershipModel.findOne({
      _id: memberId,
      organization: orgId
    });

    if (!targetMembership) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    const isSelf = targetMembership.user.toString() === userId.toString();
    const isAuthorized = callerMembership.role === "OWNER" || callerMembership.role === "ADMIN" || isSelf;

    if (!isAuthorized) {
      throw new Error("PERMISSION_DENIED: Cannot remove this member.");
    }

    if (targetMembership.role === "OWNER") {
      throw new Error("OWNER_CANNOT_BE_REMOVED: Transfer ownership first.");
    }

    await MembershipModel.deleteOne({ _id: memberId });
    return { success: true, removed: true };
  }
}

module.exports = new OrganizationService();
