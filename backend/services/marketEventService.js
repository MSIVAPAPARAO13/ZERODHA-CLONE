const crypto = require("crypto");
const MarketEvent = require("../models/MarketEventModel");
const marketDataService = require("./marketDataService");
const marketScannerService = require("./marketScannerService");
const { WatchlistModel } = require("../models/WatchlistModel");
const { AlertModel } = require("../models/AlertModel");
const { HoldingsModel } = require("../models/HoldingsModel");
const { PositionsModel } = require("../models/PositionsModel");

class MarketEventService {
  /**
   * Deterministic deduplication key using SHA-256 and hourly time buckets
   */
  generateDedupeKey(userId, symbol, eventType, timestamp = new Date()) {
    const date = new Date(timestamp);
    const hourBucket = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCHours()).padStart(2, '0')}`;
    const raw = `${String(userId)}:${String(symbol).toUpperCase()}:${eventType}:${hourBucket}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Deterministic severity classification
   */
  calculateSeverity(eventType, metrics = {}) {
    const { changePercent = 0, volumeMultiple = 1, isCorrelated = false, signalCount = 1 } = metrics;
    const absPct = Math.abs(changePercent);

    if (isCorrelated || signalCount >= 3) {
      return "CRITICAL";
    }

    if (eventType === "ALERT_TRIGGERED" || eventType === "SCANNER_ENTRY") {
      return absPct >= 3.0 || volumeMultiple >= 1.5 ? "CRITICAL" : "SIGNIFICANT";
    }

    if (absPct >= 4.0 || volumeMultiple >= 2.0) {
      return "CRITICAL";
    }

    if (absPct >= 2.0 || volumeMultiple >= 1.5) {
      return "SIGNIFICANT";
    }

    if (absPct >= 1.0 || volumeMultiple >= 1.2) {
      return "WATCH";
    }

    return "INFO";
  }

  /**
   * Gathers monitored symbols for user from Watchlist, Holdings, Positions, and Alerts
   */
  async getMonitoredSymbols(userId) {
    const symbols = new Set();

    try {
      const [watchlistItems, holdings, positions, alerts] = await Promise.all([
        WatchlistModel.find({ user: userId }).lean(),
        HoldingsModel.find({ user: userId }).lean(),
        PositionsModel.find({ user: userId }).lean(),
        AlertModel.find({ user: userId, isActive: true }).lean()
      ]);

      if (watchlistItems && Array.isArray(watchlistItems)) {
        watchlistItems.forEach(item => {
          if (item?.symbol) symbols.add(item.symbol.toUpperCase());
        });
      }

      holdings.forEach(h => {
        if (h?.name) symbols.add(h.name.toUpperCase());
        if (h?.symbol) symbols.add(h.symbol.toUpperCase());
      });

      positions.forEach(p => {
        if (p?.name) symbols.add(p.name.toUpperCase());
        if (p?.symbol) symbols.add(p.symbol.toUpperCase());
      });

      alerts.forEach(a => {
        if (a?.symbol) symbols.add(a.symbol.toUpperCase());
      });
    } catch (err) {
      console.warn("Error resolving user monitored symbols:", err.message);
    }

    // Default to liquid benchmarks if user has no symbols
    if (symbols.size === 0) {
      ["TCS", "INFY", "RELIANCE"].forEach(s => symbols.add(s));
    }

    return Array.from(symbols);
  }

  /**
   * Detect price and volume events for a single symbol
   */
  async detectPriceAndVolumeEvents(userId, symbol, category = "WATCHLIST") {
    const events = [];
    try {
      const [quote, history] = await Promise.all([
        marketDataService.getQuote(symbol).catch(() => null),
        marketDataService.getHistoricalData(symbol, "1day", 30).catch(() => [])
      ]);

      if (!quote || quote.price === undefined) {
        return events;
      }

      const currentPrice = Number(quote.price);
      const prevClose = Number(quote.previousClose || (history && history.length > 1 ? history[history.length - 2].close : currentPrice));
      const changeValue = currentPrice - prevClose;
      const changePercent = prevClose > 0 ? (changeValue / prevClose) * 100 : 0;
      const absChangePct = Math.abs(changePercent);

      // 1. Price Move Event
      if (absChangePct >= 1.0) {
        const severity = this.calculateSeverity("PRICE_MOVE", { changePercent });
        const dedupeKey = this.generateDedupeKey(userId, symbol, "PRICE_MOVE");

        events.push({
          user: userId,
          symbol,
          eventType: "PRICE_MOVE",
          severity,
          category,
          title: `${symbol} Price ${changePercent >= 0 ? "Gain" : "Drop"} ${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
          description: `${symbol} moved ${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}% from previous close ₹${prevClose.toFixed(2)} to ₹${currentPrice.toFixed(2)}.`,
          observedData: [
            { metric: "currentPrice", value: currentPrice, unit: "₹", provider: quote.dataSource || "mock" },
            { metric: "previousClose", value: prevClose, unit: "₹", provider: quote.dataSource || "mock" },
            { metric: "changePercent", value: changePercent, unit: "%", provider: quote.dataSource || "mock" }
          ],
          sourceReferences: [
            { sourceType: "MARKET_DATA", sourceId: symbol, details: { provider: quote.dataSource || "mock" } }
          ],
          previousValue: prevClose,
          currentValue: currentPrice,
          changeValue,
          changePercent,
          provider: quote.dataSource || "mock",
          dedupeKey,
          tags: [symbol, category, changePercent >= 0 ? "BULLISH" : "BEARISH"]
        });
      }

      // 2. Volume Surge Event & Technical Breakout
      if (history && history.length >= 20) {
        const recentBars = history.slice(-20);
        const avgVolume = recentBars.reduce((sum, b) => sum + (Number(b.volume) || 0), 0) / 20;
        const currentVolume = Number(quote.volume) || (recentBars[recentBars.length - 1]?.volume || 0);
        const volumeMultiple = avgVolume > 0 ? currentVolume / avgVolume : 1.0;

        if (volumeMultiple >= 1.25) {
          const dedupeKey = this.generateDedupeKey(userId, symbol, "VOLUME_SURGE");
          const severity = this.calculateSeverity("VOLUME_SURGE", { volumeMultiple });

          events.push({
            user: userId,
            symbol,
            eventType: "VOLUME_SURGE",
            severity,
            category,
            title: `${symbol} Unusual Volume Surge (${volumeMultiple.toFixed(2)}x)`,
            description: `Trading volume of ${currentVolume.toLocaleString()} is ${volumeMultiple.toFixed(2)}x the 20-day baseline average (${Math.round(avgVolume).toLocaleString()}).`,
            observedData: [
              { metric: "currentVolume", value: currentVolume, unit: "shares", provider: quote.dataSource || "mock" },
              { metric: "baselineVolume20d", value: Math.round(avgVolume), unit: "shares", provider: quote.dataSource || "mock" },
              { metric: "volumeMultiple", value: Number(volumeMultiple.toFixed(2)), unit: "x", provider: quote.dataSource || "mock" }
            ],
            sourceReferences: [
              { sourceType: "MARKET_DATA", sourceId: symbol, details: { period: "20d", metric: "VOLUME" } }
            ],
            previousValue: avgVolume,
            currentValue: currentVolume,
            changeValue: currentVolume - avgVolume,
            changePercent: (volumeMultiple - 1) * 100,
            provider: quote.dataSource || "mock",
            dedupeKey,
            tags: [symbol, "VOLUME", "EXPANSION"]
          });
        }

        // Technical Breakout / Breakdown (20-day High / Low)
        const highest20 = Math.max(...recentBars.slice(0, -1).map(b => Number(b.high) || Number(b.close)));
        const lowest20 = Math.min(...recentBars.slice(0, -1).map(b => Number(b.low) || Number(b.close)));

        if (currentPrice > highest20) {
          const dedupeKey = this.generateDedupeKey(userId, symbol, "TECHNICAL_BREAKOUT");
          events.push({
            user: userId,
            symbol,
            eventType: "TECHNICAL_BREAKOUT",
            severity: "SIGNIFICANT",
            category,
            title: `${symbol} 20-Day High Breakout`,
            description: `Price ₹${currentPrice.toFixed(2)} broke above the 20-day high resistance of ₹${highest20.toFixed(2)}.`,
            observedData: [
              { metric: "currentPrice", value: currentPrice, unit: "₹", provider: quote.dataSource || "mock" },
              { metric: "resistance20dHigh", value: highest20, unit: "₹", provider: quote.dataSource || "mock" }
            ],
            sourceReferences: [
              { sourceType: "MARKET_DATA", sourceId: symbol, details: { indicator: "DONCHIAN_HIGH" } }
            ],
            previousValue: highest20,
            currentValue: currentPrice,
            changeValue: currentPrice - highest20,
            changePercent: ((currentPrice - highest20) / highest20) * 100,
            provider: quote.dataSource || "mock",
            dedupeKey,
            tags: [symbol, "BREAKOUT", "RESISTANCE"]
          });
        } else if (currentPrice < lowest20) {
          const dedupeKey = this.generateDedupeKey(userId, symbol, "TECHNICAL_BREAKDOWN");
          events.push({
            user: userId,
            symbol,
            eventType: "TECHNICAL_BREAKDOWN",
            severity: "SIGNIFICANT",
            category,
            title: `${symbol} 20-Day Low Breakdown`,
            description: `Price ₹${currentPrice.toFixed(2)} breached below the 20-day support of ₹${lowest20.toFixed(2)}.`,
            observedData: [
              { metric: "currentPrice", value: currentPrice, unit: "₹", provider: quote.dataSource || "mock" },
              { metric: "support20dLow", value: lowest20, unit: "₹", provider: quote.dataSource || "mock" }
            ],
            sourceReferences: [
              { sourceType: "MARKET_DATA", sourceId: symbol, details: { indicator: "DONCHIAN_LOW" } }
            ],
            previousValue: lowest20,
            currentValue: currentPrice,
            changeValue: currentPrice - lowest20,
            changePercent: ((currentPrice - lowest20) / lowest20) * 100,
            provider: quote.dataSource || "mock",
            dedupeKey,
            tags: [symbol, "BREAKDOWN", "SUPPORT"]
          });
        }
      }
    } catch (err) {
      console.warn(`Price/Volume evaluation skipped for ${symbol}:`, err.message);
    }

    return events;
  }

  /**
   * Detect scanner entry events for user monitored symbols
   */
  async detectScannerEvents(userId, symbols = []) {
    const events = [];
    try {
      const scanPreset = {
        name: "Momentum Confluence Scan",
        conditions: [
          { indicator: "SMA", period: 20, operator: "GREATER_THAN", compareTo: { type: "SMA", period: 50 } },
          { indicator: "RSI", period: 14, operator: "GREATER_THAN", value: 50 },
          { indicator: "VOLUME_SMA", period: 20, operator: "GREATER_THAN", value: 1.1 }
        ]
      };

      const scanResult = await marketScannerService.runScan(scanPreset, {
        symbols: symbols.length > 0 ? symbols : ["TCS", "INFY", "RELIANCE"]
      });

      if (scanResult?.matches) {
        for (const match of scanResult.matches) {
          if (match.conditionCoverage >= 0.66) {
            const dedupeKey = this.generateDedupeKey(userId, match.symbol, "SCANNER_ENTRY");
            events.push({
              user: userId,
              symbol: match.symbol,
              eventType: "SCANNER_ENTRY",
              severity: match.conditionCoverage >= 1.0 ? "SIGNIFICANT" : "WATCH",
              category: "SCANNER",
              title: `${match.symbol} Matched Scanner Criteria`,
              description: `${match.symbol} satisfied ${match.matchedConditions?.length || 2} of 3 conditions in Momentum Confluence Scan.`,
              observedData: [
                { metric: "matchScore", value: match.matchScore, unit: "", provider: "marketScannerService" },
                { metric: "conditionCoverage", value: match.conditionCoverage, unit: "ratio", provider: "marketScannerService" },
                { metric: "rsi", value: match.indicators?.RSI || null, unit: "", provider: "marketScannerService" }
              ],
              sourceReferences: [
                { sourceType: "SCANNER", sourceId: "momentum-confluence", details: { matches: match.matchedConditions } }
              ],
              currentValue: match.price || null,
              provider: "marketScannerService",
              dedupeKey,
              tags: [match.symbol, "SCANNER", "MOMENTUM"]
            });
          }
        }
      }
    } catch (err) {
      console.warn("Scanner event detection error:", err.message);
    }
    return events;
  }

  /**
   * Detect triggered alerts
   */
  async detectAlertEvents(userId) {
    const events = [];
    try {
      const triggeredAlerts = await AlertModel.find({
        user: userId,
        triggeredAt: { $ne: null }
      }).sort({ triggeredAt: -1, updatedAt: -1 }).limit(10).lean();

      for (const alert of triggeredAlerts) {
        const dedupeKey = this.generateDedupeKey(userId, alert.symbol, "ALERT_TRIGGERED", alert.updatedAt);
        events.push({
          user: userId,
          symbol: alert.symbol,
          eventType: "ALERT_TRIGGERED",
          severity: "SIGNIFICANT",
          category: "ALERT",
          title: `${alert.symbol} Price Alert Triggered`,
          description: `Price alert was triggered: ${alert.symbol} ${alert.condition} ₹${alert.targetPrice} (Trigger price: ₹${alert.triggerPrice || alert.targetPrice}).`,
          observedData: [
            { metric: "targetPrice", value: alert.targetPrice, unit: "₹", provider: "alertService" },
            { metric: "triggerPrice", value: alert.triggerPrice || alert.targetPrice, unit: "₹", provider: "alertService" }
          ],
          sourceReferences: [
            { sourceType: "ALERT", sourceId: String(alert._id), details: { condition: alert.condition } }
          ],
          currentValue: alert.triggerPrice || alert.targetPrice,
          previousValue: alert.targetPrice,
          provider: "alertService",
          dedupeKey,
          tags: [alert.symbol, "ALERT", alert.condition]
        });
      }
    } catch (err) {
      console.warn("Alert event detection error:", err.message);
    }
    return events;
  }

  /**
   * Event Correlation & Clustering Engine (WOW Feature)
   * Combines multiple co-occurring signals into a single unified Event Cluster
   */
  correlateAndClusterEvents(userId, rawEvents = []) {
    const symbolMap = new Map();

    // Group events by symbol
    for (const evt of rawEvents) {
      if (!symbolMap.has(evt.symbol)) {
        symbolMap.set(evt.symbol, []);
      }
      symbolMap.get(evt.symbol).push(evt);
    }

    const finalEvents = [];

    for (const [symbol, symEvents] of symbolMap.entries()) {
      if (symEvents.length >= 2) {
        // Multi-signal confluence detected! Cluster into a CORRELATED_EVENT
        const clusterId = `cluster_${String(userId).slice(-4)}_${symbol}_${Date.now()}`;
        const eventTypes = symEvents.map(e => e.eventType);
        const hasPrice = eventTypes.includes("PRICE_MOVE");
        const hasVolume = eventTypes.includes("VOLUME_SURGE");
        const hasScanner = eventTypes.includes("SCANNER_ENTRY");

        const primaryPriceEvent = symEvents.find(e => e.eventType === "PRICE_MOVE") || symEvents[0];
        const changePct = primaryPriceEvent.changePercent || 0;

        const correlatedSignals = symEvents.map(e => ({
          symbol: e.symbol,
          eventType: e.eventType,
          description: e.description,
          metric: e.observedData?.[0]?.metric || e.eventType,
          value: e.observedData?.[0]?.value || null,
          severity: e.severity
        }));

        const clusterDedupeKey = this.generateDedupeKey(userId, symbol, "CORRELATED_EVENT");

        const correlatedEvent = {
          user: userId,
          symbol,
          eventType: "CORRELATED_EVENT",
          severity: symEvents.length >= 3 || (hasPrice && hasVolume && hasScanner) ? "CRITICAL" : "SIGNIFICANT",
          category: symEvents.some(e => e.category === "PORTFOLIO") ? "PORTFOLIO" : "WATCHLIST",
          title: `${symbol} Momentum Confluence (${symEvents.length} Signals)`,
          description: `Multiple correlated market signals converged on ${symbol}: ${symEvents.map(e => e.title).join("; ")}.`,
          observedData: symEvents.flatMap(e => e.observedData || []),
          sourceReferences: symEvents.flatMap(e => e.sourceReferences || []),
          previousValue: primaryPriceEvent.previousValue,
          currentValue: primaryPriceEvent.currentValue,
          changeValue: primaryPriceEvent.changeValue,
          changePercent: changePct,
          provider: primaryPriceEvent.provider,
          dedupeKey: clusterDedupeKey,
          clusterId,
          correlatedSignals,
          tags: [symbol, "CONFLUENCE", "CORRELATED", ...new Set(symEvents.flatMap(e => e.tags || []))]
        };

        // Also assign clusterId to individual sub-events
        symEvents.forEach(e => {
          e.clusterId = clusterId;
          finalEvents.push(e);
        });

        finalEvents.push(correlatedEvent);
      } else {
        // Single event
        finalEvents.push(symEvents[0]);
      }
    }

    return finalEvents;
  }

  /**
   * Main Evaluation Pipeline: Detects, correlates, deduplicates, and saves events safely
   */
  async evaluateMarketEvents(userId, options = {}) {
    const { specificSymbols = null } = options;
    const symbols = specificSymbols || await this.getMonitoredSymbols(userId);

    // 1. Gather raw signals in parallel
    const [priceVolEvents, scannerEvents, alertEvents] = await Promise.all([
      Promise.all(symbols.map(s => this.detectPriceAndVolumeEvents(userId, s))).then(res => res.flat()),
      this.detectScannerEvents(userId, symbols),
      this.detectAlertEvents(userId)
    ]);

    const allRaw = [...priceVolEvents, ...scannerEvents, ...alertEvents];

    // 2. Correlate & Cluster
    const correlated = this.correlateAndClusterEvents(userId, allRaw);

    // 3. Upsert deduplicated records into MongoDB
    const persistedEvents = [];
    for (const evtData of correlated) {
      try {
        const saved = await MarketEvent.findOneAndUpdate(
          { user: userId, dedupeKey: evtData.dedupeKey },
          { $setOnInsert: evtData },
          { upsert: true, new: true }
        );
        persistedEvents.push(saved);
      } catch (err) {
        // Duplicate key or write collision handled safely
      }
    }

    return persistedEvents;
  }

  /**
   * Get paginated events for authenticated user
   */
  async getEvents(userId, query = {}) {
    const {
      severity,
      symbol,
      category,
      isRead,
      page = 1,
      limit = 20
    } = query;

    const filter = { user: userId, isDismissed: false };

    if (severity) filter.severity = severity.toUpperCase();
    if (symbol) filter.symbol = symbol.toUpperCase();
    if (category) filter.category = category.toUpperCase();
    if (isRead !== undefined) filter.isRead = isRead === 'true' || isRead === true;

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const numLimit = Math.min(100, Math.max(1, Number(limit)));

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
      totalPages: Math.ceil(total / numLimit) || 1
    };
  }

  /**
   * Get single event with isolation check
   */
  async getEventById(userId, eventId) {
    return MarketEvent.findOne({ _id: eventId, user: userId }).lean();
  }

  /**
   * Mark event as read
   */
  async markRead(userId, eventId) {
    return MarketEvent.findOneAndUpdate(
      { _id: eventId, user: userId },
      { $set: { isRead: true } },
      { new: true }
    );
  }

  /**
   * Mark all events for user as read
   */
  async markAllRead(userId) {
    const result = await MarketEvent.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );
    return { updatedCount: result.modifiedCount };
  }

  /**
   * Dismiss event (for feed filtering without deleting underlying evidence)
   */
  async dismissEvent(userId, eventId) {
    return MarketEvent.findOneAndUpdate(
      { _id: eventId, user: userId },
      { $set: { isDismissed: true } },
      { new: true }
    );
  }
}

module.exports = new MarketEventService();
