const { ResearchWorkflowModel } = require("../models/ResearchWorkflowModel");
const researchAgentService = require("./researchAgentService");

const ALLOWED_TOOLS = [
  "getQuote",
  "getHistoricalData",
  "runScanner",
  "getMarketEvents",
  "getPortfolio",
  "runScenario",
  "runBacktest",
  "runRobustness",
  "getJournal",
  "getDecision",
  "getResearchSession"
];

class ResearchWorkflowService {
  /**
   * Validate steps against allowlisted tool registry
   */
  validateSteps(steps) {
    if (!Array.isArray(steps)) {
      throw new Error("STEPS_MUST_BE_ARRAY");
    }

    steps.forEach((step, idx) => {
      if (!step.toolName || !ALLOWED_TOOLS.includes(step.toolName)) {
        throw new Error(`INVALID_STEP_TOOL: '${step.toolName}' is not in the allowlisted tool registry.`);
      }
      if (!step.stepId) {
        step.stepId = `step_${idx + 1}_${step.toolName}`;
      }
      if (typeof step.order !== "number") {
        step.order = idx;
      }
    });

    // Sort steps in order
    steps.sort((a, b) => a.order - b.order);
    return steps;
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(userId, data) {
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
      throw new Error("WORKFLOW_NAME_REQUIRED");
    }

    const steps = this.validateSteps(data.steps || []);

    const workflow = await ResearchWorkflowModel.create({
      user: userId,
      name: data.name.trim(),
      description: data.description || "",
      steps,
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
      version: 1
    });

    return workflow;
  }

  /**
   * Get all workflows for a user
   */
  async getWorkflows(userId) {
    return await ResearchWorkflowModel.find({ user: userId }).sort({ updatedAt: -1 }).lean();
  }

  /**
   * Get a single workflow by ID
   */
  async getWorkflowById(userId, workflowId) {
    const workflow = await ResearchWorkflowModel.findOne({ _id: workflowId, user: userId }).lean();
    if (!workflow) {
      throw new Error("WORKFLOW_NOT_FOUND");
    }
    return workflow;
  }

  /**
   * Update workflow
   */
  async updateWorkflow(userId, workflowId, updates) {
    const existing = await ResearchWorkflowModel.findOne({ _id: workflowId, user: userId });
    if (!existing) {
      throw new Error("WORKFLOW_NOT_FOUND");
    }

    if (updates.name) existing.name = updates.name.trim();
    if (updates.description !== undefined) existing.description = updates.description.trim();
    if (updates.enabled !== undefined) existing.enabled = Boolean(updates.enabled);
    if (updates.steps) {
      existing.steps = this.validateSteps(updates.steps);
      existing.version += 1;
    }

    await existing.save();
    return existing;
  }

  /**
   * Duplicate workflow
   */
  async duplicateWorkflow(userId, workflowId) {
    const existing = await this.getWorkflowById(userId, workflowId);
    const cloned = await ResearchWorkflowModel.create({
      user: userId,
      name: `${existing.name} (Copy)`,
      description: existing.description,
      steps: existing.steps,
      version: 1,
      enabled: true
    });
    return cloned;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(userId, workflowId) {
    const result = await ResearchWorkflowModel.deleteOne({ _id: workflowId, user: userId });
    if (result.deletedCount === 0) {
      throw new Error("WORKFLOW_NOT_FOUND");
    }
    return { success: true, deleted: true };
  }

  /**
   * Run workflow sequentially
   */
  async runWorkflow(userId, workflowId, overrides = {}) {
    const workflow = await ResearchWorkflowModel.findOne({ _id: workflowId, user: userId });
    if (!workflow) {
      throw new Error("WORKFLOW_NOT_FOUND");
    }

    const stepsToRun = (workflow.steps || [])
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order);

    const stepResults = [];
    let hasFailure = false;
    const startTime = Date.now();

    for (let i = 0; i < stepsToRun.length; i++) {
      const step = stepsToRun[i];
      const mergedParams = {
        ...(step.params || {}),
        ...(overrides.params || {})
      };

      const stepStart = Date.now();
      try {
        const execution = await researchAgentService.executeTool(userId, step.toolName, mergedParams);
        stepResults.push({
          stepId: step.stepId,
          toolName: step.toolName,
          order: step.order,
          durationMs: Date.now() - stepStart,
          success: execution.success,
          data: execution.data || null,
          error: execution.error || null
        });

        if (!execution.success) {
          hasFailure = true;
        }
      } catch (err) {
        hasFailure = true;
        stepResults.push({
          stepId: step.stepId,
          toolName: step.toolName,
          order: step.order,
          durationMs: Date.now() - stepStart,
          success: false,
          data: null,
          error: err.message
        });
      }
    }

    const finalStatus = stepsToRun.length === 0 ? "SUCCESS" : (hasFailure ? (stepResults.some(s => s.success) ? "PARTIAL" : "FAILED") : "SUCCESS");

    workflow.lastRunAt = new Date();
    workflow.lastRunStatus = finalStatus;
    await workflow.save();

    return {
      workflowId: workflow._id,
      workflowName: workflow.name,
      version: workflow.version,
      status: finalStatus,
      totalDurationMs: Date.now() - startTime,
      executedStepsCount: stepResults.length,
      stepResults,
      disclaimer: "RESEARCH_WORKFLOW_PIPELINE — BOUNDED EXPERIMENTAL RESULTS, NOT REAL FINANCIAL EXECUTION"
    };
  }
}

module.exports = new ResearchWorkflowService();
