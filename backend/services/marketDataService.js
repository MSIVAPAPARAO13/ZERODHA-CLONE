const mockProvider = require("../providers/MockMarketDataProvider");
const twelveDataProvider = require("../providers/TwelveDataProvider");
const alphaVantageProvider = require("../providers/AlphaVantageProvider");

class MarketDataService {
  constructor() {
    this.primaryType = (process.env.MARKET_DATA_PROVIDER || "mock").toLowerCase();
    this.provider = this.resolveProvider(this.primaryType);
    this.fallbackProvider = mockProvider; // Deterministic internal fallback
    this.cache = new Map(); // Simple in-memory timestamped cache
    this.CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache
  }

  resolveProvider(type) {
    if (type === "twelvedata" && process.env.TWELVE_DATA_API_KEY) {
      return twelveDataProvider;
    }
    if (type === "alphavantage" && process.env.ALPHA_VANTAGE_API_KEY) {
      return alphaVantageProvider;
    }
    return mockProvider;
  }

  /**
   * Resilient execute wrapper implementing:
   * Primary -> Fallback Provider -> Timestamped Cache -> DATA_UNAVAILABLE
   */
  async executeWithFallback(operationName, key, fn, fallbackFn) {
    // 0a. Check Fresh Cache first (within 60 seconds)
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      if (Date.now() - entry.timestamp < 60 * 1000) {
        return entry.data;
      }
    }

    // 0b. Circuit Breaker: If primary recently rate limited, immediately invoke fallback
    if (this.rateLimitUntil && Date.now() < this.rateLimitUntil) {
      if (fallbackFn) {
        try {
          const fallbackResult = await fallbackFn();
          if (fallbackResult) {
            const tagged = {
              ...fallbackResult,
              providerNotice: "SERVED_VIA_FALLBACK_PROVIDER",
              timestamp: new Date()
            };
            this.cache.set(key, { data: tagged, timestamp: Date.now() });
            return tagged;
          }
        } catch (e) {}
      }
    }

    // 1. Try Primary
    try {
      const result = await fn();
      if (result) {
        this.cache.set(key, { data: result, timestamp: Date.now() });
        return result;
      }
    } catch (primaryErr) {
      // Primary failed; log warning and trigger circuit breaker cooldown if rate limited
      if (primaryErr.message && primaryErr.message.includes('RATE_LIMITED')) {
        this.rateLimitUntil = Date.now() + 60 * 1000; // 60s cooldown
      }
      console.warn(`[MarketDataService] Primary provider failed for ${operationName}(${key}): ${primaryErr.message}. Attempting fallback...`);
    }

    // 2. Try Fallback Provider
    if (fallbackFn) {
      try {
        const fallbackResult = await fallbackFn();
        if (fallbackResult) {
          const tagged = {
            ...fallbackResult,
            providerNotice: "SERVED_VIA_FALLBACK_PROVIDER",
            timestamp: new Date()
          };
          this.cache.set(key, { data: tagged, timestamp: Date.now() });
          return tagged;
        }
      } catch (fallbackErr) {
        console.warn(`[MarketDataService] Fallback provider also failed for ${operationName}(${key}): ${fallbackErr.message}. Checking cache...`);
      }
    }

    // 3. Check Timestamped Cache
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      const ageMs = Date.now() - entry.timestamp;
      if (ageMs <= this.CACHE_TTL_MS) {
        return {
          ...entry.data,
          cached: true,
          isStale: true,
          cachedAt: new Date(entry.timestamp),
          cacheAgeSeconds: Math.round(ageMs / 1000)
        };
      }
    }

    // 4. DATA_UNAVAILABLE
    throw new Error(`DATA_UNAVAILABLE: Real-time market data for '${key}' is currently unreachable across all providers.`);
  }

  async getQuote(symbol) {
    const sym = String(symbol).toUpperCase().trim();
    return this.executeWithFallback(
      "getQuote",
      sym,
      () => this.provider.getQuote(sym),
      () => this.fallbackProvider.getQuote(sym)
    );
  }

  async getQuotes(symbols = []) {
    if (!symbols || symbols.length === 0) {
      if (this.provider && typeof this.provider.getQuotes === 'function') {
        return this.provider.getQuotes();
      }
      return this.fallbackProvider.getQuotes();
    }
    return Promise.all(symbols.map(s => this.getQuote(s).catch(() => ({ symbol: s, status: "DATA_UNAVAILABLE" }))));
  }

  async searchSymbols(query) {
    try {
      return await this.provider.searchSymbols(query);
    } catch (err) {
      return this.fallbackProvider.searchSymbols(query);
    }
  }

  async getHistoricalData(symbol, options = {}) {
    const sym = String(symbol).toUpperCase().trim();
    const cacheKey = `hist_${sym}_${options.interval || "1day"}`;
    return this.executeWithFallback(
      "getHistoricalData",
      cacheKey,
      () => (this.provider.getHistoricalData ? this.provider.getHistoricalData(sym, options) : null),
      () => (this.fallbackProvider.getHistoricalData ? this.fallbackProvider.getHistoricalData(sym, options) : null)
    );
  }

  async getTechnicalIndicators(symbol, indicator, options = {}) {
    const sym = String(symbol).toUpperCase().trim();
    const cacheKey = `tech_${sym}_${indicator}`;
    return this.executeWithFallback(
      "getTechnicalIndicators",
      cacheKey,
      () => (this.provider.getTechnicalIndicators ? this.provider.getTechnicalIndicators(sym, indicator, options) : null),
      () => (this.fallbackProvider.getTechnicalIndicators ? this.fallbackProvider.getTechnicalIndicators(sym, indicator, options) : null)
    );
  }

  async getNewsSentiment(symbol, options = {}) {
    const sym = String(symbol).toUpperCase().trim();
    const cacheKey = `news_${sym}`;
    return this.executeWithFallback(
      "getNewsSentiment",
      cacheKey,
      () => (this.provider.getNewsSentiment ? this.provider.getNewsSentiment(sym, options) : null),
      () => (this.fallbackProvider.getNewsSentiment ? this.fallbackProvider.getNewsSentiment(sym, options) : null)
    );
  }
}

module.exports = new MarketDataService();
