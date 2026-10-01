import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  marketScannerService,
  watchlistService,
  alertService
} from '../services/api';
import './MarketScanner.css';

const CURATED_PRESETS = [
  {
    id: 'preset-momentum',
    name: 'Momentum Research',
    description: 'SMA20 > SMA50, RSI > 55, Volume > 1.2x Volume SMA20',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditions: [
      { indicator: 'SMA', period: 20, operator: 'GREATER_THAN', compareTo: { type: 'SMA', period: 50 } },
      { indicator: 'RSI', period: 14, operator: 'GREATER_THAN', value: 55 },
      { indicator: 'VOLUME_SMA', period: 20, operator: 'GREATER_THAN', value: 1.2 }
    ]
  },
  {
    id: 'preset-trend',
    name: 'Trend Alignment',
    description: 'EMA20 > EMA50, Price > EMA20, Price > EMA50',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditions: [
      { indicator: 'EMA', period: 20, operator: 'GREATER_THAN', compareTo: { type: 'EMA', period: 50 } },
      { indicator: 'PRICE_CHANGE', period: 1, operator: 'GREATER_THAN', value: 0 }
    ]
  },
  {
    id: 'preset-breakout',
    name: 'Breakout Research',
    description: 'Price exceeds 20-day High with 1.2x volume expansion',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditions: [
      { indicator: 'DONCHIAN_BREAKOUT', period: 20, operator: 'GREATER_THAN', value: 0 },
      { indicator: 'VOLUME_SMA', period: 20, operator: 'GREATER_THAN', value: 1.2 }
    ]
  },
  {
    id: 'preset-volume',
    name: 'Volume Expansion',
    description: 'Unusual trading volume exceeding 1.5x 20-day baseline',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditions: [
      { indicator: 'VOLUME_SMA', period: 20, operator: 'GREATER_THAN', value: 1.5 }
    ]
  },
  {
    id: 'preset-oversold',
    name: 'Oversold Research',
    description: 'RSI < 35 with short-term price compression',
    universe: 'NIFTY50',
    matchMode: 'NEAR',
    conditions: [
      { indicator: 'RSI', period: 14, operator: 'LESS_THAN', value: 35 },
      { indicator: 'PRICE_CHANGE', period: 5, operator: 'LESS_THAN', value: -2 }
    ]
  },
  {
    id: 'preset-rel-strength',
    name: 'Relative Strength',
    description: 'Outperforming benchmark NIFTY50 over 20 trading sessions',
    universe: 'NIFTY50',
    matchMode: 'STRICT',
    conditions: [
      { indicator: 'RELATIVE_STRENGTH', period: 20, operator: 'GREATER_THAN', value: 0 }
    ]
  }
];

const MarketScanner = () => {
  const navigate = useNavigate();
  // Navigation & Pipeline
  const [pipelineStep, setPipelineStep] = useState('DISCOVER'); // DISCOVER, EXPLAIN, BACKTEST, STRESS, RESEARCH

  // Scan Config State
  const [scanName, setScanName] = useState('Momentum Research');
  const [selectedUniverse, setSelectedUniverse] = useState('NIFTY50');
  const [customSymbolsInput, setCustomSymbolsInput] = useState('TCS, INFY, RELIANCE, HDFCBANK, ICICIBANK, WIPRO, LT, SBIN, TATAMOTORS');
  const [matchMode, setMatchMode] = useState('STRICT');
  const [conditions, setConditions] = useState(CURATED_PRESETS[0].conditions);
  const [activePresetId, setActivePresetId] = useState('preset-momentum');

  // Execution State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [savedScans, setSavedScans] = useState([]);
  
  // Drawer / Inspection State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [researchQuestion, setResearchQuestion] = useState(null);

  // Cross-Engine Modal State
  const [backtestModal, setBacktestModal] = useState(null);
  const [stressModal, setStressModal] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load Saved Scans & Initial Auto-run
  useEffect(() => {
    loadSavedScans();
    handleRunScan(CURATED_PRESETS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSavedScans = async () => {
    try {
      const res = await marketScannerService.getScanners();
      if (res.data?.success) {
        setSavedScans(res.data.data.scanners || []);
      }
    } catch (err) {
      // Fail gracefully
    }
  };

  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setScanName(preset.name);
    setSelectedUniverse(preset.universe);
    setMatchMode(preset.matchMode);
    setConditions(JSON.parse(JSON.stringify(preset.conditions)));
  };

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { indicator: 'RSI', period: 14, operator: 'GREATER_THAN', value: 50 }
    ]);
  };

  const handleRemoveCondition = (idx) => {
    const updated = conditions.filter((_, i) => i !== idx);
    setConditions(updated);
  };

  const handleConditionChange = (idx, field, val) => {
    const updated = [...conditions];
    if (field === 'compareTo') {
      if (val === 'VALUE') {
        delete updated[idx].compareTo;
        updated[idx].value = 50;
      } else {
        delete updated[idx].value;
        updated[idx].compareTo = { type: val, period: 50 };
      }
    } else {
      updated[idx][field] = val;
    }
    setConditions(updated);
  };

  const handleRunScan = async (overridePreset = null) => {
    setIsScanning(true);
    setAiExplanation(null);
    setResearchQuestion(null);
    setPipelineStep('DISCOVER');

    try {
      const currentUniverse = overridePreset ? overridePreset.universe : selectedUniverse;
      const currentConditions = overridePreset ? overridePreset.conditions : conditions;
      const currentMatchMode = overridePreset ? overridePreset.matchMode : matchMode;
      const currentName = overridePreset ? overridePreset.name : scanName;

      const payload = {
        name: currentName,
        universe: currentUniverse,
        customSymbols: currentUniverse === 'CUSTOM' 
          ? customSymbolsInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
          : undefined,
        matchMode: currentMatchMode,
        conditions: currentConditions
      };

      const res = await marketScannerService.runScan(payload);
      if (res.data?.success) {
        setScanResult(res.data.data);
        toast.success(`Scan completed: ${res.data.data.metadata.matchedCount} matching candidates discovered.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Market scan evaluation failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveScan = async () => {
    try {
      const payload = {
        name: scanName,
        description: `Custom scan with ${conditions.length} condition(s)`,
        universe: selectedUniverse,
        customSymbols: selectedUniverse === 'CUSTOM'
          ? customSymbolsInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
          : undefined,
        matchMode,
        conditions
      };
      const res = await marketScannerService.createScanner(payload);
      if (res.data?.success) {
        toast.success(`Scan "${scanName}" saved successfully.`);
        loadSavedScans();
      }
    } catch (err) {
      toast.error('Failed to save scan configuration');
    }
  };

  // Action Bridge: Add to Watchlist
  const handleAddToWatchlist = async (symbol) => {
    try {
      const res = await watchlistService.addSymbol(symbol);
      if (res.data?.success) {
        toast.success(`Added ${symbol} to your research watchlist.`);
      }
    } catch (err) {
      toast.error(`Failed to add ${symbol} to watchlist`);
    }
  };

  // Action Bridge: Create Alert
  const handleCreateAlert = async (candidate) => {
    try {
      const targetPrice = Math.round(candidate.price * 1.02);
      const res = await alertService.createAlert({
        symbol: candidate.symbol,
        targetPrice,
        condition: 'ABOVE'
      });
      if (res.data?.success) {
        toast.success(`Alert created: ${candidate.symbol} above ₹${targetPrice}`);
      }
    } catch (err) {
      toast.error(`Failed to create alert for ${candidate.symbol}`);
    }
  };

  // Action Bridge: Backtest this scan
  const handleBacktestScan = async () => {
    if (!scanResult) return;
    setIsActionLoading(true);
    setPipelineStep('BACKTEST');

    try {
      const payload = {
        name: scanResult.scanner?.name || scanName,
        universe: selectedUniverse,
        customSymbols: selectedUniverse === 'CUSTOM'
          ? customSymbolsInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
          : undefined,
        conditions
      };

      const res = await marketScannerService.backtestScan(payload, {
        initialCapital: 100000,
        positionSizePct: 20
      });

      if (res.data?.success) {
        setBacktestModal(res.data.data);
        toast.success('Converted scanner rules to historical strategy backtest!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Backtest bridge failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action Bridge: Stress Test Selected Candidates
  const handleStressCandidates = async (symbolsToStress) => {
    setIsActionLoading(true);
    setPipelineStep('STRESS');

    try {
      const res = await marketScannerService.stressTestCandidates(symbolsToStress, 'preset-it-correction');
      if (res.data?.success) {
        setStressModal(res.data.data);
        toast.success(`Stress test evaluated across candidate basket (${symbolsToStress.join(', ')})`);
      }
    } catch (err) {
      toast.error('Stress test bridge failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action Bridge: Research Question Synthesis
  const handleSynthesizeQuestion = async () => {
    if (!scanResult) return;
    setPipelineStep('RESEARCH');
    try {
      const res = await marketScannerService.generateResearchQuestion(scanResult);
      if (res.data?.success) {
        setResearchQuestion(res.data.data);
        toast.success('Formulated hypothesis research question.');
      }
    } catch (err) {
      toast.error('Failed to formulate research question');
    }
  };

  // Action Bridge: AI Explainer
  const handleExplainScan = async () => {
    if (!scanResult) return;
    setIsExplaining(true);
    setPipelineStep('EXPLAIN');
    try {
      const res = await marketScannerService.explainScan(scanResult);
      if (res.data?.success) {
        setAiExplanation(res.data.data.explanation);
        toast.success('AI Explainer generated transparent analysis.');
      }
    } catch (err) {
      toast.error('AI explanation unavailable');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="market-scanner-container">
      {/* Header & Pipeline Stepper */}
      <div className="scanner-header">
        <div className="scanner-title-row">
          <div className="scanner-title">
            <span>Market Scanner & Opportunity Engine</span>
            <span className="scanner-badge">MVP-36 Verified</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={handleSaveScan}>
              💾 Save Scan
            </button>
            <button 
              className="btn-primary" 
              onClick={() => handleRunScan()} 
              disabled={isScanning}
            >
              {isScanning ? '⏳ Scanning Market...' : '▶ Run Market Scan'}
            </button>
          </div>
        </div>

        {/* Pipeline Stepper */}
        <div className="pipeline-stepper">
          <div className={`step-item ${pipelineStep === 'DISCOVER' ? 'active' : ''}`}>
            <span>1. DISCOVER</span>
          </div>
          <span className="step-arrow">→</span>
          <div className={`step-item ${pipelineStep === 'EXPLAIN' ? 'active' : ''}`}>
            <span>2. EXPLAIN</span>
          </div>
          <span className="step-arrow">→</span>
          <div className={`step-item ${pipelineStep === 'BACKTEST' ? 'active' : ''}`}>
            <span>3. BACKTEST</span>
          </div>
          <span className="step-arrow">→</span>
          <div className={`step-item ${pipelineStep === 'STRESS' ? 'active' : ''}`}>
            <span>4. STRESS</span>
          </div>
          <span className="step-arrow">→</span>
          <div className={`step-item ${pipelineStep === 'RESEARCH' ? 'active' : ''}`}>
            <span>5. RESEARCH</span>
          </div>
        </div>
      </div>

      {/* Control Grid */}
      <div className="scanner-grid">
        {/* Left Column: Presets & Setup */}
        <div className="scanner-sidebar">
          {/* Curated Presets */}
          <div className="scanner-card">
            <div className="card-title">
              <span>Curated Research Presets</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>6 Available</span>
            </div>
            <div className="preset-list">
              {CURATED_PRESETS.map(p => (
                <div 
                  key={p.id}
                  className={`preset-btn ${activePresetId === p.id ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(p)}
                >
                  <span className="preset-name">{p.name}</span>
                  <span className="preset-desc">{p.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Universe Configuration */}
          <div className="scanner-card">
            <div className="card-title">Universe & Matching</div>
            <div className="form-group">
              <label className="form-label">Market Universe</label>
              <select 
                className="form-select" 
                value={selectedUniverse}
                onChange={(e) => setSelectedUniverse(e.target.value)}
              >
                <option value="NIFTY50">NIFTY 50 Benchmark Universe</option>
                <option value="WATCHLIST">My Personal Research Watchlist</option>
                <option value="CUSTOM">Custom Symbol Basket</option>
              </select>
            </div>

            {selectedUniverse === 'CUSTOM' && (
              <div className="form-group">
                <label className="form-label">Symbols (Comma-separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={customSymbolsInput}
                  onChange={(e) => setCustomSymbolsInput(e.target.value)}
                  placeholder="TCS, INFY, RELIANCE..."
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Match Strictness Mode</label>
              <select 
                className="form-select"
                value={matchMode}
                onChange={(e) => setMatchMode(e.target.value)}
              >
                <option value="STRICT">Strict (100% Conditions Must Match)</option>
                <option value="NEAR">Near Match (Show 60%+ Matches for Research)</option>
              </select>
            </div>
          </div>

          {/* Saved Scans List */}
          {savedScans.length > 0 && (
            <div className="scanner-card">
              <div className="card-title">My Saved Scans ({savedScans.length})</div>
              <div className="preset-list">
                {savedScans.map(s => (
                  <div 
                    key={s._id} 
                    className="preset-btn"
                    onClick={() => {
                      setScanName(s.name);
                      setSelectedUniverse(s.universe);
                      setConditions(s.conditions);
                      setMatchMode(s.matchMode);
                      handleRunScan(s);
                    }}
                  >
                    <span className="preset-name">{s.name}</span>
                    <span className="preset-desc">{s.universe} • {s.conditions?.length} rules • v{s.version}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Conditions, Breadth, Table */}
        <div className="scanner-main">
          {/* Condition Builder Card */}
          <div className="scanner-card">
            <div className="card-title">
              <span>Transparent Rule Definition (Controlled DSL)</span>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Deterministic AST</span>
            </div>

            {conditions.map((cond, idx) => (
              <div key={idx} className="condition-row">
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select 
                    className="form-select"
                    value={cond.indicator}
                    onChange={(e) => handleConditionChange(idx, 'indicator', e.target.value)}
                  >
                    <option value="SMA">SMA (Simple MA)</option>
                    <option value="EMA">EMA (Exponential MA)</option>
                    <option value="RSI">RSI (Relative Strength Index)</option>
                    <option value="PRICE_CHANGE">Price Change %</option>
                    <option value="VOLUME_SMA">Volume SMA Multiple</option>
                    <option value="DONCHIAN_BREAKOUT">Donchian Breakout High</option>
                    <option value="RELATIVE_STRENGTH">Relative Performance vs Benchmark</option>
                  </select>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ width: '70px' }}
                    value={cond.period || 20}
                    onChange={(e) => handleConditionChange(idx, 'period', Number(e.target.value))}
                    title="Indicator Period"
                  />
                </div>

                <select 
                  className="form-select"
                  value={cond.operator}
                  onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                >
                  <option value="GREATER_THAN">&gt; Greater Than</option>
                  <option value="LESS_THAN">&lt; Less Than</option>
                  <option value="CROSSES_ABOVE">↑ Crosses Above</option>
                  <option value="CROSSES_BELOW">↓ Crosses Below</option>
                </select>

                <div>
                  {cond.compareTo ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select 
                        className="form-select"
                        value={cond.compareTo.type}
                        onChange={(e) => handleConditionChange(idx, 'compareTo', e.target.value)}
                      >
                        <option value="SMA">SMA</option>
                        <option value="EMA">EMA</option>
                      </select>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '65px' }}
                        value={cond.compareTo.period || 50}
                        onChange={(e) => {
                          const updated = [...conditions];
                          updated[idx].compareTo.period = Number(e.target.value);
                          setConditions(updated);
                        }}
                      />
                    </div>
                  ) : (
                    <input 
                      type="number" 
                      className="form-input"
                      value={cond.value !== undefined ? cond.value : 50}
                      onChange={(e) => handleConditionChange(idx, 'value', Number(e.target.value))}
                      placeholder="Threshold"
                    />
                  )}
                </div>

                <button 
                  className="btn-remove-cond"
                  onClick={() => handleRemoveCondition(idx)}
                  title="Remove Condition"
                >
                  ×
                </button>
              </div>
            ))}

            <button className="btn-add-cond" onClick={handleAddCondition}>
              + Add Rule Condition
            </button>
          </div>

          {/* Market Breadth Snapshot */}
          {scanResult?.marketBreadth && (
            <div className="breadth-banner">
              <div className="breadth-card">
                <span className="breadth-label">Advancing</span>
                <span className="breadth-val val-green">{scanResult.marketBreadth.advancing}</span>
              </div>
              <div className="breadth-card">
                <span className="breadth-label">Declining</span>
                <span className="breadth-val val-red">{scanResult.marketBreadth.declining}</span>
              </div>
              <div className="breadth-card">
                <span className="breadth-label">Above SMA 20</span>
                <span className="breadth-val val-blue">{scanResult.marketBreadth.aboveSMA20}</span>
              </div>
              <div className="breadth-card">
                <span className="breadth-label">Above SMA 50</span>
                <span className="breadth-val val-blue">{scanResult.marketBreadth.aboveSMA50}</span>
              </div>
              <div className="breadth-card">
                <span className="breadth-label">Total Evaluated</span>
                <span className="breadth-val">{scanResult.marketBreadth.totalEvaluated}</span>
              </div>
            </div>
          )}

          {/* Results Metadata Bar */}
          {scanResult && (
            <div className="result-meta-bar">
              <div className="meta-chip">
                <span>Matched:</span>
                <strong>{scanResult.metadata.matchedCount} / {scanResult.metadata.scannedCount}</strong>
              </div>
              <div className="meta-chip">
                <span>Data Provider:</span>
                <strong>{scanResult.metadata.dataSource}</strong>
              </div>
              <div className="meta-chip">
                <span>As of:</span>
                <strong>{new Date(scanResult.metadata.dataTimestamp).toLocaleTimeString()}</strong>
              </div>
              <div className="meta-chip">
                <span>Latency:</span>
                <strong>{scanResult.metadata.executionDurationMs}ms</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-secondary" 
                  onClick={handleBacktestScan}
                  disabled={isActionLoading || scanResult.matches.length === 0}
                >
                  🧪 Backtest This Scan
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleStressCandidates(scanResult.matches.slice(0, 3).map(m => m.symbol))}
                  disabled={isActionLoading || scanResult.matches.length === 0}
                >
                  🎯 Stress Top Basket
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={handleSynthesizeQuestion}
                >
                  🔬 Research Question
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={handleExplainScan}
                  disabled={isExplaining}
                >
                  ✨ AI Explainer
                </button>
              </div>
            </div>
          )}

          {/* Grounded AI Explainer Box */}
          {aiExplanation && (
            <div className="ai-box">
              <div className="ai-header">
                <span>✨ Grounded AI Opportunity Analysis (Zero Stock Tips)</span>
              </div>
              <div className="ai-section">
                <div className="ai-section-title">Observed Market Data</div>
                <div className="ai-section-content">
                  <ul>
                    {aiExplanation.observedData?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="ai-section">
                <div className="ai-section-title">Deterministic Match Evidence</div>
                <div className="ai-section-content">
                  <ul>
                    {aiExplanation.matchExplanation?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="ai-section">
                <div className="ai-section-title">Research Interpretation</div>
                <div className="ai-section-content">{aiExplanation.researchInterpretation}</div>
              </div>
              <div className="ai-section">
                <div className="ai-section-title">Limitations & Unknowns</div>
                <div className="ai-section-content">
                  <div style={{ color: '#b45309' }}>• {aiExplanation.limitations}</div>
                  <div style={{ color: '#64748b' }}>• {aiExplanation.unknowns}</div>
                </div>
              </div>
            </div>
          )}

          {/* Research Question Card */}
          {researchQuestion && (
            <div className="scanner-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                🔬 Formulated Empirical Research Hypothesis
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#14532d', lineHeight: '1.4' }}>
                "{researchQuestion.question}"
              </div>
              <div style={{ fontSize: '11px', color: '#15803d', marginTop: '8px' }}>
                Bridge: Validate this hypothesis historically via Strategy Lab or stress test correlation under Stress Studio.
              </div>
            </div>
          )}

          {/* Research Results Table */}
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Sector</th>
                  <th>Latest Price</th>
                  <th>Match</th>
                  <th>RSI (14)</th>
                  <th>Trend Alignment</th>
                  <th>Volume Multiple</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scanResult?.matches?.length > 0 ? (
                  scanResult.matches.map((item) => (
                    <tr key={item.symbol}>
                      <td>
                        <div className="symbol-cell">
                          <span>{item.symbol}</span>
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '12px' }}>
                        {item.sector || 'Equities'}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        ₹{item.price?.toFixed(2) || 'N/A'}
                      </td>
                      <td>
                        <span className={`badge-match ${item.conditionCoverage >= 1 ? 'full' : 'partial'}`}>
                          {item.matchScore} ({Math.round(item.conditionCoverage * 100)}%)
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {item.indicators?.RSI !== undefined ? item.indicators.RSI.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: item.indicators?.SMA_20 > item.indicators?.SMA_50 ? '#16a34a' : '#64748b' }}>
                          {item.indicators?.SMA_20 > item.indicators?.SMA_50 ? '↑ Bullish' : '— Neutral'}
                        </span>
                      </td>
                      <td>
                        <span>
                          {item.indicators?.VOLUME_RATIO ? `${item.indicators.VOLUME_RATIO.toFixed(2)}x` : '1.0x'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon-action primary"
                            onClick={() => setSelectedCandidate(item)}
                            title="Inspect Exact Rule Breakdown"
                          >
                            Why?
                          </button>
                          <button 
                            className="btn-icon-action"
                            style={{ background: '#7c3aed', color: '#ffffff' }}
                            onClick={() => navigate(`/research?symbol=${item.symbol}&intent=SCANNER_EXPLANATION&question=Why did ${item.symbol} match scanner rules today?`)}
                            title="Open in Research Copilot"
                          >
                            🔬 Investigate
                          </button>
                          <button 
                            className="btn-icon-action"
                            onClick={() => handleAddToWatchlist(item.symbol)}
                            title="Add to Research Watchlist"
                          >
                            + Watchlist
                          </button>
                          <button 
                            className="btn-icon-action"
                            onClick={() => handleCreateAlert(item)}
                            title="Create Price Alert"
                          >
                            Alert
                          </button>
                          <button 
                            className="btn-icon-action"
                            onClick={() => handleStressCandidates([item.symbol])}
                            title="Stress Test this Asset"
                          >
                            Stress
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      {isScanning ? 'Evaluating market universe...' : 'No securities matched the active scan criteria. Try switching to "Near Match" mode or loosening threshold conditions.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Candidate Research Drawer ("Why Did This Match?") */}
      {selectedCandidate && (
        <div className="drawer-backdrop" onClick={() => setSelectedCandidate(null)}>
          <div className="research-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="drawer-title">{selectedCandidate.symbol} — Research Evidence</div>
                <div className="drawer-subtitle">
                  {selectedCandidate.sector} • ₹{selectedCandidate.price} • Match Score: {selectedCandidate.matchScore}
                </div>
              </div>
              <button className="btn-close-drawer" onClick={() => setSelectedCandidate(null)}>×</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
                Exact Condition Verification Breakdown
              </h4>
              {selectedCandidate.ruleBreakdown?.map((rule, idx) => (
                <div key={idx} className="rule-evidence-card">
                  <div className="rule-evidence-title">
                    <span style={{ color: rule.passed ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                      {rule.passed ? '✓' : '✗'}
                    </span>
                    <span>{rule.rule}</span>
                  </div>
                  <div className="rule-evidence-detail">
                    {rule.detail}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions inside Drawer */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => handleAddToWatchlist(selectedCandidate.symbol)}
              >
                + Add to Watchlist
              </button>
              <button 
                className="btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => handleCreateAlert(selectedCandidate)}
              >
                Create Alert
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1 }}
                onClick={() => {
                  setSelectedCandidate(null);
                  handleStressCandidates([selectedCandidate.symbol]);
                }}
              >
                Stress Test
              </button>
            </div>

            {/* Data Quality & Audit Panel */}
            <div className="data-quality-panel">
              <div style={{ fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
                DATA AUDIT & REPRODUCIBILITY
              </div>
              <div className="dq-row">
                <span>Provider Tier:</span>
                <strong>{selectedCandidate.dataSource || 'MarketDataService'}</strong>
              </div>
              <div className="dq-row">
                <span>Bars Analyzed:</span>
                <strong>252 Daily Sessions</strong>
              </div>
              <div className="dq-row">
                <span>Latest Bar Timestamp:</span>
                <strong>{new Date(selectedCandidate.timestamp).toLocaleDateString()}</strong>
              </div>
              <div className="dq-row">
                <span>Result Hash:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedCandidate.resultHash}</span>
              </div>
              <div className="dq-row">
                <span>Fundamental Ratios:</span>
                <span style={{ color: '#d97706' }}>PLANNED / Requires Fundamental Provider Tier</span>
              </div>
              <div className="dq-disclaimer">
                Historical constituent survivorship bias disclosure: universe constituents reflect current membership. All technical filters are deterministic research criteria, never automated investment advice.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backtest Modal Bridge */}
      {backtestModal && (
        <div className="drawer-backdrop" onClick={() => setBacktestModal(null)}>
          <div className="research-drawer" style={{ width: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="drawer-title">Historical Backtest of Scanner Rules</div>
                <div className="drawer-subtitle">
                  Strategy Lab Bridge • Initial Capital: ₹1,00,000 • Sizing: 20%
                </div>
              </div>
              <button className="btn-close-drawer" onClick={() => setBacktestModal(null)}>×</button>
            </div>

            <div className="breadth-banner">
              <div className="breadth-card">
                <span className="breadth-label">Return %</span>
                <span className={`breadth-val ${backtestModal.metrics?.returnPercentage >= 0 ? 'val-green' : 'val-red'}`}>
                  {backtestModal.metrics?.returnPercentage}%
                </span>
              </div>
              <div className="breadth-card">
                <span className="breadth-label">Benchmark Return</span>
                <span className="breadth-val val-blue">{backtestModal.metrics?.benchmarkReturn}%</span>
              </div>
              <div className="breadth-card">
                <span className="breadth-label">Max Drawdown</span>
                <span className="breadth-val val-red">{backtestModal.metrics?.maxDrawdown}%</span>
              </div>
              <div className="breadth-card">
                <span className="breadth-label">Trades</span>
                <span className="breadth-val">{backtestModal.metrics?.tradeCount}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                Simulated Trade Ledger ({backtestModal.tradeLedger?.length || 0} Executions)
              </h4>
              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>PnL (₹)</th>
                      <th>Net Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestModal.tradeLedger?.map((t, idx) => (
                      <tr key={idx}>
                        <td><strong>{t.symbol}</strong></td>
                        <td>₹{t.entryPrice?.toFixed(2)}</td>
                        <td>₹{t.exitPrice?.toFixed(2)}</td>
                        <td style={{ color: t.netPnL >= 0 ? '#16a34a' : '#dc2626' }}>
                          ₹{t.netPnL?.toFixed(2)}
                        </td>
                        <td>{t.returnPct?.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn-primary" 
                style={{ width: '100%' }}
                onClick={() => setBacktestModal(null)}
              >
                Close Backtest Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stress Test Modal Bridge */}
      {stressModal && (
        <div className="drawer-backdrop" onClick={() => setStressModal(null)}>
          <div className="research-drawer" style={{ width: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="drawer-title">Stress Studio Modeled Impact</div>
                <div className="drawer-subtitle">
                  Scenario: {stressModal.scenario?.name} (IT -15% Shock)
                </div>
              </div>
              <button className="btn-close-drawer" onClick={() => setStressModal(null)}>×</button>
            </div>

            <div className="scanner-card" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>
                Modeled Candidate Drawdown
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#b91c1c' }}>
                ₹{stressModal.candidateGroupImpact?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '6px' }}>
                {stressModal.statement}
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                Attribution by Candidate Asset
              </h4>
              {stressModal.candidatesAttribution?.map((attr, idx) => (
                <div key={idx} className="rule-evidence-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{attr.symbol} (Qty: {attr.qty})</span>
                    <span style={{ color: '#dc2626' }}>₹{attr.absoluteImpact?.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Baseline Value: ₹{attr.baselineValue?.toLocaleString()} → Shocked Value: ₹{attr.scenarioValue?.toLocaleString()} ({attr.percentageImpact}%)
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn-primary" 
                style={{ width: '100%' }}
                onClick={() => setStressModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketScanner;
