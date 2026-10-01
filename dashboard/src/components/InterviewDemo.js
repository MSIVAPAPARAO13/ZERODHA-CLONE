import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const InterviewDemo = () => {
  const [demoData, setDemoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemo = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get("http://localhost:3002/api/v1/demo", { headers });
        if (res.data?.success) {
          setDemoData(res.data.data);
        }
      } catch (err) {
        // Fallback local configuration if offline
        setDemoData({
          product: "TRADEFLOW",
          version: "2.0-PRODUCTION",
          mode: "PAPER_TRADING_SIMULATION",
          disclaimer: "SIMULATION_MODE: Educational research platform only. Zero real-money brokerage integration.",
          capabilities: [
            { id: "market", title: "Market Intelligence", frontendUrl: "/insights", description: "Real-time volatility and regime monitoring", status: "LIVE" },
            { id: "copilot", title: "Research Copilot & Agent", frontendUrl: "/research", description: "Multi-tool evidence synthesis and gap detection", status: "LIVE" },
            { id: "portfolio", title: "Portfolio Intelligence", frontendUrl: "/ai-analyst", description: "Herfindahl concentration & exposure attribution", status: "LIVE" },
            { id: "scenarios", title: "Scenario & Stress Studio", frontendUrl: "/scenarios", description: "Deterministic sector shock and macro stress replay", status: "LIVE" },
            { id: "strategies", title: "Strategy Lab", frontendUrl: "/strategies", description: "Backtesting & walk-forward parameter robustness", status: "LIVE" },
            { id: "decisions", title: "Decision Journal", frontendUrl: "/journal", description: "Falsifiable theses and trade review audits", status: "LIVE" },
            { id: "learning", title: "Learning Coach", frontendUrl: "/behavior-insights", description: "Behavioral bias detection & discipline tracking", status: "LIVE" },
            { id: "automation", title: "Personal Automation", frontendUrl: "/events", description: "Scheduled daily briefs & research digests", status: "LIVE" }
          ],
          flowSteps: [
            "1. Authentication & JWT user isolation",
            "2. What Changed Today feed review",
            "3. Market Event surveillance",
            "4. Research Copilot evidence collection",
            "5. Portfolio concentration analysis",
            "6. Sector stress testing scenario",
            "7. Strategy Lab quantitative backtest",
            "8. Walk-forward robustness check",
            "9. Decision thesis documentation",
            "10. Idempotent paper execution simulation",
            "11. Trading journal review",
            "12. Behavioral coaching insights",
            "13. Research automation scheduling"
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDemo();
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", color: "#666" }}>Loading TradeFlow Interview Demo...</div>;
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "#fff",
        padding: "24px 32px",
        borderRadius: "12px",
        marginBottom: "30px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: "700" }}>
              TradeFlow — End-to-End Interview Demo
            </h1>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "15px" }}>
              The unified institutional research, execution simulation, and behavioral discipline system.
            </p>
          </div>
          <span style={{
            background: "#22c55e",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "0.5px"
          }}>
            {demoData?.version || "PRODUCTION READY"}
          </span>
        </div>

        <div style={{
          marginTop: "16px",
          padding: "10px 14px",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          color: "#fca5a5",
          fontSize: "13px"
        }}>
          ⚠️ <strong>Simulation Mode</strong>: TradeFlow operates exclusively on simulated virtual balances and paper-trading accounts. Real-money brokerage transactions are not supported.
        </div>
      </div>

      {/* Capabilities Grid */}
      <h2 style={{ fontSize: "20px", color: "#334155", marginBottom: "16px", fontWeight: "600" }}>
        Interactive Product Modules
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "20px",
        marginBottom: "40px"
      }}>
        {demoData?.capabilities?.map((cap) => (
          <div
            key={cap.id}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>{cap.title}</h3>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "#16a34a", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px" }}>
                  {cap.status}
                </span>
              </div>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
                {cap.description}
              </p>
            </div>
            <Link
              to={cap.frontendUrl}
              style={{
                display: "block",
                textAlign: "center",
                padding: "8px 12px",
                background: "#0284c7",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "500"
              }}
            >
              Open Live Module →
            </Link>
          </div>
        ))}
      </div>

      {/* Complete E2E Flow */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px" }}>
        <h2 style={{ fontSize: "18px", color: "#334155", marginBottom: "12px", fontWeight: "600" }}>
          End-to-End Trader Lifecycle Flow
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "10px" }}>
          {demoData?.flowSteps?.map((step, idx) => (
            <div
              key={idx}
              style={{
                padding: "10px 14px",
                background: "#f8fafc",
                border: "1px solid #f1f5f9",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#475569"
              }}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InterviewDemo;
