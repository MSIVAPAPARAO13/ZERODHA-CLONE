const Automation = require("../models/AutomationModel");
const portfolioIntelligenceService = require("./portfolioIntelligenceService");
const marketNarrativeService = require("./marketNarrativeService");
const journalIntelligenceService = require("./journalIntelligenceService");
const strategyNotebookService = require("./strategyNotebookService");
const decisionJournalService = require("./decisionJournalService");
const marketEventService = require("./marketEventService");

class AutomationService {
  /**
   * Create a new research automation task
   */
  async createAutomation(userId, data) {
    const { name, type, schedule = "DAILY_8AM", configuration = {} } = data;

    if (!name || !type) {
      throw new Error("NAME_AND_TYPE_REQUIRED");
    }

    const validTypes = [
      "DAILY_BRIEF",
      "PORTFOLIO_REVIEW",
      "RESEARCH_REVIEW",
      "STRATEGY_REVIEW",
      "JOURNAL_REVIEW",
      "EVENT_DIGEST"
    ];

    if (!validTypes.includes(type)) {
      throw new Error(`INVALID_AUTOMATION_TYPE: ${type}`);
    }

    const automation = await Automation.create({
      user: userId,
      name: name.trim(),
      type,
      schedule,
      configuration,
      enabled: true,
      lastStatus: "PENDING"
    });

    return automation;
  }

  /**
   * List automations for user
   */
  async listAutomations(userId) {
    return Automation.find({ user: userId }).sort({ createdAt: -1 }).lean();
  }

  /**
   * Get single automation by ID
   */
  async getAutomationById(userId, automationId) {
    return Automation.findOne({ _id: automationId, user: userId }).lean();
  }

  /**
   * Update automation
   */
  async updateAutomation(userId, automationId, updates = {}) {
    const allowed = ["name", "schedule", "enabled", "configuration"];
    const safeUpdates = {};
    allowed.forEach(k => {
      if (updates[k] !== undefined) safeUpdates[k] = updates[k];
    });

    return Automation.findOneAndUpdate(
      { _id: automationId, user: userId },
      { $set: safeUpdates },
      { new: true }
    );
  }

  /**
   * Delete automation
   */
  async deleteAutomation(userId, automationId) {
    return Automation.findOneAndDelete({ _id: automationId, user: userId });
  }

  /**
   * Execute an automation workflow immediately
   * Strictly read-only research: NO order creation or balance mutation
   */
  async runAutomation(userId, automationId) {
    const automation = await Automation.findOne({ _id: automationId, user: userId });
    if (!automation) {
      throw new Error("AUTOMATION_NOT_FOUND");
    }

    automation.lastStatus = "RUNNING";
    await automation.save();

    let result = null;

    try {
      switch (automation.type) {
        case "PORTFOLIO_REVIEW": {
          result = await portfolioIntelligenceService.getPortfolioIntelligence(userId);
          break;
        }
        case "DAILY_BRIEF": {
          result = await marketNarrativeService.generateMarketNarrative(userId, automation.configuration);
          break;
        }
        case "JOURNAL_REVIEW": {
          result = await journalIntelligenceService.detectJournalPatterns(userId);
          break;
        }
        case "STRATEGY_REVIEW": {
          result = await strategyNotebookService.getNotebookEntries(userId, automation.configuration);
          break;
        }
        case "RESEARCH_REVIEW": {
          result = await decisionJournalService.getDecisions(userId, automation.configuration);
          break;
        }
        case "EVENT_DIGEST": {
          const events = await marketEventService.getRecentEvents(userId, 10);
          result = { count: events.length, events };
          break;
        }
        default:
          throw new Error(`UNSUPPORTED_TYPE: ${automation.type}`);
      }

      automation.lastRunAt = new Date();
      automation.lastStatus = "SUCCESS";
      automation.lastRunResult = {
        executedAt: new Date(),
        summary: `Successfully executed ${automation.type} automation.`,
        dataAvailable: result !== null
      };
      automation.executionCount += 1;
      await automation.save();

      return {
        automationId: automation._id,
        name: automation.name,
        type: automation.type,
        status: "SUCCESS",
        result
      };
    } catch (err) {
      automation.lastRunAt = new Date();
      automation.lastStatus = "FAILED";
      automation.lastRunResult = { error: err.message };
      await automation.save();
      throw err;
    }
  }
}

module.exports = new AutomationService();
