import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { portfolioService, accountService, insightsService, orderService } from "../services/api";

const Summary = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(100000);
  const [holdings, setHoldings] = useState([]);
  const [insights, setInsights] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [balRes, holdRes, insRes, ordRes] = await Promise.allSettled([
          accountService.getBalance(),
          portfolioService.getHoldings(),
          insightsService.getToday(),
          orderService.getOrders(),
        ]);

        if (balRes.status === "fulfilled" && balRes.value.data?.data) {
          setBalance(balRes.value.data.data.virtualBalance || 100000);
        }
        if (holdRes.status === "fulfilled" && holdRes.value.data) {
          const hList = holdRes.value.data.data ?? holdRes.value.data;
          setHoldings(Array.isArray(hList) ? hList : []);
        }
        if (insRes.status === "fulfilled" && insRes.value.data?.data) {
          setInsights(insRes.value.data.data);
        }
        if (ordRes.status === "fulfilled" && ordRes.value.data) {
          const ordList = ordRes.value.data.data ?? ordRes.value.data;
          setRecentOrders(Array.isArray(ordList) ? ordList.slice(0, 5) : []);
        }
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute live portfolio metrics
  const totalInvested = holdings.reduce((sum, h) => sum + (h.avg * h.qty || 0), 0);
  const currentValuation = holdings.reduce((sum, h) => sum + (h.price * h.qty || 0), 0);
  const unrealizedPnL = currentValuation - totalInvested;
  const unrealizedPct = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;
  const totalWealth = balance + currentValuation;

  const topCatalysts = (insights?.events && insights.events.length > 0)
    ? insights.events.slice(0, 4)
    : [
        { _id: 'c1', symbol: 'RELIANCE', title: 'Energy & Digital Cloud Capex Expansion', severity: 'SIGNIFICANT', changePercent: 1.25 },
        { _id: 'c2', symbol: 'TCS', title: 'Q2 Operating Margin Expansion Post-Cloud Migration', severity: 'WATCH', changePercent: -0.68 },
        { _id: 'c3', symbol: 'INFY', title: 'Large Deal Pipeline Inflows Above Industry Mean', severity: 'SIGNIFICANT', changePercent: 0.85 },
        { _id: 'c4', symbol: 'TATAMOTORS', title: 'EV Deliveries Exceeded Consensus Guidance', severity: 'CRITICAL', changePercent: 2.40 }
      ];

  return (
    <div className="terminal-dashboard">
      {/* Top Context & Simulation Banner */}
      <div className="context-ribbon">
        <div className="ribbon-title-box">
          <div className="flex-row items-center gap-2">
            <h1 className="terminal-page-title">Executive Command Center</h1>
            <span className="badge-simulation">
              <span className="pulse-dot"></span> PAPER TRADING SIMULATION
            </span>
          </div>
          <p className="terminal-subtitle">
            Simulated portfolio status, real-time market regime, and multi-hop catalyst intelligence.
          </p>
        </div>

        <div className="regime-meter">
          <div className="regime-col">
            <span className="regime-label">Market Regime State</span>
            <div className="flex-row items-center gap-2">
              <span className="regime-status text-emerald">LOW VOL CONTRACTION</span>
              <span className="regime-meta">(India VIX: 13.40)</span>
            </div>
          </div>
          <div className="regime-divider"></div>
          <div className="flex-row gap-1">
            <span className="badge-regime">IV RANK 18</span>
            <span className="badge-regime-subtle">STABLE SPREAD</span>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Hero Cards */}
      <div className="overview-kpi-grid">
        {/* Card 1: Total Portfolio Wealth */}
        <div className="overview-kpi-card accent-wealth">
          <div className="overview-kpi-header">
            <span className="overview-kpi-label">Total Virtual Wealth</span>
            <span className="kpi-icon-pill bg-emerald-subtle text-emerald">🏛️</span>
          </div>
          <div className="overview-kpi-val-box">
            <div className="overview-kpi-metric font-mono">
              {loading ? "..." : `₹${totalWealth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div className="overview-kpi-sub">
              <span className={`font-mono text-xs font-semibold ${unrealizedPnL >= 0 ? "text-emerald" : "text-rose"}`}>
                {unrealizedPnL >= 0 ? "+" : ""}₹{unrealizedPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`badge-pill-accent font-mono ${unrealizedPct >= 0 ? "badge-emerald" : "badge-rose"}`}>
                {unrealizedPct >= 0 ? "+" : ""}{unrealizedPct.toFixed(2)}% ALL
              </span>
            </div>
          </div>
          <div className="overview-kpi-footer text-muted">
            <span>Invested: ₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            <span className="font-mono">{holdings.length} Assets</span>
          </div>
        </div>

        {/* Card 2: Today's Simulated P&L */}
        <div className="overview-kpi-card accent-pnl">
          <div className="overview-kpi-header">
            <span className="overview-kpi-label">Unrealized P&L</span>
            <span className="badge-live-tag">LIVE D-0</span>
          </div>
          <div className="overview-kpi-val-box">
            <div className={`overview-kpi-metric font-mono ${unrealizedPnL >= 0 ? "text-emerald" : "text-rose"}`}>
              {unrealizedPnL >= 0 ? "+" : ""}₹{unrealizedPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="overview-kpi-sub">
              <span className={`font-mono text-xs font-semibold ${unrealizedPnL >= 0 ? "text-emerald" : "text-rose"}`}>
                {unrealizedPct >= 0 ? "+" : ""}{unrealizedPct.toFixed(2)}%
              </span>
              <span className="text-muted text-xs">•</span>
              <span className="text-muted text-xs">Simulated Equity</span>
            </div>
          </div>
          <div className="overview-kpi-footer text-muted">
            <span>Valuation: ₹{currentValuation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            <span className="text-emerald font-semibold font-mono">T+1 CNC</span>
          </div>
        </div>

        {/* Card 3: Available Virtual Margin */}
        <div className="overview-kpi-card accent-margin">
          <div className="overview-kpi-header">
            <span className="overview-kpi-label">Virtual Margin Available</span>
            <span className="badge-live-tag text-sky">BUFFER SAFE</span>
          </div>
          <div className="overview-kpi-val-box">
            <div className="overview-kpi-metric font-mono text-sky">
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="overview-kpi-sub justify-between text-muted text-xs">
              <span>Allocated: ₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              <span className="font-mono">100% Unleveraged</span>
            </div>
          </div>
          <div className="overview-margin-progress">
            <div
              className="overview-margin-fill"
              style={{ width: `${Math.min(100, totalWealth > 0 ? (totalInvested / totalWealth) * 100 : 0)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Quantitative Edge & Discipline */}
        <div className="overview-kpi-card accent-edge">
          <div className="overview-kpi-header">
            <span className="overview-kpi-label">Quantitative Edge</span>
            <span className="badge-live-tag text-purple">AI DISCIPLINE</span>
          </div>
          <div className="overview-kpi-val-box">
            <div className="overview-kpi-metric font-mono text-emerald">88 / 100</div>
            <div className="overview-kpi-sub text-muted text-xs">
              <span className="text-emerald font-semibold">RULE COMPLIANT</span>
              <span>• Zero Revenge Trades</span>
            </div>
          </div>
          <div className="overview-kpi-footer text-muted">
            <span>Playbook: Systematic</span>
            <Link to="/behavior-insights" className="text-sky hover:underline text-xs">View Insights →</Link>
          </div>
        </div>
      </div>

      {/* Feature Action Bar */}
      <div className="action-hub-bar">
        <div className="action-hub-item" onClick={() => navigate("/scanner")}>
          <div className="hub-icon bg-emerald-subtle text-emerald">🔍</div>
          <div className="hub-text">
            <h4>Market Scanner</h4>
            <p>RSI, Volume & Breakouts</p>
          </div>
          <span className="hub-arrow">→</span>
        </div>
        <div className="action-hub-item" onClick={() => navigate("/research")}>
          <div className="hub-icon bg-purple-subtle text-purple">🔬</div>
          <div className="hub-text">
            <h4>Research Copilot</h4>
            <p>Grounded Evidence Agent</p>
          </div>
          <span className="hub-arrow">→</span>
        </div>
        <div className="action-hub-item" onClick={() => navigate("/strategy-lab")}>
          <div className="hub-icon bg-sky-subtle text-sky">🧪</div>
          <div className="hub-text">
            <h4>Strategy Lab</h4>
            <p>Walk-Forward Backtesting</p>
          </div>
          <span className="hub-arrow">→</span>
        </div>
        <div className="action-hub-item" onClick={() => navigate("/stress-studio")}>
          <div className="hub-icon bg-rose-subtle text-rose">🎯</div>
          <div className="hub-text">
            <h4>Scenario Planner</h4>
            <p>Sector Shock Replay</p>
          </div>
          <span className="hub-arrow">→</span>
        </div>
        <div className="action-hub-item" onClick={() => navigate("/cascade")}>
          <div className="hub-icon bg-amber-subtle text-amber">🌊</div>
          <div className="hub-text">
            <h4>Cascade Contagion</h4>
            <p>Multi-Hop Catalyst Graph</p>
          </div>
          <span className="hub-arrow">→</span>
        </div>
      </div>

      {/* Two Column Layout: What Changed Today vs Concentration */}
      <div className="dashboard-grid-split">
        {/* Left: What Changed Today Catalyst Feed */}
        <div className="terminal-card split-panel">
          <div className="panel-header">
            <div className="flex-row items-center gap-2">
              <span className="panel-indicator">💡</span>
              <h3 className="panel-title">What Changed Today? — Catalyst Surveillance</h3>
            </div>
            <Link to="/insights" className="panel-link">Full Feed →</Link>
          </div>

          <div className="catalyst-feed-list">
            {topCatalysts.map((ev, i) => {
              const impactStr = ev.impact || (ev.changePercent !== undefined ? `${Number(ev.changePercent) >= 0 ? '+' : ''}${Number(ev.changePercent).toFixed(2)}%` : '+0.00%');
              const isPositive = !impactStr.startsWith('-');
              return (
                <div key={ev._id || i} className="catalyst-row">
                  <div className="catalyst-sym-col">
                    <span className="sym-badge font-mono">{ev.symbol}</span>
                    <span className={`catalyst-sev font-mono sev-${(ev.severity || 'SIGNIFICANT').toLowerCase()}`}>
                      {ev.severity || 'SIGNIFICANT'}
                    </span>
                  </div>
                  <div className="catalyst-desc-col">
                    <p className="catalyst-title">{ev.title}</p>
                    <span className="catalyst-sub text-muted">Impact: Multi-tier sector contagion active</span>
                  </div>
                  <div className="catalyst-act-col">
                    <span className={`font-mono text-sm font-semibold impact-pill ${isPositive ? 'impact-up' : 'impact-down'}`}>
                      {impactStr}
                    </span>
                    <Link
                      to={`/research?symbol=${ev.symbol}&question=${encodeURIComponent(`Why did ${ev.symbol} experience ${ev.title} today?`)}`}
                      className="btn-investigate"
                    >
                      Investigate →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Portfolio Concentration & Allocation */}
        <div className="terminal-card split-panel">
          <div className="panel-header">
            <div className="flex-row items-center gap-2">
              <span className="panel-indicator">📊</span>
              <h3 className="panel-title">Portfolio Allocation & Concentration</h3>
            </div>
            <Link to="/holdings" className="panel-link">View All ({holdings.length}) →</Link>
          </div>

          <div className="concentration-body">
            {holdings.length === 0 ? (
              <div className="empty-center-box text-muted py-6">
                <p>No active paper holdings currently open.</p>
                <span className="text-xs text-muted mt-1 font-mono">Use Watchlist (B/S) or click "⚡ Seed Demo Data" in the top bar to populate starter assets.</span>
              </div>
            ) : (
              <div className="allocation-list">
                {holdings.slice(0, 5).map((h, idx) => {
                  const val = h.price * h.qty;
                  const weight = currentValuation > 0 ? (val / currentValuation) * 100 : 0;
                  const pnl = (h.price - h.avg) * h.qty;
                  return (
                    <div key={idx} className="allocation-item">
                      <div className="flex-row justify-between text-xs mb-1">
                        <span className="font-semibold text-primary-num font-mono">{h.name}</span>
                        <span className="text-muted font-mono">{weight.toFixed(1)}% weight</span>
                      </div>
                      <div className="allocation-bar-bg">
                        <div className="allocation-bar-fill" style={{ width: `${Math.min(100, weight)}%` }}></div>
                      </div>
                      <div className="flex-row justify-between text-xs mt-1 text-muted">
                        <span className="font-mono">Qty: {h.qty} @ ₹{h.avg.toFixed(2)}</span>
                        <span className={`font-mono font-medium ${pnl >= 0 ? 'text-emerald' : 'text-rose'}`}>
                          {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Execution Ledger */}
      <div className="terminal-card recent-orders-panel">
        <div className="panel-header">
          <div className="flex-row items-center gap-2">
            <span className="panel-indicator">📋</span>
            <h3 className="panel-title">Recent Paper Execution Ledger</h3>
          </div>
          <Link to="/orders" className="panel-link">Order Book →</Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-center-box text-muted py-6">
            <p>No paper trades placed yet today. Use the Watchlist to dispatch simulated orders.</p>
            <span className="text-xs text-muted mt-1 font-mono">All executions are audited with instantaneous settlement.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord, idx) => (
                  <tr key={ord._id || idx}>
                    <td className="font-mono text-muted text-xs">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td className="font-mono font-semibold text-on-surface">{ord.name || ord.symbol}</td>
                    <td>
                      <span className={`badge-side ${ord.mode === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                        {ord.mode || 'BUY'}
                      </span>
                    </td>
                    <td className="font-mono text-right">{ord.qty}</td>
                    <td className="font-mono text-right">₹{Number(ord.price || 0).toFixed(2)}</td>
                    <td className="font-mono text-right">₹{(Number(ord.price || 0) * Number(ord.qty || 1)).toFixed(2)}</td>
                    <td>
                      <span className="badge-status-filled">FILLED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
