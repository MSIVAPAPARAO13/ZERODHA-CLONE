import React, { useState } from "react";
import { aiService } from "../services/api";

const PortfolioAnalyst = () => {
  const [loadingType, setLoadingType] = useState(null);
  const [results, setResults] = useState({
    portfolioReview: null,
    whatChangedToday: null,
    dailyDebrief: null,
    patternReview: null
  });
  const [error, setError] = useState("");

  const handleAction = async (type) => {
    setLoadingType(type);
    setError("");
    try {
      let res;
      switch(type) {
        case 'portfolioReview': res = await aiService.portfolioReview(); break;
        case 'whatChangedToday': res = await aiService.whatChangedToday(); break;
        case 'dailyDebrief': res = await aiService.dailyDebrief(); break;
        case 'patternReview': res = await aiService.patternReview(); break;
        default: break;
      }
      setResults(prev => ({ ...prev, [type]: res.data.data.analysis }));
    } catch (err) {
      setError(err.response?.data?.error?.message || `Failed to perform ${type}.`);
    } finally {
      setLoadingType(null);
    }
  };

  const ActionCard = ({ title, description, actionType }) => (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#673ab7' }}>{title}</h3>
      <p style={{ color: '#666', fontSize: '0.9em', flexGrow: 1, margin: '0 0 20px 0' }}>{description}</p>
      
      {!results[actionType] ? (
        <button 
          onClick={() => handleAction(actionType)}
          disabled={loadingType !== null}
          style={{ background: '#673ab7', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: loadingType !== null ? 'not-allowed' : 'pointer' }}
        >
          {loadingType === actionType ? 'Analyzing...' : `Generate ${title}`}
        </button>
      ) : (
        <div style={{ background: '#f5f0ff', padding: '15px', borderRadius: '4px', fontSize: '0.9em' }}>
          {results[actionType].summary && <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>Summary</p>}
          <p>{results[actionType].summary}</p>
          
          {results[actionType].portfolioFacts && (
            <>
              <p style={{ fontWeight: 'bold', margin: '15px 0 5px 0' }}>Portfolio Facts</p>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {results[actionType].portfolioFacts.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </>
          )}

          {results[actionType].reflectionQuestions && (
            <>
              <p style={{ fontWeight: 'bold', margin: '15px 0 5px 0' }}>Reflection Questions</p>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {results[actionType].reflectionQuestions.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </>
          )}

          {/* Additional fields for specific analyses can be mapped here generically for MVP */}
          {results[actionType].activityCount && <p style={{ marginTop: '10px' }}><strong>Activity:</strong> {results[actionType].activityCount}</p>}
          
          <button 
            onClick={() => setResults(prev => ({ ...prev, [actionType]: null }))}
            style={{ background: 'transparent', color: '#673ab7', border: '1px solid #673ab7', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginTop: '15px', width: '100%' }}
          >
            Clear Analysis
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h3 className="title">✨ TradeFlow AI Analyst</h3>
      </div>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        TradeFlow AI provides educational analysis based on your recorded activity and available market data. It does not provide investment recommendations.
      </p>

      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <ActionCard 
          title="Portfolio Review" 
          description="Analyze your current holdings, positions, and concentration risk." 
          actionType="portfolioReview" 
        />
        <ActionCard 
          title="Pattern Review" 
          description="Identify repeated behaviors and patterns in your recent journal entries." 
          actionType="patternReview" 
        />
        <ActionCard 
          title="Daily Debrief" 
          description="Summarize what happened today based on your transactions and journals." 
          actionType="dailyDebrief" 
        />
        <ActionCard 
          title="What Changed Today" 
          description="Get a quick factual summary of portfolio and watchlist differences in the last 24h." 
          actionType="whatChangedToday" 
        />
      </div>
    </div>
  );
};

export default PortfolioAnalyst;
