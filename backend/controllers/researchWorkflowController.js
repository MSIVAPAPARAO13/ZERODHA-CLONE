const researchWorkflowService = require("../services/researchWorkflowService");

class ResearchWorkflowController {
  async createWorkflow(req, res, next) {
    try {
      const userId = req.user?.userId;
      const result = await researchWorkflowService.createWorkflow(userId, req.body);
      return res.status(201).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "WORKFLOW_NAME_REQUIRED" || err.message.startsWith("INVALID_STEP_TOOL") || err.message === "STEPS_MUST_BE_ARRAY") {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async getWorkflows(req, res, next) {
    try {
      const userId = req.user?.userId;
      const result = await researchWorkflowService.getWorkflows(userId);
      return res.status(200).json({
        success: true,
        data: { workflows: result },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getWorkflowById(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const result = await researchWorkflowService.getWorkflowById(userId, id);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "WORKFLOW_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Workflow not found" }
        });
      }
      next(err);
    }
  }

  async updateWorkflow(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const result = await researchWorkflowService.updateWorkflow(userId, id, req.body);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "WORKFLOW_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Workflow not found" }
        });
      }
      if (err.message.startsWith("INVALID_STEP_TOOL") || err.message === "STEPS_MUST_BE_ARRAY") {
        return res.status(400).json({
          success: false,
          data: null,
          error: { message: err.message }
        });
      }
      next(err);
    }
  }

  async duplicateWorkflow(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const result = await researchWorkflowService.duplicateWorkflow(userId, id);
      return res.status(201).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "WORKFLOW_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Workflow not found" }
        });
      }
      next(err);
    }
  }

  async deleteWorkflow(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const result = await researchWorkflowService.deleteWorkflow(userId, id);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "WORKFLOW_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Workflow not found" }
        });
      }
      next(err);
    }
  }

  async runWorkflow(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const result = await researchWorkflowService.runWorkflow(userId, id, req.body);
      return res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      if (err.message === "WORKFLOW_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: "Workflow not found" }
        });
      }
      next(err);
    }
  }
}

module.exports = new ResearchWorkflowController();
