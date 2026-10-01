import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { journalService } from "../services/api";

const TradeJournal = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await journalService.getJournals();
      const list = res.data?.data ?? res.data;
      setJournals(Array.isArray(list) ? list : []);
    } catch (err) {
      setError("Failed to load trade journal.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="terminal-dashboard">
      <div className="empty-center-box text-muted" style={{ padding: '60px 0' }}>
        <span style={{ fontSize: '1.5rem' }}>📝</span>
        <p style={{ marginTop: 8 }}>Loading journal entries…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="terminal-dashboard">
      <div className="empty-center-box" style={{ padding: '60px 0', color: '#f43f5e' }}>
        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
        <p style={{ marginTop: 8 }}>{error}</p>
      </div>
    </div>
  );

  const avgConfidence = journals.length > 0
    ? (journals.reduce((a, j) => a + (j.confidence || 0), 0) / journals.length).toFixed(1)
    : 0;

  return (
    <div className="terminal-dashboard">
      {/* Header */}
      <div className="context-ribbon">
        <div className="ribbon-title-box">
          <h1 className="terminal-page-title">Trade Journal</h1>
          <p className="terminal-subtitle">All journaled trades with thesis, confidence, and replay links.</p>
        </div>
        <span className="badge-simulation">
          <span className="pulse-dot"></span> {journals.length} ENTRIES
        </span>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'TOTAL JOURNALED', val: journals.length, icon: '📝' },
          { label: 'WITH TARGET', val: journals.filter(j => j.targetPrice).length, icon: '🎯' },
          { label: 'WITH STOP LOSS', val: journals.filter(j => j.riskPrice).length, icon: '🛡️' },
          { label: 'AVG CONFIDENCE', val: `${avgConfidence} / 5`, icon: '⭐' },
        ].map(({ label, val, icon }) => (
          <div key={label} className="terminal-card kpi-card">
            <div className="card-header-compact">
              <span className="kpi-label">{label}</span>
              <span className="kpi-icon">{icon}</span>
            </div>
            <div className="kpi-val text-primary-num font-mono">{val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="terminal-card">
        <div className="panel-header">
          <h3 className="panel-title">📋 All Journaled Trades</h3>
        </div>
        <div className="table-responsive">
          <table className="terminal-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Strategy</th>
                <th>Entry</th>
                <th>Target</th>
                <th>Stop</th>
                <th>Conf.</th>
                <th>Replay</th>
              </tr>
            </thead>
            <tbody>
              {journals.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No journal entries yet. Enable "Add Trade Thesis" when placing an order to log your first entry.
                  </td>
                </tr>
              ) : journals.map((j) => (
                <tr key={j._id}>
                  <td className="font-mono text-muted" style={{ fontSize: '0.78rem' }}>
                    {new Date(j.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="font-mono font-semibold text-primary-num">{j.symbol}</td>
                  <td>
                    <span className={`badge-side ${j.side === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                      {j.side}
                    </span>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.78rem' }}>{j.strategy || '—'}</td>
                  <td className="font-mono">₹{Number(j.entryPrice || 0).toFixed(2)}</td>
                  <td className="font-mono text-emerald">{j.targetPrice ? `₹${Number(j.targetPrice).toFixed(2)}` : '—'}</td>
                  <td className="font-mono text-rose">{j.riskPrice ? `₹${Number(j.riskPrice).toFixed(2)}` : '—'}</td>
                  <td className="font-mono">{j.confidence ? `${j.confidence}/5` : '—'}</td>
                  <td>
                    <Link to={`/replay/${j._id}`} className="btn-investigate" style={{ fontSize: '0.72rem' }}>
                      Replay →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradeJournal;
