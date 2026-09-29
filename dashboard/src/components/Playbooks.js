import React, { useState, useEffect } from "react";
import { playbookService, aiService } from "../services/api";

const Playbooks = () => {
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiReview, setAiReview] = useState(null);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newPbName, setNewPbName] = useState("");
  const [newPbDesc, setNewPbDesc] = useState("");

  useEffect(() => {
    fetchPlaybooks();
  }, []);

  const fetchPlaybooks = async () => {
    try {
      const res = await playbookService.getPlaybooks();
      setPlaybooks(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load playbooks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newPbName) return;
    try {
      await playbookService.createPlaybook({ name: newPbName, description: newPbDesc });
      setShowCreate(false);
      setNewPbName("");
      setNewPbDesc("");
      fetchPlaybooks();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Error creating playbook");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this playbook?")) {
      try {
        await playbookService.deletePlaybook(id);
        fetchPlaybooks();
      } catch (err) {
        alert(err.response?.data?.error?.message || "Error deleting playbook");
      }
    }
  };

  const handleAiReview = async () => {
    try {
      const res = await aiService.playbookReview();
      setAiReview(res.data.data.analysis);
    } catch(err) {
      alert("Failed to load AI review.");
    }
  };

  if (loading) return <div>Loading Playbooks...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#444" }}>MY PLAYBOOKS</h2>
        <button onClick={() => setShowCreate(!showCreate)} style={{ background: "#387ed1", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          + New Playbook
        </button>
      </div>

      {showCreate && (
        <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", marginTop: "20px", border: "1px solid #e0e0e0" }}>
          <h3>Create Playbook</h3>
          <input type="text" placeholder="Playbook Name (e.g. Momentum Setup)" value={newPbName} onChange={(e) => setNewPbName(e.target.value)} style={{ padding: "8px", width: "100%", marginBottom: "10px" }} />
          <input type="text" placeholder="Description" value={newPbDesc} onChange={(e) => setNewPbDesc(e.target.value)} style={{ padding: "8px", width: "100%", marginBottom: "10px" }} />
          <button onClick={handleCreate} style={{ background: "#4caf50", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "10px" }}>Save</button>
          <button onClick={() => setShowCreate(false)} style={{ background: "#ccc", color: "black", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
        {playbooks.map(pb => (
          <div key={pb.id} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
               <h3 style={{ margin: "0 0 10px 0", color: "#387ed1" }}>{pb.name}</h3>
               <button onClick={() => handleDelete(pb.id)} style={{ background: "transparent", border: "none", color: "red", cursor: "pointer" }}>Delete</button>
            </div>
            <p style={{ margin: "0 0 10px 0", color: "#666" }}>{pb.rulesCount} rules</p>
            <p style={{ margin: "0 0 10px 0", color: "#666" }}>{pb.tradesCount} trades using this</p>
            <div style={{ background: "#f5f5f5", padding: "10px", borderRadius: "4px" }}>
               <strong>Compliance: {pb.complianceRate}%</strong>
            </div>
            {/* Navigating to PlaybookDetail would go here. For MVP, we will manage rules via Edge Insights or expand this card. */}
          </div>
        ))}
        {playbooks.length === 0 && <p style={{ color: "#999" }}>No playbooks created yet.</p>}
      </div>

      <div style={{ marginTop: "40px" }}>
         <button onClick={handleAiReview} style={{ background: "#673ab7", color: "white", border: "none", padding: "10px 20px", borderRadius: "4px", cursor: "pointer" }}>
            Review My Discipline (AI)
         </button>
         
         {aiReview && (
            <div style={{ background: "#f5f0ff", border: "1px solid #d4c4fb", borderRadius: "8px", padding: "20px", marginTop: "20px" }}>
               <h4 style={{ color: "#673ab7", marginTop: 0 }}>AI Playbook Review</h4>
               <p>{aiReview.summary}</p>
               {aiReview.frequentlyMissedRules?.length > 0 && (
                  <div>
                    <strong>Frequently Missed Rules (Focus Areas):</strong>
                    <ul>
                      {aiReview.frequentlyMissedRules.map((r,i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
               )}
            </div>
         )}
      </div>

    </div>
  );
};

export default Playbooks;
