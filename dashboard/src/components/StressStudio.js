import React, { useState, useEffect } from 'react';
import { scenarioService, marketCascadeService } from '../services/api';
import toast from 'react-hot-toast';
import './StressStudio.css';

const StressStudio = () => {
  const [activeTab, setActiveTab] = useState('studio'); // 'studio', 'compare', 'whatif'
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('preset-it-correction');
  const [loading, setLoading] = useState(false);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Custom scenario builder state
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('My Custom Stress Test');
  const [customHorizon, setCustomHorizon] = useState('1D');
  const [customShocks, setCustomShocks] = useState([
    { targetType: 'SECTOR', target: 'Information Technology', percentage: -15 }
  ]);

  // What-If simulator state
  const [whatIfSymbol, setWhatIfSymbol] = useState('RELIANCE');
  const [whatIfQty, setWhatIfQty] = useState(20);
  const [whatIfPrice, setWhatIfPrice] = useState(2500);
  const [whatIfAction, setWhatIfAction] = useState('ADD');

  // Compare state
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    fetchPresetsAndRunInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPresetsAndRunInitial = async () => {
    try {
      setLoading(true);
      const res = await scenarioService.getScenarios();
      if (res.data.success) {
        setPresets(res.data.data);
        // Execute initial default preset
        runSelectedScenario('preset-it-correction');
      }
    } catch (err) {
      toast.error('Failed to load scenario library');
    } finally {
      setLoading(false);
    }
  };

  const runSelectedScenario = async (presetIdOrDef, extraOptions = {}) => {
    try {
      setLoading(true);
      setSelectedHolding(null);
      setAiExplanation(null);
      const res = await scenarioService.runScenario(presetIdOrDef, extraOptions);
      if (res.data.success) {
        setScenarioResult(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error running stress scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCurrent = () => {
    if (isCustom) {
      const customDef = {
        name: customName,
        shocks: customShocks,
        horizon: customHorizon
      };
      runSelectedScenario(customDef);
    } else {
      runSelectedScenario(selectedPresetId);
    }
  };

  const handleAddShock = () => {
    setCustomShocks([...customShocks, { targetType: 'SECTOR', target: 'Energy', percentage: -10 }]);
  };

  const handleRemoveShock = (idx) => {
    if (customShocks.length === 1) {
      toast.error('At least one shock is required.');
      return;
    }
    setCustomShocks(customShocks.filter((_, i) => i !== idx));
  };

  const handleShockChange = (idx, field, value) => {
    const updated = [...customShocks];
    updated[idx][field] = field === 'percentage' ? parseFloat(value) || 0 : value;
    setCustomShocks(updated);
  };

  const handleRunWhatIf = () => {
    const options = {
      whatIfPositions: [{
        symbol: whatIfSymbol.toUpperCase().trim(),
        qty: parseInt(whatIfQty, 10),
        price: parseFloat(whatIfPrice),
        action: whatIfAction
      }]
    };
    const target = isCustom ? { name: customName, shocks: customShocks, horizon: customHorizon } : selectedPresetId;
    runSelectedScenario(target, options);
  };

  const handleRunComparison = async () => {
    try {
      setCompareLoading(true);
      const res = await scenarioService.compareScenarios([
        'preset-it-correction',
        'preset-broad-selloff',
        'preset-severe-tech'
      ]);
      if (res.data.success) {
        setCompareData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to compare scenarios');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleCreateResearchQuestion = async (rq) => {
    try {
      const res = await marketCascadeService.saveResearchQuestion('SCENARIO_STUDIO', {
        question: rq.question,
        context: rq.context,
        affectedSymbol: 'PORTFOLIO_CONCENTRATION'
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
      const target = isCustom ? { name: customName, shocks: customShocks, horizon: customHorizon } : selectedPresetId;
      const res = await scenarioService.explainScenario(target);
      if (res.data.success) {
        setAiExplanation(res.data.data.explanation);
        toast.success('Grounded scenario explanation synthesized!');
      }
    } catch (err) {
      toast.error('AI Explainer temporarily unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const baseline = scenarioResult?.baseline || {};
  const modeled = scenarioResult?.modeledResult || {};
  const scenario = scenarioResult?.scenario || {};
  const topContributors = scenarioResult?.topContributors || [];
  const topOffsets = scenarioResult?.topOffsets || [];
  const strategies = scenarioResult?.strategyExposure || [];
  const theses = scenarioResult?.thesisLinks || [];
  const whatIf = scenarioResult?.whatIfComparison || null;

  return (
    <div className="stress-container">
      {/* Top Header */}
      <div className="stress-header">
        <div>
          <h1>Advanced Scenario & Stress Studio</h1>
          <p>Deterministic, non-predictive portfolio shock and what-if simulation engine</p>
        </div>
        <div className="tab-controls">
          <button 
            className={`tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('studio')}
          >
            Stress Studio
          </button>
          <button 
            className={`tab-btn ${activeTab === 'whatif' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatif')}
          >
            What-If Simulator
          </button>
          <button 
            className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('compare');
              if (!compareData) handleRunComparison();
            }}
          >
            Scenario Comparison
          </button>
        </div>
      </div>

      {/* Baseline Hero Banner */}
      <div className="baseline-hero">
        <div className="baseline-metric">
          <h3>Current Portfolio Baseline</h3>
          <div className="val">₹{baseline.totalValue?.toLocaleString() || '0'}</div>
        </div>
        <div className="baseline-metric">
          <h3>Active Positions</h3>
          <div className="val">{baseline.holdingCount || 0}</div>
        </div>
        <div className="baseline-metric">
          <h3>Selected Scenario</h3>
          <div className="val" style={{ fontSize: '18px', color: '#2563eb' }}>
            {scenario.name || 'Custom'}
          </div>
        </div>
        <div>
          <button 
            className="tab-btn" 
            style={{ background: '#ffffff' }}
            onClick={() => setShowMethodologyModal(true)}
          >
            🔍 View Methodology
          </button>
        </div>
      </div>

      {/* Main Tab: Stress Studio */}
      {activeTab === 'studio' && (
        <div className="stress-grid">
          {/* Left Column: Scenario Builder */}
          <div className="panel-card">
            <h2>Scenario Builder</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button 
                className={`tab-btn ${!isCustom ? 'active' : ''}`} 
                style={{ flex: 1, padding: '6px' }}
                onClick={() => setIsCustom(false)}
              >
                Curated Presets
              </button>
              <button 
                className={`tab-btn ${isCustom ? 'active' : ''}`} 
                style={{ flex: 1, padding: '6px' }}
                onClick={() => setIsCustom(true)}
              >
                Custom Shocks
              </button>
            </div>

            {!isCustom ? (
              <div className="preset-list">
                {presets.map(p => (
                  <div 
                    key={p._id || p.id}
                    className={`preset-pill ${selectedPresetId === (p._id || p.id) ? 'active' : ''}`}
                    onClick={() => {
                      const id = p._id || p.id;
                      setSelectedPresetId(id);
                      runSelectedScenario(id);
                    }}
                  >
                    <div className="title">{p.name}</div>
                    <div className="sub">
                      {p.shocks?.map(s => `${s.target} ${s.percentage > 0 ? `+${s.percentage}` : s.percentage}%`).join(', ')} • {p.horizon}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label>Scenario Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Stress Horizon</label>
                  <select 
                    className="form-select"
                    value={customHorizon}
                    onChange={(e) => setCustomHorizon(e.target.value)}
                  >
                    <option value="1D">1 Day (Single Session Shock)</option>
                    <option value="3D">3 Days (Multi-Session Selloff)</option>
                    <option value="1W">1 Week (Supply Disruption)</option>
                    <option value="1M">1 Month (Macro Contraction)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Defined Shocks</label>
                  {customShocks.map((s, idx) => (
                    <div key={idx} className="shock-row">
                      <select 
                        value={s.targetType}
                        onChange={(e) => handleShockChange(idx, 'targetType', e.target.value)}
                        style={{ width: '90px' }}
                      >
                        <option value="MARKET">Market</option>
                        <option value="SECTOR">Sector</option>
                        <option value="ASSET">Asset</option>
                      </select>

                      <input 
                        type="text" 
                        value={s.target} 
                        onChange={(e) => handleShockChange(idx, 'target', e.target.value)}
                        placeholder="Target (e.g. IT, NIFTY)"
                        style={{ flex: 1 }}
                      />

                      <input 
                        type="number" 
                        value={s.percentage} 
                        onChange={(e) => handleShockChange(idx, 'percentage', e.target.value)}
                        placeholder="%"
                        style={{ width: '60px' }}
                      />
                      <span>%</span>

                      <button className="btn-remove" onClick={() => handleRemoveShock(idx)}>✕</button>
                    </div>
                  ))}
                  <button 
                    className="tab-btn" 
                    style={{ width: '100%', marginTop: '6px', fontSize: '12px' }}
                    onClick={handleAddShock}
                  >
                    + Add Shock Parameter
                  </button>
                </div>
              </div>
            )}

            <button 
              className="btn-run" 
              onClick={handleRunCurrent}
              disabled={loading}
            >
              {loading ? 'Simulating...' : '⚡ RUN SCENARIO'}
            </button>

            <button 
              className="tab-btn" 
              style={{ width: '100%', marginTop: '10px', background: '#faf5ff', borderColor: '#d8b4fe', color: '#6b21a8' }}
              onClick={handleExplainWithAI}
              disabled={aiLoading}
            >
              {aiLoading ? 'Explaining...' : '✨ Explain with Grounded AI'}
            </button>
          </div>

          {/* Right Column: Scenario Results Dashboard */}
          <div>
            {/* AI Explainer Box */}
            {aiExplanation && (
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#6b21a8' }}>✨ Grounded AI Stress Explanation</h3>
                  <button 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    onClick={() => setAiExplanation(null)}
                  >
                    ✕
                  </button>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#374151' }}>{aiExplanation.summary}</p>
                
                <div style={{ fontSize: '12px', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #f3e8ff' }}>
                  <strong>Stress Takeaways:</strong> {aiExplanation.stressTakeaways}
                </div>
              </div>
            )}

            {/* Modeled Result Overview Card */}
            <div className="panel-card" style={{ marginBottom: '20px' }}>
              <h2>Modeled Scenario Impact</h2>
              <div className="result-hero-box">
                <div className="result-item">
                  <h4>Modeled Value</h4>
                  <div className="num text-neutral">₹{modeled.scenarioValue?.toLocaleString()}</div>
                </div>
                <div className="result-item">
                  <h4>Modeled Absolute Impact</h4>
                  <div className={`num ${modeled.absoluteImpact < 0 ? 'text-down' : 'text-up'}`}>
                    ₹{modeled.absoluteImpact?.toLocaleString()}
                  </div>
                </div>
                <div className="result-item">
                  <h4>Modeled Percentage Impact</h4>
                  <div className={`num ${modeled.percentageImpact < 0 ? 'text-down' : 'text-up'}`}>
                    {modeled.percentageImpact}%
                  </div>
                </div>
                <div className="result-item">
                  <h4>Severity</h4>
                  <span className={`badge badge-${scenario.severity?.toLowerCase() || 'moderate'}`} style={{ marginTop: '6px' }}>
                    {scenario.severity || 'MODERATE'}
                  </span>
                </div>
              </div>

              {/* Holding Inspector Drawer */}
              {selectedHolding && (
                <div className="detail-drawer">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Holding Detail: {selectedHolding.symbol}</strong>
                    <button 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      onClick={() => setSelectedHolding(null)}
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="drawer-grid">
                    <div><strong>Reference Price:</strong> ₹{selectedHolding.referencePrice}</div>
                    <div><strong>Scenario Price:</strong> ₹{selectedHolding.scenarioPrice}</div>
                    <div><strong>Baseline Value:</strong> ₹{selectedHolding.baselineValue?.toLocaleString()}</div>
                    <div><strong>Scenario Value:</strong> ₹{selectedHolding.scenarioValue?.toLocaleString()}</div>
                    <div><strong>Absolute Impact:</strong> ₹{selectedHolding.absoluteImpact?.toLocaleString()}</div>
                    <div><strong>Loss Contribution:</strong> {selectedHolding.contributionPercent}%</div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Applied Shocks:</strong> {selectedHolding.appliedShocks?.map(s => `${s.target} (${s.percentage}%)`).join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              )}

              {/* Top Contributors & Offsets Summary Widgets */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase' }}>
                    📉 Top Loss Contributors
                  </span>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    {topContributors.length > 0 ? (
                      topContributors.map(c => (
                        <div key={c.symbol} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600' }}>{c.symbol}</span>
                          <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                            -₹{Math.abs(c.absoluteImpact).toLocaleString()} ({c.contributionPercent}%)
                          </span>
                        </div>
                      ))
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '12px' }}>No loss contributors in this scenario</span>
                    )}
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '6px', padding: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>
                    📈 Offsetting Positions
                  </span>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    {topOffsets.length > 0 ? (
                      topOffsets.map(o => (
                        <div key={o.symbol} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600' }}>{o.symbol}</span>
                          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                            +₹{Math.abs(o.absoluteImpact).toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '12px' }}>No offsetting positions</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Contributors Table */}
              <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#0f172a' }}>
                Holding-Level Drawdown Attribution (Click row to inspect)
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Sector</th>
                    <th>Baseline Value</th>
                    <th>Scenario Value</th>
                    <th>Impact (₹)</th>
                    <th>Impact (%)</th>
                    <th>Contribution (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioResult?.holdingAttribution?.map(h => (
                    <tr 
                      key={h.symbol} 
                      className={`clickable ${selectedHolding?.symbol === h.symbol ? 'selected' : ''}`}
                      onClick={() => setSelectedHolding(h)}
                    >
                      <td><strong>{h.symbol}</strong></td>
                      <td>{h.sector}</td>
                      <td>₹{h.baselineValue?.toLocaleString()}</td>
                      <td>₹{h.scenarioValue?.toLocaleString()}</td>
                      <td className={h.absoluteImpact < 0 ? 'text-down' : 'text-up'}>
                        ₹{h.absoluteImpact?.toLocaleString()}
                      </td>
                      <td className={h.percentageImpact < 0 ? 'text-down' : 'text-up'}>
                        {h.percentageImpact}%
                      </td>
                      <td><strong>{h.contributionPercent}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {topOffsets.length > 0 && (
                <div style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', padding: '8px 12px', borderRadius: '4px' }}>
                  🛡️ <strong>Offsetting Exposure:</strong> {topOffsets.map(o => `${o.symbol} (+₹${o.absoluteImpact})`).join(', ')}
                </div>
              )}
            </div>

            {/* Strategy & Thesis Intersections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Strategy Impact */}
              <div className="panel-card">
                <h2>Strategy Impact (Playbooks)</h2>
                {strategies.length > 0 ? (
                  strategies.map(s => (
                    <div key={s.playbookId} className="item-card">
                      <h4>{s.name}</h4>
                      <p>Strategy: {s.strategy} • Linked Exposure: <strong>{s.exposurePercent}%</strong> (₹{s.linkedValue?.toLocaleString()})</p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748b' }}>No playbooks actively intersect with these holdings.</p>
                )}
              </div>

              {/* Thesis Links */}
              <div className="panel-card">
                <h2>Thesis Vulnerability Review</h2>
                {theses.length > 0 ? (
                  theses.map(t => (
                    <div key={t.journalId} className="item-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4>{t.symbol} ({t.strategy})</h4>
                        <span className="badge badge-severe" style={{ fontSize: '10px' }}>{t.status}</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0' }}>Stored: "{t.storedThesis}"</p>
                      <p style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px' }}>{t.note}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748b' }}>No trade journal theses active for these holdings.</p>
                )}
              </div>
            </div>

            {/* Research Questions Card */}
            <div className="panel-card">
              <h2>Research Engine Integration</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>
                Formulate empirical research questions based on modeled scenario downside:
              </p>
              {scenarioResult?.researchQuestions?.map((rq, idx) => (
                <div key={idx} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px 16px', marginBottom: '10px' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#166534', fontWeight: 600 }}>"{rq.question}"</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#15803d' }}>{rq.context}</p>
                  <button 
                    className="tab-btn active"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => handleCreateResearchQuestion(rq)}
                  >
                    + Create Research Question
                  </button>
                </div>
              ))}
            </div>

            {/* Immutable Ledger Notice */}
            <div className="ledger-guarantee-note">
              <span>🔒</span>
              <div>
                <strong>Immutable Financial Ledger Guarantee:</strong> Running scenario simulations never mutates your virtual balance, actual positions, or completed transactions. All results are purely hypothetical analytical models.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: What-If Position Simulator */}
      {activeTab === 'whatif' && (
        <div className="panel-card">
          <h2>What-If Position Simulator</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
            Simulate adding or removing hypothetical positions to test how your portfolio's stress resilience and sector concentration change before committing capital.
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Symbol</label>
              <input 
                type="text" 
                className="form-input" 
                value={whatIfSymbol}
                onChange={(e) => setWhatIfSymbol(e.target.value)}
              />
            </div>
            <div style={{ width: '100px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Quantity</label>
              <input 
                type="number" 
                className="form-input" 
                value={whatIfQty}
                onChange={(e) => setWhatIfQty(e.target.value)}
              />
            </div>
            <div style={{ width: '130px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Price (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                value={whatIfPrice}
                onChange={(e) => setWhatIfPrice(e.target.value)}
              />
            </div>
            <div style={{ width: '120px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Action</label>
              <select 
                className="form-select"
                value={whatIfAction}
                onChange={(e) => setWhatIfAction(e.target.value)}
              >
                <option value="ADD">Add Position</option>
                <option value="REMOVE">Remove Position</option>
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button 
                className="tab-btn active"
                style={{ padding: '9px 18px' }}
                onClick={handleRunWhatIf}
              >
                Simulate Change
              </button>
            </div>
          </div>

          {whatIf && (
            <div className="result-hero-box" style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}>
              <div className="result-item">
                <h4>Metric</h4>
                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '6px' }}>Current Portfolio</div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '6px' }}>Hypothetical Portfolio</div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '6px', color: '#2563eb' }}>Marginal Change</div>
              </div>
              <div className="result-item">
                <h4>Portfolio Value</h4>
                <div style={{ fontSize: '14px', marginTop: '6px' }}>₹{whatIf.before.portfolioValue?.toLocaleString()}</div>
                <div style={{ fontSize: '14px', marginTop: '6px' }}>₹{whatIf.after.portfolioValue?.toLocaleString()}</div>
                <div style={{ fontSize: '14px', marginTop: '6px', color: '#2563eb' }}>
                  {whatIf.delta.capitalDifference > 0 ? `+₹${whatIf.delta.capitalDifference}` : `₹${whatIf.delta.capitalDifference}`}
                </div>
              </div>
              <div className="result-item">
                <h4>Modeled Scenario Impact</h4>
                <div style={{ fontSize: '14px', marginTop: '6px', color: '#dc2626' }}>{whatIf.before.modeledImpact}%</div>
                <div style={{ fontSize: '14px', marginTop: '6px', color: '#dc2626' }}>{whatIf.after.modeledImpact}%</div>
                <div style={{ fontSize: '14px', marginTop: '6px', color: whatIf.delta.impactDifferencePct >= 0 ? '#16a34a' : '#dc2626' }}>
                  {whatIf.delta.impactDifferencePct > 0 ? `+${whatIf.delta.impactDifferencePct}%` : `${whatIf.delta.impactDifferencePct}%`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Scenario Comparison */}
      {activeTab === 'compare' && (
        <div className="panel-card">
          <h2>Side-by-Side Scenario Comparison</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
            Benchmark multiple hypothetical market paths against your current portfolio baseline:
          </p>

          {compareLoading ? (
            <p>Evaluating multi-scenario matrix...</p>
          ) : compareData ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Severity</th>
                  <th>Modeled Value</th>
                  <th>Absolute Impact</th>
                  <th>Percentage Impact</th>
                  <th>Largest Downside Drag</th>
                  <th>Offsetting Asset</th>
                </tr>
              </thead>
              <tbody>
                {compareData.comparison.map(c => (
                  <tr key={c.scenarioId}>
                    <td><strong>{c.name}</strong></td>
                    <td>
                      <span className={`badge badge-${c.severity.toLowerCase()}`}>
                        {c.severity}
                      </span>
                    </td>
                    <td>₹{c.modeledValue?.toLocaleString()}</td>
                    <td className="text-down">₹{c.absoluteImpact?.toLocaleString()}</td>
                    <td className="text-down">{c.percentageImpact}%</td>
                    <td><strong>{c.largestDrag}</strong></td>
                    <td>{c.largestOffset}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      )}

      {/* Methodology Transparency Modal */}
      {showMethodologyModal && (
        <div className="modal-overlay" onClick={() => setShowMethodologyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Methodology Transparency & Math Model</h3>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setShowMethodologyModal(false)}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: '13px', color: '#334155' }}>
              TradeFlow uses a decimal-safe, multi-layer multiplicative shock combination model that eliminates additive double counting:
            </p>

            <div className="code-block">
              S_combined = (1 + S_market) * (1 + S_sector) * (1 + S_asset) - 1<br/>
              Scenario_Price = Current_Price * (1 + S_combined)<br/>
              Holding_Impact = Quantity * (Scenario_Price - Current_Price)<br/>
              Contribution_% = (Holding_Impact / Total_Portfolio_Impact) * 100
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', color: '#475569' }}>
              <div><strong>Engine Version:</strong> {scenarioResult?.methodology?.calculationVersion || '1.0.0-MVP34'}</div>
              <div><strong>Snapshot Hash:</strong> {scenarioResult?.methodology?.snapshotHash || 'N/A'}</div>
              <div><strong>Sector Taxonomy:</strong> Verified Exchange Classification (marketMetadata.js)</div>
              <div><strong>Data Source:</strong> MarketDataService (Real API with Mock Fallback)</div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button className="tab-btn active" onClick={() => setShowMethodologyModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StressStudio;
