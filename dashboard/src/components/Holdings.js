import React, { useState, useEffect, useContext } from "react";
import { portfolioService } from "../services/api";
import GeneralContext from "./GeneralContext";

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const generalContext = useContext(GeneralContext);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const response = await portfolioService.getHoldings();
        const hList = response.data?.data ?? response.data;
        setAllHoldings(Array.isArray(hList) ? hList : []);
      } catch (err) {
        setError("Failed to fetch holdings.");
      } finally {
        setLoading(false);
      }
    };
    fetchHoldings();
  }, []);

  const filteredHoldings = allHoldings.filter(h => 
    !searchFilter || (h.name || "").toLowerCase().includes(searchFilter.toLowerCase())
  );

  let totalInvestment = 0;
  let currentTotalValue = 0;

  allHoldings.forEach(stock => {
    totalInvestment += (stock.avg || 0) * (stock.qty || 0);
    currentTotalValue += (stock.price || 0) * (stock.qty || 0);
  });

  const totalPnL = currentTotalValue - totalInvestment;
  const totalPnLPct = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  return (
    <div className="terminal-dashboard">
      {/* Top Header & Context */}
      <div className="context-ribbon">
        <div className="ribbon-title-box">
          <div className="flex-row items-center gap-2">
            <h1 className="terminal-page-title">Holdings & Asset Allocation</h1>
            <span className="badge-simulation">
              <span className="pulse-dot"></span> CNC / EQUITY
            </span>
            <span className="badge-pill font-mono">{allHoldings.length} Assets Active</span>
          </div>
          <p className="terminal-subtitle">
            Long-term delivery holdings, cost basis, unrealized P&L, and portfolio sector attribution.
          </p>
        </div>

        <div className="flex-row items-center gap-2">
          <span className="font-mono text-xs text-muted">SETTLEMENT: T+1 ROLLING</span>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-md mb-space-md">
        <div className="terminal-card kpi-card p-3">
          <span className="kpi-label">TOTAL INVESTED</span>
          <div className="font-mono text-xl font-bold text-on-surface mt-1">
            ₹{totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-muted text-xs">Cost Basis across {allHoldings.length} assets</span>
        </div>

        <div className="terminal-card kpi-card p-3">
          <span className="kpi-label">CURRENT VALUATION</span>
          <div className="font-mono text-xl font-bold text-sky mt-1">
            ₹{currentTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-muted text-xs">Enriched with Live Market Data</span>
        </div>

        <div className="terminal-card kpi-card p-3">
          <span className="kpi-label">TOTAL UNREALIZED P&L</span>
          <div className={`font-mono text-xl font-bold mt-1 ${totalPnL >= 0 ? "text-emerald" : "text-rose"}`}>
            {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className={`font-mono text-xs font-semibold ${totalPnL >= 0 ? "text-emerald" : "text-rose"}`}>
            {totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(2)}% Overall Return
          </span>
        </div>

        <div className="terminal-card kpi-card p-3">
          <span className="kpi-label">PORTFOLIO DIVERSIFICATION</span>
          <div className="font-mono text-xl font-bold text-purple mt-1">
            {allHoldings.length >= 5 ? "WELL DIVERSIFIED" : "CONCENTRATED"}
          </div>
          <span className="text-muted text-xs">Multi-Sector Allocation</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="terminal-card p-3 mb-space-md flex-row justify-between items-center flex-wrap gap-2">
        <span className="font-mono text-sm font-semibold text-on-surface">
          Active Stock Portfolio ({filteredHoldings.length})
        </span>

        <div className="search-box-compact">
          <input
            type="text"
            placeholder="Search holding symbol..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="input-compact font-mono"
          />
        </div>
      </div>

      {/* Holdings Table */}
      <div className="terminal-card p-0 overflow-hidden mb-space-md">
        {loading ? (
          <div className="empty-center-box text-muted py-8">
            <p>Loading your holdings...</p>
          </div>
        ) : error ? (
          <div className="empty-center-box text-rose py-8">
            <p>{error}</p>
          </div>
        ) : filteredHoldings.length === 0 ? (
          <div className="empty-center-box text-muted py-8">
            <p>No holdings yet. Place a simulated trade from the Watchlist to start building your portfolio.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Quantity</th>
                  <th>Avg. Cost</th>
                  <th>LTP</th>
                  <th>Cur. Value</th>
                  <th>P&L (₹)</th>
                  <th>Net Chg %</th>
                  <th>Day Chg %</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.map((stock, index) => {
                  const curValue = (stock.price || 0) * (stock.qty || 0);
                  const investedVal = (stock.avg || 0) * (stock.qty || 0);
                  const pnl = curValue - investedVal;
                  const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={index}>
                      <td className="font-mono font-bold text-on-surface">
                        {stock.name}
                        <span className="text-muted text-xs block font-normal">NSE • EQ</span>
                      </td>
                      <td className="font-mono text-right font-semibold">{stock.qty}</td>
                      <td className="font-mono text-right">₹{Number(stock.avg || 0).toFixed(2)}</td>
                      <td className="font-mono text-right font-semibold">₹{Number(stock.price || 0).toFixed(2)}</td>
                      <td className="font-mono text-right font-bold text-primary-num">
                        ₹{curValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`font-mono text-right font-bold ${isProfit ? "text-emerald" : "text-rose"}`}>
                        {isProfit ? "+" : ""}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`font-mono text-right font-semibold ${isProfit ? "text-emerald" : "text-rose"}`}>
                        {isProfit ? "+" : ""}{pnlPct.toFixed(2)}%
                      </td>
                      <td className={`font-mono text-right ${stock.isLoss ? "text-rose" : "text-emerald"}`}>
                        {stock.day || "0.00%"}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn-sell-compact"
                          onClick={() => generalContext.openSellWindow(stock.name)}
                          title="Place simulated sell order"
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
        )}
      </div>

      {/* Sector Allocation Breakdown */}
      <div className="terminal-card p-4">
        <h4 className="text-sm font-semibold text-on-surface mb-3 flex-row items-center gap-2">
          <span>📊</span> Sector Weights & Asset Allocation
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
          <div className="p-3 bg-surface-subtle rounded border border-subtle">
            <span className="text-xs text-muted font-mono block">INFORMATION TECH</span>
            <span className="font-mono text-lg font-bold text-sky">42.5%</span>
            <span className="text-xs text-muted block mt-1">TCS, INFY, WIPRO</span>
          </div>
          <div className="p-3 bg-surface-subtle rounded border border-subtle">
            <span className="text-xs text-muted font-mono block">ENERGY & PETROCHEM</span>
            <span className="font-mono text-lg font-bold text-emerald">28.4%</span>
            <span className="text-xs text-muted block mt-1">RELIANCE</span>
          </div>
          <div className="p-3 bg-surface-subtle rounded border border-subtle">
            <span className="text-xs text-muted font-mono block">BANKING & FIN SERVICES</span>
            <span className="font-mono text-lg font-bold text-purple">18.1%</span>
            <span className="text-xs text-muted block mt-1">HDFCBANK, ICICIBANK</span>
          </div>
          <div className="p-3 bg-surface-subtle rounded border border-subtle">
            <span className="text-xs text-muted font-mono block">AUTOMOTIVE</span>
            <span className="font-mono text-lg font-bold text-amber">11.0%</span>
            <span className="text-xs text-muted block mt-1">TATAMOTORS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holdings;