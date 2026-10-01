import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import Sidebar from "./Menu";
import { accountService, demoService } from "../services/api";
import toast from "react-hot-toast";

const Home = () => {
  const [balance, setBalance] = useState(150000);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await accountService.getBalance();
        if (res.data?.data?.virtualBalance) {
          setBalance(res.data.data.virtualBalance);
        }
      } catch (err) {
        // fallback to default
      }
    };
    fetchBalance();
  }, []);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      await demoService.seedDemo();
      toast.success("✅ Demo portfolio, positions, orders & watchlist seeded successfully!");
      // Short delay before reload so toast is visible
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      toast.error("Failed to seed demo data. Please check connection.");
      setIsSeeding(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        {/* Top Institutional Market & Engine Strip */}
        <header className="index-strip" role="banner" aria-label="Live Market Indices and Simulation Bar">
          <div className="flex items-center gap-4">
            <div className="index-chip">
              <span className="index-chip-name">NIFTY 50</span>
              <span className="index-chip-val text-emerald font-mono">24,535.80</span>
              <span className="index-chip-pct text-emerald font-mono font-semibold">+0.68%</span>
            </div>

            <div className="index-chip">
              <span className="index-chip-name">SENSEX</span>
              <span className="index-chip-val text-emerald font-mono">80,436.84</span>
              <span className="index-chip-pct text-emerald font-mono font-semibold">+0.54%</span>
            </div>

            <div className="index-chip">
              <span className="index-chip-name">INDIA VIX</span>
              <span className="index-chip-val text-sky font-mono">13.12</span>
              <span className="index-chip-pct text-sky font-mono font-semibold">-2.45%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="btn-seed-banner"
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              title="Click to populate complete realistic Indian stock market portfolio, orders, positions & watchlist"
              aria-label="Seed Demo Data"
            >
              {isSeeding ? "⚡ Seeding Portfolio..." : "⚡ Seed Demo Data"}
            </button>

            <div className="engine-status-pill">
              <span className="pulse-dot"></span>
              <span className="font-mono text-xs">ATLAS LIVE FEED</span>
            </div>

            <div className="capital-indicator-pill">
              <span className="text-muted text-xs">SIM CAPITAL:</span>
              <span className="font-mono font-bold text-emerald text-xs">
                ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <span className="badge-simulation-pill">
              PAPER TRADING ACTIVE
            </span>
          </div>
        </header>

        <Dashboard />
      </div>
    </div>
  );
};

export default Home;
