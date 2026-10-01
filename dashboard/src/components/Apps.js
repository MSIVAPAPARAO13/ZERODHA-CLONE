import React from "react";
import { useNavigate } from "react-router-dom";

const TOOL_CARDS = [
  { icon: "🔍", label: "Market Scanner", desc: "RSI, Volume & Breakout signals across 500+ symbols", path: "/scanner", accent: "#10b981" },
  { icon: "🔬", label: "Research Copilot", desc: "AI-powered grounded evidence research on any asset", path: "/research", accent: "#7c3aed" },
  { icon: "🧪", label: "Strategy Lab", desc: "Walk-forward backtesting, optimization, split-test", path: "/strategy-lab", accent: "#0284c7" },
  { icon: "🎯", label: "Scenario Planner", desc: "Stress-test your portfolio against historic shocks", path: "/stress-studio", accent: "#f43f5e" },
  { icon: "🌊", label: "Cascade Contagion", desc: "Multi-hop sector impact graph from a trigger event", path: "/cascade", accent: "#f59e0b" },
  { icon: "✨", label: "AI Portfolio Analyst", desc: "Portfolio review, daily debrief, pattern review", path: "/ai-analyst", accent: "#a855f7" },
  { icon: "📖", label: "Playbooks", desc: "Define and enforce pre-trade checklists and rules", path: "/playbooks", accent: "#06b6d4" },
  { icon: "⚙️", label: "Edge & Behavior", desc: "Discipline analytics, rule compliance, bias detection", path: "/behavior-insights", accent: "#f97316" },
  { icon: "⚡", label: "Market Events", desc: "Live SEBI, corporate action, and earnings event feed", path: "/events", accent: "#ef4444" },
  { icon: "💡", label: "Daily Insights", desc: "AI-generated catalyst intelligence, digests, and alerts", path: "/insights", accent: "#38bdf8" },
  { icon: "📝", label: "Trade Journal", desc: "Review all journaled trades with thesis and replay", path: "/journal", accent: "#10b981" },
  { icon: "🔔", label: "Alerts", desc: "Price alerts on any watchlist instrument", path: "/alerts", accent: "#f59e0b" },
];

const Apps = () => {
  const navigate = useNavigate();

  return (
    <div className="terminal-dashboard">
      <div className="context-ribbon">
        <div className="ribbon-title-box">
          <h1 className="terminal-page-title">Apps & Tools</h1>
          <p className="terminal-subtitle">All TradeFlow intelligence modules, research copilots, and portfolio tools in one place.</p>
        </div>
        <span className="badge-simulation">
          <span className="pulse-dot"></span> ALL SYSTEMS LIVE
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {TOOL_CARDS.map((tool, i) => (
          <div
            key={i}
            onClick={() => navigate(tool.path)}
            style={{
              background: '#0f172a', border: `1px solid #1e293b`,
              borderRadius: '8px', padding: '18px', cursor: 'pointer',
              transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '8px'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = tool.accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>{tool.icon}</span>
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>{tool.label}</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: '1.5', margin: 0 }}>{tool.desc}</p>
            <div style={{ marginTop: '4px' }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600, color: tool.accent,
                fontFamily: 'monospace', letterSpacing: '0.04em'
              }}>OPEN →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Apps;
