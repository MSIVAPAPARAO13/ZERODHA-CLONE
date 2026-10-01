const DecisionJournal = require("../models/DecisionJournalModel");

class DecisionJournalService {
  async createDecision(userId, data) {
    const {
      title,
      symbol,
      decisionType,
      thesis,
      evidenceReferences = [],
      scenarioReferences = [],
      expectedOutcome = "",
      riskFactors = [],
      invalidatingConditions = [],
      reviewDate = null
    } = data;

    if (!title || !symbol || !decisionType || !thesis) {
      throw new Error("TITLE_SYMBOL_TYPE_THESIS_REQUIRED");
    }

    const initialTimeline = [
      {
        date: new Date(),
        eventType: "DECISION_RECORDED",
        description: `Decision recorded: ${decisionType} on ${symbol.toUpperCase()} - "${title}".`
      }
    ];

    if (evidenceReferences.length > 0) {
      initialTimeline.push({
        date: new Date(),
        eventType: "RESEARCH_STARTED",
        description: `Linked ${evidenceReferences.length} analytical evidence references.`
      });
    }

    if (scenarioReferences.length > 0) {
      initialTimeline.push({
        date: new Date(),
        eventType: "SCENARIO_TESTED",
        description: `Linked stress scenario impact (${scenarioReferences[0].name || "Custom"}: ${scenarioReferences[0].modeledImpact}%).`
      });
    }

    const decision = new DecisionJournal({
      user: userId,
      title: title.trim(),
      symbol: symbol.toUpperCase().trim(),
      decisionType,
      thesis: thesis.trim(),
      evidenceReferences,
      scenarioReferences,
      expectedOutcome: expectedOutcome.trim(),
      riskFactors,
      invalidatingConditions,
      reviewDate: reviewDate ? new Date(reviewDate) : null,
      timeline: initialTimeline
    });

    return decision.save();
  }

  async getDecisions(userId, query = {}) {
    const { symbol, decisionType, status, page = 1, limit = 20 } = query;
    const filter = { user: userId };

    if (symbol) filter.symbol = symbol.toUpperCase().trim();
    if (decisionType) filter.decisionType = decisionType;
    if (status) filter.status = status;

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const numLimit = Math.min(100, Math.max(1, Number(limit)));

    const [decisions, total] = await Promise.all([
      DecisionJournal.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numLimit)
        .lean(),
      DecisionJournal.countDocuments(filter)
    ]);

    return {
      decisions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / numLimit) || 1
    };
  }

  async getDecisionById(userId, decisionId) {
    return DecisionJournal.findOne({ _id: decisionId, user: userId }).lean();
  }

  async updateDecision(userId, decisionId, updates = {}) {
    const allowed = [
      "title",
      "thesis",
      "expectedOutcome",
      "riskFactors",
      "invalidatingConditions",
      "status",
      "reviewDate",
      "reviewNotes"
    ];

    const safeUpdate = {};
    allowed.forEach(field => {
      if (updates[field] !== undefined) safeUpdate[field] = updates[field];
    });

    let decision = await DecisionJournal.findOneAndUpdate(
      { _id: decisionId, user: userId },
      { $set: safeUpdate },
      { new: true }
    );

    if (updates.status === "REVIEWED" && decision) {
      decision = await this.addTimelineEvent(userId, decisionId, {
        eventType: "DECISION_REVIEWED",
        description: `Decision marked as REVIEWED. Notes: ${updates.reviewNotes || "Review concluded."}`
      });
    }

    return decision;
  }

  async addTimelineEvent(userId, decisionId, eventData) {
    const { eventType, description, referenceId = null } = eventData;
    if (!eventType || !description) throw new Error("EVENT_TYPE_AND_DESCRIPTION_REQUIRED");

    return DecisionJournal.findOneAndUpdate(
      { _id: decisionId, user: userId },
      {
        $push: {
          timeline: {
            date: new Date(),
            eventType,
            description,
            referenceId
          }
        }
      },
      { new: true }
    );
  }

  async deleteDecision(userId, decisionId) {
    return DecisionJournal.findOneAndDelete({ _id: decisionId, user: userId });
  }
}

module.exports = new DecisionJournalService();
