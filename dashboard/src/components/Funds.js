import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { accountService } from "../services/api";

const Funds = () => {
  const [balance, setBalance] = useState(100000);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await accountService.getBalance();
      if (response.data?.data?.virtualBalance !== undefined) {
        setBalance(response.data.data.virtualBalance);
      }
    } catch (err) {
      console.error("Failed to fetch balance", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleSimulateTopUp = (amount) => {
    const newBal = balance + amount;
    setBalance(newBal);
    toast.success(`Simulated Capital credited: +₹${amount.toLocaleString('en-IN')}`);
  };

  const handleResetCapital = () => {
    setResetting(true);
    setTimeout(() => {
      setBalance(100000);
      setResetting(false);
      toast.success("Virtual capital reset to initial baseline ₹1,00,000.00");
    }, 400);
  };

  // Derived margin metrics
  const availableCash = balance;
  const deliveryMargin = 18450.00;
  const intradayMargin = 6200.00;
  const spanMargin = 0.00;
  const exposureMargin = 0.00;
  const totalMarginUsed = deliveryMargin + intradayMargin;
  const marginUtilizationPct = Math.min(100, Math.round((totalMarginUsed / (balance + totalMarginUsed)) * 100));

  return (
    <div className="terminal-dashboard">
      {/* Top Header & Context Ribbon */}
      <div className="context-ribbon">
        <div className="ribbon-title-box">
          <div className="flex-row items-center gap-2">
            <h1 className="terminal-page-title">Capital Allocation & Funds Ledger</h1>
            <span className="badge-simulation">
              <span className="pulse-dot"></span> SIMULATED PAPER CAPITAL
            </span>
          </div>
          <p className="terminal-subtitle">
            Manage simulated purchasing power, intraday margin limits, collateral, and virtual capital allocations.
          </p>
        </div>

        <div className="flex-row items-center gap-2">
          <button 
            className="btn-terminal-secondary"
            onClick={handleResetCapital}
            disabled={resetting}
          >
            {resetting ? "Resetting..." : "↺ Reset to ₹1,00,000"}
          </button>
          <button 
            className="btn-terminal-primary"
            onClick={() => handleSimulateTopUp(50000)}
          >
            + Add ₹50,000 SIM
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card highlight-card">
          <div className="kpi-header">
            <span className="kpi-title">AVAILABLE PURCHASING POWER</span>
            <span className="kpi-icon">💰</span>
          </div>
          <div className="kpi-metric">
            {loading ? "..." : `₹${availableCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
          <div className="kpi-delta text-emerald">
            ● 100% Unencumbered Cash
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">TOTAL MARGIN COMMITTED</span>
            <span className="kpi-icon">🔒</span>
          </div>
          <div className="kpi-metric">
            ₹{totalMarginUsed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-delta text-secondary">
            Delivery: ₹{deliveryMargin.toLocaleString('en-IN')} | Intraday: ₹{intradayMargin.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">UTILIZATION RATIO</span>
            <span className="kpi-icon">📊</span>
          </div>
          <div className="kpi-metric">
            {marginUtilizationPct}%
          </div>
          <div className="kpi-delta text-emerald">
            Healthy (&lt; 50% limit)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">LEVERAGE MULTIPLIER</span>
            <span className="kpi-icon">⚡</span>
          </div>
          <div className="kpi-metric font-mono">
            5.0x MIS
          </div>
          <div className="kpi-delta text-secondary">
            CNC Delivery: 1.0x Full Cash
          </div>
        </div>
      </div>

      {/* Main Grid: Equity Breakdown & Risk Controls */}
      <div className="dashboard-grid-2col">
        {/* Equity Breakdown Table */}
        <div className="terminal-card">
          <div className="terminal-card-header">
            <div className="terminal-card-title">
              <span>Equity & Margin Ledger Breakdown</span>
              <span className="badge-pill font-mono">LIVE ACCOUNT</span>
            </div>
            <span className="text-xs text-muted">SEGMENT: NSE_EQ / BSE_EQ</span>
          </div>

          <div className="terminal-table-container">
            <table className="terminal-table">
              <tbody>
                <tr>
                  <td className="text-secondary font-medium">Available Cash (Free Capital)</td>
                  <td className="text-right font-mono font-bold text-emerald">
                    ₹{availableCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="text-secondary font-medium">Opening Balance (Today 09:15 IST)</td>
                  <td className="text-right font-mono text-secondary">₹1,00,000.00</td>
                </tr>
                <tr>
                  <td className="text-secondary font-medium">Delivery Margin (CNC Blocked)</td>
                  <td className="text-right font-mono text-secondary">₹{deliveryMargin.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="text-secondary font-medium">Intraday Margin (MIS Blocked)</td>
                  <td className="text-right font-mono text-secondary">₹{intradayMargin.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="text-secondary font-medium">SPAN Margin (F&O Contracts)</td>
                  <td className="text-right font-mono text-muted">₹{spanMargin.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="text-secondary font-medium">Exposure Margin</td>
                  <td className="text-right font-mono text-muted">₹{exposureMargin.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="text-secondary font-medium">Options Premium Receivable</td>
                  <td className="text-right font-mono text-muted">₹0.00</td>
                </tr>
                <tr className="border-t">
                  <td className="font-bold text-primary">Total Account Net Worth</td>
                  <td className="text-right font-mono font-bold text-primary">
                    ₹{(availableCash + totalMarginUsed).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Governance & Quick Top-Up */}
        <div className="flex flex-col gap-4">
          <div className="terminal-card">
            <div className="terminal-card-header">
              <div className="terminal-card-title">
                <span>Simulation Capital Controls</span>
              </div>
              <span className="badge-tag">SANDBOX ENGINE</span>
            </div>

            <p className="text-sm text-secondary mb-3">
              Need more virtual purchasing power to test large positions or algorithmic stress scenarios? Top up simulated funds instantly:
            </p>

            <div className="flex gap-2 flex-wrap mb-4">
              <button 
                className="btn-terminal-secondary text-xs" 
                onClick={() => handleSimulateTopUp(25000)}
              >
                + ₹25,000
              </button>
              <button 
                className="btn-terminal-secondary text-xs" 
                onClick={() => handleSimulateTopUp(50000)}
              >
                + ₹50,000
              </button>
              <button 
                className="btn-terminal-secondary text-xs" 
                onClick={() => handleSimulateTopUp(100000)}
              >
                + ₹1,00,000
              </button>
              <button 
                className="btn-terminal-secondary text-xs" 
                onClick={() => handleSimulateTopUp(500000)}
              >
                + ₹5,00,000
              </button>
            </div>

            <div className="allocation-item">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary">Margin Utilization</span>
                <span className="font-mono">{marginUtilizationPct}% of capacity</span>
              </div>
              <div className="allocation-bar-bg">
                <div 
                  className="allocation-bar-fill" 
                  style={{ width: `${marginUtilizationPct}%`, backgroundColor: marginUtilizationPct > 80 ? '#f43f5e' : '#0284c7' }}
                ></div>
              </div>
            </div>
          </div>

          <div className="terminal-card">
            <div className="terminal-card-header">
              <div className="terminal-card-title">
                <span>Risk & Execution Rules</span>
              </div>
              <span className="text-xs text-muted">GUARDRAILS</span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-surface">
                <span className="text-secondary">Max Leverage (MIS)</span>
                <span className="font-mono font-bold text-primary">5.0x Auto-squared 15:15 IST</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-surface">
                <span className="text-secondary">Delivery Settlement</span>
                <span className="font-mono font-bold text-primary">T+1 Rolling SEBI Mandate</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-surface">
                <span className="text-secondary">Max Risk Per Trade</span>
                <span className="font-mono font-bold text-emerald">2.0% Account Equity</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-surface">
                <span className="text-secondary">Daily Circuit Drawdown</span>
                <span className="font-mono font-bold text-rose">-5.0% Auto Killswitch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Funds;
