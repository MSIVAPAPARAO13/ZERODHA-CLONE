const crypto = require("crypto");
const StrategyNotebook = require("../models/StrategyNotebookModel");
const { StrategyModel } = require("../models/StrategyModel");

class StrategyNotebookService {
  /**
   * Deterministically compute an experiment result hash
   */
  computeResultHash(parametersHash, datasetRange, configuration, results) {
    const canonical = {
      parametersHash,
      datasetRange: {
        startDate: datasetRange?.startDate || "ALL",
        endDate: datasetRange?.endDate || "ALL",
        interval: datasetRange?.interval || "1day"
      },
      configuration: {
        capital: Number(configuration?.capital) || 100000,
        universe: (configuration?.universe || []).slice().sort()
      },
      results: {
        totalReturnPercent: Number(results?.totalReturnPercent || 0),
        maxDrawdownPercent: Number(results?.maxDrawdownPercent || 0),
        winRatePercent: Number(results?.winRatePercent || 0),
        profitFactor: Number(results?.profitFactor || 0),
        tradeCount: Number(results?.tradeCount || 0)
      }
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(canonical))
      .digest("hex")
      .slice(0, 16);
  }

  /**
   * Records a structured strategy research experiment
   */
  async recordExperiment(userId, payload) {
    const {
      strategyId,
      title,
      hypothesis,
      datasetRange = {},
      configuration = {},
      results = {},
      robustnessResults = {},
      observations = "",
      limitations = "",
      nextExperiment = "",
      linkedDecisionId = null,
      linkedJournalEntryId = null
    } = payload;

    if (!strategyId || !title || !hypothesis) {
      throw new Error("STRATEGY_ID_TITLE_AND_HYPOTHESIS_REQUIRED");
    }

    const strategy = await StrategyModel.findOne({ _id: strategyId, user: userId });
    if (!strategy) {
      throw new Error("STRATEGY_NOT_FOUND");
    }

    const strategyVersion = strategy.strategyVersion || strategy.version || 1;
    const parametersHash = strategy.parametersHash || "INITIAL_HASH";
    const resultHash = this.computeResultHash(parametersHash, datasetRange, configuration, results);

    const notebookEntry = await StrategyNotebook.create({
      user: userId,
      strategy: strategyId,
      strategyVersion,
      parametersHash,
      title: title.trim(),
      hypothesis: hypothesis.trim(),
      datasetRange,
      configuration,
      results,
      robustnessResults,
      resultHash,
      observations: observations.trim(),
      limitations: limitations.trim(),
      nextExperiment: nextExperiment.trim(),
      linkedDecisionId,
      linkedJournalEntryId
    });

    return notebookEntry;
  }

  /**
   * List notebook entries for user
   */
  async getNotebookEntries(userId, filter = {}) {
    const query = { user: userId };
    if (filter.strategyId) query.strategy = filter.strategyId;
    if (filter.strategyVersion) query.strategyVersion = Number(filter.strategyVersion);

    const { page = 1, limit = 20 } = filter;
    const numLimit = Number(limit);
    const skip = (Number(page) - 1) * numLimit;

    const [entries, total] = await Promise.all([
      StrategyNotebook.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numLimit)
        .populate("strategy", "name version strategyVersion")
        .lean(),
      StrategyNotebook.countDocuments(query)
    ]);

    return {
      entries,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / numLimit) || 1
    };
  }

  /**
   * Get single notebook entry
   */
  async getNotebookEntryById(userId, entryId) {
    return StrategyNotebook.findOne({ _id: entryId, user: userId })
      .populate("strategy", "name version strategyVersion parametersHash universe costs")
      .lean();
  }

  /**
   * Update notebook reflections (observations, limitations, nextExperiment)
   */
  async updateNotebookEntry(userId, entryId, updates = {}) {
    const allowed = ["title", "hypothesis", "observations", "limitations", "nextExperiment", "linkedDecisionId", "linkedJournalEntryId"];
    const safeUpdates = {};
    allowed.forEach(k => {
      if (updates[k] !== undefined) safeUpdates[k] = updates[k];
    });

    return StrategyNotebook.findOneAndUpdate(
      { _id: entryId, user: userId },
      { $set: safeUpdates },
      { new: true }
    );
  }

  /**
   * Research Copilot Bridge: Generates investigation context and prompt
   */
  async getInvestigationContext(userId, entryId) {
    const entry = await this.getNotebookEntryById(userId, entryId);
    if (!entry) throw new Error("NOTEBOOK_ENTRY_NOT_FOUND");

    return {
      entryId: entry._id,
      strategyName: entry.strategy?.name || "Strategy",
      strategyVersion: entry.strategyVersion,
      resultHash: entry.resultHash,
      investigatePrompt: `Investigate experiment '${entry.title}' (Version ${entry.strategyVersion}): Return ${entry.results.totalReturnPercent}%, Max Drawdown ${entry.results.maxDrawdownPercent}%, Robustness: ${entry.robustnessResults?.status || 'N/A'}. Hypothesis: "${entry.hypothesis}". Documented limitations: "${entry.limitations || 'None'}".`,
      evidencePayload: {
        datasetRange: entry.datasetRange,
        configuration: entry.configuration,
        results: entry.results,
        robustness: entry.robustnessResults,
        observations: entry.observations,
        limitations: entry.limitations
      },
      disclaimer: "RESEARCH_NOTEBOOK_EVIDENCE — GROUNDED HISTORICAL EXPERIMENT"
    };
  }
}

module.exports = new StrategyNotebookService();
