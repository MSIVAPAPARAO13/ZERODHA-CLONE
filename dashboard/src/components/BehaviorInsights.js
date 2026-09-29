import React, { useState, useEffect } from "react";
import { analyticsService, aiService } from "../services/api";

const BehaviorInsights = () => {
  const [windowPeriod, setWindowPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    fetchAnalytics();
    // Clear AI review when window changes
    setAiReview(null);
    setAiError("");
  }, [windowPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await analyticsService.getBehaviorAnalytics(windowPeriod);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load behavioral analytics.");
    } finally {
      setLoading(false);
    }
  };

  const handleAiReview = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await aiService.behaviorReview(windowPeriod);
      setAiReview(res.data.data.analysis);
    } catch (err) {
      setAiError(err.response?.data?.error?.message || "Failed to load AI reflection.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Behavioral Edge Engine...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#444' }}>TRADEFLOW BEHAVIORAL EDGE</h2>
        <div>
          <select value={windowPeriod} onChange={(e) => setWindowPeriod(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {data && data.message ? (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '1.2em' }}>{data.message}</p>
          <p style={{ color: '#999' }}>({data.tradeCount} trades found in period. 5 required.)</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#387ed1' }}>{data.tradeCount}</h3>
              <p style={{ margin: 0, color: '#666' }}>Journaled Trades</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#4caf50' }}>{data.summary.winRate}%</h3>
              <p style={{ margin: 0, color: '#666' }}>Win Rate (Closed)</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#f39c12' }}>₹{data.summary.avgPnl}</h3>
              <p style={{ margin: 0, color: '#666' }}>Avg Realized P&L</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#e74c3c' }}>{data.advanced.exitEfficiency || 'N/A'}</h3>
              <p style={{ margin: 0, color: '#666' }}>Avg Exit Efficiency</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            
            {/* PLAN VS EXECUTION */}
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 }}>PLAN vs EXECUTION</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Target Reached</span>
                <span style={{ fontWeight: 'bold' }}>{data.planExecution.targetReached}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Risk Crossed</span>
                <span style={{ fontWeight: 'bold' }}>{data.planExecution.riskCrossed}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Exit Before Later Target Hit</span>
                <span style={{ fontWeight: 'bold', color: data.planExecution.exitBeforeTarget > 0 ? '#e74c3c' : 'inherit' }}>{data.planExecution.exitBeforeTarget}</span>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px dashed #ccc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#4caf50' }}>Avg MFE</span>
                  <span>{data.advanced.avgMfe ? `₹${data.advanced.avgMfe}` : 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#e74c3c' }}>Avg MAE</span>
                  <span>{data.advanced.avgMae ? `₹${data.advanced.avgMae}` : 'N/A'}</span>
                </div>
                <p style={{ fontSize: '0.8em', color: '#999', margin: '5px 0 0 0' }}>Data Resolution: {data.advanced.dataResolution}</p>
              </div>
            </div>

            {/* PATTERNS & COMPLETENESS */}
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 }}>OBSERVED PATTERNS</h3>
              {data.patterns.length > 0 ? (
                <ul style={{ paddingLeft: '20px' }}>
                  {data.patterns.map((p, i) => (
                    <li key={i} style={{ marginBottom: '15px' }}>
                      <strong style={{ display: 'block', color: '#387ed1' }}>{p.type}</strong>
                      <span style={{ color: '#666', fontSize: '0.9em', display: 'block', marginBottom: '5px' }}>{p.desc}</span>
                      <button 
                         onClick={async () => {
                           const res = await aiService.playbookSuggestion(p.type, p.desc);
                           const rule = res.data.data.analysis;
                           const pbName = prompt(`AI Suggested Rule: "${rule.ruleText}"\nEnter the ID of the playbook you want to add this to (or cancel). Note: Playbook IDs can be found in the Playbooks page, but for MVP just create a Playbook first.`);
                           if (pbName) {
                              try {
                                 const pb = await playbookService.getPlaybook(pbName);
                                 pb.data.rules = pb.data.rules || [];
                                 pb.data.rules.push({ text: rule.ruleText, category: rule.category });
                                 await playbookService.updatePlaybook(pbName, { rules: pb.data.rules });
                                 alert("Rule added successfully!");
                              } catch(e) { alert("Failed to add rule."); }
                           }
                         }}
                         style={{ background: '#387ed1', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}>
                         [ Create Process Rule ]
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#999' }}>No distinct negative/positive patterns identified.</p>
              )}

              <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginTop: '20px' }}>Journal Completeness</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '0.9em', color: '#666' }}>
                <div>Strategy: {data.dataQuality.strategy}</div>
                <div>Thesis: {data.dataQuality.thesis}</div>
                <div>Target: {data.dataQuality.target}</div>
                <div>Risk: {data.dataQuality.risk}</div>
                <div>Reason: {data.dataQuality.reason}</div>
                <div>Confidence: {data.dataQuality.confidence}</div>
              </div>
            </div>
            
          </div>

          {/* AI REFLECTION */}
          <div style={{ background: '#f5f0ff', border: '1px solid #d4c4fb', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#673ab7' }}>✨ AI REFLECTION</h3>
                {!aiReview && (
                  <button 
                    onClick={handleAiReview} 
                    disabled={aiLoading}
                    style={{ background: '#673ab7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: aiLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {aiLoading ? 'Reviewing Patterns...' : 'Review My Patterns'}
                  </button>
                )}
             </div>

             {aiError && <p style={{ color: '#e74c3c', marginTop: '15px' }}>{aiError}</p>}

             {aiReview && (
               <div style={{ marginTop: '20px', color: '#444' }}>
                 <p style={{ fontWeight: 'bold' }}>Summary</p>
                 <p>{aiReview.summary}</p>
                 
                 {aiReview.observedPatterns?.map((op, i) => (
                   <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '15px', borderRadius: '6px', marginTop: '15px' }}>
                     <h4 style={{ margin: '0 0 10px 0', color: '#673ab7' }}>{op.title} <span style={{ fontSize: '0.8em', color: '#999', fontWeight: 'normal' }}>({op.type})</span></h4>
                     <p style={{ margin: '0 0 10px 0' }}>{op.description}</p>
                     
                     <div style={{ fontSize: '0.9em', background: '#f9f9f9', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                       <strong>Evidence:</strong>
                       <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                         {op.evidence?.map((e, j) => <li key={j}>{e}</li>)}
                       </ul>
                     </div>
                     <p style={{ margin: 0, fontStyle: 'italic', color: '#555' }}><strong>Q:</strong> {op.reflectionQuestion}</p>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </>
      )}
      <div style={{ height: '40px' }}></div>
    </div>
  );
};

export default BehaviorInsights;
