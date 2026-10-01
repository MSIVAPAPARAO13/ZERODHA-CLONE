import React, { useState, useEffect } from "react";
import { orderService } from "../services/api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("ALL");
  const [searchSymbol, setSearchSymbol] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders();
      const list = res.data?.data || res.data || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesMode = filterMode === "ALL" || o.mode === filterMode;
    const matchesSym = !searchSymbol || (o.name || o.symbol || "").toLowerCase().includes(searchSymbol.toLowerCase());
    return matchesMode && matchesSym;
  });

  const totalVolume = orders.reduce((sum, o) => sum + Number(o.qty || 0), 0);
  const totalTurnover = orders.reduce((sum, o) => sum + (Number(o.price || 0) * Number(o.qty || 0)), 0);

  const exportCSV = () => {
    if (!orders.length) return;
    const headers = "OrderID,Timestamp,Symbol,Mode,Quantity,Price,TotalAmount,Status\n";
    const rows = orders.map(o => 
      `"${o._id}","${o.createdAt || ''}","${o.name || o.symbol}","${o.mode}","${o.qty}","${o.price}","${(o.price * o.qty).toFixed(2)}","${o.status || 'FILLED'}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tradeflow_orders_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="terminal-dashboard">
      {/* Top Header & Context */}
      <div className="context-ribbon">
        <div className="ribbon-title-box">
          <div className="flex-row items-center gap-2">
            <h1 className="terminal-page-title">Orders & Execution Ledger</h1>
            <span className="badge-simulation">
              <span className="pulse-dot"></span> PAPER TRADING SIMULATION
            </span>
          </div>
          <p className="terminal-subtitle">
            Immutable audit log of simulated paper orders, execution timestamps, and idempotency guarantees.
          </p>
        </div>

        <div className="flex-row items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary-compact" disabled={!orders.length}>
            📥 Export CSV
          </button>
          <button onClick={fetchOrders} className="btn-secondary-compact">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md mb-space-md">
        <div className="terminal-card kpi-card p-3">
          <span className="kpi-label">TOTAL PAPER ORDERS</span>
          <div className="font-mono text-xl font-bold text-on-surface mt-1">{orders.length} Executions</div>
          <span className="text-muted text-xs">ACID Multi-Document Transacted</span>
        </div>
        <div className="terminal-card kpi-card p-3">
          <span className="kpi-label">TOTAL SHARE VOLUME</span>
          <div className="font-mono text-xl font-bold text-sky mt-1">{totalVolume.toLocaleString()} Units</div>
          <span className="text-muted text-xs">Simulated Equity Trades</span>
        </div>
        <div className="terminal-card kpi-card p-3">
          <span className="kpi-label">SIMULATED TURNOVER</span>
          <div className="font-mono text-xl font-bold text-emerald mt-1">
            ₹{totalTurnover.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-muted text-xs">Gross Rupee Value</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="terminal-card p-3 mb-space-md flex-row justify-between items-center flex-wrap gap-2">
        <div className="flex-row items-center gap-2">
          <button
            onClick={() => setFilterMode("ALL")}
            className={`filter-pill ${filterMode === "ALL" ? "filter-pill-active" : ""}`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilterMode("BUY")}
            className={`filter-pill ${filterMode === "BUY" ? "filter-pill-active text-emerald" : ""}`}
          >
            BUY ({orders.filter(o => o.mode === "BUY").length})
          </button>
          <button
            onClick={() => setFilterMode("SELL")}
            className={`filter-pill ${filterMode === "SELL" ? "filter-pill-active text-rose" : ""}`}
          >
            SELL ({orders.filter(o => o.mode === "SELL").length})
          </button>
        </div>

        <div className="search-box-compact">
          <input
            type="text"
            placeholder="Filter by symbol..."
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            className="input-compact font-mono"
          />
        </div>
      </div>

      {/* Main Order Table */}
      <div className="terminal-card p-0 overflow-hidden">
        {loading ? (
          <div className="empty-center-box text-muted py-8">
            <p>Loading execution ledger...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-center-box text-muted py-8">
            <p>No orders found matching the selected filter criteria.</p>
            <p className="text-xs text-muted mt-1">Use the Watchlist or "+ PAPER ORDER" to place a new trade.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>Order Reference / ID</th>
                  <th>Timestamp</th>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th>Quantity</th>
                  <th>Executed Price</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord, idx) => {
                  const amt = Number(ord.price || 0) * Number(ord.qty || 1);
                  return (
                    <tr key={ord._id || idx}>
                      <td className="font-mono text-muted text-xs">
                        <span title={ord._id}>
                          {ord._id ? `#${ord._id.substring(ord._id.length - 8).toUpperCase()}` : `#ORD-${idx + 1}`}
                        </span>
                      </td>
                      <td className="font-mono text-muted text-xs">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString() : 'Recent'}
                      </td>
                      <td className="font-mono font-bold text-on-surface">
                        {ord.name || ord.symbol}
                      </td>
                      <td>
                        <span className={`badge-side ${ord.mode === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                          {ord.mode || 'BUY'}
                        </span>
                      </td>
                      <td className="font-mono text-right font-semibold">{ord.qty}</td>
                      <td className="font-mono text-right">₹{Number(ord.price || 0).toFixed(2)}</td>
                      <td className="font-mono text-right font-bold text-primary-num">
                        ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className="badge-status-filled">
                          <span className="dot-green"></span> FILLED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;