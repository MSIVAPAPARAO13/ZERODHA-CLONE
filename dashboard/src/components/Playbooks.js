import React, { useState, useEffect } from "react";
import { playbookService, aiService } from "../services/api";
import toast from "react-hot-toast";

const Playbooks = () => {
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newPbName, setNewPbName] = useState("");
  const [newPbDesc, setNewPbDesc] = useState("");

  useEffect(() => { fetchPlaybooks(); }, []);

  const fetchPlaybooks = async () => {
    try {
      const res = await playbookService.getPlaybooks();
      const list = res.data?.data ?? res.data;
      setPlaybooks(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load playbooks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newPbName.trim()) return;
    try {
      await playbookService.createPlaybook({ name: newPbName, description: newPbDesc });
      toast.success("Playbook created!");
      setShowCreate(false);
      setNewPbName(""); setNewPbDesc("");
      fetchPlaybooks();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Error creating playbook");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this playbook?")) return;
    try {
      await playbookService.deletePlaybook(id);
      toast.success("Playbook deleted");
      fetchPlaybooks();
    } catch (err) {
      toast.error("Error deleting playbook");
    }
  };

  const handleAiReview = async () => {
    setAiLoading(true);
    try {
      const res = await aiService.playbookReview();
      const analysis = res.data?.data?.analysis ?? res.data?.data;
      setAiReview(analysis);
    } catch {
      toast.error("Failed to load AI review.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return (
    <div className="terminal-dashboard">
      <div className="empty-center-box text-muted" style={{ padding: '60px 0' }}>
        <span style={{ fontSize: '1.5rem' }}>📖</span>
        <p style={{ marginTop: 8 }}>Loading playbooks…</p>
      </div>
    </div>
  );

  return (
    <div className="terminal-dashboard">
      {/* Header */}
      <div className="context-ribbon">
        <div className="ribbon-title-box">
          <h1 className="terminal-page-title">Playbooks</h1>
          <p className="terminal-subtitle">
            Define pre-trade rules and checklists. Attach to orders to enforce discipline.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="ai-playbook-review-btn"
            onClick={handleAiReview}
            disabled={aiLoading}
            style={{
              background: '#7c3aed', color: '#fff', border: 'none', padding: '8px 14px',
              borderRadius: 6, cursor: aiLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: '0.8rem', opacity: aiLoading ? 0.7 : 1
            }}
          >
            {aiLoading ? '⏳ Analyzing…' : '✨ AI Review'}
          </button>
          <button
            id="create-playbook-btn"
            onClick={() => setShowCreate(!showCreate)}
            style={{
              background: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px',
              borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
            }}
          >
            + New Playbook
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#2d0e14', border: '1px solid #f43f5e44', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#f43f5e', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="terminal-card" style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#f8fafc', fontSize: '0.9rem', marginBottom: 14 }}>Create New Playbook</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              placeholder="Playbook name (e.g. Momentum Setup)"
              value={newPbName}
              onChange={e => setNewPbName(e.target.value)}
              style={{ padding: '9px 12px', background: '#162032', border: '1px solid #1e293b', borderRadius: 6, color: '#f8fafc', fontSize: '0.85rem', outline: 'none' }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newPbDesc}
              onChange={e => setNewPbDesc(e.target.value)}
              style={{ padding: '9px 12px', background: '#162032', border: '1px solid #1e293b', borderRadius: 6, color: '#f8fafc', fontSize: '0.85rem', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCreate} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Save</button>
              <button onClick={() => setShowCreate(false)} style={{ background: '#1e293b', color: '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Review */}
      {aiReview && (
        <div className="terminal-card" style={{ marginBottom: 20, borderColor: '#7c3aed44' }}>
          <div className="panel-header">
            <h3 className="panel-title">✨ AI Playbook Review</h3>
            <button onClick={() => setAiReview(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem' }}>Clear ✕</button>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 10 }}>{aiReview.summary}</p>
          {aiReview.frequentlyMissedRules?.length > 0 && (
            <>
              <p style={{ fontWeight: 600, color: '#f43f5e', fontSize: '0.78rem', marginBottom: 4 }}>FREQUENTLY MISSED RULES</p>
              <ul style={{ paddingLeft: 16, color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.8 }}>
                {aiReview.frequentlyMissedRules.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Playbook Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {playbooks.map(pb => (
          <div key={pb.id} className="terminal-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card-header-compact">
              <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem' }}>{pb.name}</span>
              <button
                onClick={() => handleDelete(pb.id)}
                style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '0.78rem' }}
              >✕ Delete</button>
            </div>
            {pb.description && <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>{pb.description}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ background: '#162032', border: '1px solid #1e293b', borderRadius: 4, padding: '3px 8px', fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                {pb.rulesCount ?? 0} rules
              </span>
              <span style={{ background: '#162032', border: '1px solid #1e293b', borderRadius: 4, padding: '3px 8px', fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                {pb.tradesCount ?? 0} trades
              </span>
              <span style={{ background: '#162032', border: '1px solid #1e293b', borderRadius: 4, padding: '3px 8px', fontSize: '0.72rem', color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>
                {pb.complianceRate ?? 0}% compliance
              </span>
            </div>
          </div>
        ))}
        {playbooks.length === 0 && (
          <div className="empty-center-box text-muted" style={{ gridColumn: '1/-1', padding: '40px 0' }}>
            <p>No playbooks yet. Create your first one with the button above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playbooks;
