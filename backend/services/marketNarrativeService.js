const MarketEvent = require("../models/MarketEventModel");
const { HoldingsModel } = require("../models/HoldingsModel");
const marketRegimeService = require("./marketRegimeService");
const sectorIntelligenceService = require("./sectorIntelligenceService");
const aiAnalystService = require("./aiAnalystService");

class MarketNarrativeService {
  /**
   * Deterministically assemble an evidence-grounded market narrative
   */
  async generateMarketNarrative(userId, options = {}) {
    // 1. Gather regime and metrics
    const regimeData = await marketRegimeService.detectCurrentRegime(userId);

    // 2. Gather sector dashboard
    const sectorDashboard = await sectorIntelligenceService.getSectorDashboard(userId);

    // 3. Gather recent market events for user (last 24 hours)
    const recentEvents = await MarketEvent.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) }
    }).sort({ createdAt: -1 }).limit(20).lean();

    // 4. Gather user holdings
    const userHoldings = await HoldingsModel.find({ user: userId }).lean();

    // -----------------------------------------------------------------
    // SECTION 1: WHAT CHANGED?
    // -----------------------------------------------------------------
    const whatChanged = {
      title: "What Changed?",
      summary: `Market regime is classified as ${regimeData.regime} with ${regimeData.metrics.advancingPercent}% of tracked universe advancing. Observable trend is ${regimeData.metrics.trend}.`,
      evidence: [
        `Market Regime: ${regimeData.regime} (Prior: ${regimeData.previousRegime || "BASELINE"})`,
        `Advance/Decline Ratio: ${regimeData.metrics.breadthRatio} (${regimeData.metrics.advancingPercent}% Advancing vs ${regimeData.metrics.decliningPercent}% Declining)`,
        `Average Universe Volatility: ${regimeData.metrics.averageVolatility}% (${regimeData.metrics.volatilityLevel})`,
        ...regimeData.evidence
      ]
    };

    // -----------------------------------------------------------------
    // SECTION 2: WHAT IS UNUSUAL?
    // -----------------------------------------------------------------
    const criticalEvents = recentEvents.filter(e => e.severity === "CRITICAL" || e.severity === "SIGNIFICANT");
    const volumeEvents = recentEvents.filter(e => e.eventType === "VOLUME_SURGE" || (e.description && e.description.toLowerCase().includes("volume")));

    const unusualEvidence = [];
    if (criticalEvents.length > 0) {
      unusualEvidence.push(`${criticalEvents.length} critical/significant market signals observed in the last 24h.`);
      criticalEvents.slice(0, 3).forEach(e => {
        unusualEvidence.push(`- [${e.severity}] ${e.symbol}: ${e.title}`);
      });
    } else {
      unusualEvidence.push("No critical severity market anomalies detected across monitored symbols in the past 24 hours.");
    }

    if (volumeEvents.length > 0) {
      unusualEvidence.push(`${volumeEvents.length} volume surge events identified.`);
    }

    if (regimeData.metrics.averageVolatility >= 2.5) {
      unusualEvidence.push(`Elevated volatility cluster: Universe average absolute change is ${regimeData.metrics.averageVolatility}%.`);
    }

    const whatIsUnusual = {
      title: "What is Unusual?",
      summary: criticalEvents.length > 0
        ? `Detected ${criticalEvents.length} elevated market events and noteworthy volume/volatility deviations.`
        : "Trading conditions reflect normal volatility distribution without outlier anomalies.",
      evidence: unusualEvidence
    };

    // -----------------------------------------------------------------
    // SECTION 3: WHICH SECTORS CHANGED?
    // -----------------------------------------------------------------
    const movingSectors = (sectorDashboard.sectors || []).filter(
      s => Math.abs(s.averagePriceChange) >= 0.5 || s.breadthPercent >= 65 || s.breadthPercent <= 35
    );

    const sectorEvidence = [];
    (sectorDashboard.sectors || []).forEach(s => {
      sectorEvidence.push(`${s.sector}: ${s.averagePriceChange >= 0 ? "+" : ""}${s.averagePriceChange}% (Breadth: ${s.breadthPercent}% advancing, Momentum: ${s.momentum})`);
    });

    const whichSectorsChanged = {
      title: "Which Sectors Changed?",
      summary: movingSectors.length > 0
        ? `${movingSectors.map(s => `${s.sector} (${s.averagePriceChange >= 0 ? "+" : ""}${s.averagePriceChange}%)`).join(", ")} recorded notable directional momentum.`
        : "Sector movements remained within standard narrow ranges.",
      evidence: sectorEvidence
    };

    // -----------------------------------------------------------------
    // SECTION 4: WHICH MONITORED ASSETS WERE AFFECTED?
    // -----------------------------------------------------------------
    const heldSymbols = new Set(userHoldings.map(h => h.name.toUpperCase()));
    const affectedHoldingsEvents = recentEvents.filter(e => heldSymbols.has((e.symbol || "").toUpperCase()));

    const affectedEvidence = [];
    if (userHoldings.length === 0) {
      affectedEvidence.push("Portfolio contains 0 active equity positions; no user holdings currently exposed.");
    } else {
      userHoldings.forEach(h => {
        const sym = h.name.toUpperCase();
        const symEvents = affectedHoldingsEvents.filter(e => (e.symbol || "").toUpperCase() === sym);
        affectedEvidence.push(
          `${sym}: Qty ${h.qty}, Last Price ₹${h.price || h.avg}, Net ${h.net || "0.0%"}, Active Events: ${symEvents.length}`
        );
      });
    }

    const whichMonitoredAssetsAffected = {
      title: "Which Monitored Assets Were Affected?",
      summary: affectedHoldingsEvents.length > 0
        ? `${affectedHoldingsEvents.length} market events directly intersect with current user portfolio holdings.`
        : "Zero active events currently impact user portfolio holdings directly.",
      evidence: affectedEvidence
    };

    // -----------------------------------------------------------------
    // SECTION 5: WHAT REMAINS UNKNOWN?
    // -----------------------------------------------------------------
    const unknownsEvidence = [
      "Real-time institutional block deal registry is limited by current exchange data tier.",
      "Corporate earnings calendar and quarterly filings are not continuously ingested in price stream.",
      "Macroeconomic indicator updates (CPI, Central Bank rates) are referenced via proxy rather than direct feed.",
      "Provider latency and snapshot interval: 1-minute to 1-day granularity depending on asset."
    ];

    const whatRemainsUnknown = {
      title: "What Remains Unknown?",
      summary: "Certain fundamental and institutional flow variables remain unobserved in this price/volume snapshot.",
      evidence: unknownsEvidence
    };

    // Grounded synthesis text
    const synthesisText = `MARKET SNAPSHOT\n\n` +
      `1. What Changed?\n${whatChanged.summary}\n\n` +
      `2. What is Unusual?\n${whatIsUnusual.summary}\n\n` +
      `3. Which Sectors Changed?\n${whichSectorsChanged.summary}\n\n` +
      `4. Which Monitored Assets Were Affected?\n${whichMonitoredAssetsAffected.summary}\n\n` +
      `5. What Remains Unknown?\n${whatRemainsUnknown.summary}`;

    return {
      timestamp: new Date(),
      regime: regimeData.regime,
      sections: {
        whatChanged,
        whatIsUnusual,
        whichSectorsChanged,
        whichMonitoredAssetsAffected,
        whatRemainsUnknown
      },
      synthesis: synthesisText,
      disclaimer: "EVIDENCE_BASED_OBSERVATION — NOT A PREDICTION OR RECOMMENDATION",
      methodology: "STRICT_EVIDENCE_GROUNDING — ZERO ARBITRARY FINANCIAL SCORES"
    };
  }
}

module.exports = new MarketNarrativeService();
