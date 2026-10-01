const marketRegimeService = require("./marketRegimeService");
const portfolioIntelligenceService = require("./portfolioIntelligenceService");
const marketEventService = require("./marketEventService");
const { ResearchSessionModel } = require("../models/ResearchSessionModel");
const DecisionJournal = require("../models/DecisionJournalModel");
const { TradeJournalModel } = require("../models/TradeJournalModel");
const StrategyNotebook = require("../models/StrategyNotebookModel");

class DigestService {
  /**
   * Daily Brief Digest
   */
  async getDailyDigest(userId) {
    const [
      regime,
      portfolio,
      eventsData,
      researchSessions,
      decisions,
      recentTrades
    ] = await Promise.all([
      marketRegimeService.detectCurrentRegime(userId).catch(() => ({ regime: "UNKNOWN", volatilityState: "NORMAL", metrics: { volatilityLevel: "NORMAL" } })),
      portfolioIntelligenceService.getPortfolioIntelligence(userId).catch(() => null),
      marketEventService.getEvents(userId, { limit: 10 }).catch(() => ({ events: [] })),
      ResearchSessionModel.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
      DecisionJournal.find({ user: userId, status: "ACTIVE" }).sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
      TradeJournalModel.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean().catch(() => [])
    ]);

    const events = eventsData?.events || [];
    const significantEvents = events.filter(e => e.severity === "CRITICAL" || e.severity === "SIGNIFICANT");

    // Portfolio Insights
    let portfolioSummary = "No active holdings in portfolio.";
    let topHoldingEvidence = null;
    if (portfolio && portfolio.holdings && portfolio.holdings.length > 0) {
      const top = portfolio.holdings[0];
      const weightPct = ((top.weight || 0) * 100).toFixed(1);
      portfolioSummary = `${top.symbol} represents ${weightPct}% of portfolio equity.`;
      topHoldingEvidence = {
        symbol: top.symbol,
        weight: `${weightPct}%`,
        totalEquity: portfolio.totalEquity,
        concentrationStatus: portfolio.concentration?.assessment?.status
      };
    }

    // Market Insights
    const volatilityDesc = regime.metrics?.volatilityLevel || regime.volatilityState || "NORMAL";
    const marketSummary = `Current regime is ${regime.regime || "BALANCED"} with ${volatilityDesc} volatility.`;

    // Events Insights
    const eventSummary = `${significantEvents.length} critical or significant market events detected today.`;

    // Research Insights
    const openResearchQuestions = researchSessions.filter(s => s.status !== "COMPLETED").map(s => s.question);
    const researchSummary = `${openResearchQuestions.length} open research questions pending follow-up.`;

    // Strategy & Decisions
    const activeDecisionsCount = decisions.length;
    const strategySummary = `${activeDecisionsCount} active trading decisions currently logged and tracked.`;

    // Journal
    const unreviewedTrades = recentTrades.filter(t => !t.tags || t.tags.length === 0);
    const journalSummary = `${unreviewedTrades.length} recent trades without behavioral tags need review.`;

    // Next Research Directive (strictly educational & analytical)
    let nextResearch = "Screen the market universe for volatility breakouts matching the current market regime.";
    if (portfolio && portfolio.holdings && portfolio.holdings.length > 0) {
      nextResearch = `Stress-test portfolio exposure to a 10% sector shock on ${portfolio.holdings[0].symbol}.`;
    } else if (openResearchQuestions.length > 0) {
      nextResearch = `Deepen analysis on question: "${openResearchQuestions[0]}"`;
    }

    return {
      type: "DAILY_BRIEF",
      generatedAt: new Date(),
      sections: {
        market: {
          title: "MARKET REGIME",
          summary: marketSummary,
          evidence: {
            regime: regime.regime || "BALANCED",
            volatility: volatilityDesc,
            metrics: regime.metrics || null
          }
        },
        portfolio: {
          title: "PORTFOLIO INTELLIGENCE",
          summary: portfolioSummary,
          evidence: topHoldingEvidence
        },
        events: {
          title: "MARKET SURVEILLANCE EVENTS",
          summary: eventSummary,
          evidence: {
            totalEvents: events.length,
            significantCount: significantEvents.length,
            topEvents: significantEvents.slice(0, 3).map(e => ({
              symbol: e.symbol,
              type: e.eventType,
              severity: e.severity
            }))
          }
        },
        research: {
          title: "RESEARCH SESSIONS",
          summary: researchSummary,
          evidence: {
            openQuestionsCount: openResearchQuestions.length,
            questions: openResearchQuestions.slice(0, 3)
          }
        },
        strategies: {
          title: "STRATEGIES & DECISIONS",
          summary: strategySummary,
          evidence: {
            activeDecisionsCount,
            decisions: decisions.slice(0, 3).map(d => ({ symbol: d.symbol, thesis: d.thesis }))
          }
        },
        journal: {
          title: "TRADING JOURNAL",
          summary: journalSummary,
          evidence: {
            recentTradesCount: recentTrades.length,
            unreviewedTradesCount: unreviewedTrades.length
          }
        },
        nextResearch: {
          title: "SUGGESTED NEXT RESEARCH",
          action: nextResearch,
          rationale: "Grounded recommendation based on current portfolio concentration and active market regime."
        }
      },
      disclaimer: "TRADEFLOW_DIGEST — EDUCATIONAL RESEARCH DIGEST, NOT FINANCIAL TRADING ADVICE"
    };
  }

  /**
   * Weekly Brief Digest
   */
  async getWeeklyDigest(userId) {
    const [
      regime,
      portfolio,
      eventsData,
      researchSessions,
      decisions,
      recentTrades,
      experiments
    ] = await Promise.all([
      marketRegimeService.detectCurrentRegime(userId).catch(() => ({ regime: "UNKNOWN", volatilityState: "NORMAL", metrics: { volatilityLevel: "NORMAL" } })),
      portfolioIntelligenceService.getPortfolioIntelligence(userId).catch(() => null),
      marketEventService.getEvents(userId, { limit: 50 }).catch(() => ({ events: [] })),
      ResearchSessionModel.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean().catch(() => []),
      DecisionJournal.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean().catch(() => []),
      TradeJournalModel.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean().catch(() => []),
      StrategyNotebook.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean().catch(() => [])
    ]);

    const events = eventsData?.events || [];
    const significantEvents = events.filter(e => e.severity === "CRITICAL" || e.severity === "SIGNIFICANT");

    // Discipline & Journal Pattern
    const winningTrades = recentTrades.filter(t => (t.pnl || t.netPnl || 0) > 0);
    const winRate = recentTrades.length > 0 ? ((winningTrades.length / recentTrades.length) * 100).toFixed(1) : 0;

    return {
      type: "WEEKLY_DIGEST",
      generatedAt: new Date(),
      sections: {
        marketSummary: {
          title: "WEEKLY MARKET MACRO",
          regime: regime.regime || "BALANCED",
          volatilityState: regime.volatilityState || "NORMAL",
          significantEventsCount: significantEvents.length
        },
        portfolioEvolution: {
          title: "PORTFOLIO & RISK EXPOSURE",
          totalEquity: portfolio?.totalEquity || 0,
          cashWeight: portfolio?.cashWeight ? `${(portfolio.cashWeight * 100).toFixed(1)}%` : "100%",
          topAsset: portfolio?.holdings?.[0]?.symbol || "NONE",
          concentrationStatus: portfolio?.concentration?.assessment?.status || "BALANCED"
        },
        strategyExperiments: {
          title: "STRATEGY LAB & BACKTESTS",
          totalExperiments: experiments.length,
          recentExperiments: experiments.slice(0, 3).map(e => ({
            name: e.title || e.name || "Experiment",
            status: e.status || "COMPLETED"
          }))
        },
        journalPatterns: {
          title: "JOURNAL PATTERNS & DISCIPLINE",
          totalLoggedTrades: recentTrades.length,
          winRate: `${winRate}%`,
          unreviewedTradesCount: recentTrades.filter(t => !t.tags || t.tags.length === 0).length
        },
        researchSessions: {
          title: "RESEARCH & UNRESOLVED QUESTIONS",
          totalSessions: researchSessions.length,
          unresolvedQuestions: researchSessions.filter(s => s.status !== "COMPLETED").map(s => s.question).slice(0, 5)
        },
        openDecisions: {
          title: "OPEN DECISION AUDIT",
          activeDecisions: decisions.filter(d => d.status === "ACTIVE").length,
          reviewedDecisions: decisions.filter(d => d.status === "REVIEWED").length
        }
      },
      disclaimer: "TRADEFLOW_WEEKLY_DIGEST — RETROSPECTIVE RESEARCH & DISCIPLINE REVIEW, NOT TRADING SIGNALS"
    };
  }
}

module.exports = new DigestService();
