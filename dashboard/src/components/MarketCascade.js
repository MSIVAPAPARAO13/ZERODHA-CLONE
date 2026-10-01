import React, { useState, useEffect } from 'react';
import { marketCascadeService } from '../services/api';
import toast from 'react-hot-toast';
import './MarketCascade.css';

const MarketCascade = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [depth, setDepth] = useState(3);
  const [cascade, setCascade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cascade'); // 'cascade', 'timeline'

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await marketCascadeService.getEvents();
      if (res.data.success && res.data.data.length > 0) {
        setEvents(res.data.data);
        const defaultId = res.data.data[0].id;
        setSelectedEventId(defaultId);
        loadCascade(defaultId, depth);
      }
    } catch (err) {
      toast.error('Failed to load market events');
    } finally {
      setLoading(false);
    }
  };

  const loadCascade = async (eventId, currentDepth) => {
    try {
      setLoading(true);
      setSelectedNode(null);
      setAiExplanation(null);
      const res = await marketCascadeService.getCascade(eventId, { depth: currentDepth });
      if (res.data.success) {
        setCascade(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error generating cascade');
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (e) => {
    const newId = e.target.value;
    setSelectedEventId(newId);
    loadCascade(newId, depth);
  };

  const handleDepthChange = (newDepth) => {
    setDepth(newDepth);
    if (selectedEventId) {
      loadCascade(selectedEventId, newDepth);
    }
  };

  const handleNodeClick = (node) => {
    // Find incident edge for evidence details
    const edge = cascade.edges.find(e => e.target === node.id || e.source === node.id);
    setSelectedNode({ ...node, edge });
  };

  const handleThesisReview = async (thesisId, status) => {
    try {
      const res = await marketCascadeService.submitThesisReview(selectedEventId, {
        thesisId,
        status,
        reason: reviewReason || `Marked as ${status}`
      });
      if (res.data.success) {
        toast.success(`Thesis marked as ${status}`);
        setReviewReason('');
        // Reload cascade to reflect updated review state and audit history
        loadCascade(selectedEventId, depth);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Review submission failed');
    }
  };

  const handleCreateResearchQuestion = async (rq) => {
    try {
      const res = await marketCascadeService.saveResearchQuestion(selectedEventId, {
        question: rq.question,
        context: rq.observedEvidence,
        thesisId: rq.thesisId,
        affectedSymbol: rq.affectedEntity
      });
      if (res.data.success) {
        toast.success('Research question saved to research queue!');
      }
    } catch (err) {
      toast.error('Failed to save research question');
    }
  };

  const handleExplainWithAI = async () => {
    try {
      setAiLoading(true);
      const res = await marketCascadeService.explainCascade(selectedEventId, { depth });
      if (res.data.success) {
        setAiExplanation(res.data.data.explanation);
        toast.success('Grounded explanation synthesized!');
      }
    } catch (err) {
      toast.error('AI Explainer temporarily unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading && !cascade) {
    return <div className="cascade-container"><p>Loading Market Event Cascade Engine...</p></div>;
  }

  const event = cascade?.event || {};
  const portfolio = cascade?.portfolioImpact || {};
  const strategies = cascade?.strategies || [];
  const theses = cascade?.theses || [];
  const researchQuestions = cascade?.researchQuestions || [];

  // Group nodes by level for visual tree layout
  const eventNodes = cascade?.nodes.filter(n => n.type === 'EVENT') || [];
  const directNodes = cascade?.nodes.filter(n => n.type === 'DIRECT_SECURITY') || [];
  const intermediateNodes = cascade?.nodes.filter(n => ['SECTOR', 'RELATED_ENTITY'].includes(n.type)) || [];
  const leafNodes = cascade?.nodes.filter(n => ['PORTFOLIO', 'PLAYBOOK', 'THESIS', 'WATCHLIST', 'ALERT'].includes(n.type)) || [];

  return (
    <div className="cascade-container">
      {/* Top Header */}
      <div className="cascade-header">
        <div>
          <h1>Market Event Cascade & Thesis Impact</h1>
          <p>Multi-hop, evidence-backed propagation connecting macro catalysts to portfolio logic</p>
        </div>
        <div className="cascade-controls">
          <select 
            value={selectedEventId} 
            onChange={handleEventChange}
            className="cascade-select"
          >
            {events.map(e => (
              <option key={e.id} value={e.id}>
                {e.symbol} — {e.title.substring(0, 45)}...
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className={`depth-btn ${depth === 1 ? 'active' : ''}`}
              onClick={() => handleDepthChange(1)}
              title="Depth 1: Event and Direct Security"
            >
              Depth 1
            </button>
            <button 
              className={`depth-btn ${depth === 2 ? 'active' : ''}`}
              onClick={() => handleDepthChange(2)}
              title="Depth 2: Sector and Verified Peers"
            >
              Depth 2
            </button>
            <button 
              className={`depth-btn ${depth === 3 ? 'active' : ''}`}
              onClick={() => handleDepthChange(3)}
              title="Depth 3: Portfolio, Strategies and Theses"
            >
              Depth 3
            </button>
          </div>

          <button 
            className={`depth-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode(viewMode === 'cascade' ? 'timeline' : 'cascade')}
          >
            {viewMode === 'cascade' ? 'Decision Timeline' : 'Cascade Graph'}
          </button>
        </div>
      </div>

      {/* Event Details Card */}
      <div className="event-hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className={`badge badge-${event.category?.toLowerCase() || 'corporate'}`}>
              {event.category || 'EVENT'}
            </span>
            <h2 style={{ margin: '8px 0 4px 0', fontSize: '18px', color: '#0f172a' }}>{event.title}</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>{event.summary}</p>
          </div>
          <button 
            className="btn-action btn-primary" 
            style={{ width: 'auto', padding: '8px 16px', whiteSpace: 'nowrap' }}
            onClick={handleExplainWithAI}
            disabled={aiLoading}
          >
            {aiLoading ? 'Synthesizing...' : '✨ Explain with Grounded AI'}
          </button>
        </div>
        <div className="event-meta-row">
          <span><strong>Ticker:</strong> {event.symbol}</span>
          <span><strong>Source:</strong> {event.provider}</span>
          <span><strong>Published:</strong> {new Date(event.publishedAt).toLocaleString()}</span>
          <span><strong>Graph Version:</strong> {cascade?.meta?.calculationVersion}</span>
        </div>
      </div>

      {/* Grounded AI Explainer Result */}
      {aiExplanation && (
        <div className="ai-explainer-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#6b21a8', fontSize: '16px' }}>✨ Grounded AI Analysis (Zero Hallucination)</h3>
            <button 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              onClick={() => setAiExplanation(null)}
            >
              ✕ Close
            </button>
          </div>
          <p style={{ fontSize: '13px', margin: '8px 0', color: '#374151' }}>{aiExplanation.summary}</p>

          <div className="ai-category-block">
            <div className="ai-category-title">Observed Facts</div>
            {aiExplanation.observed?.map((item, idx) => <div key={idx} style={{ fontSize: '12px' }}>• {item}</div>)}
          </div>
          <div className="ai-category-block">
            <div className="ai-category-title">Provider-Supplied Information</div>
            {aiExplanation.providerSupplied?.map((item, idx) => <div key={idx} style={{ fontSize: '12px' }}>• {item}</div>)}
          </div>
          <div className="ai-category-block">
            <div className="ai-category-title">Derived Intersections</div>
            {aiExplanation.derived?.map((item, idx) => <div key={idx} style={{ fontSize: '12px' }}>• {item}</div>)}
          </div>
          <div className="ai-category-block">
            <div className="ai-category-title">User-Defined Assumptions</div>
            {aiExplanation.userDefined?.map((item, idx) => <div key={idx} style={{ fontSize: '12px' }}>• {item}</div>)}
          </div>
          <div className="ai-category-block">
            <div className="ai-category-title">Remaining Unknowns</div>
            {aiExplanation.unknown?.map((item, idx) => <div key={idx} style={{ fontSize: '12px' }}>• {item}</div>)}
          </div>
        </div>
      )}

      {viewMode === 'cascade' ? (
        <>
          {/* Interactive Graph Card */}
          <div className="graph-stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Interactive Relationship Graph</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {cascade?.nodes.length} Nodes • {cascade?.edges.length} Edges (Max Depth: {depth})
              </span>
            </div>

            {/* Legend */}
            <div className="graph-legend">
              <div className="legend-item"><span className="legend-dot dot-provider"></span> <strong>PROVIDER-SUPPLIED:</strong> External API Market Data</div>
              <div className="legend-item"><span className="legend-dot dot-verified"></span> <strong>VERIFIED:</strong> Exchange Registry & Taxonomies</div>
              <div className="legend-item"><span className="legend-dot dot-derived"></span> <strong>DERIVED:</strong> Portfolio Exposure Calculations</div>
              <div className="legend-item"><span className="legend-dot dot-user"></span> <strong>USER-DEFINED:</strong> Authored Theses & Playbooks</div>
            </div>

            {/* Visual Tree */}
            <div className="cascade-visual-tree">
              {/* Level 0: Event */}
              <div className="tree-level">
                {eventNodes.map(node => (
                  <div 
                    key={node.id} 
                    className={`tree-node ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => handleNodeClick(node)}
                  >
                    <div className="node-type">ROOT EVENT</div>
                    <div className="node-name">{node.symbol} Catalyst</div>
                    <div className="node-sub">{node.metadata.category}</div>
                  </div>
                ))}
              </div>

              <div className="tree-connector"></div>

              {/* Level 1: Direct Entity */}
              <div className="tree-level">
                {directNodes.map(node => (
                  <div 
                    key={node.id} 
                    className={`tree-node ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => handleNodeClick(node)}
                  >
                    <div className="node-type">DIRECT SECURITY</div>
                    <div className="node-name">{node.name}</div>
                    <div className="node-sub">Exchange Identifier</div>
                  </div>
                ))}
              </div>

              {intermediateNodes.length > 0 && (
                <>
                  <div className="tree-connector"></div>
                  {/* Level 2: Sector & Related Entities */}
                  <div className="tree-level">
                    {intermediateNodes.map(node => (
                      <div 
                        key={node.id} 
                        className={`tree-node ${selectedNode?.id === node.id ? 'selected' : ''}`}
                        onClick={() => handleNodeClick(node)}
                      >
                        <div className="node-type">{node.type}</div>
                        <div className="node-name">{node.name}</div>
                        <div className="node-sub">{node.metadata?.industry || `Peer of ${node.metadata?.peerOf}`}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {leafNodes.length > 0 && (
                <>
                  <div className="tree-connector"></div>
                  {/* Level 3: Portfolio, Playbooks, Theses */}
                  <div className="tree-level">
                    {leafNodes.map(node => (
                      <div 
                        key={node.id} 
                        className={`tree-node ${selectedNode?.id === node.id ? 'selected' : ''}`}
                        onClick={() => handleNodeClick(node)}
                      >
                        <div className="node-type">{node.type}</div>
                        <div className="node-name">{node.name}</div>
                        <div className="node-sub">
                          {node.type === 'PORTFOLIO' ? `${node.metadata.exposurePercent}% Exposure` :
                           node.type === 'THESIS' ? `Status: ${node.metadata.status}` :
                           node.type === 'PLAYBOOK' ? `Strategy: ${node.metadata.strategy}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Clicked Node Detail Drawer */}
            {selectedNode && (
              <div className="node-inspector-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                    Entity Inspector: {selectedNode.name} ({selectedNode.type})
                  </h4>
                  <button 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    onClick={() => setSelectedNode(null)}
                  >
                    ✕ Close
                  </button>
                </div>
                <div className="inspector-grid">
                  <div><strong>Entity ID:</strong> {selectedNode.id}</div>
                  <div><strong>Source:</strong> {selectedNode.source}</div>
                  <div><strong>Relationship:</strong> {selectedNode.edge?.relationshipType || 'DIRECT'}</div>
                  <div><strong>Confidence:</strong> {selectedNode.edge?.confidence || 'VERIFIED'}</div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Factual Evidence:</strong> {selectedNode.edge?.evidence || 'Primary root event.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Grid: Portfolio & Strategies, Thesis Drift & Review */}
          <div className="cascade-grid">
            {/* Left: Portfolio Impact & Strategies */}
            <div className="cascade-card">
              <h2>Portfolio & Strategy Intersection</h2>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Direct Portfolio Exposure
                </div>
                {portfolio.isHeld ? (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>
                      {portfolio.exposurePercent}%
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>
                      ({portfolio.shares} shares • ₹{portfolio.currentValue?.toLocaleString()})
                    </span>
                  </div>
                ) : (
                  <div style={{ marginTop: '4px', fontSize: '14px', color: '#64748b' }}>
                    No direct open shares held in active portfolio.
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '14px', color: '#0f172a', margin: '0 0 10px 0' }}>
                  Intersecting Playbooks ({strategies.length})
                </h3>
                {strategies.length > 0 ? (
                  strategies.map(s => (
                    <div key={s.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '6px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Strategy: {s.strategy} • {s.rulesCount} Execution Rules
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748b' }}>No playbooks actively reference this entity.</p>
                )}
              </div>
            </div>

            {/* Right: Thesis Drift, Diff & Review Action */}
            <div className="cascade-card">
              <h2>Thesis Drift Detection & Review</h2>

              {theses.length > 0 ? (
                theses.map(thesis => (
                  <div key={thesis.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>
                        Thesis v{thesis.version} ({thesis.strategy})
                      </span>
                      <span className={`badge badge-${thesis.status.toLowerCase().replace(/_/g, '-')}`}>
                        {thesis.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="diff-box">
                      <div className="diff-label">Stored Thesis Assumption</div>
                      <div className="diff-content">{thesis.diff.expected}</div>

                      <div className="diff-label">Observed Event Evidence</div>
                      <div className="diff-content">{thesis.diff.observed}</div>

                      <div className="diff-label">Calculated Difference</div>
                      <div className="diff-content difference">{thesis.diff.difference}</div>
                    </div>

                    <input 
                      type="text"
                      placeholder="Optional review reason or note..."
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', fontSize: '12px', marginBottom: '10px' }}
                    />

                    <div className="review-actions">
                      <button 
                        className="btn-action btn-valid"
                        onClick={() => handleThesisReview(thesis.id, 'STILL_VALID')}
                      >
                        ✓ Still Valid
                      </button>
                      <button 
                        className="btn-action btn-update"
                        onClick={() => handleThesisReview(thesis.id, 'NEEDS_UPDATE')}
                      >
                        ⚠ Needs Update
                      </button>
                      <button 
                        className="btn-action btn-irrelevant"
                        onClick={() => handleThesisReview(thesis.id, 'NO_LONGER_RELEVANT')}
                      >
                        ✕ No Longer Relevant
                      </button>
                    </div>

                    {thesis.reviewHistory && thesis.reviewHistory.length > 0 && (
                      <div style={{ marginTop: '14px', fontSize: '11px', color: '#64748b' }}>
                        <strong>Audit Trail:</strong> Last reviewed as {thesis.reviewHistory[thesis.reviewHistory.length - 1].toStatus} on {new Date(thesis.reviewHistory[thesis.reviewHistory.length - 1].timestamp).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: '#64748b' }}>No trade journal thesis documented for this security.</p>
              )}
            </div>
          </div>

          {/* Research Questions Section */}
          <div className="cascade-card" style={{ marginBottom: '24px' }}>
            <h2>Research Engine Integration</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Structured, non-predictive research questions synthesized from event evidence and thesis assumptions:
            </p>

            {researchQuestions.map((rq, idx) => (
              <div key={idx} className="rq-box">
                <p>"{rq.question}"</p>
                <div style={{ fontSize: '11px', color: '#15803d', display: 'flex', gap: '16px' }}>
                  <span><strong>Affected Entity:</strong> {rq.affectedEntity}</span>
                  <span><strong>Unknown:</strong> {rq.unknown}</span>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <button 
                    className="btn-action btn-primary"
                    style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => handleCreateResearchQuestion(rq)}
                  >
                    + Create Research Question
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Decision Timeline View */
        <div className="cascade-card">
          <h2>Decision Timeline Integration (MVP-31 Link)</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Chronological evidence trail connecting market event arrival to cascade evaluation and deliberate user review:
          </p>

          <div className="timeline-list">
            <div className="timeline-step">
              <div className="timeline-icon">1</div>
              <div className="timeline-content">
                <strong>Market Event Ingestion</strong>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  "{event.title}" published by {event.provider} at {new Date(event.publishedAt).toLocaleString()}.
                </div>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-icon">2</div>
              <div className="timeline-content">
                <strong>Cascade Detected</strong>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  Propagated through {cascade?.nodes.length} nodes and {cascade?.edges.length} edges. Identified {portfolio.exposurePercent || 0}% portfolio exposure and {strategies.length} active strategy intersections.
                </div>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-icon">3</div>
              <div className="timeline-content">
                <strong>Thesis Drift Review Requested</strong>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  Flagged assumption divergence. Marked status as REQUIRES_REVIEW. Presented structured diff to trader.
                </div>
              </div>
            </div>

            {theses.some(t => t.status !== 'REQUIRES_REVIEW') && (
              <div className="timeline-step">
                <div className="timeline-icon">4</div>
                <div className="timeline-content">
                  <strong>User Review Confirmed</strong>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Trader verified thesis status and persisted audit log to permanent ledger.
                  </div>
                </div>
              </div>
            )}

            <div className="timeline-step">
              <div className="timeline-icon">5</div>
              <div className="timeline-content">
                <strong>Research Question Synthesized</strong>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  Formulated non-predictive research question linking event evidence to thesis risk threshold.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketCascade;
