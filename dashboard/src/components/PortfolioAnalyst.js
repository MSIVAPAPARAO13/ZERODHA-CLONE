import React, { useState } from "react";
import { aiService } from "../services/api";

const ACTIONS = [
  {
    type: "portfolioReview",
    title: "Portfolio Review",
    icon: "🏛️",
    desc: "Analyze holdings, concentration risk, sector exposure and Herfindahl index.",
  },
  {
    type: "patternReview",
    title: "Pattern Review",
    icon: "🔁",
    desc: "Identify repeated behaviors and patterns in your recent journal entries.",
  },
  {
    type: "dailyDebrief",
    title: "Daily Debrief",
    icon: "📅",
    desc: "Summarize today's transactions, P&L movement and key activity.",
  },
  {
    type: "whatChangedToday",
    title: "What Changed Today",
    icon: "⚡",
    desc: "Quick factual summary of portfolio and watchlist differences in last 24h.",
  },
];

const PortfolioAnalyst = () => {
  const [loadingType, setLoadingType] = useState(null);
  const [results, setResults] = useState({});
  const [error, setError] = useState("");

  const handleAction = async (type) => {
    setLoadingType(type);
    setError("");
    try {
      const serviceMap = {
        portfolioReview: aiService.portfolioReview,
        patternReview: aiService.patternReview,
        dailyDebrief: aiService.dailyDebrief,
        whatChangedToday: aiService.whatChangedToday,
      };
      const res = await serviceMap[type]();
      const analysis = res.data?.data?.analysis ?? res.data?.data ?? res.data;
      setResults(prev => ({ ...prev, [type]: analysis }));
    } catch (err) {
      setError(err.response?.data?.error?.message || `Failed to perform ${type}.`);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="terminal-dashboard">
      {/* Header */}
      <div className="context-ribbon">
        <div className="ribbon-title-box">
          <h1 className="terminal-page-title">✨ AI Portfolio Analyst</h1>
          <p className="terminal-subtitle">
            Educational AI analysis based on your recorded activity. Not investment advice.
          </p>
        </div>
        <span className="badge-simulation">
          <span className="pulse-dot"></span> AI ENGINE LIVE
        </span>
      </div>

      {error && (
        <div style={{
          background: '#2d0e14', border: '1px solid #f43f5e44', borderRadius: 8,
          padding: '12px 16px', marginBottom: 16, color: '#f43f5e', fontSize: '0.85rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {ACTIONS.map(({ type, title, icon, desc }) => (
          <div key={type} className="terminal-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card-header-compact">
              <span className="kpi-label">{title}</span>
              <span className="kpi-icon">{icon}</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>{desc}</p>

            {!results[type] ? (
              <button
                onClick={() => handleAction(type)}
                disabled={loadingType !== null}
                id={`ai-${type}-btn`}
                style={{
                  background: loadingType === type ? '#1e293b' : '#0284c7',
                  color: '#fff', border: 'none', padding: '9px 16px',
                  borderRadius: 6, cursor: loadingType !== null ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '0.82rem', opacity: loadingType !== null && loadingType !== type ? 0.5 : 1
                }}
              >
                {loadingType === type ? '⏳ Analyzing…' : `Run ${title}`}
              </button>
            ) : (
              <div style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 6, padding: 14, fontSize: '0.82rem' }}>
                {results[type].summary && (
                  <>
                    <p style={{ fontWeight: 600, color: '#38bdf8', marginBottom: 6, fontSize: '0.8rem' }}>SUMMARY</p>
                    <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: 8 }}>{results[type].summary}</p>
                  </>
                )}
                {results[type].portfolioFacts?.length > 0 && (
                  <>
                    <p style={{ fontWeight: 600, color: '#38bdf8', marginBottom: 4, fontSize: '0.8rem' }}>KEY FACTS</p>
                    <ul style={{ paddingLeft: 16, margin: '0 0 8px', color: '#94a3b8', lineHeight: 1.7 }}>
                      {results[type].portfolioFacts.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </>
                )}
                {results[type].reflectionQuestions?.length > 0 && (
                  <>
                    <p style={{ fontWeight: 600, color: '#38bdf8', marginBottom: 4, fontSize: '0.8rem' }}>REFLECT</p>
                    <ul style={{ paddingLeft: 16, margin: '0 0 8px', color: '#94a3b8', lineHeight: 1.7 }}>
                      {results[type].reflectionQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </>
                )}
                {typeof results[type] === 'string' && (
                  <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{results[type]}</p>
                )}
                <button
                  onClick={() => setResults(prev => { const n = { ...prev }; delete n[type]; return n; })}
                  style={{
                    background: 'transparent', color: '#64748b', border: '1px solid #334155',
                    padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', marginTop: 8
                  }}
                >
                  Clear ✕
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioAnalyst;
