import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";

import { orderService, accountService, playbookService } from "../services/api";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";

const PlaybookChecklist = ({ playbookId, checklistState, setChecklistState }) => {
  const [rules, setRules] = useState([]);
  useEffect(() => {
    if (!playbookId) return;
    playbookService.getPlaybook(playbookId).then(res => setRules(res.data?.data?.rules || [])).catch(()=>{});
  }, [playbookId]);
  
  if (!rules.length) return null;
  return (
    <div style={{ marginTop: '10px', fontSize: '0.85em', background: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
       <strong style={{ display: 'block', marginBottom: '8px' }}>Pre-Trade Checklist</strong>
       {rules.map((r, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '5px' }}>
            <input type="checkbox" checked={!!checklistState[r.text]} onChange={(e) => setChecklistState({...checklistState, [r.text]: e.target.checked})} />
            <span style={{ color: r.required ? '#444' : '#888' }}>{r.text} {r.required && '*'}</span>
          </label>
       ))}
    </div>
  );
};

const BuyActionWindow = ({ uid, actionType = "BUY" }) => {
  const { closeBuyWindow } = useContext(GeneralContext);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState(null);
  
  const [playbooks, setPlaybooks] = useState([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState("");
  const [checklistState, setChecklistState] = useState({});

  const [showJournal, setShowJournal] = useState(false);
  const [journal, setJournal] = useState({
    strategy: "OTHER",
    reason: "OTHER",
    confidence: 3,
    targetPrice: "",
    riskPrice: "",
    expectedHoldingPeriod: "UNSPECIFIED",
    thesis: ""
  });

  useEffect(() => {
    if (actionType === 'BUY') {
      accountService.getBalance().then(res => setBalance(res.data?.data?.virtualBalance || 100000)).catch(() => {});
    }
    playbookService.getPlaybooks().then(res => setPlaybooks(res.data?.data || [])).catch(() => {});
  }, [actionType]);

  const handleOrderClick = async () => {
    setIsSubmitting(true);
    try {
      const orderPayload = {
        name: uid,
        qty: Number(stockQuantity),
        price: Number(stockPrice),
        mode: actionType,
      };

      if (showJournal || selectedPlaybookId) {
        orderPayload.journal = {
          ...journal,
          targetPrice: journal.targetPrice ? Number(journal.targetPrice) : undefined,
          riskPrice: journal.riskPrice ? Number(journal.riskPrice) : undefined,
          playbook: selectedPlaybookId || undefined,
          checklist: selectedPlaybookId ? Object.keys(checklistState).map(k => ({ ruleText: k, followed: checklistState[k] })) : []
        };
      }

      await orderService.placeOrder(orderPayload);
      toast.success(`${actionType} order placed successfully for ${uid}`);
      closeBuyWindow();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message || "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    closeBuyWindow();
  };


  return (
    <div className="container" id="buy-window" draggable="true" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="qty"
              min="1"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
              disabled={isSubmitting}
            />
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              min="0.05"
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
              disabled={isSubmitting}
            />
          </fieldset>
        </div>
      </div>

      <div style={{ margin: '15px 20px', padding: '10px', borderTop: '1px solid #eee' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9em', color: '#444' }}>
          <input 
            type="checkbox" 
            checked={showJournal} 
            onChange={(e) => setShowJournal(e.target.checked)}
          />
          Add Trade Thesis (Optional)
        </label>

        {showJournal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', fontSize: '0.85em' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Strategy</label>
                <select value={journal.strategy} onChange={(e) => setJournal({...journal, strategy: e.target.value})}>
                  {['MOMENTUM', 'BREAKOUT', 'VALUE', 'NEWS', 'TECHNICAL', 'TREND', 'REBALANCE', 'OTHER'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Reason</label>
                <select value={journal.reason} onChange={(e) => setJournal({...journal, reason: e.target.value})}>
                  {['EARNINGS', 'VALUATION', 'TECHNICAL_SETUP', 'NEWS', 'PORTFOLIO_REBALANCE', 'WATCHLIST_OPPORTUNITY', 'OTHER'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Confidence (1-5)</label>
                <input type="number" min="1" max="5" value={journal.confidence} onChange={(e) => setJournal({...journal, confidence: Number(e.target.value)})} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Expected Holding</label>
                <select value={journal.expectedHoldingPeriod} onChange={(e) => setJournal({...journal, expectedHoldingPeriod: e.target.value})}>
                  {['INTRADAY', '1-3 DAYS', '1-2 WEEKS', '1-3 MONTHS', 'LONG_TERM', 'UNSPECIFIED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Target Price</label>
                <input type="number" min="0" value={journal.targetPrice} onChange={(e) => setJournal({...journal, targetPrice: e.target.value})} placeholder="Optional" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Risk / Invalidation</label>
                <input type="number" min="0" value={journal.riskPrice} onChange={(e) => setJournal({...journal, riskPrice: e.target.value})} placeholder="Optional" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label>Thesis</label>
              <textarea 
                rows="3" 
                value={journal.thesis} 
                onChange={(e) => setJournal({...journal, thesis: e.target.value})} 
                placeholder="What do you expect to happen?"
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </div>

      {playbooks.length > 0 && (
      <div style={{ margin: '0 20px 15px 20px', padding: '10px', borderTop: '1px solid #eee' }}>
         <label style={{ display: 'block', fontSize: '0.9em', color: '#444', marginBottom: '8px' }}>Attach Playbook (Optional)</label>
         <select 
            value={selectedPlaybookId} 
            onChange={(e) => {
               setSelectedPlaybookId(e.target.value);
               setChecklistState({});
            }}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
         >
           <option value="">-- No Playbook --</option>
           {playbooks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
         </select>
         
         {selectedPlaybookId && (
           <PlaybookChecklist playbookId={selectedPlaybookId} checklistState={checklistState} setChecklistState={setChecklistState} />
         )}
      </div>
      )}

      <div className="buttons">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>Margin required: ₹{(stockQuantity * stockPrice).toFixed(2)}</span>
          {actionType === 'BUY' && balance !== null && (
            <span style={{ fontSize: '0.85em', color: balance >= (stockQuantity * stockPrice) ? '#4caf50' : '#e74c3c' }}>
              Available Balance: ₹{balance.toFixed(2)}
            </span>
          )}
        </div>
        <div>
          <button 
            className={`btn ${actionType === 'BUY' ? 'btn-blue' : 'btn-red'}`} 
            onClick={handleOrderClick} 
            disabled={isSubmitting}
            style={{ backgroundColor: actionType === 'SELL' ? '#e74c3c' : '#387ed1' }}
          >
            {isSubmitting ? "Processing..." : actionType}
          </button>
          <button className="btn btn-grey" onClick={handleCancelClick} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;