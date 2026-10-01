const MarketEvent = require("../models/MarketEventModel");
const { HoldingsModel } = require("../models/HoldingsModel");
const marketDataService = require("./marketDataService");
const marketEventService = require("./marketEventService");
const { VERIFIED_TAXONOMY, getVerifiedMetadata } = require("../config/marketMetadata");

const SECTOR_CONSTITUENTS = {
  "Information Technology": ["TCS", "INFY", "WIPRO", "KPITTECH", "QUICKHEAL"],
  "Financial Services": ["HDFCBANK", "ICICIBANK", "SBIN"],
  "Energy": ["RELIANCE", "ONGC"],
  "Fast Moving Consumer Goods": ["HUL", "ITC"],
  "Automotive": ["M&M", "TATAMOTORS"],
  "Metals & Mining": ["TATASTEEL"],
  "Pharmaceuticals": ["SUNPHARMA"]
};

class SectorIntelligenceService {
  /**
   * Returns list of tracked sector names
   */
  getTrackedSectors() {
    return Object.keys(SECTOR_CONSTITUENTS);
  }

  /**
   * Determine sector momentum deterministically
   */
  calculateMomentum(avgChange, advancingPercent) {
    if (avgChange >= 1.0 && advancingPercent >= 60) return "BULLISH";
    if (avgChange <= -1.0 && advancingPercent <= 40) return "BEARISH";
    return "NEUTRAL";
  }

  /**
   * Aggregates real quotes and builds sector overview
   */
  async computeSectorMetrics(sectorName) {
    const constituents = SECTOR_CONSTITUENTS[sectorName] || [];
    if (constituents.length === 0) {
      return {
        sector: sectorName,
        constituents: [],
        averagePriceChange: 0,
        advancing: 0,
        declining: 0,
        unchanged: 0,
        breadthPercent: 0,
        totalVolume: 0,
        momentum: "NEUTRAL",
        status: "DATA_LIMITED"
      };
    }

    let quotes = [];
    try {
      quotes = await marketDataService.getQuotes(constituents);
    } catch (err) {
      quotes = [];
    }

    let totalChange = 0;
    let advancing = 0;
    let declining = 0;
    let unchanged = 0;
    let totalVolume = 0;

    quotes.forEach(q => {
      const pct = typeof q.percentChange === "number" ? q.percentChange : (q.changePercent || 0);
      totalChange += pct;
      if (pct > 0.05) advancing++;
      else if (pct < -0.05) declining++;
      else unchanged++;
      totalVolume += Number(q.volume || 0);
    });

    const count = quotes.length || 1;
    const averagePriceChange = Number((totalChange / count).toFixed(2));
    const breadthPercent = Math.round((advancing / count) * 100);
    const momentum = this.calculateMomentum(averagePriceChange, breadthPercent);

    return {
      sector: sectorName,
      constituents,
      averagePriceChange,
      advancing,
      declining,
      unchanged,
      breadthPercent,
      totalVolume,
      momentum,
      status: quotes.length > 0 ? "AVAILABLE" : "DATA_LIMITED"
    };
  }

  /**
   * Connects sector intelligence with a user's portfolio exposure and market events
   */
  async getSectorDashboard(userId) {
    const sectors = this.getTrackedSectors();

    // 1. Fetch user holdings
    const userHoldings = userId ? await HoldingsModel.find({ user: userId }).lean() : [];
    let totalPortfolioEquity = 0;
    const holdingsBySymbol = {};

    userHoldings.forEach(h => {
      const val = (h.price || h.avg || 0) * (h.qty || 0);
      totalPortfolioEquity += val;
      holdingsBySymbol[h.name.toUpperCase()] = {
        symbol: h.name.toUpperCase(),
        qty: h.qty,
        price: h.price,
        value: val
      };
    });

    // 2. Fetch recent events per symbol across last 48 hours
    const recentEvents = await MarketEvent.find({
      createdAt: { $gte: new Date(Date.now() - 48 * 3600 * 1000) }
    }).lean();

    const eventCountBySymbol = {};
    recentEvents.forEach(e => {
      const sym = (e.symbol || "").toUpperCase();
      eventCountBySymbol[sym] = (eventCountBySymbol[sym] || 0) + 1;
    });

    // 3. Compute metrics for each sector
    const sectorCards = await Promise.all(
      sectors.map(async (sectorName) => {
        const metrics = await this.computeSectorMetrics(sectorName);
        const constituents = metrics.constituents;

        // Sum event counts
        let sectorEventCount = 0;
        const constituentsWithExposure = [];
        let sectorHoldingEquity = 0;

        constituents.forEach(sym => {
          sectorEventCount += (eventCountBySymbol[sym] || 0);
          if (holdingsBySymbol[sym]) {
            sectorHoldingEquity += holdingsBySymbol[sym].value;
            constituentsWithExposure.push(holdingsBySymbol[sym]);
          }
        });

        // Check unlisted user holdings matching this sector via verified taxonomy
        userHoldings.forEach(h => {
          const sym = h.name.toUpperCase();
          if (!constituents.includes(sym)) {
            const meta = getVerifiedMetadata(sym);
            if (meta && meta.sector === sectorName && !constituentsWithExposure.some(e => e.symbol === sym)) {
              sectorHoldingEquity += (h.price || h.avg || 0) * h.qty;
              constituentsWithExposure.push({
                symbol: sym,
                qty: h.qty,
                price: h.price,
                value: (h.price || h.avg || 0) * h.qty
              });
            }
          }
        });

        const userExposurePercent = totalPortfolioEquity > 0
          ? Number(((sectorHoldingEquity / totalPortfolioEquity) * 100).toFixed(1))
          : 0;

        return {
          ...metrics,
          eventCount: sectorEventCount,
          portfolioExposure: {
            userExposurePercent,
            sectorHoldingEquity,
            holdings: constituentsWithExposure
          },
          actions: {
            investigatePrompt: `Investigate sector dynamics and recent events in ${sectorName}`,
            stressPrompt: `Stress test portfolio against ${sectorName} shock (-10% / -20%)`
          }
        };
      })
    );

    return {
      timestamp: new Date(),
      totalSectors: sectorCards.length,
      sectors: sectorCards
    };
  }

  /**
   * Transparent side-by-side comparison between two sectors
   */
  async compareSectors(sectorA, sectorB, userId) {
    const [metricsA, metricsB, dashboard] = await Promise.all([
      this.computeSectorMetrics(sectorA),
      this.computeSectorMetrics(sectorB),
      this.getSectorDashboard(userId)
    ]);

    const cardA = dashboard.sectors.find(s => s.sector === sectorA) || { ...metricsA, portfolioExposure: { userExposurePercent: 0 }, eventCount: 0 };
    const cardB = dashboard.sectors.find(s => s.sector === sectorB) || { ...metricsB, portfolioExposure: { userExposurePercent: 0 }, eventCount: 0 };

    const comparison = {
      priceChangeDelta: Number((cardA.averagePriceChange - cardB.averagePriceChange).toFixed(2)),
      breadthDelta: cardA.breadthPercent - cardB.breadthPercent,
      higherVolumeSector: cardA.totalVolume >= cardB.totalVolume ? sectorA : sectorB,
      userExposureDelta: Number((cardA.portfolioExposure.userExposurePercent - cardB.portfolioExposure.userExposurePercent).toFixed(1)),
      eventCountDelta: cardA.eventCount - cardB.eventCount
    };

    return {
      sectorA: cardA,
      sectorB: cardB,
      comparison,
      methodology: "TRANSPARENT_FACTUAL_COMPARISON — ZERO ARBITRARY FINANCIAL SCORES"
    };
  }

  /**
   * Detects material sector movement and emits SECTOR_CHANGE event into MarketEventModel
   */
  async checkAndEmitSectorEvents(userId) {
    if (!userId) return [];
    const dashboard = await this.getSectorDashboard(userId);
    const emittedEvents = [];

    for (const sector of dashboard.sectors) {
      if (Math.abs(sector.averagePriceChange) >= 2.0 || sector.breadthPercent === 100 || sector.breadthPercent === 0) {
        const dedupeKey = marketEventService.generateDedupeKey(
          userId,
          sector.sector.replace(/\s+/g, "_").toUpperCase(),
          "SECTOR_CHANGE",
          new Date()
        );

        try {
          const event = await MarketEvent.findOneAndUpdate(
            { dedupeKey },
            {
              $set: {
                user: userId,
                symbol: sector.sector.replace(/\s+/g, "_").toUpperCase(),
                eventType: "SECTOR_CHANGE",
                severity: Math.abs(sector.averagePriceChange) >= 3.0 ? "CRITICAL" : "SIGNIFICANT",
                category: "MARKET",
                title: `Sector Move: ${sector.sector} (${sector.averagePriceChange >= 0 ? "+" : ""}${sector.averagePriceChange}%)`,
                description: `Sector ${sector.sector} exhibits material momentum: Average change ${sector.averagePriceChange}%, Breadth ${sector.breadthPercent}% advancing. User portfolio exposure: ${sector.portfolioExposure.userExposurePercent}%.`,
                observedData: [
                  { metric: "averagePriceChange", value: sector.averagePriceChange, unit: "%" },
                  { metric: "breadthPercent", value: sector.breadthPercent, unit: "%" },
                  { metric: "userExposurePercent", value: sector.portfolioExposure.userExposurePercent, unit: "%" }
                ],
                sources: [{ sourceType: "MARKET_DATA", details: { constituents: sector.constituents } }],
                dedupeKey,
                timestamp: new Date()
              }
            },
            { upsert: true, new: true }
          );
          emittedEvents.push(event);
        } catch (err) {
          // Continue safe execution
        }
      }
    }

    return emittedEvents;
  }
}

module.exports = new SectorIntelligenceService();
