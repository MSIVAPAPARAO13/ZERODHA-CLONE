import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { insightsService } from '../services/api';
import './Insights.css';

export default function Insights() {
  const navigate = useNavigate();
  const [feedData, setFeedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadTodayFeed();
  }, []);

  const loadTodayFeed = async () => {
    setLoading(true);
    try {
      const res = await insightsService.getToday();
      if (res.data && res.data.success && res.data.data) {
        setFeedData(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load today feed', err);
      toast.error('Failed to load daily research feed');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (evtId, e) => {
    if (e) e.stopPropagation();
    try {
      await insightsService.dismiss(evtId);
      // Remove dismissed item from state
      setFeedData(prev => {
        if (!prev) return prev;
        const updatedEvents = prev.events.filter(ev => ev._id !== evtId);
        const updatedSections = prev.sections.map(sec => ({
          ...sec,
          events: sec.events.filter(ev => ev._id !== evtId)
        })).filter(sec => sec.events.length > 0);

        return {
          ...prev,
          events: updatedEvents,
          sections: updatedSections,
          summary: {
            ...prev.summary,
            totalEvents: updatedEvents.length
          }
        };
      });
      toast.success('Insight dismissed from today’s feed');
    } catch (err) {
      toast.error('Failed to dismiss insight');
    }
  };

  const handleInvestigate = (evt, e) => {
    if (e) e.stopPropagation();
    const q = `Why did ${evt.symbol} exhibit ${evt.title} today?`;
    navigate(`/research?symbol=${evt.symbol}&intent=EVENT_INVESTIGATION&question=${encodeURIComponent(q)}`);
  };

  const handleAskQuestion = (question) => {
    // Extract symbol if present in question
    const words = question.split(' ');
    const symbolCandidate = words.find(w => w === w.toUpperCase() && w.length >= 2 && w.length <= 10);
    const symParam = symbolCandidate ? `&symbol=${symbolCandidate}` : '';
    navigate(`/research?intent=EVENT_INVESTIGATION&question=${encodeURIComponent(question)}${symParam}`);
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'badge-sev-critical';
      case 'SIGNIFICANT': return 'badge-sev-significant';
      case 'WATCH': return 'badge-sev-watch';
      default: return 'badge-sev-info';
    }
  };

  return (
    <div className="insights-container">
      {/* Header */}
      <div className="insights-header">
        <div className="insights-title-row">
          <span className="insights-badge">MVP-39</span>
          <h2>💡 What Changed Today?</h2>
        </div>
        <p className="insights-subtitle">
          Your personalized daily market research briefing based on your watchlist, holdings, active alerts, and recent inquiries.
        </p>

        {/* Date and Refresh */}
        <div className="insights-subbar">
          <span className="feed-date">
            📅 {feedData?.date ? new Date(feedData.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Today'}
          </span>
          <button type="button" className="btn-refresh-feed" onClick={loadTodayFeed} disabled={loading}>
            ↻ Refresh Feed
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {feedData?.summary && (
        <div className="insights-kpi-strip">
          <div className="kpi-card">
            <span className="kpi-num text-critical">{feedData.summary.criticalCount || 0}</span>
            <span className="kpi-label">Critical Confluences</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-num text-portfolio">{feedData.summary.portfolioEventsCount || 0}</span>
            <span className="kpi-label">Portfolio Moves</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-num text-watchlist">{feedData.summary.watchlistEventsCount || 0}</span>
            <span className="kpi-label">Watchlist Signals</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-num text-alerts">{feedData.summary.alertEventsCount || 0}</span>
            <span className="kpi-label">Triggered Alerts</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-num text-total">{feedData.summary.totalEvents || 0}</span>
            <span className="kpi-label">Total Signals Today</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="insights-main">
        {loading ? (
          <div className="insights-loading">Compiling your personalized research briefing...</div>
        ) : !feedData || feedData.sections?.length === 0 ? (
          <div className="insights-empty-state">
            <span className="empty-icon">🌱</span>
            <h3>No Significant Changes Detected</h3>
            <p>
              Your monitored market state is unchanged based on the data currently available to TradeFlow.
              All holdings, watchlist items, and alerts are within ordinary parameters.
            </p>
            <button
              type="button"
              className="btn-empty-action"
              onClick={() => navigate('/scanner')}
            >
              Explore Market Scanner
            </button>
          </div>
        ) : (
          <div className="insights-sections-list">
            {feedData.sections.map((section) => (
              <div key={section.id} className="feed-section">
                <div className="section-header">
                  <span className="section-icon">{section.icon}</span>
                  <h3 className="section-title">{section.title}</h3>
                  <span className="section-count">{section.events.length}</span>
                </div>

                <div className="section-cards-grid">
                  {section.events.map((evt) => (
                    <div
                      key={evt._id}
                      className={`insight-card ${evt.isRead ? 'read' : 'unread'} ${evt.eventType === 'CORRELATED_EVENT' ? 'confluence-border' : ''}`}
                    >
                      <div className="card-top">
                        <div className="card-top-left">
                          <span className={`sev-tag ${getSeverityBadgeClass(evt.severity)}`}>
                            {evt.severity}
                          </span>
                          <span className="sym-tag">{evt.symbol}</span>
                          <span className="type-tag">{evt.eventType}</span>
                        </div>
                        <div className="card-top-right">
                          <button
                            type="button"
                            className="btn-dismiss"
                            title="Dismiss from today's feed"
                            onClick={(e) => handleDismiss(evt._id, e)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="card-content">
                        <h4 className="card-title">{evt.title}</h4>
                        <p className="card-desc">{evt.description}</p>

                        {/* "Why This Appears" */}
                        {evt.whyThisAppears && (
                          <div className="why-appears-box">
                            <span className="why-label">WHY THIS APPEARS:</span>
                            <span className="why-text">{evt.whyThisAppears}</span>
                          </div>
                        )}

                        {/* Correlated signals preview */}
                        {evt.correlatedSignals?.length > 0 && (
                          <div className="card-signals-list">
                            {evt.correlatedSignals.map((sig, i) => (
                              <span key={i} className="sig-bubble">
                                <b>{sig.eventType}:</b> {sig.description || sig.metric}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="card-footer">
                        <span className="footer-time">
                          {new Date(evt.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <div className="card-actions">
                          <button
                            type="button"
                            className="btn-view-details"
                            onClick={() => setSelectedEvent(evt)}
                          >
                            View Evidence
                          </button>
                          <button
                            type="button"
                            className="btn-copilot"
                            onClick={(e) => handleInvestigate(evt, e)}
                          >
                            🔬 Investigate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Daily Research Questions Section */}
        {feedData?.researchQuestions?.length > 0 && (
          <div className="daily-questions-card">
            <div className="questions-header">
              <span className="q-icon">🎯</span>
              <h4>Empirical Research Inquiries For Today</h4>
            </div>
            <p className="questions-subtitle">
              Generated deterministically from today’s detected events. Click any inquiry to launch an investigation dossier.
            </p>
            <div className="questions-grid">
              {feedData.researchQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="question-chip-card"
                  onClick={() => handleAskQuestion(q)}
                >
                  <span className="q-bullet">↳</span>
                  <span className="q-text">{q}</span>
                  <span className="q-action-hint">Investigate →</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Evidence Modal */}
      {selectedEvent && (
        <div className="insights-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="insights-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEvent.symbol} — Evidence Details</h3>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><b>Event:</b> {selectedEvent.title}</p>
              <p><b>Context:</b> {selectedEvent.whyThisAppears}</p>
              <p><b>Provider:</b> {selectedEvent.provider}</p>
              <p><b>Occurred:</b> {new Date(selectedEvent.occurredAt).toLocaleString()}</p>
              <p><b>Dedupe Key:</b> <code style={{ fontSize: 11 }}>{selectedEvent.dedupeKey}</code></p>

              {selectedEvent.observedData?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4>Observed Metrics</h4>
                  <table className="evidence-minitable">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Provider</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEvent.observedData.map((d, i) => (
                        <tr key={i}>
                          <td>{d.metric}</td>
                          <td>{String(d.value)} {d.unit}</td>
                          <td>{d.provider}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-copilot"
                onClick={(e) => handleInvestigate(selectedEvent, e)}
              >
                🔬 Open in Research Copilot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
