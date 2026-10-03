import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { alertService, marketService } from "../services/api";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [condition, setCondition] = useState("ABOVE");
  const [targetPrice, setTargetPrice] = useState("");
  const [searching, setSearching] = useState(false);

  const loadAlerts = async () => {
    try {
      const res = await alertService.getAlerts();
      if (res.data && res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (!symbol) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await marketService.searchSymbols(symbol);
        setSearchResults(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [symbol]);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!symbol || !targetPrice) return;
    try {
      await alertService.createAlert({ symbol, condition, targetPrice: Number(targetPrice) });
      toast.success("Alert created");
      setSymbol("");
      setTargetPrice("");
      setSearchResults([]);
      loadAlerts();
    } catch (err) {
      // Toast error handled by axios interceptor
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await alertService.updateAlert(id, !currentStatus);
      toast.success(`Alert ${!currentStatus ? 'enabled' : 'disabled'}`);
      loadAlerts();
    } catch (err) {
      // Toast error handled by axios interceptor
    }
  };

  const handleDelete = async (id) => {
    try {
      await alertService.deleteAlert(id);
      toast.success("Alert deleted");
      loadAlerts();
    } catch (err) {
      // Toast error handled by axios interceptor
    }
  };

  const handleEvaluate = async () => {
    try {
      await alertService.evaluateAlerts();
      toast.success("Alerts evaluated manually");
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 className="title" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Price Alerts</h3>
      
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
        <h4 style={{ marginBottom: '10px' }}>Create New Alert</h4>
        <form onSubmit={handleCreateAlert} style={{ display: 'flex', gap: '15px', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search symbol (e.g. TCS)" 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            {symbol && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', zIndex: 10 }}>
                {searching ? (
                  <div style={{ padding: '8px', color: '#666', fontSize: '0.85rem' }}>Searching symbols...</div>
                ) : searchResults.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {searchResults.map(s => (
                      <li 
                        key={s.symbol} 
                        onClick={() => { setSymbol(s.symbol); setSearchResults([]); }}
                        style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      >
                        {s.symbol}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: '8px', color: '#888', fontSize: '0.85rem' }}>No symbols found</div>
                )}
              </div>
            )}
          </div>
          
          <select 
            value={condition} 
            onChange={(e) => setCondition(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="ABOVE">Above</option>
            <option value="BELOW">Below</option>
          </select>

          <input 
            type="number" 
            placeholder="Target Price" 
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />

          <button type="submit" className="btn btn-blue" style={{ padding: '8px 16px' }}>Create Alert</button>
        </form>
      </div>

      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
        <h4>Your Alerts</h4>
        <button className="btn btn-blue" onClick={handleEvaluate}>Evaluate (Test)</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : alerts.length === 0 ? (
        <p style={{ color: '#888' }}>No alerts created yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Symbol</th>
              <th style={{ padding: '10px' }}>Condition</th>
              <th style={{ padding: '10px' }}>Target</th>
              <th style={{ padding: '10px' }}>Current</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(alert => (
              <tr key={alert._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{alert.symbol}</td>
                <td style={{ padding: '10px' }}>{alert.condition}</td>
                <td style={{ padding: '10px' }}>₹{alert.targetPrice}</td>
                <td style={{ padding: '10px' }}>{alert.currentPrice ? `₹${alert.currentPrice}` : 'N/A'}</td>
                <td style={{ padding: '10px' }}>
                  {!alert.isActive ? (
                    <span style={{ color: '#888' }}>Triggered ({new Date(alert.triggeredAt).toLocaleTimeString()})</span>
                  ) : (
                    <span style={{ color: '#4caf50' }}>Active</span>
                  )}
                </td>
                <td style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                  {alert.isActive && (
                    <button 
                      onClick={() => handleToggle(alert._id, alert.isActive)}
                      style={{ border: 'none', background: 'none', color: '#ff9800', cursor: 'pointer' }}
                    >
                      Disable
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(alert._id)}
                    style={{ border: 'none', background: 'none', color: '#e74c3c', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Alerts;
