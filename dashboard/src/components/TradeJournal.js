import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { journalService } from "../services/api";

const TradeJournal = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await journalService.getJournals();
      setJournals(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h3 className="title">My Trade Journal</h3>
      <div style={{ marginBottom: "20px", display: "flex", gap: "20px", background: "#f8f9fa", padding: "15px", borderRadius: "8px" }}>
        <div>
          <span style={{ fontSize: "24px", fontWeight: "bold", color: "#387ed1" }}>{journals.length}</span>
          <p style={{ margin: 0, color: "#666" }}>Total Journaled Trades</p>
        </div>
        <div>
          <span style={{ fontSize: "24px", fontWeight: "bold", color: "#4caf50" }}>
            {journals.filter(j => j.targetPrice).length}
          </span>
          <p style={{ margin: 0, color: "#666" }}>Trades With Target</p>
        </div>
        <div>
          <span style={{ fontSize: "24px", fontWeight: "bold", color: "#e74c3c" }}>
            {journals.filter(j => j.riskPrice).length}
          </span>
          <p style={{ margin: 0, color: "#666" }}>Trades With Risk</p>
        </div>
        <div>
          <span style={{ fontSize: "24px", fontWeight: "bold", color: "#f39c12" }}>
            {journals.length > 0 ? (journals.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / journals.length).toFixed(1) : 0} / 5
          </span>
          <p style={{ margin: 0, color: "#666" }}>Avg. Confidence</p>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Strategy</th>
            <th>Entry</th>
            <th>Target</th>
            <th>Risk</th>
            <th>Confidence</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {journals.map((journal) => (
            <tr key={journal._id}>
              <td>{new Date(journal.createdAt).toLocaleDateString()}</td>
              <td style={{ fontWeight: 'bold' }}>{journal.symbol}</td>
              <td style={{ color: journal.side === "BUY" ? "#387ed1" : "#e74c3c", fontWeight: 'bold' }}>{journal.side}</td>
              <td>{journal.strategy}</td>
              <td>₹{journal.entryPrice.toFixed(2)}</td>
              <td>{journal.targetPrice ? `₹${journal.targetPrice.toFixed(2)}` : '-'}</td>
              <td>{journal.riskPrice ? `₹${journal.riskPrice.toFixed(2)}` : '-'}</td>
              <td>{journal.confidence ? `${journal.confidence}/5` : '-'}</td>
              <td>
                <Link to={`/replay/${journal._id}`} style={{ textDecoration: 'none', color: '#387ed1', fontWeight: 'bold' }}>
                  View Replay
                </Link>
              </td>
            </tr>
          ))}
          {journals.length === 0 && (
            <tr>
              <td colSpan="9" style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                No journal entries yet. Add a thesis when placing an order!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TradeJournal;
