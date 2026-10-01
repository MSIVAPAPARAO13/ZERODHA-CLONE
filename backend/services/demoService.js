const { HoldingsModel } = require("../models/HoldingsModel");
const { PositionsModel } = require("../models/PositionsModel");
const { OrdersModel } = require("../models/OrdersModel");
const { WatchlistModel } = require("../models/WatchlistModel");
const { TradeJournalModel } = require("../models/TradeJournalModel");
const { PlaybookModel } = require("../models/PlaybookModel");
const { AlertModel } = require("../models/AlertModel");
const { ScannerModel } = require("../models/ScannerModel");
const { UserModel } = require("../models/UserModel");
const { TransactionModel } = require("../models/TransactionModel");
const MarketEvent = require("../models/MarketEventModel");

class DemoService {
  async seedUserData(userId) {
    if (!userId) throw new Error("userId is required for seeding");

    // Clear existing user data in these collections to avoid duplicates
    await HoldingsModel.deleteMany({ user: userId });
    await PositionsModel.deleteMany({ user: userId });
    await OrdersModel.deleteMany({ user: userId });
    await WatchlistModel.deleteMany({ user: userId });
    await TradeJournalModel.deleteMany({ user: userId });
    await PlaybookModel.deleteMany({ user: userId });
    await AlertModel.deleteMany({ user: userId });
    await ScannerModel.deleteMany({ user: userId });
    await TransactionModel.deleteMany({ user: userId });
    await MarketEvent.deleteMany({ user: userId });

    // Ensure user has virtual balance
    await UserModel.findByIdAndUpdate(userId, { virtualBalance: 150000 });

    // 1. Seed Holdings
    const holdings = await HoldingsModel.insertMany([
      { user: userId, name: "RELIANCE", qty: 45, avg: 2840.50, price: 2985.40, net: "+5.10%", day: "+1.25%", isLoss: false },
      { user: userId, name: "TCS", qty: 30, avg: 4120.00, price: 4250.80, net: "+3.17%", day: "-0.45%", isLoss: false },
      { user: userId, name: "INFY", qty: 65, avg: 1850.25, price: 1920.10, net: "+3.77%", day: "+0.85%", isLoss: false },
      { user: userId, name: "HDFCBANK", qty: 80, avg: 1620.00, price: 1695.50, net: "+4.66%", day: "+1.10%", isLoss: false },
      { user: userId, name: "TATAMOTORS", qty: 120, avg: 940.00, price: 1012.30, net: "+7.69%", day: "+2.40%", isLoss: false },
      { user: userId, name: "ICICIBANK", qty: 75, avg: 1180.00, price: 1245.00, net: "+5.51%", day: "+0.65%", isLoss: false },
      { user: userId, name: "BHARTIARTL", qty: 50, avg: 1540.00, price: 1625.00, net: "+5.52%", day: "+1.80%", isLoss: false },
      { user: userId, name: "ITC", qty: 200, avg: 485.00, price: 512.40, net: "+5.65%", day: "-0.20%", isLoss: false },
      { user: userId, name: "LT", qty: 25, avg: 3520.00, price: 3680.00, net: "+4.55%", day: "+0.90%", isLoss: false },
      { user: userId, name: "SBIN", qty: 110, avg: 780.00, price: 815.50, net: "+4.55%", day: "+1.35%", isLoss: false }
    ]);

    // 2. Seed Positions
    const positions = await PositionsModel.insertMany([
      { user: userId, product: "MIS", name: "NIFTY 24500 CE", qty: 150, avg: 142.50, price: 178.20, net: "+25.05%", day: "+₹5,355.00", isLoss: false },
      { user: userId, product: "MIS", name: "BANKNIFTY 52000 PE", qty: 60, avg: 210.00, price: 185.00, net: "-11.90%", day: "-₹1,500.00", isLoss: true },
      { user: userId, product: "NRML", name: "INFY 1950 CE", qty: 400, avg: 32.40, price: 44.80, net: "+38.27%", day: "+₹4,960.00", isLoss: false },
      { user: userId, product: "MIS", name: "TATAMOTORS", qty: 100, avg: 998.00, price: 1012.30, net: "+1.43%", day: "+₹1,430.00", isLoss: false }
    ]);

    // 3. Seed Orders
    const orders = await OrdersModel.insertMany([
      { user: userId, name: "INFY", qty: 65, price: 1850.25, mode: "BUY" },
      { user: userId, name: "RELIANCE", qty: 45, price: 2840.50, mode: "BUY" },
      { user: userId, name: "HDFCBANK", qty: 80, price: 1620.00, mode: "BUY" },
      { user: userId, name: "TATAMOTORS", qty: 120, price: 940.00, mode: "BUY" },
      { user: userId, name: "ICICIBANK", qty: 75, price: 1180.00, mode: "BUY" },
      { user: userId, name: "TCS", qty: 10, price: 4280.00, mode: "SELL" },
      { user: userId, name: "NIFTY 24500 CE", qty: 150, price: 142.50, mode: "BUY" },
      { user: userId, name: "ITC", qty: 200, price: 485.00, mode: "BUY" }
    ]);

    // 3b. Seed Transactions for replay & cash flow tracking
    await TransactionModel.insertMany([
      { user: userId, type: "BUY", symbol: "INFY", quantity: 65, price: 1850.25, amount: 120266.25, balanceBefore: 250000, balanceAfter: 129733.75, order: orders[0]._id },
      { user: userId, type: "BUY", symbol: "RELIANCE", quantity: 45, price: 2840.50, amount: 127822.50, balanceBefore: 129733.75, balanceAfter: 1911.25, order: orders[1]._id },
      { user: userId, type: "BUY", symbol: "HDFCBANK", quantity: 80, price: 1620.00, amount: 129600.00, balanceBefore: 150000, balanceAfter: 20400, order: orders[2]._id },
      { user: userId, type: "BUY", symbol: "TATAMOTORS", quantity: 120, price: 940.00, amount: 112800.00, balanceBefore: 160000, balanceAfter: 47200, order: orders[3]._id },
      { user: userId, type: "BUY", symbol: "ICICIBANK", quantity: 75, price: 1180.00, amount: 88500.00, balanceBefore: 180000, balanceAfter: 91500, order: orders[4]._id },
      { user: userId, type: "SELL", symbol: "TCS", quantity: 10, price: 4280.00, amount: 42800.00, balanceBefore: 107200, balanceAfter: 150000, order: orders[5]._id },
      { user: userId, type: "BUY", symbol: "NIFTY 24500 CE", quantity: 150, price: 142.50, amount: 21375.00, balanceBefore: 150000, balanceAfter: 128625, order: orders[6]._id },
      { user: userId, type: "BUY", symbol: "ITC", quantity: 200, price: 485.00, amount: 97000.00, balanceBefore: 128625, balanceAfter: 31625, order: orders[7]._id }
    ]);

    // 4. Seed Watchlist (Top 16 NIFTY 50 Stocks)
    const symbols = [
      "RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS",
      "ICICIBANK", "BHARTIARTL", "ITC", "SBIN", "LT",
      "MARUTI", "SUNPHARMA", "BAJFINANCE", "AXISBANK", "KOTAKBANK", "TITAN"
    ];
    await WatchlistModel.insertMany(symbols.map(symbol => ({ user: userId, symbol })));

    // 5. Seed Playbooks
    const playbooks = await PlaybookModel.insertMany([
      {
        user: userId,
        name: "Donchian 20-Day Trend Breakout",
        description: "Systematic trend continuation capturing institutional momentum on fresh 20-day high expansions.",
        strategy: "BREAKOUT",
        isActive: true,
        rules: [
          { text: "Confirm price closes above 20-day high with >1.5x 20-day avg volume", category: "ENTRY", required: true, sortOrder: 1 },
          { text: "Max portfolio risk 1.5% of total virtual equity", category: "RISK", required: true, sortOrder: 2 },
          { text: "Trailing stop placed at lower Donchian 10-day channel boundary", category: "EXIT", required: true, sortOrder: 3 },
          { text: "Document macro catalyst & catalyst score in journal before entry", category: "JOURNAL", required: true, sortOrder: 4 }
        ]
      },
      {
        user: userId,
        name: "Institutional VWAP Pullback",
        description: "Mean reversion setup entering institutional volume-weighted average price tests during trending days.",
        strategy: "MOMENTUM",
        isActive: true,
        rules: [
          { text: "Wait for price to test VWAP within 0.3% band after strong 9:30 AM open", category: "ENTRY", required: true, sortOrder: 1 },
          { text: "RSI on 5-minute chart must stay above 45 to confirm underlying trend strength", category: "PLANNING", required: true, sortOrder: 2 },
          { text: "Stop loss fixed 0.6% below swing low with minimum 2:1 profit target", category: "RISK", required: true, sortOrder: 3 },
          { text: "Record discipline score and trade screenshot immediately post-fill", category: "JOURNAL", required: false, sortOrder: 4 }
        ]
      }
    ]);

    // 6. Seed 6 Trade Journals (4 Closed, 2 Open) for Edge & Learning Analytics
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000);
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
    const yesterday = new Date(Date.now() - 1 * 86400000);

    await TradeJournalModel.insertMany([
      {
        user: userId,
        order: orders[0]._id,
        symbol: "INFY",
        side: "BUY",
        strategy: "BREAKOUT",
        reason: "TECHNICAL_SETUP",
        confidence: 4,
        thesis: "Ascending triangle breakout with expanding volume above 1850 pivot resistance.",
        targetPrice: 1980,
        riskPrice: 1810,
        expectedHoldingPeriod: "1-2 WEEKS",
        entryPrice: 1850.25,
        quantity: 65,
        emotion: "CONFIDENT",
        lesson: "Respecting the breakout level and waiting for 15-min confirmation paid off.",
        playbook: playbooks[0]._id,
        checklist: [
          { ruleText: "Confirm price closes above 20-day high with >1.5x volume", followed: true },
          { ruleText: "Max portfolio risk 1.5%", followed: true }
        ],
        result: { pnl: 4540.25, pnlPercent: 3.77, exitPrice: 1920.10, exitDate: yesterday, status: "CLOSED" },
        createdAt: tenDaysAgo
      },
      {
        user: userId,
        order: orders[3]._id,
        symbol: "TATAMOTORS",
        side: "BUY",
        strategy: "MOMENTUM",
        reason: "NEWS",
        confidence: 5,
        thesis: "Strong quarterly delivery numbers beating consensus by 4.2%. EV margins turned positive.",
        targetPrice: 1060,
        riskPrice: 910,
        expectedHoldingPeriod: "1-3 MONTHS",
        entryPrice: 940.00,
        quantity: 120,
        emotion: "DISCIPLINED",
        lesson: "Clear pre-defined risk stopped any urge to over-trade intraday noise.",
        result: { pnl: 8676.00, pnlPercent: 7.69, exitPrice: 1012.30, exitDate: twoDaysAgo, status: "CLOSED" },
        createdAt: fiveDaysAgo
      },
      {
        user: userId,
        order: orders[5]._id,
        symbol: "TCS",
        side: "SELL",
        strategy: "VALUE",
        reason: "PORTFOLIO_REBALANCE",
        confidence: 4,
        thesis: "Partial profit harvest after multi-week cloud deal runup into upper Donchian band.",
        targetPrice: 4300,
        riskPrice: 4050,
        expectedHoldingPeriod: "1-3 DAYS",
        entryPrice: 4120.00,
        quantity: 10,
        emotion: "DISCIPLINED",
        lesson: "Systematic partial locking protected unrealized gains from reversal.",
        result: { pnl: 1600.00, pnlPercent: 3.88, exitPrice: 4280.00, exitDate: yesterday, status: "CLOSED" },
        createdAt: fiveDaysAgo
      },
      {
        user: userId,
        order: orders[1]._id,
        symbol: "RELIANCE",
        side: "BUY",
        strategy: "TREND",
        reason: "TECHNICAL_SETUP",
        confidence: 4,
        thesis: "Volume breakout above 2840 consolidation base supported by energy ARPU inflows.",
        targetPrice: 3050,
        riskPrice: 2790,
        expectedHoldingPeriod: "1-2 WEEKS",
        entryPrice: 2840.50,
        quantity: 45,
        emotion: "CONFIDENT",
        lesson: "Patience holding through mid-session shakeout delivered full R:R target.",
        result: { pnl: 6520.50, pnlPercent: 5.10, exitPrice: 2985.40, exitDate: yesterday, status: "CLOSED" },
        createdAt: tenDaysAgo
      },
      {
        user: userId,
        order: orders[6]._id,
        symbol: "NIFTY 24500 CE",
        side: "BUY",
        strategy: "TREND",
        reason: "TECHNICAL_SETUP",
        confidence: 4,
        thesis: "Bullish continuation pattern above 24,350 pivot supported by private banking rally.",
        targetPrice: 210,
        riskPrice: 115,
        expectedHoldingPeriod: "INTRADAY",
        entryPrice: 142.50,
        quantity: 150,
        emotion: "DISCIPLINED",
        lesson: "Trailed stop-loss at 20 EMA safeguarded unrealized gains.",
        result: { pnl: 5355.00, pnlPercent: 25.05, status: "OPEN" },
        createdAt: new Date()
      },
      {
        user: userId,
        order: orders[2]._id,
        symbol: "HDFCBANK",
        side: "BUY",
        strategy: "MOMENTUM",
        reason: "WATCHLIST_OPPORTUNITY",
        confidence: 4,
        thesis: "Credit deposit ratio normalization driving institutional block reallocations.",
        targetPrice: 1750,
        riskPrice: 1580,
        expectedHoldingPeriod: "1-3 MONTHS",
        entryPrice: 1620.00,
        quantity: 80,
        emotion: "CONFIDENT",
        lesson: "Aligning trade with macro sector rotation maximizes win consistency.",
        result: { pnl: 6040.00, pnlPercent: 4.66, status: "OPEN" },
        createdAt: new Date()
      }
    ]);

    // 6b. Seed Market Events for Today's Surveillance Feed
    const nowTs = Date.now();
    await MarketEvent.insertMany([
      {
        user: userId,
        symbol: "RELIANCE",
        eventType: "PRICE_MOVE",
        severity: "SIGNIFICANT",
        category: "PORTFOLIO",
        title: "Energy & Telecom Capex Outlays Above Consensus",
        description: "Reliance gains 1.25% on strong subscriber additions and retail EBITDA expansion.",
        occurredAt: new Date(),
        changePercent: 1.25,
        dedupeKey: `${userId}_RELIANCE_PRICE_MOVE_${nowTs}`,
        isRead: false,
        isDismissed: false
      },
      {
        user: userId,
        symbol: "TCS",
        eventType: "CORRELATED_EVENT",
        severity: "CRITICAL",
        category: "WATCHLIST",
        title: "Q2 Margin Expansion Post-Cloud Migration Inflows",
        description: "Large multi-year enterprise transformation deals signed across BFSI sector.",
        occurredAt: new Date(),
        changePercent: 0.68,
        dedupeKey: `${userId}_TCS_CORRELATED_EVENT_${nowTs}`,
        isRead: false,
        isDismissed: false
      },
      {
        user: userId,
        symbol: "INFY",
        eventType: "VOLUME_SURGE",
        severity: "SIGNIFICANT",
        category: "PORTFOLIO",
        title: "Volume Surge >2.1x 20-Day SMA with Resistance Breakout",
        description: "Infosys gaps up through 1850 pivot with institutional accumulation block deals.",
        occurredAt: new Date(),
        changePercent: 0.85,
        dedupeKey: `${userId}_INFY_VOLUME_SURGE_${nowTs}`,
        isRead: false,
        isDismissed: false
      },
      {
        user: userId,
        symbol: "TATAMOTORS",
        eventType: "ALERT_TRIGGERED",
        severity: "CRITICAL",
        category: "ALERT",
        title: "EV Unit Deliveries Exceeded Consensus Guidance by 4.2%",
        description: "Commercial vehicle and JLR margins sustained above 12.8% quarterly threshold.",
        occurredAt: new Date(),
        changePercent: 2.40,
        dedupeKey: `${userId}_TATAMOTORS_ALERT_TRIGGERED_${nowTs}`,
        isRead: false,
        isDismissed: false
      },
      {
        user: userId,
        symbol: "HDFCBANK",
        eventType: "PRICE_MOVE",
        severity: "WATCH",
        category: "PORTFOLIO",
        title: "Credit Deposit Ratio Normalization Ahead of Schedule",
        description: "Private banking sector tailwinds supporting sustained multiple rerating.",
        occurredAt: new Date(),
        changePercent: 1.10,
        dedupeKey: `${userId}_HDFCBANK_PRICE_MOVE_${nowTs}`,
        isRead: false,
        isDismissed: false
      }
    ]);

    // 7. Seed Alerts
    await AlertModel.insertMany([
      { user: userId, symbol: "RELIANCE", condition: "ABOVE", targetPrice: 3000.00, isActive: true },
      { user: userId, symbol: "INFY", condition: "ABOVE", targetPrice: 1950.00, isActive: true },
      { user: userId, symbol: "TATAMOTORS", condition: "ABOVE", targetPrice: 1050.00, isActive: true },
      { user: userId, symbol: "HDFCBANK", condition: "BELOW", targetPrice: 1600.00, isActive: true }
    ]);

    // 8. Seed Scanners
    await ScannerModel.insertMany([
      {
        user: userId,
        name: "52-Week High Breakout Scanner",
        description: "Scans NIFTY 50 universe for stocks breaking out above 20-day high with volume momentum.",
        universe: "NIFTY50",
        matchMode: "STRICT",
        conditionGroup: "AND",
        conditions: [
          { indicator: "DONCHIAN_BREAKOUT", period: 20, operator: "CROSS_ABOVE", threshold: null }
        ]
      },
      {
        user: userId,
        name: "RSI Oversold Bullish Divergence",
        description: "Flags oversold stocks under RSI 35 with positive price reversal candles.",
        universe: "NIFTY50",
        matchMode: "STRICT",
        conditionGroup: "AND",
        conditions: [
          { indicator: "RSI", period: 14, operator: "LESS_THAN", threshold: 35 }
        ]
      }
    ]);

    return {
      success: true,
      holdingsCount: holdings.length,
      positionsCount: positions.length,
      ordersCount: orders.length,
      watchlistCount: symbols.length,
      playbooksCount: playbooks.length
    };
  }

  getDemoOverview() {
    return {
      product: "TRADEFLOW",
      version: "2.0-PRODUCTION",
      mode: "PAPER_TRADING_SIMULATION",
      disclaimer: "EDUCATIONAL_RESEARCH_PLATFORM — Simulation and analytical research only. Zero real-money brokerage integration.",
      capabilities: [
        {
          id: "market_intelligence",
          title: "Market Intelligence & Surveillance",
          route: "/api/v1/insights/today",
          frontendUrl: "/dashboard/insights",
          description: "Detects real-time volatility spikes, breakout signals, and macro regime shifts.",
          status: "LIVE"
        },
        {
          id: "research_copilot",
          title: "Autonomous Research Copilot & Agent",
          route: "/api/v1/research/agent",
          frontendUrl: "/dashboard/research",
          description: "Synthesizes multi-step research plans using an allowlisted 11-tool registry.",
          status: "LIVE"
        },
        {
          id: "portfolio_intelligence",
          title: "Portfolio Intelligence",
          route: "/api/v1/portfolio/intelligence",
          frontendUrl: "/dashboard/portfolio",
          description: "Measures Herfindahl concentration, cash allocation, and holding attribution.",
          status: "LIVE"
        },
        {
          id: "scenario_studio",
          title: "Scenario & Stress Studio",
          route: "/api/v1/scenarios",
          frontendUrl: "/dashboard/scenarios",
          description: "Simulates deterministic multi-shock macro drawdowns and sector contagion.",
          status: "LIVE"
        },
        {
          id: "strategy_lab",
          title: "Strategy Lab & Backtesting",
          route: "/api/v1/strategies",
          frontendUrl: "/dashboard/strategies",
          description: "Executes backtests and walk-forward parameter robustness tests on historical OHLCV data.",
          status: "LIVE"
        },
        {
          id: "decision_journal",
          title: "Decision Journal",
          route: "/api/v1/decisions",
          frontendUrl: "/dashboard/decisions",
          description: "Tracks falsifiable theses, review dates, and invalidation rules for every trade.",
          status: "LIVE"
        },
        {
          id: "learning_coach",
          title: "Personal Learning & Discipline Coach",
          route: "/api/v1/learning/summary",
          frontendUrl: "/dashboard/coach",
          description: "Identifies behavioral biases, revenge trading, and discipline metrics from journal history.",
          status: "LIVE"
        },
        {
          id: "personal_automation",
          title: "Personal Research Automation",
          route: "/api/v1/automations",
          frontendUrl: "/dashboard/automations",
          description: "Schedules automated daily briefings, portfolio audits, and weekly retrospective digests.",
          status: "LIVE"
        }
      ],
      flowSteps: [
        "1. Authenticate with JWT user isolation",
        "2. Review 'What Changed Today' personalized feed",
        "3. Investigate critical Market Surveillance Events",
        "4. Research Copilot collects factual multi-tool evidence",
        "5. Evaluate Portfolio Concentration & Capital At Risk",
        "6. Stress-test portfolio under 10% Sector Shock scenario",
        "7. Validate quantitative strategy in Strategy Lab",
        "8. Perform Walk-Forward Robustness analysis",
        "9. Document thesis and invalidation rules in Decision Journal",
        "10. Execute paper trade simulation with Idempotency-Key protection",
        "11. Review trade execution in Trade Journal",
        "12. Generate behavioral insight with Learning Coach",
        "13. Schedule recurring research task in Automation Engine",
        "14. Generate Daily Brief and Weekly Retrospective Digest",
        "15. Collaborate with team organization using counter-evidence tags"
      ]
    };
  }
}

module.exports = new DemoService();
