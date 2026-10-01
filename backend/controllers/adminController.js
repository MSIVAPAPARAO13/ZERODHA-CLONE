const adminService = require("../services/adminService");

class AdminController {
  async getOverview(req, res, next) {
    try {
      const overview = await adminService.getOverview();
      return res.status(200).json({
        success: true,
        data: overview,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await adminService.getUsers(page, limit);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrganizations(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await adminService.getOrganizations(page, limit);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getProviders(req, res, next) {
    try {
      const result = await adminService.getProviderHealth();
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getSystemEvents(req, res, next) {
    try {
      const result = await adminService.getSystemEvents(req.query);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
