const LearningProfile = require("../models/LearningProfileModel");
const MarketEvent = require("../models/MarketEventModel");
const { ScenarioModel } = require("../models/ScenarioModel");
const { StrategyModel } = require("../models/StrategyModel");
const StrategyNotebook = require("../models/StrategyNotebookModel");
const DecisionJournal = require("../models/DecisionJournalModel");
const { TradeJournalModel } = require("../models/TradeJournalModel");
const { HoldingsModel } = require("../models/HoldingsModel");
const portfolioIntelligenceService = require("./portfolioIntelligenceService");
const journalIntelligenceService = require("./journalIntelligenceService");

class LearningCoachService {
  /**
   * Generates or refreshes the user's personal learning profile
   */
  async getLearningProfile(userId) {
    // 1. Gather counts and user records across all TradeFlow modules
    const [
      eventCount,
      scenarioCount,
      strategyCount,
      notebookCount,
      decisionCount,
      journals,
      holdings
    ] = await Promise.all([
      MarketEvent.countDocuments({ user: userId }),
      ScenarioModel ? ScenarioModel.countDocuments({ user: userId }) : 0,
      StrategyModel.countDocuments({ user: userId }),
      StrategyNotebook.countDocuments({ user: userId }),
      DecisionJournal.countDocuments({ user: userId }),
      TradeJournalModel.find({ user: userId }).lean(),
      HoldingsModel.find({ user: userId }).lean()
    ]);

    const totalTrades = journals.length;
    const reviewedTrades = journals.filter(j => j.result?.status === "CLOSED" || j.lesson).length;
    const unreviewedTrades = journals.filter(j => j.result?.status === "CLOSED" && !j.lesson).length;

    const researchActivity = {
      totalResearchSessions: Math.max(decisionCount, notebookCount),
      totalMarketEventsViewed: eventCount,
      totalScenariosSimulated: scenarioCount,
      totalStrategyExperiments: strategyCount + notebookCount,
      totalDecisionsRecorded: decisionCount,
      totalJournalsReviewed: reviewedTrades
    };

    // 2. Evaluate Knowledge Gaps across 6 core research dimensions
    const knowledgeGaps = [];

    // Dimension 1: Technical Evidence
    if (strategyCount >= 3 || notebookCount >= 2) {
      knowledgeGaps.push({
        dimension: "Technical Evidence",
        status: "STRONG",
        evidence: `${strategyCount} strategies and ${notebookCount} technical notebook experiments conducted.`
      });
    } else if (strategyCount >= 1) {
      knowledgeGaps.push({
        dimension: "Technical Evidence",
        status: "MODERATE",
        evidence: `${strategyCount} technical strategy formulated.`
      });
    } else {
      knowledgeGaps.push({
        dimension: "Technical Evidence",
        status: "NOT_STARTED",
        evidence: "Zero technical strategy experiments saved in Strategy Lab."
      });
    }

    // Dimension 2: Backtesting & Robustness
    if (notebookCount >= 2) {
      knowledgeGaps.push({
        dimension: "Backtesting & Robustness",
        status: "STRONG",
        evidence: `${notebookCount} versioned backtests and robustness stress tests logged.`
      });
    } else if (strategyCount >= 1) {
      knowledgeGaps.push({
        dimension: "Backtesting & Robustness",
        status: "MODERATE",
        evidence: `${strategyCount} strategy created with preliminary backtest baseline.`
      });
    } else {
      knowledgeGaps.push({
        dimension: "Backtesting & Robustness",
        status: "NOT_STARTED",
        evidence: "No formal backtesting experiments recorded."
      });
    }

    // Dimension 3: Scenario Analysis
    if (scenarioCount >= 3) {
      knowledgeGaps.push({
        dimension: "Scenario & Stress Analysis",
        status: "STRONG",
        evidence: `${scenarioCount} macro, sector, or symbol shock scenarios tested.`
      });
    } else if (scenarioCount >= 1) {
      knowledgeGaps.push({
        dimension: "Scenario & Stress Analysis",
        status: "MODERATE",
        evidence: `${scenarioCount} portfolio stress test simulated.`
      });
    } else {
      knowledgeGaps.push({
        dimension: "Scenario & Stress Analysis",
        status: "LIMITED",
        evidence: "No custom portfolio scenario stress tests executed."
      });
    }

    // Dimension 4: Fundamental Analysis
    knowledgeGaps.push({
      dimension: "Fundamental Analysis",
      status: "UNAVAILABLE",
      evidence: "Fundamental valuation & financial filings tier is not currently ingested in price-volume feed."
    });

    // Dimension 5: Portfolio Concentration Analysis
    if (holdings.length > 0) {
      knowledgeGaps.push({
        dimension: "Portfolio Concentration Analysis",
        status: "MODERATE",
        evidence: `Portfolio contains ${holdings.length} active assets mapped to verified exchange taxonomy.`
      });
    } else {
      knowledgeGaps.push({
        dimension: "Portfolio Concentration Analysis",
        status: "LIMITED",
        evidence: "Portfolio contains 0 active holdings; concentration analysis is data-limited."
      });
    }

    // Dimension 6: Evidence Documentation
    const documentedTrades = journals.filter(j => j.thesis && j.evidence && j.evidence.length > 0).length;
    if (totalTrades > 0 && (documentedTrades / totalTrades) >= 0.7) {
      knowledgeGaps.push({
        dimension: "Evidence Documentation",
        status: "STRONG",
        evidence: `${documentedTrades} of ${totalTrades} trades include structured thesis and evidence citations.`
      });
    } else if (totalTrades > 0 && (documentedTrades / totalTrades) >= 0.3) {
      knowledgeGaps.push({
        dimension: "Evidence Documentation",
        status: "MODERATE",
        evidence: `${documentedTrades} of ${totalTrades} trades documented with evidence citations.`
      });
    } else {
      knowledgeGaps.push({
        dimension: "Evidence Documentation",
        status: "LIMITED",
        evidence: "Most recorded trades lack explicit thesis or structured evidence links."
      });
    }

    // 3. Formulate Grounded Personal Research Questions (Non-pressuring)
    const suggestedResearchQuestions = [];

    if (scenarioCount === 0 && holdings.length > 0) {
      suggestedResearchQuestions.push({
        question: "You have active portfolio holdings but have not simulated any scenario shocks. Would you like to model a -10% sector shock?",
        rationale: "Testing hypothetical sector declines helps anticipate drawdowns before real market moves occur.",
        category: "SCENARIO",
        actionRoute: "/scenarios"
      });
    }

    if (strategyCount > 0 && notebookCount === 0) {
      suggestedResearchQuestions.push({
        question: "You have created strategies without recording a structured robustness experiment. Would you like to test slippage sensitivity?",
        rationale: "Slippage sensitivity reveals whether historical gains survive realistic trade execution frictions.",
        category: "ROBUSTNESS",
        actionRoute: "/strategies"
      });
    }

    if (unreviewedTrades > 0) {
      suggestedResearchQuestions.push({
        question: `You have ${unreviewedTrades} closed paper trades awaiting review. Would you like to record execution notes and lessons?`,
        rationale: "Documenting post-trade lessons closes the learning loop and highlights execution patterns.",
        category: "REVIEW",
        actionRoute: "/journal"
      });
    }

    if (decisionCount > 0 && scenarioCount === 0) {
      suggestedResearchQuestions.push({
        question: "You have recorded structured trade decisions without linking scenario stress results. Would you like to link one?",
        rationale: "Linking what-if scenarios directly to decision theses strengthens risk anticipation.",
        category: "EXPERIMENT",
        actionRoute: "/decisions"
      });
    }

    // Fallback general inquiry if all stages are advanced
    if (suggestedResearchQuestions.length === 0) {
      suggestedResearchQuestions.push({
        question: "Would you like to compare your strategy performance across different historical market regimes?",
        rationale: "Testing strategies across both trending and range-bound regimes ensures adaptability.",
        category: "GENERAL",
        actionRoute: "/strategies"
      });
    }

    // 4. Determine Learning Loop Stage
    let learningLoopStage = "RESEARCH";
    if (unreviewedTrades > 0) {
      learningLoopStage = "REVIEW";
    } else if (reviewedTrades > 0 && suggestedResearchQuestions.length > 0) {
      learningLoopStage = "NEXT_QUESTION";
    } else if (decisionCount > 0 && totalTrades === 0) {
      learningLoopStage = "RESULT";
    } else if (strategyCount > 0 && decisionCount === 0) {
      learningLoopStage = "EXPERIMENT";
    }

    // 5. Gather Empirical Journal Patterns
    const patternData = await journalIntelligenceService.detectJournalPatterns(userId);
    const recurringPatterns = (patternData.patterns || []).map(p => ({
      patternType: p.type,
      description: p.observation,
      observedCount: p.count || 1
    }));

    // 6. Upsert Learning Profile
    const profile = await LearningProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          researchActivity,
          knowledgeGaps,
          recurringPatterns,
          suggestedResearchQuestions,
          learningLoopStage,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return profile;
  }

  /**
   * Retrieves personal research questions
   */
  async getPersonalResearchQuestions(userId) {
    const profile = await this.getLearningProfile(userId);
    return {
      questions: profile.suggestedResearchQuestions,
      disclaimer: "EDUCATIONAL_RESEARCH_INQUIRIES — NOT FINANCIAL RECOMMENDATIONS"
    };
  }

  /**
   * Retrieves knowledge gaps evaluation
   */
  async getKnowledgeGaps(userId) {
    const profile = await this.getLearningProfile(userId);
    return {
      gaps: profile.knowledgeGaps,
      researchActivity: profile.researchActivity,
      disclaimer: "RESEARCH_GAP_ANALYSIS — BASED EXCLUSIVELY ON OBSERVED TRADEFLOW ACTIVITY"
    };
  }

  /**
   * Complete Learning Loop status
   */
  async getLearningLoopStatus(userId) {
    const profile = await this.getLearningProfile(userId);
    const loopStages = [
      { stage: "RESEARCH", label: "Market Research & Copilot", completed: profile.researchActivity.totalMarketEventsViewed > 0 },
      { stage: "EXPERIMENT", label: "Strategy Lab & Backtesting", completed: profile.researchActivity.totalStrategyExperiments > 0 },
      { stage: "RESULT", label: "Robustness & Decision Journal", completed: profile.researchActivity.totalDecisionsRecorded > 0 },
      { stage: "REVIEW", label: "Paper Trade Execution & Review", completed: profile.researchActivity.totalJournalsReviewed > 0 },
      { stage: "LESSON", label: "Empirical Lesson Logging", completed: profile.researchActivity.totalJournalsReviewed > 0 },
      { stage: "NEXT_QUESTION", label: "Personalized Research Inquiry", completed: profile.suggestedResearchQuestions.length > 0 }
    ];

    return {
      currentStage: profile.learningLoopStage,
      loopStages,
      summary: `Current learning stage: ${profile.learningLoopStage}. You have completed ${loopStages.filter(s => s.completed).length} of 6 loop phases.`,
      disclaimer: "TRADEFLOW_LEARNING_LOOP — META-RESEARCH PLATFORM FOR SYSTEMATIC TRADERS"
    };
  }
}

module.exports = new LearningCoachService();
