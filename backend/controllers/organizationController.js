const organizationService = require("../services/organizationService");

class OrganizationController {
  async createOrganization(req, res, next) {
    try {
      const userId = req.user?.userId;
      const result = await organizationService.createOrganization(userId, req.body);
      return res.status(201).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "ORGANIZATION_NAME_REQUIRED") {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async getUserOrganizations(req, res, next) {
    try {
      const userId = req.user?.userId;
      const result = await organizationService.getUserOrganizations(userId);
      return res.status(200).json({
        success: true,
        data: { organizations: result },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrganizationById(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const result = await organizationService.getOrganizationById(userId, id);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "ORGANIZATION_ACCESS_DENIED") {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: "Access denied to organization." }
        });
      }
      if (err.message === "ORGANIZATION_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Organization not found." }
        });
      }
      next(err);
    }
  }

  async inviteMember(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const result = await organizationService.inviteMember(userId, id, req.body);
      return res.status(201).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message.startsWith("PERMISSION_DENIED")) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "User to invite was not found." }
        });
      }
      if (err.message === "USER_ALREADY_MEMBER") {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: "User is already an active member of this organization." }
        });
      }
      next(err);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id, memberId } = req.params;
      const { role } = req.body;
      const result = await organizationService.updateMemberRole(userId, id, memberId, role);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message.startsWith("PERMISSION_DENIED")) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      if (err.message === "MEMBER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Member record not found." }
        });
      }
      if (err.message === "INVALID_ROLE") {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: "Invalid role specified." }
        });
      }
      next(err);
    }
  }

  async removeMember(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id, memberId } = req.params;
      const result = await organizationService.removeMember(userId, id, memberId);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message.startsWith("PERMISSION_DENIED") || err.message === "ORGANIZATION_ACCESS_DENIED") {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      if (err.message.startsWith("OWNER_CANNOT_BE_REMOVED")) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      if (err.message === "MEMBER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Member record not found." }
        });
      }
      next(err);
    }
  }
}

module.exports = new OrganizationController();
