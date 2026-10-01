const { ResearchSessionModel } = require("../models/ResearchSessionModel");
const { ResearchCommentModel } = require("../models/ResearchCommentModel");
const { MembershipModel } = require("../models/MembershipModel");

class CollaborationService {
  /**
   * Helper: Check if user has active membership in an organization
   */
  async checkOrgMembership(userId, organizationId) {
    const membership = await MembershipModel.findOne({
      organization: organizationId,
      user: userId,
      status: "ACTIVE"
    }).lean();

    if (!membership) {
      throw new Error("ORGANIZATION_ACCESS_DENIED: User is not an active member of this organization.");
    }
    return membership;
  }

  /**
   * Helper: Check access to a research session
   */
  async checkSessionAccess(userId, sessionId) {
    const session = await ResearchSessionModel.findById(sessionId);
    if (!session) {
      throw new Error("RESEARCH_SESSION_NOT_FOUND");
    }

    // Owner always has access
    if (session.user.toString() === userId.toString()) {
      return { session, isOwner: true, isOrgMember: false };
    }

    // If shared with organization, check membership
    if (session.sharedWithOrg && session.organization) {
      const membership = await this.checkOrgMembership(userId, session.organization);
      return { session, isOwner: false, isOrgMember: true, role: membership.role };
    }

    throw new Error("SESSION_ACCESS_DENIED: Private session not accessible.");
  }

  /**
   * Share a research session with an organization
   */
  async shareSession(userId, sessionId, organizationId) {
    const session = await ResearchSessionModel.findOne({ _id: sessionId, user: userId });
    if (!session) {
      throw new Error("RESEARCH_SESSION_NOT_FOUND_OR_UNAUTHORIZED");
    }

    await this.checkOrgMembership(userId, organizationId);

    session.organization = organizationId;
    session.sharedWithOrg = true;
    await session.save();

    return session;
  }

  /**
   * Get shared research sessions for an organization
   */
  async getSharedSessions(userId, organizationId) {
    await this.checkOrgMembership(userId, organizationId);

    const sessions = await ResearchSessionModel.find({
      organization: organizationId,
      sharedWithOrg: true
    })
      .populate("user", "name email username")
      .sort({ updatedAt: -1 })
      .lean();

    return sessions;
  }

  /**
   * Add a research comment or counter-evidence
   */
  async addComment(userId, sessionId, commentData) {
    const { session } = await this.checkSessionAccess(userId, sessionId);

    const {
      body,
      evidenceType = "NEUTRAL",
      evidenceDetails = {},
      mentions = [],
      parentComment = null
    } = commentData;

    if (!body || typeof body !== "string" || body.trim().length === 0) {
      throw new Error("COMMENT_BODY_REQUIRED");
    }

    const validEvidenceTypes = ["SUPPORTS_THESIS", "CONTRADICTS_THESIS", "NEUTRAL"];
    const verifiedEvidenceType = validEvidenceTypes.includes(evidenceType) ? evidenceType : "NEUTRAL";

    const comment = await ResearchCommentModel.create({
      researchSession: session._id,
      organization: session.organization || null,
      author: userId,
      body: body.trim(),
      evidenceType: verifiedEvidenceType,
      evidenceDetails,
      mentions,
      parentComment
    });

    const populated = await ResearchCommentModel.findById(comment._id)
      .populate("author", "name email")
      .populate("mentions", "name email")
      .lean();

    return populated;
  }

  /**
   * Get comments for a research session
   */
  async getComments(userId, sessionId) {
    await this.checkSessionAccess(userId, sessionId);

    const comments = await ResearchCommentModel.find({ researchSession: sessionId })
      .populate("author", "name email username")
      .populate("mentions", "name email username")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: 1 })
      .lean();

    return comments;
  }

  /**
   * Resolve a comment thread
   */
  async resolveComment(userId, commentId) {
    const comment = await ResearchCommentModel.findById(commentId);
    if (!comment) {
      throw new Error("COMMENT_NOT_FOUND");
    }

    await this.checkSessionAccess(userId, comment.researchSession);

    comment.resolved = true;
    comment.resolvedBy = userId;
    comment.resolvedAt = new Date();
    await comment.save();

    return comment;
  }

  /**
   * Create a new version of a research session
   */
  async createSessionVersion(userId, sessionId, updates = {}, changeSummary = "Updated research session") {
    const { session } = await this.checkSessionAccess(userId, sessionId);

    // Snapshot current state
    const previousSnapshot = {
      title: session.title,
      question: session.question,
      status: session.status,
      evidenceBundle: session.evidenceBundle
    };

    session.versions.push({
      version: session.version,
      changedBy: userId,
      summary: changeSummary,
      snapshot: previousSnapshot,
      timestamp: new Date()
    });

    // Apply updates
    if (updates.title) session.title = updates.title.trim();
    if (updates.question) session.question = updates.question.trim();
    if (updates.status) session.status = updates.status;
    if (updates.evidenceBundle) session.evidenceBundle = updates.evidenceBundle;

    session.version += 1;
    await session.save();

    return session;
  }

  /**
   * Get version history for a research session
   */
  async getSessionVersions(userId, sessionId) {
    const { session } = await this.checkSessionAccess(userId, sessionId);

    const populatedSession = await ResearchSessionModel.findById(sessionId)
      .populate("versions.changedBy", "name email")
      .lean();

    return {
      currentVersion: session.version,
      history: populatedSession.versions || []
    };
  }
}

module.exports = new CollaborationService();
