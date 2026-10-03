import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { journalService, aiService } from "../services/api";

const TradeReplay = () => {
  const { id } = useParams();
  const [replayData, setReplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState("");

  const fetchReplay = useCallback(async () => {
    try {
      const res = await journalService.getReplay(id);
      setReplayData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load replay.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReplay();
  }, [fetchReplay]);

  const handleAnalyze = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await aiService.tradeReview(id);
      setAiAnalysis(res.data.data.analysis);
    } catch (err) {
      setAiError(err.response?.data?.error?.message || "Failed to analyze trade.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading replay...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  if (!replayData) return <div style={{ padding: '20px' }}>No replay data found.</div>;

  const { journal, outcome, marketData } = replayData;

  const renderStars = (count) => {
    return '★'.repeat(count || 0) + '☆'.repeat(5 - (count || 0));
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#444' }}>{journal.symbol} — TRADE REPLAY</h2>
        <Link to="/journal" style={{ textDecoration: 'none', color: '#666' }}>&larr; Back to Journal</Link>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, color: '#387ed1' }}>YOUR DECISION</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Strategy:</strong> {journal.strategy}</p>
            <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Reason:</strong> {journal.reason}</p>
            <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Confidence:</strong> <span style={{ color: '#f39c12' }}>{renderStars(journal.confidence)}</span></p>
          </div>
          <div>
            <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Entry:</strong> ₹{journal.entryPrice?.toFixed(2)}</p>
            <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Target:</strong> {journal.targetPrice ? `₹${journal.targetPrice.toFixed(2)}` : '-'}</p>
            <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Risk:</strong> {journal.riskPrice ? `₹${journal.riskPrice.toFixed(2)}` : '-'}</p>
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Thesis:</strong></p>
          <p style={{ fontStyle: 'italic', color: '#555', background: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>"{journal.thesis || 'No thesis provided.'}"</p>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
           <h3 style={{ margin: 0, color: '#387ed1' }}>WHAT HAPPENED</h3>
           {marketData && <span style={{ fontSize: '0.8em', color: '#999' }}>Source: {marketData.source} ({marketData.resolution})</span>}
        </div>
        
        {marketData ? (
          <div>
            <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '1.1em', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              ₹{journal.entryPrice?.toFixed(2)} {outcome.targetReached ? ` ── ₹${journal.targetPrice?.toFixed(2)}` : ''} {outcome.riskCrossed ? ` ── ₹${journal.riskPrice?.toFixed(2)}` : ''} {outcome.exitPrice ? ` ── ₹${outcome.exitPrice.toFixed(2)}` : ''} {(!outcome.exitPrice && outcome.currentMarketPrice) ? ` ── ₹${outcome.currentMarketPrice.toFixed(2)}` : ''}
            </div>
            
            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {outcome.targetReached && <div style={{ color: '#4caf50' }}>✓ Target reached on {new Date(outcome.targetReachedDate).toLocaleDateString()}</div>}
              {!outcome.targetReached && journal.targetPrice && <div style={{ color: '#999' }}>— Target (₹{journal.targetPrice}) not reached yet.</div>}

              {outcome.riskCrossed && <div style={{ color: '#e74c3c' }}>✗ Risk level crossed on {new Date(outcome.riskCrossedDate).toLocaleDateString()}</div>}
              {!outcome.riskCrossed && journal.riskPrice && <div style={{ color: '#999' }}>— Risk level (₹{journal.riskPrice}) not crossed.</div>}
            </div>
          </div>
        ) : (
          <div style={{ color: '#999' }}>Historical timeline unavailable.</div>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, color: '#387ed1' }}>ACTUAL OUTCOME</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Status:</strong> <span style={{ fontWeight: 'bold', color: outcome.status === 'CLOSED' ? '#e74c3c' : '#4caf50' }}>{outcome.status}</span></p>
            {outcome.status === 'CLOSED' ? (
              <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Actual Exit:</strong> ₹{outcome.exitPrice?.toFixed(2)}</p>
            ) : (
              <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Current Market:</strong> {outcome.currentMarketPrice ? `₹${outcome.currentMarketPrice.toFixed(2)}` : 'N/A'}</p>
            )}
            <p style={{ margin: '5px 0' }}><strong style={{ color: '#666' }}>Holding Duration:</strong> {outcome.holdingDurationDays} days</p>
          </div>
          <div>
            {outcome.status === 'CLOSED' ? (
              <p style={{ margin: '5px 0', fontSize: '1.2em' }}>
                <strong style={{ color: '#666' }}>Realized P&L:</strong> 
                <span style={{ color: outcome.realizedPnl >= 0 ? '#4caf50' : '#e74c3c', fontWeight: 'bold', marginLeft: '10px' }}>
                  {outcome.realizedPnl >= 0 ? '+' : ''}₹{outcome.realizedPnl?.toFixed(2)}
                </span>
              </p>
            ) : (
               <p style={{ margin: '5px 0', fontSize: '1.2em' }}>
                <strong style={{ color: '#666' }}>Unrealized P&L:</strong> 
                {outcome.unrealizedPnl !== null ? (
                  <span style={{ color: outcome.unrealizedPnl >= 0 ? '#4caf50' : '#e74c3c', fontWeight: 'bold', marginLeft: '10px' }}>
                    {outcome.unrealizedPnl >= 0 ? '+' : ''}₹{outcome.unrealizedPnl?.toFixed(2)}
                  </span>
                ) : 'N/A'}
              </p>
            )}
          </div>
        </div>
      </div>

      {journal.checklist && journal.checklist.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, color: '#387ed1' }}>PLAYBOOK COMPLIANCE</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {journal.checklist.map((c, i) => (
              <li key={i} style={{ marginBottom: '8px', fontSize: '1.05em' }}>
                <span style={{ color: c.followed ? '#4caf50' : '#e74c3c', marginRight: '10px', fontWeight: 'bold' }}>{c.followed ? '✓' : '✗'}</span>
                <span style={{ color: c.followed ? '#333' : '#999', textDecoration: c.followed ? 'none' : 'line-through' }}>{c.ruleText}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee', fontSize: '1.1em' }}>
            <strong>Compliance Score:</strong> <span style={{ color: '#387ed1' }}>{((journal.checklist.filter(c => c.followed).length / journal.checklist.length) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      <div style={{ background: '#f5f0ff', border: '1px solid #d4c4fb', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#673ab7' }}>✨ AI TRADE REVIEW</h3>
          {!aiAnalysis && (
            <button 
              onClick={handleAnalyze} 
              disabled={aiLoading}
              style={{ background: '#673ab7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: aiLoading ? 'not-allowed' : 'pointer' }}
            >
              {aiLoading ? 'Analyzing...' : 'Analyze This Trade'}
            </button>
          )}
        </div>
        
        {aiError && <p style={{ color: '#e74c3c', marginTop: '15px' }}>{aiError}</p>}
        
        {aiAnalysis && (
          <div style={{ marginTop: '20px', color: '#444' }}>
            <p style={{ fontSize: '1.1em', fontWeight: 'bold' }}>Summary</p>
            <p>{aiAnalysis.summary}</p>
            
            <p style={{ fontWeight: 'bold', marginTop: '15px' }}>Decision Context</p>
            <p>{aiAnalysis.decisionContext}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div>
                <p style={{ fontWeight: 'bold', color: '#4caf50' }}>What went as planned</p>
                <ul style={{ paddingLeft: '20px' }}>
                  {aiAnalysis.whatWentAsPlanned?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p style={{ fontWeight: 'bold', color: '#e74c3c' }}>What differed</p>
                <ul style={{ paddingLeft: '20px' }}>
                  {aiAnalysis.whatDidNotGoAsPlanned?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </div>
            
            <p style={{ fontWeight: 'bold', marginTop: '15px' }}>Learning Points</p>
            <ul style={{ paddingLeft: '20px' }}>
              {aiAnalysis.learningPoints?.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            
            <p style={{ fontWeight: 'bold', marginTop: '15px' }}>Questions for Reflection</p>
            <ul style={{ paddingLeft: '20px' }}>
              {aiAnalysis.questionsForReflection?.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            
            <div style={{ marginTop: '20px', fontSize: '0.85em', color: '#888', borderTop: '1px solid #e0e0e0', paddingTop: '10px' }}>
              <p><strong>Evidence:</strong> {aiAnalysis.evidence?.join(" | ")}</p>
              <p><em>TradeFlow AI provides educational analysis based on your recorded activity. It does not provide investment recommendations.</em></p>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ height: '40px' }}></div>
    </div>
  );
};

export default TradeReplay;
