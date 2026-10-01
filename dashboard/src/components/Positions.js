import React, { useState, useEffect, useContext } from "react";
import { portfolioService } from "../services/api";
import GeneralContext from "./GeneralContext";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const generalContext = useContext(GeneralContext);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await portfolioService.getPositions();
        const pList = response.data?.data ?? response.data;
        setPositions(Array.isArray(pList) ? pList : []);
      } catch (err) {
        setError("Failed to fetch positions.");
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
  }, []);

  if (loading) return (
    <div className="terminal-dashboard">
      <div className="empty-center-box text-muted" style={{ padding: '60px 0' }}>
        <span style={{ fontSize: '1.5rem' }}>📈</span>
        <p style={{ marginTop: 8 }}>Loading positions…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="terminal-dashboard">
      <div className="empty-center-box" style={{ padding: '60px 0', color: '#f43f5e' }}>
        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
        <p style={{ marginTop: 8 }}>{error}</p>
      </div>
    </div>
  );

  const totalPnL = positions.reduce((s, p) => s + ((p.price - p.avg) * p.qty || 0), 0);

  return (
    <div className="terminal-dashboard">
      {/* Header */}
      <div className="context-ribbon">
        <div className="ribbon-title-box">
          <h1 className="terminal-page-title">Open Positions</h1>
          <p className="terminal-subtitle">Intraday and short-term paper positions — MIS / CNC product types.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={`font-mono font-semibold ${totalPnL >= 0 ? 'text-emerald' : 'text-rose'}`} style={{ fontSize: '1rem' }}>
            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
          </span>
          <span className="text-muted" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>TOTAL MTM P&L</span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="terminal-card">
          <div className="empty-center-box text-muted" style={{ padding: '50px 0' }}>
            <span style={{ fontSize: '2rem' }}>📈</span>
            <p style={{ marginTop: 10, fontWeight: 600 }}>No open positions</p>
            <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Place an MIS order from the Watchlist to see intraday positions here.</p>
          </div>
        </div>
      ) : (
        <div className="terminal-card">
          <div className="table-responsive">
            <table className="terminal-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Instrument</th>
                  <th>Qty</th>
                  <th>Avg Cost</th>
                  <th>LTP</th>
                  <th>P&L</th>
                  <th>Day Chg.</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((stock, index) => {
                  const curValue = stock.price * stock.qty;
                  const investedVal = stock.avg * stock.qty;
                  const pnl = curValue - investedVal;
                  const isProfit = pnl >= 0;
                  return (
                    <tr key={index}>
                      <td><span style={{ background: '#162032', border: '1px solid #1e293b', borderRadius: 4, padding: '2px 7px', fontSize: '0.7rem', fontFamily: 'monospace', color: '#94a3b8' }}>{stock.product || 'CNC'}</span></td>
                      <td className="font-mono font-semibold text-primary-num">{stock.name}</td>
                      <td className="font-mono text-right">{stock.qty}</td>
                      <td className="font-mono text-right">₹{Number(stock.avg || 0).toFixed(2)}</td>
                      <td className="font-mono text-right">₹{Number(stock.price || 0).toFixed(2)}</td>
                      <td className={`font-mono font-semibold text-right ${isProfit ? 'text-emerald' : 'text-rose'}`}>
                        {isProfit ? '+' : ''}₹{pnl.toFixed(2)}
                      </td>
                      <td className={`font-mono text-right ${stock.isLoss ? 'text-rose' : 'text-emerald'}`}>
                        {stock.day || '0.00%'}
                      </td>
                      <td>
                        <button
                          className="badge-side badge-sell"
                          onClick={() => generalContext.openSellWindow(stock.name)}
                          style={{ cursor: 'pointer', border: 'none', fontSize: '0.72rem', padding: '3px 10px' }}
                        >
                          SELL
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Positions;