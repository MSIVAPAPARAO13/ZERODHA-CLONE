import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { marketEventsService } from '../services/api';
import './Events.css';

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (severityFilter !== 'ALL') {
        params.severity = severityFilter;
      }
      const res = await marketEventsService.getEvents(params);
      if (res.data && res.data.success && res.data.data) {
        setEvents(res.data.data.events || []);
      }
    } catch (err) {
      console.warn('Failed to load market events', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await marketEventsService.evaluate();
      if (res.data && res.data.success) {
        toast.success(`Evaluated market state. ${res.data.data.evaluatedCount} events active.`);
        loadEvents();
      }
    } catch (err) {
      toast.error('Failed to run event evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await marketEventsService.markAllRead();
      if (res.data && res.data.success) {
        toast.success('All events marked as read');
        loadEvents();
      }
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleMarkSingleRead = async (evtId, e) => {
    if (e) e.stopPropagation();
    try {
      await marketEventsService.markRead(evtId);
      setEvents(prev => prev.map(ev => ev._id === evtId ? { ...ev, isRead: true } : ev));
    } catch (err) {
      // silent
    }
  };

  const handleInvestigate = (evt, e) => {
    if (e) e.stopPropagation();
    const q = `Why did ${evt.symbol} generate this ${evt.eventType.replace('_', ' ')} event today?`;
    navigate(`/research?symbol=${evt.symbol}&intent=EVENT_INVESTIGATION&question=${encodeURIComponent(q)}`);
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'badge-sev-critical';
      case 'SIGNIFICANT': return 'badge-sev-significant';
      case 'WATCH': return 'badge-sev-watch';
      default: return 'badge-sev-info';
    }
  };

  const getSeverityIcon = (sev) => {
    switch (sev) {
      case 'CRITICAL': return '🔴';
      case 'SIGNIFICANT': return '🟠';
      case 'WATCH': return '🟡';
      default: return '🔵';
    }
  };

  return (
    <div className="events-page-container">
      {/* Header */}
      <div className="events-header">
        <div className="events-title-wrap">
          <span className="events-badge">MVP-38</span>
          <h2>⚡ Market Event Intelligence</h2>
        </div>
        <p className="events-subtitle">
          Real-time detected market events, multi-signal correlation clusters, and grounded investigation triggers.
        </p>

        {/* Action Toolbar */}
        <div className="events-toolbar">
          <div className="filter-chips">
            {['ALL', 'CRITICAL', 'SIGNIFICANT', 'WATCH', 'INFO'].map(sev => (
              <button
                key={sev}
                type="button"
                className={`filter-chip ${severityFilter === sev ? 'active' : ''}`}
                onClick={() => setSeverityFilter(sev)}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="toolbar-actions">
            <button
              type="button"
              className="btn-eval"
              disabled={evaluating}
              onClick={handleEvaluate}
            >
              {evaluating ? 'Evaluating...' : '↻ Evaluate Now'}
            </button>
            <button
              type="button"
              className="btn-mark-all"
              onClick={handleMarkAllRead}
            >
              ✓ Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* Events Feed List */}
      <div className="events-content">
        {loading ? (
          <div className="events-loading">Evaluating market events...</div>
        ) : events.length === 0 ? (
          <div className="events-empty-card">
            <span className="empty-icon">🔕</span>
            <h3>No Active Market Events</h3>
            <p>
              No notable price moves, volume surges, or scanner matches currently detected
              for your monitored universe.
            </p>
            <button type="button" className="btn-eval-cta" onClick={handleEvaluate}>
              Evaluate Market State Now
            </button>
          </div>
        ) : (
          <div className="events-feed-list">
            {events.map((evt) => (
              <div
                key={evt._id}
                className={`event-card ${evt.isRead ? 'read' : 'unread'} ${evt.eventType === 'CORRELATED_EVENT' ? 'correlated-card' : ''}`}
                onClick={() => {
                  setSelectedEvent(evt);
                  if (!evt.isRead) handleMarkSingleRead(evt._id);
                }}
              >
                <div className="event-card-top">
                  <div className="event-top-left">
                    <span className={`severity-tag ${getSeverityBadgeClass(evt.severity)}`}>
                      {getSeverityIcon(evt.severity)} {evt.severity}
                    </span>
                    <span className="event-type-pill">{evt.eventType}</span>
                    <span className="event-symbol-badge">{evt.symbol}</span>
                    {evt.eventType === 'CORRELATED_EVENT' && (
                      <span className="confluence-tag">✨ Confluence Cluster</span>
                    )}
                  </div>
                  <div className="event-top-right">
                    <span className="event-time">
                      {new Date(evt.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!evt.isRead && <span className="unread-dot" title="Unread event" />}
                  </div>
                </div>

                <div className="event-body">
                  <h4 className="event-title">{evt.title}</h4>
                  <p className="event-desc">{evt.description}</p>

                  {/* Correlated Signals Display */}
                  {evt.correlatedSignals?.length > 0 && (
                    <div className="correlated-signals-box">
                      <span className="signals-label">Supporting Signals ({evt.correlatedSignals.length}):</span>
                      <div className="signal-chips-list">
                        {evt.correlatedSignals.map((sig, idx) => (
                          <div key={idx} className="sig-chip">
                            <span className="sig-type">{sig.eventType}:</span>
                            <span className="sig-val">{sig.description || sig.metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observed Metrics Preview */}
                  {evt.observedData?.length > 0 && (
                    <div className="event-metrics-row">
                      {evt.observedData.slice(0, 3).map((obs, i) => (
                        <div key={i} className="metric-item">
                          <span className="m-label">{obs.metric}:</span>
                          <span className="m-val">{String(obs.value)} {obs.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="event-footer">
                  <div className="footer-meta">
                    <span className="meta-prov">Source: {evt.provider}</span>
                    <span className="meta-cat">Cat: {evt.category}</span>
                  </div>
                  <div className="footer-actions">
                    <button
                      type="button"
                      className="btn-view-ev"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(evt);
                      }}
                    >
                      View Evidence
                    </button>
                    <button
                      type="button"
                      className="btn-investigate"
                      onClick={(e) => handleInvestigate(evt, e)}
                    >
                      🔬 Investigate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Evidence Modal */}
      {selectedEvent && (
        <div className="event-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="event-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <span className={`severity-tag ${getSeverityBadgeClass(selectedEvent.severity)}`}>
                  {selectedEvent.severity}
                </span>
                <h3>{selectedEvent.symbol} — {selectedEvent.eventType}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="d-label">Title</span>
                <span className="d-value">{selectedEvent.title}</span>
              </div>
              <div className="detail-row">
                <span className="d-label">Description</span>
                <span className="d-value">{selectedEvent.description}</span>
              </div>
              <div className="detail-row">
                <span className="d-label">Dedupe Key (SHA-256)</span>
                <span className="d-value font-mono">{selectedEvent.dedupeKey}</span>
              </div>
              {selectedEvent.clusterId && (
                <div className="detail-row">
                  <span className="d-label">Cluster ID</span>
                  <span className="d-value font-mono">{selectedEvent.clusterId}</span>
                </div>
              )}

              {/* Observed Data Table */}
              <h4 style={{ margin: '16px 0 8px 0', fontSize: '13px' }}>Observed Evidence Records</h4>
              <div className="table-responsive">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                      <th>Unit</th>
                      <th>Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEvent.observedData?.map((obs, i) => (
                      <tr key={i}>
                        <td className="font-semibold">{obs.metric}</td>
                        <td>{String(obs.value)}</td>
                        <td>{obs.unit || '—'}</td>
                        <td>{obs.provider}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-investigate primary"
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
