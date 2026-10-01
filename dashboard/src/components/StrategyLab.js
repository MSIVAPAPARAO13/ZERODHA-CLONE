import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { strategyService } from '../services/api';
import './StrategyLab.css';

const StrategyLab = () => {
  const [activeTab, setActiveTab] = useState('backtest'); // 'backtest', 'optimize', 'walkforward', 'compare'
  const [presets, setPresets] = useState([]);
  const [customStrategies, setCustomStrategies] = useState([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState('preset-momentum-sma');
  
  // Backtest State
  const [backtestResult, setBacktestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [capital, setCapital] = useState(100000);
  const [selectedUniverse, setSelectedUniverse] = useState(['TCS', 'INFY', 'RELIANCE']);
  const [positionSizePct, setPositionSizePct] = useState(20);
  const [slippagePct, setSlippagePct] = useState(0.1);

  // Parameter Optimization State
  const [paramFastSMA, setParamFastSMA] = useState('10, 20');
  const [paramSlowSMA, setParamSlowSMA] = useState('30, 50');
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [optLoading, setOptLoading] = useState(false);

  // Train / Test State
  const [trainStart, setTrainStart] = useState('2023-01-01');
  const [trainEnd, setTrainEnd] = useState('2024-06-30');
  const [testStart, setTestStart] = useState('2024-07-01');
  const [testEnd, setTestEnd] = useState('2025-12-31');
  const [splitResult, setSplitResult] = useState(null);
  const [splitLoading, setSplitLoading] = useState(false);

  // AI & Research Questions
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [researchQuestion, setResearchQuestion] = useState(null);
  const [stressExposure, setStressExposure] = useState(null);

  // Strategy Comparison
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await strategyService.getStrategies();
      if (res.data.success) {
        setPresets(res.data.data.presets || []);
        setCustomStrategies(res.data.data.custom || []);
        // Run initial default preset
        runBacktestForStrategy('preset-momentum-sma');
      }
    } catch (err) {
      toast.error('Failed to load strategy library');
    } finally {
      setLoading(false);
    }
  };

  const runBacktestForStrategy = async (strategyIdOrDef) => {
    try {
      setLoading(true);
      setAiExplanation(null);
      setResearchQuestion(null);
      setStressExposure(null);

      const res = await strategyService.runBacktest(strategyIdOrDef, {
        initialCapital: capital,
        universe: selectedUniverse,
        positionSizing: { type: 'PERCENT_EQUITY', value: positionSizePct },
        costs: {
          brokerageRate: 0.0003,
          flatFeePerTrade: 20,
          slippageRate: slippagePct / 100
        }
      });

      if (res.data.success) {
        setBacktestResult(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to execute backtest');
    } finally {
      setLoading(false);
    }
  };

  const handleRunOptimization = async () => {
    try {
      setOptLoading(true);
      const fastArr = paramFastSMA.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      const slowArr = paramSlowSMA.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));

      const res = await strategyService.runOptimization(selectedStrategyId, {
        fastSMA: fastArr,
        slowSMA: slowArr
      }, {
        universe: selectedUniverse
      });

      if (res.data.success) {
        setOptimizationResult(res.data.data);
        toast.success(`Evaluated ${res.data.data.combinationsTested} parameter combinations`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Optimization failed');
    } finally {
      setOptLoading(false);
    }
  };

  const handleRunSplitTest = async () => {
    try {
      setSplitLoading(true);
      const res = await strategyService.runSplitTest(selectedStrategyId, 
        { startDate: trainStart, endDate: trainEnd },
        { startDate: testStart, endDate: testEnd },
        { universe: selectedUniverse }
      );
      if (res.data.success) {
        setSplitResult(res.data.data);
        toast.success('Train/Test out-of-sample simulation complete');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Split test validation failed');
    } finally {
      setSplitLoading(false);
    }
  };

  const handleCompareAll = async () => {
    try {
      setCompareLoading(true);
      const ids = presets.map(p => p._id);
      const res = await strategyService.compareStrategies(ids, { universe: selectedUniverse });
      if (res.data.success) {
        setCompareResult(res.data.data);
      }
    } catch (err) {
      toast.error('Comparison failed');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleStressTestExposure = async () => {
    try {
      toast.loading('Simulating stress exposure in Stress Studio...');
      const res = await strategyService.stressTestStrategy(selectedStrategyId, 'preset-it-correction');
      toast.dismiss();
      if (res.data.success) {
        setStressExposure(res.data.data);
        toast.success('Strategy exposure under IT shock calculated');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to link Stress Studio');
    }
  };

  const handleSynthesizeQuestion = async () => {
    if (!backtestResult) return;
    try {
      const res = await strategyService.generateResearchQuestion(backtestResult);
      if (res.data.success) {
        setResearchQuestion(res.data.data);
        toast.success('Research Question synthesized');
      }
    } catch (err) {
      toast.error('Failed to synthesize research question');
    }
  };

  const handleExplainWithAI = async () => {
    if (!backtestResult) return;
    try {
      setAiLoading(true);
      const res = await strategyService.explainBacktest(backtestResult);
      if (res.data.success) {
        setAiExplanation(res.data.data);
      }
    } catch (err) {
      toast.error('Grounded AI explanation unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const metrics = backtestResult?.metrics || {};
  const metadata = backtestResult?.metadata || {};
  const equityCurve = backtestResult?.equityCurve || [];
  const tradeLedger = backtestResult?.tradeLedger || [];
  const regimeAnalysis = backtestResult?.regimeAnalysis || [];

  return (
    <div className="strategy-container">
      {/* Header */}
      <div className="strategy-header">
        <div>
          <h1>🧪 Strategy Research & Backtesting 2.0</h1>
          <p>Deterministic historical simulation, parameter sensitivity exploration, and out-of-sample research</p>
        </div>
        <div>
          <span className="badge badge-purple" style={{ fontSize: '12px', padding: '6px 12px' }}>
            Engine v{metadata.engineVersion || '2.0.0-mvp35'}
          </span>
        </div>
      </div>

      {/* Non-Predictive Disclaimer */}
      <div className="disclaimer-banner">
        <strong>RESEARCH ENGINE PRINCIPLE:</strong> Historical backtests evaluate simulated performance under specific past data and defined rules. They are strictly non-predictive evidence, not a guarantee of future returns.
      </div>

      {/* Navigation Tabs */}
      <div className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'backtest' ? 'active' : ''}`}
          onClick={() => setActiveTab('backtest')}
        >
          📊 Backtest & Simulation
        </button>
        <button 
          className={`tab-btn ${activeTab === 'optimize' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimize')}
        >
          🔍 Parameter Lab & Sensitivity
        </button>
        <button 
          className={`tab-btn ${activeTab === 'walkforward' ? 'active' : ''}`}
          onClick={() => setActiveTab('walkforward')}
        >
          ⏱️ Out-of-Sample / Walk-Forward
        </button>
        <button 
          className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => { setActiveTab('compare'); if (!compareResult) handleCompareAll(); }}
        >
          ⚖️ Compare Strategies
        </button>
      </div>

      {/* Tab 1: Backtest Core */}
      {activeTab === 'backtest' && (
        <div className="strategy-layout">
          {/* Left Column: Strategy & Simulation Setup */}
          <div className="sidebar-panel">
            <h2>Strategy Configuration</h2>
            
            <div className="form-group">
              <label>Select Strategy / Preset</label>
              <select 
                value={selectedStrategyId} 
                onChange={(e) => {
                  setSelectedStrategyId(e.target.value);
                  runBacktestForStrategy(e.target.value);
                }}
              >
                <optgroup label="Curated Research Presets">
                  {presets.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </optgroup>
                {customStrategies.length > 0 && (
                  <optgroup label="My Custom Strategies">
                    {customStrategies.map(c => (
                      <option key={c._id} value={c._id}>{c.name} (v{c.version})</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Simulated Initial Capital (₹)</label>
              <input 
                type="number" 
                value={capital} 
                onChange={(e) => setCapital(Number(e.target.value))}
                min="1000"
              />
            </div>

            <div className="form-group">
              <label>Position Sizing (% Equity per Trade)</label>
              <input 
                type="number" 
                value={positionSizePct} 
                onChange={(e) => setPositionSizePct(Number(e.target.value))}
                min="1"
                max="100"
              />
            </div>

            <div className="form-group">
              <label>Modeled Slippage (%)</label>
              <input 
                type="number" 
                step="0.05"
                value={slippagePct} 
                onChange={(e) => setSlippagePct(Number(e.target.value))}
                min="0"
                max="2"
              />
            </div>

            <div className="form-group">
              <label>Universe Assets</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {['TCS', 'INFY', 'RELIANCE', 'WIPRO'].map(sym => (
                  <label key={sym} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={selectedUniverse.includes(sym)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUniverse([...selectedUniverse, sym]);
                        else setSelectedUniverse(selectedUniverse.filter(s => s !== sym));
                      }}
                    />
                    {sym}
                  </label>
                ))}
              </div>
            </div>

            <button 
              className="btn-primary" 
              onClick={() => runBacktestForStrategy(selectedStrategyId)}
              disabled={loading}
              style={{ marginTop: '16px' }}
            >
              {loading ? 'Running Simulation...' : '⚡ RUN HISTORICAL BACKTEST'}
            </button>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="btn-secondary"
                onClick={handleExplainWithAI}
                disabled={aiLoading}
              >
                {aiLoading ? 'Explaining...' : '✨ Explain with Grounded AI'}
              </button>

              <button 
                className="btn-secondary"
                onClick={handleSynthesizeQuestion}
              >
                🔬 Create Research Question
              </button>

              <button 
                className="btn-secondary"
                onClick={handleStressTestExposure}
              >
                🎯 Stress Test Strategy Exposure
              </button>
            </div>
          </div>

          {/* Right Column: Performance Results Dashboard */}
          <div>
            {/* AI Explanation Box */}
            {aiExplanation && (
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#6b21a8' }}>✨ Grounded AI Strategy Analysis</h3>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setAiExplanation(null)}>✕</button>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#374151' }}>{aiExplanation.summary}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <strong style={{ color: '#475569' }}>OBSERVED DATA:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '16px', color: '#334155' }}>
                      {aiExplanation.observedData?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong style={{ color: '#475569' }}>DERIVED METRICS:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '16px', color: '#334155' }}>
                      {aiExplanation.derivedMetrics?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Research Question Card */}
            {researchQuestion && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>🔬 Synthesized Research Question</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setResearchQuestion(null)}>✕</button>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#14532d' }}>{researchQuestion.question}</p>
              </div>
            )}

            {/* Stress Exposure Card */}
            {stressExposure && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#9f1239', textTransform: 'uppercase' }}>🎯 Strategy Exposure Under IT Correction (-15%)</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setStressExposure(null)}>✕</button>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#1e293b' }}>
                  {stressExposure.statement}
                </p>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#be123c', fontWeight: 'bold' }}>
                  Modeled Strategy Downside: ₹{stressExposure.strategyLinkedImpact?.toLocaleString()}
                </div>
              </div>
            )}

            {/* Core Metrics Grid */}
            <div className="metric-grid">
              <div className="metric-card">
                <span>Net Return</span>
                <div className={`val ${metrics.returnPercentage >= 0 ? 'positive' : 'negative'}`}>
                  {metrics.returnPercentage > 0 ? `+${metrics.returnPercentage}` : metrics.returnPercentage}%
                </div>
                <small>₹{metrics.netProfit?.toLocaleString()}</small>
              </div>

              <div className="metric-card">
                <span>Benchmark Return</span>
                <div className="val">{metrics.benchmarkReturn}%</div>
                <small>Alpha: {metrics.alphaDifference > 0 ? `+${metrics.alphaDifference}` : metrics.alphaDifference}%</small>
              </div>

              <div className="metric-card">
                <span>Max Drawdown</span>
                <div className="val negative">{metrics.maxDrawdown}%</div>
                <small>{metrics.maxDrawdownDurationDays || 0} days peak-to-trough</small>
              </div>

              <div className="metric-card">
                <span>Win Rate</span>
                <div className="val">{metrics.winRate}%</div>
                <small>{metrics.winningTrades || 0}W / {metrics.losingTrades || 0}L ({metrics.tradeCount || 0} total)</small>
              </div>

              <div className="metric-card">
                <span>Profit Factor</span>
                <div className="val">{metrics.profitFactor}</div>
                <small>Gross Profit/Loss</small>
              </div>

              <div className="metric-card">
                <span>Final Equity</span>
                <div className="val">₹{metrics.finalEquity?.toLocaleString()}</div>
                <small>Base: ₹{metrics.initialCapital?.toLocaleString()}</small>
              </div>
            </div>

            {/* Equity Curve SVG Chart */}
            <div className="chart-box">
              <div className="chart-header">
                <h3>Simulated Equity Curve vs Benchmark ({metadata.startDate} to {metadata.endDate})</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Hash: <code>{metadata.snapshotHash}</code>
                </span>
              </div>
              <div style={{ height: '180px', width: '100%', position: 'relative', background: '#f8fafc', borderRadius: '4px', overflow: 'hidden' }}>
                {equityCurve.length > 1 ? (
                  <svg width="100%" height="100%" viewBox="0 0 800 180" preserveAspectRatio="none">
                    {/* Zero baseline */}
                    <line x1="0" y1="90" x2="800" y2="90" stroke="#cbd5e1" strokeDasharray="4" />
                    
                    {/* Strategy Curve */}
                    <polyline
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      points={equityCurve.map((pt, idx) => {
                        const x = (idx / (equityCurve.length - 1)) * 800;
                        const returnPct = ((pt.portfolioValue - capital) / capital) * 100;
                        const y = 90 - (returnPct * 4); // scaled
                        return `${x},${Math.max(10, Math.min(170, y))}`;
                      }).join(' ')}
                    />

                    {/* Benchmark Curve */}
                    <polyline
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="2"
                      points={equityCurve.map((pt, idx) => {
                        const x = (idx / (equityCurve.length - 1)) * 800;
                        const bPct = pt.benchmarkReturnPercent || 0;
                        const y = 90 - (bPct * 4);
                        return `${x},${Math.max(10, Math.min(170, y))}`;
                      }).join(' ')}
                    />
                  </svg>
                ) : (
                  <div style={{ textAlign: 'center', paddingTop: '70px', color: '#94a3b8', fontSize: '13px' }}>
                    Insufficient historical data points for chart
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', marginTop: '8px', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '12px', height: '3px', background: '#0284c7', display: 'inline-block' }}></span> Strategy Equity
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '12px', height: '3px', background: '#94a3b8', display: 'inline-block' }}></span> Benchmark ({strategyService ? 'NIFTY50' : ''})
                </span>
              </div>
            </div>

            {/* Regime Breakdown */}
            {regimeAnalysis && regimeAnalysis.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {regimeAnalysis.map((r, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>{r.regime}</span>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px', color: r.netPnL >= 0 ? '#16a34a' : '#dc2626' }}>
                      ₹{r.netPnL?.toLocaleString()}
                    </div>
                    <small style={{ color: '#94a3b8', fontSize: '11px' }}>{r.trades} completed trades</small>
                  </div>
                ))}
              </div>
            )}

            {/* Trade Ledger */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                Trade Execution Ledger ({tradeLedger.length} Trades)
              </h3>
              <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trade ID</th>
                      <th>Symbol</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>Entry Px</th>
                      <th>Exit Px</th>
                      <th>Qty</th>
                      <th>Fees</th>
                      <th>Net P&L</th>
                      <th>Return</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeLedger.length > 0 ? (
                      tradeLedger.map(t => (
                        <tr key={t.tradeId}>
                          <td><strong>{t.tradeId}</strong></td>
                          <td>{t.symbol}</td>
                          <td>{t.entryDate}</td>
                          <td>{t.exitDate}</td>
                          <td>₹{t.entryPrice}</td>
                          <td>₹{t.exitPrice}</td>
                          <td>{t.quantity}</td>
                          <td>₹{t.fees}</td>
                          <td style={{ color: t.netPnL >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                            ₹{t.netPnL}
                          </td>
                          <td style={{ color: t.returnPercent >= 0 ? '#16a34a' : '#dc2626' }}>
                            {t.returnPercent}%
                          </td>
                          <td>
                            <span className={`badge ${t.exitReason === 'STOP_LOSS' ? 'badge-red' : (t.exitReason === 'TAKE_PROFIT' ? 'badge-green' : 'badge-blue')}`}>
                              {t.exitReason}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                          No trades executed in this window under the defined strategy rules.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Parameter Lab & Sensitivity */}
      {activeTab === 'optimize' && (
        <div>
          <div className="sidebar-panel" style={{ marginBottom: '20px' }}>
            <h2>Parameter Grid Experiment</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: '16px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Fast SMA Periods (Comma-separated)</label>
                <input 
                  type="text" 
                  value={paramFastSMA} 
                  onChange={(e) => setParamFastSMA(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Slow SMA Periods (Comma-separated)</label>
                <input 
                  type="text" 
                  value={paramSlowSMA} 
                  onChange={(e) => setParamSlowSMA(e.target.value)} 
                />
              </div>
              <button 
                className="btn-primary" 
                onClick={handleRunOptimization}
                disabled={optLoading}
              >
                {optLoading ? 'Testing...' : '⚡ RUN GRID EXPERIMENT'}
              </button>
            </div>
          </div>

          {optimizationResult && (
            <div>
              {/* Overfitting Warning */}
              {optimizationResult.overfittingWarning && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
                  <strong>⚠️ OVERFITTING RISK DISCLOSURE:</strong> {optimizationResult.overfittingWarning}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 18px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Parameter Sensitivity</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`sensitivity-tag sensitivity-${optimizationResult.sensitivityScore}`}>
                      {optimizationResult.sensitivityScore} SENSITIVITY (StdDev: {optimizationResult.returnStdDev}%)
                    </span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  A strategy with <strong>Low Sensitivity</strong> behaves consistently across neighboring parameters, whereas <strong>High Sensitivity</strong> indicates potential curve-fitting.
                </p>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fast Period</th>
                    <th>Slow Period</th>
                    <th>Simulated Return</th>
                    <th>Max Drawdown</th>
                    <th>Trades</th>
                    <th>Win Rate</th>
                    <th>Profit Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationResult.results?.map((res, i) => (
                    <tr key={i}>
                      <td><strong>{res.parameters.fastPeriod}</strong></td>
                      <td><strong>{res.parameters.slowPeriod}</strong></td>
                      <td style={{ color: res.returnPercentage >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                        {res.returnPercentage}%
                      </td>
                      <td style={{ color: '#dc2626' }}>{res.maxDrawdown}%</td>
                      <td>{res.tradeCount}</td>
                      <td>{res.winRate}%</td>
                      <td>{res.profitFactor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Train / Test Out-of-Sample */}
      {activeTab === 'walkforward' && (
        <div>
          <div className="sidebar-panel" style={{ marginBottom: '20px' }}>
            <h2>Train / Test Out-of-Sample Validation</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 180px', gap: '12px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Train Start</label>
                <input type="date" value={trainStart} onChange={(e) => setTrainStart(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Train End</label>
                <input type="date" value={trainEnd} onChange={(e) => setTrainEnd(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Test Start (OOS)</label>
                <input type="date" value={testStart} onChange={(e) => setTestStart(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Test End (OOS)</label>
                <input type="date" value={testEnd} onChange={(e) => setTestEnd(e.target.value)} />
              </div>
              <button 
                className="btn-primary" 
                onClick={handleRunSplitTest}
                disabled={splitLoading}
              >
                {splitLoading ? 'Simulating...' : '⚡ TEST OUT-OF-SAMPLE'}
              </button>
            </div>
          </div>

          {splitResult && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <span className="badge badge-blue">IN-SAMPLE (TRAINING)</span>
                  <div style={{ fontSize: '12px', color: '#64748b', margin: '8px 0' }}>
                    {splitResult.trainWindow.startDate} to {splitResult.trainWindow.endDate}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: splitResult.inSampleMetrics.returnPercentage >= 0 ? '#16a34a' : '#dc2626' }}>
                    {splitResult.inSampleMetrics.returnPercentage}% Return
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '6px', color: '#475569' }}>
                    Max Drawdown: {splitResult.inSampleMetrics.maxDrawdown}% | Trades: {splitResult.inSampleMetrics.tradeCount} | Win Rate: {splitResult.inSampleMetrics.winRate}%
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <span className="badge badge-purple">OUT-OF-SAMPLE (TEST)</span>
                  <div style={{ fontSize: '12px', color: '#64748b', margin: '8px 0' }}>
                    {splitResult.testWindow.startDate} to {splitResult.testWindow.endDate}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: splitResult.outOfSampleMetrics.returnPercentage >= 0 ? '#16a34a' : '#dc2626' }}>
                    {splitResult.outOfSampleMetrics.returnPercentage}% Return
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '6px', color: '#475569' }}>
                    Max Drawdown: {splitResult.outOfSampleMetrics.maxDrawdown}% | Trades: {splitResult.outOfSampleMetrics.tradeCount} | Win Rate: {splitResult.outOfSampleMetrics.winRate}%
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px' }}>RESEARCH OBSERVATION:</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                  {splitResult.comparison.observation} (Performance Delta: {splitResult.comparison.returnDelta}%)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Compare Strategies */}
      {activeTab === 'compare' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: 0 }}>Comparative Performance Matrix</h2>
            <button className="btn-secondary" onClick={handleCompareAll} disabled={compareLoading}>
              {compareLoading ? 'Refreshing...' : '🔄 Re-run Comparison'}
            </button>
          </div>

          {compareResult && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Strategy Name</th>
                  <th>Version</th>
                  <th>Return (%)</th>
                  <th>Benchmark Return (%)</th>
                  <th>Alpha (%)</th>
                  <th>Max DD (%)</th>
                  <th>Win Rate (%)</th>
                  <th>Profit Factor</th>
                  <th>Trades</th>
                  <th>Avg Days Held</th>
                </tr>
              </thead>
              <tbody>
                {compareResult.strategies?.map(s => (
                  <tr key={s.strategyId}>
                    <td><strong>{s.name}</strong></td>
                    <td>v{s.version}</td>
                    <td style={{ color: s.returnPercentage >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                      {s.returnPercentage}%
                    </td>
                    <td>{s.benchmarkReturn}%</td>
                    <td style={{ color: s.alphaDifference >= 0 ? '#16a34a' : '#dc2626' }}>
                      {s.alphaDifference}%
                    </td>
                    <td style={{ color: '#dc2626' }}>{s.maxDrawdown}%</td>
                    <td>{s.winRate}%</td>
                    <td>{s.profitFactor}</td>
                    <td>{s.tradeCount}</td>
                    <td>{s.avgHoldingPeriodDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default StrategyLab;
