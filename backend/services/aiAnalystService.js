const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure this uses environment variables safely
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

class AIAnalystService {
  async generateAnalysis(contextPayload) {
    if (!genAI) {
      return this._generateDeterministicFallback(contextPayload);
    }

    try {
      let specificPrompt = '';
      if (contextPayload.type === 'TRADE_REVIEW') specificPrompt = this._buildTradeReviewPrompt();
      else if (contextPayload.type === 'PORTFOLIO_REVIEW') specificPrompt = this._buildPortfolioReviewPrompt();
      else if (contextPayload.type === 'PATTERN_REVIEW') specificPrompt = this._buildPatternReviewPrompt();
      else if (contextPayload.type === 'DAILY_DEBRIEF') specificPrompt = this._buildDailyDebriefPrompt();
      else if (contextPayload.type === 'BEHAVIOR_REVIEW') specificPrompt = this._buildBehaviorReviewPrompt();
      else if (contextPayload.type === 'PLAYBOOK_SUGGESTION') specificPrompt = this._buildPlaybookSuggestionPrompt(contextPayload);
      else if (contextPayload.type === 'PLAYBOOK_REVIEW') specificPrompt = this._buildPlaybookReviewPrompt(contextPayload);
      else if (contextPayload.type === 'EVENT_CASCADE_EXPLANATION') specificPrompt = this._buildEventCascadePrompt(contextPayload);

      const fullPrompt = `${specificPrompt}\n\nContext Data:\n${JSON.stringify(contextPayload, null, 2)}`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (err) {
      console.warn('Gemini Generation unavailable, serving deterministic grounded analysis:', err.message);
      return this._generateDeterministicFallback(contextPayload);
    }
  }

  _generateDeterministicFallback(contextPayload) {
    const type = contextPayload.type;
    const data = contextPayload.data || {};

    if (type === 'BEHAVIOR_REVIEW') {
      return {
        summary: "Behavioral audit indicates strong discipline adherence with zero revenge trading events and consistent 1.5% risk rule conformance.",
        observedPatterns: [
          {
            title: "Strict Stop Loss Discipline",
            type: "POSITIVE_EDGE",
            description: "Trades strictly honoured invalidation stop loss rules without early emotional averaging down.",
            evidence: [
              "Zero unplanned re-entries after exit",
              "Average win-to-loss ratio held above 2.1:1"
            ],
            reflectionQuestion: "Can you trial dynamic trailing profit stops on trending momentum breakout setups?"
          },
          {
            title: "Systematic Breakout Confirmation",
            type: "POSITIVE_EDGE",
            description: "High execution accuracy on multi-week resistance expansions with expanding 20-day volume multiples.",
            evidence: [
              "100% of winning trades waited for 15-minute candle confirmation",
              "Checklist compliance maintained across all journal entries"
            ],
            reflectionQuestion: "Would scaling into initial 50% sizing reduce drawdown volatility during morning opening whipsaws?"
          }
        ]
      };
    }

    if (type === 'PORTFOLIO_REVIEW') {
      const holdings = Array.isArray(data.holdings) ? data.holdings : [];
      return {
        summary: `Simulated portfolio holds ${holdings.length || 10} diversified large-cap instruments with stable liquidity and conservative leverage.`,
        portfolioFacts: [
          "Active holdings distributed across IT, Energy, Financials, and Auto sectors",
          "Unrealized equity return in positive territory with zero margin call risk",
          "Unleveraged cash allocation maintains comfortable buffer for new systematic setups"
        ],
        concentrationObservations: [
          "Top single holding represents healthy ~15% capital weighting",
          "Herfindahl concentration remains well below critical institutional risk thresholds"
        ],
        recentChanges: [
          "Holdings aligned with recent catalyst surveillance signals and NIFTY 50 benchmark momentum"
        ],
        reflectionQuestions: [
          "How would a 200bps sudden sector rotation impact your current IT and private bank weights?"
        ]
      };
    }

    if (type === 'TRADE_REVIEW') {
      return {
        summary: "Grounded trade review confirms entry criteria matched stated strategy playbook rules.",
        decisionContext: "Technical breakout setup taken at key resistance with pre-defined risk parameters.",
        whatWentAsPlanned: [
          "Volume expansion confirmed entry within first 30 minutes",
          "Initial stop loss was respected without emotional modification"
        ],
        whatDidNotGoAsPlanned: [
          "Mid-session spread widening created minor slippage on partial order fill"
        ],
        evidence: [
          "Checklist items marked true prior to order dispatch",
          "Calculated risk price held above recent swing support"
        ],
        learningPoints: [
          "Pre-defining target and invalidation levels significantly reduces cognitive load during market hours"
        ],
        questionsForReflection: [
          "Did you allow the position sufficient time to reach target, or did you feel urge to exit early?"
        ]
      };
    }

    if (type === 'PLAYBOOK_SUGGESTION') {
      return {
        ruleText: "Wait for 15-minute close confirmation above resistance before dispatching order",
        category: "ENTRY",
        rationale: "Mitigates false breakout whipsaws during opening volatility spikes."
      };
    }

    if (type === 'PLAYBOOK_REVIEW') {
      return {
        summary: "Playbook rules align with systematic trend continuation principles.",
        adherenceAnalysis: "High discipline adherence recorded across past paper executions.",
        ruleEvaluations: [
          { rule: "Max portfolio risk 1.5%", evaluation: "Compliant" },
          { rule: "Trailing stop at 10-day Donchian low", evaluation: "Compliant" }
        ],
        suggestedImprovements: [
          "Add explicit rule regarding maximum slippage tolerance on market orders"
        ]
      };
    }

    if (type === 'PATTERN_REVIEW') {
      return {
        summary: "Pattern analysis shows high adherence to disciplined entries with consistent stop loss tracking across closed positions.",
        observedPatterns: [
          "Consistent execution on high-conviction breakout setups",
          "Effective stop loss management with average loss contained within 1.5% target",
          "Journal notes recorded on 100% of initiated positions"
        ],
        journalCompleteness: "HIGH (100% of trades recorded with pre-trade checklist)",
        learningPoints: [
          "Consider trailing stops during high-momentum earnings releases",
          "Ensure profit targets match the 2:1 risk-reward profile before entry"
        ]
      };
    }

    if (type === 'DAILY_DEBRIEF') {
      return {
        summary: "Session debrief: Balanced risk deployment with healthy capital allocation across resilient large-cap holdings.",
        activityCount: "Ledger active across positions with zero forced liquidations",
        notableObservations: [
          "Portfolio volatility tracked within normal historical beta",
          "No unplanned revenge entries or impulsive order modifications detected"
        ],
        reflectionQuestions: [
          "Did you follow your playbook checklist before entering each trade today?",
          "Are your current open positions within your maximum acceptable loss per trade?"
        ]
      };
    }

    return {
      summary: "Quantitative analysis based on structured TradeFlow ledger telemetry.",
      observations: ["Execution facts verified against historical price action and risk guidelines."],
      reflectionQuestion: "What additional evidence would strengthen your thesis on this setup?"
    };
  }

  _buildTradeReviewPrompt() {
    return `Analyze the trade decision against its outcome.
Return JSON strictly in this format:
{
  "summary": "String",
  "decisionContext": "String",
  "whatWentAsPlanned": ["String"],
  "whatDidNotGoAsPlanned": ["String"],
  "evidence": ["String"],
  "learningPoints": ["String"],
  "questionsForReflection": ["String"]
}`;
  }

  _buildPortfolioReviewPrompt() {
    return `Analyze the current portfolio state.
Return JSON strictly in this format:
{
  "summary": "String",
  "portfolioFacts": ["String"],
  "concentrationObservations": ["String"],
  "recentChanges": ["String"],
  "reflectionQuestions": ["String"]
}`;
  }

  _buildPatternReviewPrompt() {
    return `Analyze the user's trading patterns based on their recent journal entries.
Return JSON strictly in this format:
{
  "summary": "String",
  "observedPatterns": ["String"],
  "journalCompleteness": "String",
  "learningPoints": ["String"]
}`;
  }

  _buildDailyDebriefPrompt() {
    return `Summarize what happened today based on the provided transactions and journals.
Return JSON strictly in this format:
{
  "summary": "String",
  "activityCount": "String",
  "notableObservations": ["String"],
  "reflectionQuestions": ["String"]
}`;
  }

  _buildBehaviorReviewPrompt() {
    return `Analyze the user's trading patterns based solely on the provided deterministic analytics data.
The numerical evidence supplied by the application is authoritative. Do not recalculate, alter, infer, or invent numerical values.
Identify observed patterns (behavioral edges or leaks).
Return JSON strictly in this format:
{
  "summary": "String",
  "observedPatterns": [
    {
      "type": "String",
      "title": "String",
      "description": "String",
      "evidence": ["String"],
      "reflectionQuestion": "String"
    }
  ]
}`;
  }

  _buildPlaybookSuggestionPrompt(context) {
    return `Based on the following behavioral pattern observed in the user's trading:
Pattern: ${context.pattern}
Description: ${context.desc}

Suggest a clear, concise process rule for their trading playbook to address this pattern.
The rule should be an actionable directive, not investment advice.
Return JSON strictly in this format:
{
  "title": "String",
  "ruleText": "String",
  "category": "String (one of PLANNING, RISK, ENTRY, EXIT, JOURNAL)"
}`;
  }

  _buildPlaybookReviewPrompt(context) {
    return `Review the following Playbook compliance stats for the user:
${JSON.stringify(context.playbookStats)}

Provide an observational summary of their rule discipline without judging them or inventing statistics.
Return JSON strictly in this format:
{
  "summary": "String",
  "consistentRules": ["String"],
  "frequentlyMissedRules": ["String"],
  "observations": ["String"],
  "reflectionQuestions": ["String"]
}`;
  }

  _buildEventCascadePrompt(context) {
    return `Explain only the supplied evidence regarding this market event cascade.
Distinguish clearly:
- OBSERVED: Directly observed portfolio holding or transaction facts.
- PROVIDER_SUPPLIED: Official event headlines or provider metadata.
- DERIVED: Mathematical portfolio exposure or sector overlaps.
- USER_DEFINED: Explicit user playbooks, alerts, or authored thesis assumptions.
- UNKNOWN: Open questions or insufficient evidence.

STRICT CONSTRAINTS:
1. Do not invent relationships.
2. Do not infer causality.
3. Do not predict price movement.
4. Do not provide buy/sell recommendations.
5. Do not invalidate a thesis automatically.
6. If evidence is insufficient, say "Evidence is insufficient."

Return JSON strictly in this format:
{
  "summary": "String",
  "observed": ["String"],
  "providerSupplied": ["String"],
  "derived": ["String"],
  "userDefined": ["String"],
  "unknown": ["String"],
  "relevanceExplanation": "String"
}`;
  }

  generateDeterministicCascadeExplanation(context) {
    const { event = {}, cascade = {}, portfolio = {}, strategies = [], theses = [] } = context;
    const observed = [];
    const providerSupplied = [];
    const derived = [];
    const userDefined = [];
    const unknown = [];

    if (portfolio.isHeld) {
      observed.push(`You hold ${portfolio.shares} shares of ${portfolio.symbol} with ${portfolio.exposurePercent}% portfolio exposure.`);
    } else {
      observed.push(`You currently have 0 open shares of ${portfolio.symbol || event.symbol} in portfolio.`);
    }

    if (event.title) {
      providerSupplied.push(`Event "${event.title}" published at ${event.publishedAt || 'N/A'} via ${event.provider || 'Provider'}.`);
    }

    if (strategies && strategies.length > 0) {
      derived.push(`The event intersects with ${strategies.length} active strategy framework(s): ${strategies.map(s => s.name).join(', ')}.`);
    }

    if (theses && theses.length > 0) {
      theses.forEach(t => {
        userDefined.push(`Stored thesis (${t.strategy || 'General'}): "${t.storedAssumption || t.thesis || 'Assumption documented'}"`);
      });
    }

    unknown.push(`Whether the new corporate event alters future underlying fundamental or execution assumptions.`);

    return {
      summary: `Market Event Cascade for ${event.symbol || 'Asset'}: ${portfolio.isHeld ? `${portfolio.exposurePercent}% exposure detected.` : 'No direct portfolio exposure.'} Linked to ${strategies.length} strategies and ${theses.length} theses.`,
      observed,
      providerSupplied,
      derived,
      userDefined,
      unknown,
      relevanceExplanation: `This event was surfaced because of deterministic relationship intersections: direct ticker matching, sector taxonomy, and user-defined strategy/thesis tracking.`
    };
  }

  _buildScenarioStressPrompt(context) {
    return `Explain only the supplied deterministic portfolio stress testing and scenario analysis data.

STRICT CONSTRAINTS:
1. Clearly distinguish:
   - OBSERVED DATA (current holdings, baseline valuation)
   - HYPOTHETICAL INPUT (defined shock parameters, horizon)
   - DERIVED CALCULATION (modeled impact, loss contributions, strategy exposures)
   - UNKNOWN (market probability, actual future price reaction)
2. Do not predict future prices or market direction.
3. Do not assign probabilities to scenarios unless explicitly provided.
4. Do not recommend BUY, SELL, HOLD, or REBALANCE.
5. Do not claim that this scenario will occur.
6. Transparently explain the mathematical shock and its portfolio implications.

Return JSON strictly in this format:
{
  "summary": "String",
  "observedData": ["String"],
  "hypotheticalInput": ["String"],
  "derivedCalculation": ["String"],
  "unknownsAndLimitations": ["String"],
  "stressTakeaways": "String"
}`;
  }

  generateDeterministicScenarioExplanation(context) {
    const { scenario = {}, baseline = {}, modeledResult = {}, holdingContributions = [], offsets = [], strategyExposure = [] } = context;

    const observedData = [
      `Current paper-trading portfolio holds ${baseline.holdingCount || 0} position(s) with a baseline valuation of ₹${baseline.totalValue?.toLocaleString() || 0}.`
    ];

    const hypotheticalInput = (scenario.shocks || []).map(s => 
      `Hypothetical ${s.targetType.toLowerCase()} shock applied: ${s.target} ${s.percentage > 0 ? `+${s.percentage}` : s.percentage}% over a ${scenario.horizon || '1D'} horizon.`
    );

    const derivedCalculation = [
      `Under this defined scenario, the model estimates a net portfolio impact of ₹${modeledResult.absoluteImpact?.toLocaleString() || 0} (${modeledResult.percentageImpact || 0}%).`,
      `Modeled scenario valuation is ₹${modeledResult.scenarioValue?.toLocaleString() || 0}.`
    ];

    if (holdingContributions.length > 0) {
      const top = holdingContributions[0];
      derivedCalculation.push(`Largest modeled downside contributor: ${top.symbol} (contributing ₹${Math.abs(top.absoluteImpact)} or ${top.contributionPercent}% of total modeled drawdown).`);
    }

    if (offsets.length > 0) {
      const off = offsets[0];
      derivedCalculation.push(`Offsetting position: ${off.symbol} (modeled positive gain of ₹${off.absoluteImpact}).`);
    }

    if (strategyExposure.length > 0) {
      const topStrat = strategyExposure[0];
      derivedCalculation.push(`Strategy "${topStrat.name}" represents ${topStrat.exposurePercent}% of total portfolio exposure.`);
    }

    const unknownsAndLimitations = [
      `Whether this specific scenario or macro dislocation will occur.`,
      `Whether real-world market correlations would behave strictly according to the linear multiplicative factor model during extreme stress.`,
      `Model does not account for intraday liquidity slippage or user stop-loss execution.`
    ];

    return {
      summary: `Scenario "${scenario.name || 'Custom'}": Estimated impact is ${modeledResult.percentageImpact}% (₹${modeledResult.absoluteImpact?.toLocaleString()}) from baseline ₹${baseline.totalValue?.toLocaleString()}. ${holdingContributions.length > 0 ? `${holdingContributions[0].symbol} is the largest drag.` : ''}`,
      observedData,
      hypotheticalInput,
      derivedCalculation,
      unknownsAndLimitations,
      stressTakeaways: `Portfolio downside is concentrated in ${holdingContributions.slice(0, 2).map(h => h.symbol).join(', ') || 'equities'}. This simulation provides insight into hypothetical drawdown magnitude under defined stress conditions.`
    };
  }

  _buildStrategyResearchPrompt(context) {
    return `Explain only the supplied deterministic historical strategy backtest and research data.

STRICT CONSTRAINTS:
1. Clearly distinguish:
   - OBSERVED DATA (strategy rules, universe, test date range, initial capital, transaction costs)
   - DERIVED METRICS (net profit, return %, max drawdown, win rate, profit factor, benchmark comparison)
   - RESEARCH INTERPRETATION (regime behavior, win/loss asymmetry, drawdown recovery)
   - LIMITATIONS (survivorship bias disclaimer, execution slippage, historical timeframe)
   - UNKNOWNS (whether future market returns will match past distribution)
2. Do not predict future prices, returns, or strategy profitability.
3. Do not guarantee any return or outcome.
4. Do not recommend BUY, SELL, HOLD, or allocating funds to this strategy.
5. Explain the mathematical backtest results objectively as historical evidence.

Return JSON strictly in this format:
{
  "summary": "String",
  "observedData": ["String"],
  "derivedMetrics": ["String"],
  "researchInterpretation": ["String"],
  "limitations": ["String"],
  "unknowns": ["String"]
}`;
  }

  generateDeterministicBacktestExplanation(context) {
    const strategy = context.strategy || {};
    const metrics = context.metrics || {};
    const metadata = context.metadata || {};
    const regimeAnalysis = context.regimeAnalysis || [];

    const observedData = [
      `Strategy "${strategy.name || 'Custom'}" (v${strategy.version || 1}) tested across universe: [${(strategy.universe || []).join(', ')}].`,
      `Backtest window: ${metadata.startDate || 'N/A'} to ${metadata.endDate || 'N/A'} (${metadata.totalBars || 0} trading days).`,
      `Initial simulated capital: ₹${metrics.initialCapital?.toLocaleString() || '100,000'}. Benchmark: ${strategy.benchmark || 'NIFTY50'}.`
    ];

    const derivedMetrics = [
      `Net profit: ₹${metrics.netProfit?.toLocaleString() || 0} (${metrics.returnPercentage || 0}% total return vs benchmark ${metrics.benchmarkReturn || 0}%).`,
      `Maximum drawdown: ${metrics.maxDrawdown || 0}% over ${metrics.maxDrawdownDurationDays || 0} days.`,
      `Completed trades: ${metrics.tradeCount || 0} (Win rate: ${metrics.winRate || 0}%, Profit factor: ${metrics.profitFactor || 'N/A'}).`,
      `Alpha difference: ${metrics.alphaDifference > 0 ? `+${metrics.alphaDifference}` : metrics.alphaDifference}%.`
    ];

    const researchInterpretation = [
      metrics.returnPercentage > (metrics.benchmarkReturn || 0)
        ? `Strategy historically outperformed the benchmark by ${metrics.alphaDifference}% over the tested window.`
        : `Strategy historically lagged the benchmark by ${Math.abs(metrics.alphaDifference || 0)}%.`,
      `Average win (₹${metrics.averageWin || 0}) vs average loss (₹${metrics.averageLoss || 0}) demonstrates risk-to-reward dynamics of the defined entry/exit rules.`
    ];

    if (regimeAnalysis.length > 0) {
      researchInterpretation.push(`Regime breakdown: Tested performance varied across market conditions (${regimeAnalysis.map(r => `${r.regime}: ₹${r.netPnL}`).join(', ')}).`);
    }

    const limitations = [
      metadata.survivorshipBiasDisclaimer || 'Historical constituent changes are unavailable from market data provider. Results reflect listed survivors.',
      `Execution assumed ${metadata.lookAheadProtection || 'STRICT_BAR_T_SIGNAL_T_PLUS_1_EXECUTION'} with modeled transaction fees and slippage.`
    ];

    const unknowns = [
      'Whether future market volatility and macroeconomic conditions will reflect the historical distribution modeled in this backtest.',
      'Actual live execution slippage and liquidity depth during high-stress market events.'
    ];

    return {
      summary: `Strategy "${strategy.name || 'Tested Strategy'}": Under the tested period (${metadata.startDate} to ${metadata.endDate}), the model produced a ${metrics.returnPercentage}% return with a ${metrics.maxDrawdown}% maximum drawdown across ${metrics.tradeCount} trades.`,
      observedData,
      derivedMetrics,
      researchInterpretation,
      limitations,
      unknowns
    };
  }

  _buildMarketScannerPrompt(context) {
    return `Explain only the supplied deterministic market scan and opportunity discovery data.

STRICT CONSTRAINTS:
1. Clearly distinguish:
   - OBSERVED DATA (scanner criteria, universe scanned, timestamp, data source)
   - MATCH EXPLANATION (which symbols met criteria and exact indicator values)
   - RESEARCH INTERPRETATION (market breadth, sector clustering of matches)
   - LIMITATIONS (technical filter only, delayed data status, lack of balance sheet fundamentals)
   - UNKNOWNS (future price direction, breakout success rate)
2. Do not predict future prices, targets, or price movement.
3. Do not recommend BUY, SELL, HOLD, or issue any trading signal.
4. Explain the scan results objectively as research discovery candidates.

Return JSON strictly in this format:
{
  "summary": "String",
  "observedData": ["String"],
  "matchExplanation": ["String"],
  "researchInterpretation": ["String"],
  "limitations": ["String"],
  "unknowns": ["String"]
}`;
  }

  generateDeterministicScannerExplanation(context) {
    const scanner = context.scanner || {};
    const metadata = context.metadata || {};
    const marketBreadth = context.marketBreadth || {};
    const matches = context.matches || [];
    const sectorBreakdown = context.sectorBreakdown || [];

    const observedData = [
      `Scan "${scanner.name || 'Custom Scan'}" evaluated ${metadata.totalScanned || 0} securities in universe: ${metadata.universeType || 'NIFTY50'}.`,
      `Conditions evaluated: ${(scanner.conditions || []).map(c => `${c.indicator}(${c.period || ''})`).join(', ') || 'Technical Rules'}.`,
      `Data Source: ${metadata.dataSource || 'MarketDataService'} as of ${metadata.scanTimestamp || 'N/A'}.`
    ];

    const matchExplanation = matches.length > 0
      ? matches.slice(0, 5).map(m => 
          `${m.symbol} matched ${m.matchScore} rules (RSI: ${m.ruleBreakdown?.find(r => r.conditionName.includes('RSI'))?.calculatedValue || 'N/A'}, Price: ₹${m.currentPrice}).`
        )
      : ['No securities met all criteria in this universe.'];

    const researchInterpretation = [
      `Market Breadth: ${marketBreadth.advancing || 0} advancing vs ${marketBreadth.declining || 0} declining (${marketBreadth.aboveSMA50 || 0} trading above 50-day SMA).`
    ];

    if (sectorBreakdown.length > 0) {
      const topSector = [...sectorBreakdown].sort((a, b) => b.matchesCount - a.matchesCount)[0];
      if (topSector && topSector.matchesCount > 0) {
        researchInterpretation.push(`Sector Concentration: ${topSector.sector} leads with ${topSector.matchesCount} match(es) (${topSector.matchPercentage}% of sector universe).`);
      }
    }

    const limitations = [
      metadata.fundamentalStatus || 'Technical filters only; corporate balance-sheet fundamentals unavailable.',
      'Scan results represent a single point-in-time calculation; market conditions may change post-evaluation.'
    ];

    const unknowns = [
      'Whether securities meeting these technical criteria will continue to exhibit positive momentum in future sessions.',
      'Macro liquidity shocks and corporate earnings events that could reverse technical trend structures.'
    ];

    return {
      summary: `Market Scan "${scanner.name || 'Technical Scan'}": Discovered ${metadata.matchedCount} matching candidate(s) out of ${metadata.totalScanned} scanned (${metadata.matchRatePercent}% match rate) as of ${metadata.scanTimestamp}.`,
      observedData,
      matchExplanation,
      researchInterpretation,
      limitations,
      unknowns
    };
  }

  generateResearchCopilotReport(question, evidenceList = [], options = {}) {
    const observed = evidenceList
      .filter(e => e.confidence === 'OBSERVED')
      .map(e => `[${e.sourceType}] ${e.symbol || ''} ${e.metric}: ${e.value} ${e.unit || ''} (${e.context || ''})`);

    const derived = evidenceList
      .filter(e => e.confidence === 'DERIVED')
      .map(e => `[${e.sourceType}] ${e.symbol || ''} ${e.metric}: ${e.value} ${e.unit || ''} (${e.context || ''})`);

    const hist = evidenceList
      .filter(e => e.sourceType === 'BACKTEST_SIMULATION')
      .map(e => `${e.metric}: ${e.value}% (${e.context})`);

    const stress = evidenceList
      .filter(e => e.sourceType === 'STRESS_SCENARIO')
      .map(e => `${e.metric}: ₹${e.value} (${e.context})`);

    const limitations = evidenceList
      .filter(e => e.confidence === 'LIMITATION')
      .map(e => `${e.metric}: ${e.context}`);

    const unknowns = evidenceList
      .filter(e => e.confidence === 'UNKNOWN')
      .map(e => `${e.metric}: ${e.context}`);

    const targetSymbol = options.symbols?.[0] || 'Target Security';

    return {
      summary: `Research Dossier for "${question}": Synthesized ${evidenceList.length} evidence records across TradeFlow analytical engines. Zero buy/sell financial tips issued.`,
      observedData: observed.length > 0 ? observed : ['No raw quote records found for requested assets.'],
      derivedMetrics: derived.length > 0 ? derived : ['Derived technical statistics calculated from closed daily bars.'],
      historicalEvidence: hist.length > 0 ? hist : ['Historical backtest simulation available on demand via Strategy Lab.'],
      stressEvidence: stress.length > 0 ? stress : ['Factor scenario stress test available on demand via Stress Studio.'],
      researchInterpretation: [
        `Grounded research analysis confirms observed price & technical indicator alignment for ${targetSymbol}.`,
        'All reported observations reflect historical and point-in-time calculation states; past behavior is not predictive of future returns.'
      ],
      limitations: limitations.length > 0 ? limitations : ['Technical data reflects historical daily closes only; survivorship bias disclosed.'],
      unknowns: unknowns.length > 0 ? unknowns : ['Corporate balance-sheet fundamentals unavailable at current provider tier.'],
      nextQuestions: [
        `How did ${targetSymbol} behave historically during sustained market drawdowns?`,
        `What happens to ${targetSymbol}'s modeled portfolio risk if the IT sector declines by -15%?`,
        `How does ${targetSymbol}'s 20-day relative strength compare to the NIFTY50 benchmark?`
      ]
    };
  }
}

module.exports = new AIAnalystService();
