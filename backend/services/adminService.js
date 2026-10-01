const { UserModel } = require("../models/UserModel");
const { OrganizationModel } = require("../models/OrganizationModel");
const { MembershipModel } = require("../models/MembershipModel");
const { UsageEventModel } = require("../models/UsageEventModel");
const { SystemEventModel } = require("../models/SystemEventModel");
const marketDataService = require("./marketDataService");

// In-memory provider telemetry tracker
const providerTelemetry = {
  TWELVE_DATA: {
    name: "Twelve Data",
    status: "HEALTHY",
    latencyMs: 180,
    lastSuccess: new Date(),
    errorCount: 0
  },
  ALPHA_VANTAGE: {
    name: "Alpha Vantage",
    status: "HEALTHY",
    latencyMs: 240,
    lastSuccess: new Date(),
    errorCount: 0
  },
  MOCK: {
    name: "Internal Deterministic Mock",
    status: "HEALTHY",
    latencyMs: 5,
    lastSuccess: new Date(),
    errorCount: 0
  }
};

class AdminService {
  /**
   * Scrub sensitive tokens, secrets, passwords, or connection strings
   */
  sanitize(obj) {
    if (!obj || typeof obj !== "object") return obj;

    const SENSITIVE_KEYS = ["password", "jwt", "token", "apikey", "secret", "authorization", "mongourl", "cookie"];
    const cleaned = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
        cleaned[key] = "[REDACTED]";
      } else if (value && typeof value === "object") {
        cleaned[key] = this.sanitize(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Log an operational or security system event
   */
  async logSystemEvent(type, severity, message, details = {}, userId = null, ip = "127.0.0.1") {
    const cleanDetails = this.sanitize(details);
    const event = await SystemEventModel.create({
      type,
      severity,
      message,
      details: cleanDetails,
      userId,
      ip,
      timestamp: new Date()
    });

    if (type === "PROVIDER_FAILURE") {
      const provKey = details?.provider?.toUpperCase() || "TWELVE_DATA";
      if (providerTelemetry[provKey]) {
        providerTelemetry[provKey].errorCount += 1;
        providerTelemetry[provKey].status = "DEGRADED";
      }
    }

    return event;
  }

  /**
   * High-level admin dashboard overview
   */
  async getOverview() {
    const [
      totalUsers,
      totalOrganizations,
      totalEvents,
      aiRequestCount,
      backtestCount,
      workflowCount,
      scanCount,
      systemErrorCount
    ] = await Promise.all([
      UserModel.countDocuments(),
      OrganizationModel.countDocuments(),
      UsageEventModel.countDocuments(),
      UsageEventModel.countDocuments({ feature: "aiRequests" }),
      UsageEventModel.countDocuments({ feature: "backtests" }),
      UsageEventModel.countDocuments({ feature: "workflowRuns" }),
      UsageEventModel.countDocuments({ feature: "scans" }),
      SystemEventModel.countDocuments({ severity: { $in: ["ERROR", "CRITICAL"] } })
    ]);

    const errorRate = totalEvents > 0 ? Number(((systemErrorCount / totalEvents) * 100).toFixed(2)) : 0;

    return {
      metrics: {
        users: totalUsers,
        organizations: totalOrganizations,
        activeUsers: totalUsers,
        totalApiRequests: totalEvents,
        researchRequests: totalEvents,
        aiRequests: aiRequestCount,
        backtestJobs: backtestCount,
        workflowExecutions: workflowCount,
        scans: scanCount,
        providerFailures: systemErrorCount,
        errorRatePercent: errorRate,
        averageLatencyMs: 42
      },
      providers: providerTelemetry,
      timestamp: new Date()
    };
  }

  /**
   * Paginated user list for admin management
   */
  async getUsers(page = 1, limit = 20) {
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const numLimit = Math.min(100, Math.max(1, Number(limit)));

    const [users, total] = await Promise.all([
      UserModel.find({}, { password: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numLimit)
        .lean(),
      UserModel.countDocuments()
    ]);

    return {
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / numLimit) || 1
    };
  }

  /**
   * Paginated organization list for admin
   */
  async getOrganizations(page = 1, limit = 20) {
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const numLimit = Math.min(100, Math.max(1, Number(limit)));

    const [orgs, total] = await Promise.all([
      OrganizationModel.find()
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numLimit)
        .lean(),
      OrganizationModel.countDocuments()
    ]);

    return {
      organizations: orgs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / numLimit) || 1
    };
  }

  /**
   * Real-time provider health status
   */
  async getProviderHealth() {
    // Ping marketDataService to refresh latency
    const start = Date.now();
    try {
      await marketDataService.getQuote("TCS");
      providerTelemetry.TWELVE_DATA.latencyMs = Date.now() - start;
      providerTelemetry.TWELVE_DATA.lastSuccess = new Date();
      providerTelemetry.TWELVE_DATA.status = "HEALTHY";
    } catch (err) {
      providerTelemetry.TWELVE_DATA.errorCount += 1;
      providerTelemetry.TWELVE_DATA.status = "DEGRADED";
    }

    return {
      providers: providerTelemetry,
      checkedAt: new Date()
    };
  }

  /**
   * Paginated system events stream
   */
  async getSystemEvents(query = {}) {
    const { type, severity, page = 1, limit = 50 } = query;
    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const numLimit = Math.min(100, Math.max(1, Number(limit)));

    const [events, total] = await Promise.all([
      SystemEventModel.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(numLimit)
        .lean(),
      SystemEventModel.countDocuments(filter)
    ]);

    return {
      events,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / numLimit) || 1
    };
  }
}

module.exports = new AdminService();
