const MarketEvent = require("../models/MarketEventModel");
const marketEventService = require("./marketEventService");
const { WatchlistModel } = require("../models/WatchlistModel");
const { HoldingsModel } = require("../models/HoldingsModel");
const { AlertModel } = require("../models/AlertModel");
const { ResearchSessionModel } = require("../models/ResearchSessionModel");

class InsightsService {
  /**
   * Deterministic priority scoring algorithm
   */
  calculatePriorityScore(event, context = {}) {
    let score = 0;

    // 1. Severity weight
    switch (event.severity) {
      case "CRITICAL": score += 400; break;
      case "SIGNIFICANT": score += 300; break;
      case "WATCH": score += 200; break;
      default: score += 100; break;
    }

    // 2. Personal Context bonus
    if (context.portfolioSymbols?.has(event.symbol)) score += 50;
    if (event.eventType === "ALERT_TRIGGERED") score += 40;
    if (context.watchlistSymbols?.has(event.symbol)) score += 30;
    if (event.eventType === "CORRELATED_EVENT") score += 25;
    if (context.researchSymbols?.has(event.symbol)) score += 20;

    // 3. Recency bonus (within last 3 hours: +15)
    const hoursAgo = (Date.now() - new Date(event.occurredAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 3) score += 15;

    return score;
  }

  /**
   * Synthesize transparent, factual "Why This Appears" explanation
   */
  generateWhyThisAppears(event, context = {}) {
    const reasons = [];

    if (context.portfolioSymbols?.has(event.symbol)) {
      const holding = context.holdingsMap?.get(event.symbol);
      const qtyStr = holding?.qty ? ` (${holding.qty} shares)` : '';
      reasons.push(`${event.symbol} is an active position in your portfolio${qtyStr}.`);
    }

    if (context.watchlistSymbols?.has(event.symbol)) {
      reasons.push(`${event.symbol} is actively monitored on your research watchlist.`);
    }

    if (context.alertSymbols?.has(event.symbol)) {
      reasons.push(`You have active price alerts configured for ${event.symbol}.`);
    }

    if (event.eventType === "CORRELATED_EVENT") {
      reasons.push(`A multi-signal confluence cluster of ${event.correlatedSignals?.length || 2} indicators converged today.`);
    } else if (event.eventType === "PRICE_MOVE") {
      reasons.push(`Daily price change of ${event.changePercent >= 0 ? '+' : ''}${event.changePercent?.toFixed(2)}% crossed threshold.`);
    } else if (event.eventType === "VOLUME_SURGE") {
      reasons.push(`Trading volume expanded notably beyond its 20-day historical baseline.`);
    } else if (event.eventType === "SCANNER_ENTRY") {
      reasons.push(`Satisfied rule criteria in the market scanner.`);
    } else if (event.eventType === "ALERT_TRIGGERED") {
      reasons.push(`Market price crossed your specified threshold condition.`);
    }

    if (context.researchSymbols?.has(event.symbol)) {
      reasons.push(`You previously investigated this security in Research Copilot.`);
    }

    return reasons.length > 0
      ? reasons.join(" ")
      : `Market intelligence signal detected on monitored symbol ${event.symbol}.`;
  }

  /**
   * Generates grounded daily research questions from actual events
   */
  generateDailyResearchQuestions(events = []) {
    const questions = [];
    const seen = new Set();

    for (const evt of events) {
      if (seen.has(evt.symbol)) continue;
      seen.add(evt.symbol);

      if (evt.eventType === "CORRELATED_EVENT") {
        questions.push(`Why did ${evt.symbol} generate today's multi-signal momentum event?`);
      } else if (evt.eventType === "PRICE_MOVE") {
        questions.push(`What evidence explains the ${evt.changePercent >= 0 ? '+' : ''}${evt.changePercent?.toFixed(2)}% move in ${evt.symbol} today?`);
      } else if (evt.eventType === "SCANNER_ENTRY") {
        questions.push(`Which specific scanner conditions did ${evt.symbol} satisfy today?`);
      } else if (evt.eventType === "ALERT_TRIGGERED") {
        questions.push(`How does the triggered price alert in ${evt.symbol} impact your risk thesis?`);
      }

      if (questions.length >= 4) break;
    }

    if (questions.length === 0) {
      questions.push("Which portfolio exposures or watchlist symbols require updated research validation?");
    }

    return questions;
  }

  /**
   * Main Orchestration: GET /api/v1/insights/today
   */
  async getTodayFeed(userId) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // 1. Resolve user context in parallel
    const [watchlistItems, holdings, alerts, recentSessions] = await Promise.all([
      WatchlistModel.find({ user: userId }).lean(),
      HoldingsModel.find({ user: userId }).lean(),
      AlertModel.find({ user: userId }).lean(),
      ResearchSessionModel.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    const watchlistSymbols = new Set(watchlistItems.map(i => i.symbol?.toUpperCase()).filter(Boolean));
    const holdingsMap = new Map();
    const portfolioSymbols = new Set();
    holdings.forEach(h => {
      const sym = (h.name || h.symbol || '').toUpperCase();
      if (sym) {
        portfolioSymbols.add(sym);
        holdingsMap.set(sym, h);
      }
    });

    const alertSymbols = new Set(alerts.map(a => a.symbol?.toUpperCase()).filter(Boolean));
    const researchSymbols = new Set(recentSessions.flatMap(s => (s.symbols || []).map(sym => sym.toUpperCase())));

    const context = {
      watchlistSymbols,
      portfolioSymbols,
      holdingsMap,
      alertSymbols,
      researchSymbols
    };

    // 2. Query today's existing events
    let todayEvents = await MarketEvent.find({
      user: userId,
      isDismissed: false,
      occurredAt: { $gte: startOfDay }
    }).lean();

    // If no events for today yet, trigger an evaluation
    if (todayEvents.length === 0) {
      await marketEventService.evaluateMarketEvents(userId);
      todayEvents = await MarketEvent.find({
        user: userId,
        isDismissed: false,
        occurredAt: { $gte: startOfDay }
      }).lean();
    }

    // Fallback: If still none (e.g. mock data or no recent moves), fetch latest unread events
    if (todayEvents.length === 0) {
      todayEvents = await MarketEvent.find({
        user: userId,
        isDismissed: false
      }).sort({ occurredAt: -1 }).limit(15).lean();
    }

    // 3. Enrich with Why This Appears and Priority Score
    const enrichedEvents = todayEvents.map(evt => {
      const priorityScore = this.calculatePriorityScore(evt, context);
      const whyThisAppears = this.generateWhyThisAppears(evt, context);
      return {
        ...evt,
        priorityScore,
        whyThisAppears
      };
    });

    // 4. Deterministic Sort (Highest priority first)
    enrichedEvents.sort((a, b) => b.priorityScore - a.priorityScore);

    // 5. Organize into contextual sections
    const sectionMap = {
      PORTFOLIO: { id: "PORTFOLIO", title: "Your Portfolio", icon: "📦", events: [] },
      WATCHLIST: { id: "WATCHLIST", title: "Your Watchlist", icon: "👁️", events: [] },
      ALERT: { id: "ALERT", title: "Your Alerts", icon: "🔔", events: [] },
      SCANNER: { id: "SCANNER", title: "Market Scanner Matches", icon: "🔍", events: [] },
      RESEARCH: { id: "RESEARCH", title: "Recent Research Follow-ups", icon: "🔬", events: [] },
      MARKET: { id: "MARKET", title: "Market Breadth & Benchmark", icon: "🌐", events: [] }
    };

    for (const evt of enrichedEvents) {
      if (portfolioSymbols.has(evt.symbol) || evt.category === "PORTFOLIO") {
        sectionMap.PORTFOLIO.events.push(evt);
      } else if (evt.eventType === "ALERT_TRIGGERED" || evt.category === "ALERT") {
        sectionMap.ALERT.events.push(evt);
      } else if (watchlistSymbols.has(evt.symbol) || evt.category === "WATCHLIST") {
        sectionMap.WATCHLIST.events.push(evt);
      } else if (evt.eventType === "SCANNER_ENTRY" || evt.category === "SCANNER") {
        sectionMap.SCANNER.events.push(evt);
      } else if (researchSymbols.has(evt.symbol) || evt.category === "RESEARCH") {
        sectionMap.RESEARCH.events.push(evt);
      } else {
        sectionMap.MARKET.events.push(evt);
      }
    }

    const sections = Object.values(sectionMap).filter(sec => sec.events.length > 0);

    // 6. Summary Metrics
    const summary = {
      totalEvents: enrichedEvents.length,
      criticalCount: enrichedEvents.filter(e => e.severity === "CRITICAL").length,
      significantCount: enrichedEvents.filter(e => e.severity === "SIGNIFICANT").length,
      portfolioEventsCount: sectionMap.PORTFOLIO.events.length,
      watchlistEventsCount: sectionMap.WATCHLIST.events.length,
      alertEventsCount: sectionMap.ALERT.events.length,
      scannerEventsCount: sectionMap.SCANNER.events.length
    };

    // 7. Grounded Daily Research Questions
    const researchQuestions = this.generateDailyResearchQuestions(enrichedEvents);

    return {
      date: now.toISOString().split("T")[0],
      summary,
      sections,
      events: enrichedEvents,
      researchQuestions
    };
  }

  /**
   * Historical Feed: GET /api/v1/insights/history
   */
  async getHistoryFeed(userId, query = {}) {
    const { dateRange = "today", page = 1, limit = 20 } = query;
    const now = new Date();
    let startDate;

    if (dateRange === "yesterday") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    } else if (dateRange === "week") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    }

    const filter = {
      user: userId,
      occurredAt: { $gte: startDate }
    };

    const numLimit = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * numLimit;

    const [events, total] = await Promise.all([
      MarketEvent.find(filter)
        .sort({ occurredAt: -1, severity: 1 })
        .skip(skip)
        .limit(numLimit)
        .lean(),
      MarketEvent.countDocuments(filter)
    ]);

    return {
      events,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / numLimit) || 1,
      dateRange
    };
  }

  async markRead(userId, eventId) {
    return marketEventService.markRead(userId, eventId);
  }

  async dismiss(userId, eventId) {
    return marketEventService.dismissEvent(userId, eventId);
  }
}

module.exports = new InsightsService();
