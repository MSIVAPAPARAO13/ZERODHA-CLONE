/**
 * TradeFlow Tiered SaaS Plan Configuration
 * Central source of truth for subscription quotas and feature permissions.
 */

const PLANS = {
  FREE: {
    id: "FREE",
    name: "TradeFlow Free",
    description: "Essential research and paper-trading workspace for individual investors.",
    priceMonthlyInr: 0,
    limits: {
      aiRequests: 25,
      backtests: 15,
      scans: 50,
      researchSessions: 10,
      automations: 3,
      workflowRuns: 20
    },
    features: [
      "Standard Market Data (Delayed/EOD)",
      "Single-Asset Backtesting",
      "Manual Journal Entries",
      "Basic Scenario Shock Analysis"
    ]
  },
  PRO: {
    id: "PRO",
    name: "TradeFlow Pro",
    description: "Advanced quantitative intelligence, research agent, and automated surveillance.",
    priceMonthlyInr: 1999,
    limits: {
      aiRequests: 500,
      backtests: 250,
      scans: 1000,
      researchSessions: 150,
      automations: 25,
      workflowRuns: 300
    },
    features: [
      "Real-Time Provider Access",
      "Multi-Asset Strategy Lab & Robustness",
      "Autonomous Research Agent",
      "Scenario & Stress Testing Studio",
      "Automated Daily & Weekly Digests",
      "Priority Backtest Execution"
    ]
  },
  TEAM: {
    id: "TEAM",
    name: "TradeFlow Team",
    description: "Enterprise research desk collaboration, multi-user workspaces, and pooled compute.",
    priceMonthlyInr: 7999,
    limits: {
      aiRequests: 5000,
      backtests: 2500,
      scans: 10000,
      researchSessions: 1500,
      automations: 100,
      workflowRuns: 3000
    },
    features: [
      "All Pro Features Included",
      "Unlimited Organization Workspaces",
      "Shared Research & Counter-Evidence",
      "Versioned Research Hypotheses",
      "Shared Strategy Experiments",
      "Role-Based Access Control (RBAC)",
      "Audit & Compliance Logging"
    ]
  }
};

function getPlan(planId = "FREE") {
  const normalized = (planId || "FREE").toUpperCase();
  return PLANS[normalized] || PLANS.FREE;
}

function getPlanLimits(planId = "FREE") {
  return getPlan(planId).limits;
}

module.exports = {
  PLANS,
  getPlan,
  getPlanLimits
};
