const marketDataService = require("./marketDataService");
const marketScannerService = require("./marketScannerService");
const marketEventService = require("./marketEventService");
const portfolioIntelligenceService = require("./portfolioIntelligenceService");
const scenarioEngine = require("./scenarioEngine");
const backtestEngine = require("./backtestEngine");
const strategyRobustnessService = require("./strategyRobustnessService");
const decisionJournalService = require("./decisionJournalService");
const researchCopilotService = require("./researchCopilotService");
const { TradeJournalModel } = require("../models/TradeJournalModel");

const MAX_AGENT_ITERATIONS = 5;

const ALLOWED_TOOLS = [
  "getQuote",
  "getHistoricalData",
  "runScanner",
  "getMarketEvents",
  "getPortfolio",
  "runScenario",
  "runBacktest",
  "runRobustness",
  "getJournal",
  "getDecision",
  "getResearchSession"
];

class ResearchAgentService {
  /**
   * Controlled execution of an allowlisted research tool
   */
  async executeTool(userId, toolName, params = {}) {
    if (!ALLOWED_TOOLS.includes(toolName)) {
      throw new Error(`TOOL_NOT_PERMITTED: '${toolName}' is not in the controlled agent registry.`);
    }

    const start = Date.now();

    try {
      let output = null;

      switch (toolName) {
        case "getQuote": {
          const sym = (params.symbol || "TCS").toUpperCase();
          output = await marketDataService.getQuote(sym);
          break;
        }
        case "getHistoricalData": {
          const sym = (params.symbol || "TCS").toUpperCase();
          output = await marketDataService.getHistoricalData(sym, { interval: params.interval || "1day" });
          break;
        }
        case "runScanner": {
          output = await marketScannerService.runCustomScan({
            name: "Agent Quick Scan",
            universe: params.universe || ["TCS", "INFY", "RELIANCE"],
            conditions: params.conditions || [
              { indicator: "PRICE_CHANGE", period: 1, operator: "GREATER_THAN", threshold: 0 }
            ]
          });
          break;
        }
        case "getMarketEvents": {
          output = await marketEventService.getEvents(userId, { symbol: params.symbol, limit: 10 });
          break;
        }
        case "getPortfolio": {
          output = await portfolioIntelligenceService.getPortfolioIntelligence(userId);
          break;
        }
        case "runScenario": {
          output = await scenarioEngine.runScenario(userId, {
            name: params.name || "Agent Scenario Shock",
            shocks: params.shocks || [{ targetType: "SECTOR", target: "Information Technology", percentage: -5 }]
          });
          break;
        }
        case "runBacktest": {
          const strat = params.strategy || {
            name: "Agent Default Momentum",
            universe: [params.symbol || "TCS"],
            entryRules: [{ indicator: "SMA", params: { fastPeriod: 10, slowPeriod: 30 }, condition: "CROSS_ABOVE" }]
          };
          output = await backtestEngine.runBacktest(strat, params.options || {}, userId);
          break;
        }
        case "runRobustness": {
          const strat = params.strategy || {
            name: "Agent Default Momentum",
            universe: [params.symbol || "TCS"],
            entryRules: [{ indicator: "SMA", params: { fastPeriod: 10, slowPeriod: 30 }, condition: "CROSS_ABOVE" }]
          };
          output = await strategyRobustnessService.evaluateStrategyRobustness(strat, params.options || {}, userId);
          break;
        }
        case "getJournal": {
          const query = { user: userId };
          if (params.symbol) query.symbol = params.symbol.toUpperCase();
          output = await TradeJournalModel.find(query).limit(5).lean();
          break;
        }
        case "getDecision": {
          output = await decisionJournalService.getDecisions(userId, { symbol: params.symbol });
          break;
        }
        case "getResearchSession": {
          output = await researchCopilotService.getResearchSession(userId, params.sessionId || "latest");
          break;
        }
        default:
          throw new Error(`UNHANDLED_TOOL: ${toolName}`);
      }

      return {
        toolName,
        params,
        success: true,
        durationMs: Date.now() - start,
        data: output
      };
    } catch (err) {
      return {
        toolName,
        params,
        success: false,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }

  /**
   * Synthesize a research plan deterministically from the user's question
   */
  synthesizePlan(question) {
    const q = question.toLowerCase();
    const plannedTools = [];

    // Extract symbol if present
    const symbols = ["TCS", "INFY", "RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "WIPRO"];
    let detectedSymbol = "TCS";
    for (const s of symbols) {
      if (q.includes(s.toLowerCase())) {
        detectedSymbol = s;
        break;
      }
    }

    // Step 1: Always check real quote
    plannedTools.push({ toolName: "getQuote", params: { symbol: detectedSymbol } });

    // Step 2: If query mentions event / news / breakout
    if (q.includes("event") || q.includes("breakout") || q.includes("change") || q.includes("today")) {
      plannedTools.push({ toolName: "getMarketEvents", params: { symbol: detectedSymbol } });
    }

    // Step 3: If query mentions portfolio / holdings / exposure / risk
    if (q.includes("portfolio") || q.includes("hold") || q.includes("exposure") || q.includes("risk")) {
      plannedTools.push({ toolName: "getPortfolio", params: {} });
    }

    // Step 4: If query mentions scenario / crash / drop / stress
    if (q.includes("scenario") || q.includes("drop") || q.includes("crash") || q.includes("stress")) {
      plannedTools.push({
        toolName: "runScenario",
        params: { name: `Agent Shock on ${detectedSymbol}`, shocks: [{ targetType: "SECTOR", target: "Information Technology", percentage: -10 }] }
      });
    }

    // Step 5: If query mentions strategy / backtest / test / momentum
    if (q.includes("strategy") || q.includes("backtest") || q.includes("momentum") || q.includes("robust")) {
      plannedTools.push({ toolName: "runBacktest", params: { symbol: detectedSymbol } });
    }

    // Ensure at least 2 tools are planned, capped at MAX_AGENT_ITERATIONS
    if (plannedTools.length < 2) {
      plannedTools.push({ toolName: "getMarketEvents", params: { symbol: detectedSymbol } });
    }

    return {
      detectedSymbol,
      tools: plannedTools.slice(0, MAX_AGENT_ITERATIONS)
    };
  }

  /**
   * Main controlled research agent cycle
   */
  async runAgent(userId, payload) {
    const { question, maxIterations = 5 } = payload;
    if (!question || typeof question !== "string") {
      throw new Error("QUESTION_REQUIRED");
    }

    const effectiveLimit = Math.min(Math.max(Number(maxIterations) || 5, 1), MAX_AGENT_ITERATIONS);

    // Phase 1: Planning
    const plan = this.synthesizePlan(question);
    const executionQueue = plan.tools.slice(0, effectiveLimit);

    // Phase 2: Evidence Collection Loop
    const toolExecutions = [];
    const collectedEvidence = [];

    for (let i = 0; i < executionQueue.length; i++) {
      const { toolName, params } = executionQueue[i];
      const result = await this.executeTool(userId, toolName, params);
      toolExecutions.push({
        iteration: i + 1,
        toolName,
        params,
        durationMs: result.durationMs,
        success: result.success
      });

      if (result.success && result.data) {
        collectedEvidence.push({
          sourceTool: toolName,
          summary: `Harvested data from ${toolName}`,
          data: result.data
        });
      }
    }

    // Phase 3: Analysis & Findings
    const quoteItem = collectedEvidence.find(e => e.sourceTool === "getQuote")?.data;
    const eventsItem = collectedEvidence.find(e => e.sourceTool === "getMarketEvents")?.data;
    const portfolioItem = collectedEvidence.find(e => e.sourceTool === "getPortfolio")?.data;
    const scenarioItem = collectedEvidence.find(e => e.sourceTool === "runScenario")?.data;
    const backtestItem = collectedEvidence.find(e => e.sourceTool === "runBacktest")?.data;

    const findings = [];
    if (quoteItem) {
      findings.push(`Current Observable Price: ₹${quoteItem.price || quoteItem.lastPrice} (Day Change: ${quoteItem.percentChange || quoteItem.changePercent || 0}%).`);
    }
    if (eventsItem) {
      const count = Array.isArray(eventsItem) ? eventsItem.length : (eventsItem.events?.length || 0);
      findings.push(`Market Signals: ${count} verified market events detected in surveillance window.`);
    }
    if (portfolioItem) {
      findings.push(`Portfolio Context: Total portfolio capital ₹${portfolioItem.totalCapital ?? portfolioItem.totalEquity}, cash weight ${(portfolioItem.cashWeight * 100).toFixed(1)}%.`);
    }
    if (scenarioItem) {
      findings.push(`Scenario Stress Result: Modelled impact of ${scenarioItem.modeledResult?.percentageImpact?.toFixed(2)}% under tested parameters.`);
    }
    if (backtestItem) {
      findings.push(`Historical Backtest: Strategy baseline return of ${backtestItem.metrics?.returnPercentage}% across ${backtestItem.metrics?.tradeCount} trades.`);
    }

    // Phase 4: Gaps & Unknowns
    const unknowns = [
      "Institutional order flow and block trades are unobserved.",
      "Corporate earnings calendar and quarterly filings are not factored into price stream.",
      "Macroeconomic releases (CPI, Interest Rates) are not directly modeled."
    ];

    const limitations = [
      `Execution bounded to ${toolExecutions.length} of max ${MAX_AGENT_ITERATIONS} allowlisted tool iterations.`,
      "Zero direct database write permissions or code execution.",
      "Outputs represent educational research synthesis, not financial recommendations."
    ];

    // Phase 5: Generate Follow-Up Research Questions
    const followUpQuestions = [
      `How does the volume profile for ${plan.detectedSymbol} compare across different market regimes?`,
      `Would you like to run a slippage robustness test on the ${plan.detectedSymbol} momentum strategy?`,
      `Would you like to simulate a severe (-20%) sector drawdown scenario on your portfolio?`
    ];

    return {
      question,
      plan: {
        detectedSymbol: plan.detectedSymbol,
        plannedToolCount: executionQueue.length,
        tools: executionQueue.map(t => t.toolName)
      },
      toolExecutions,
      evidenceSummary: {
        totalItemsHarvested: collectedEvidence.length,
        toolsSuccessfullyExecuted: toolExecutions.filter(t => t.success).length
      },
      findings,
      unknowns,
      limitations,
      followUpQuestions,
      disclaimer: "RESEARCH_AGENT_EVIDENCE — GROUNDED FACTUAL SYNTHESIS, NOT INVESTMENT ADVICE OR RECOMMENDATIONS"
    };
  }
}

module.exports = new ResearchAgentService();
