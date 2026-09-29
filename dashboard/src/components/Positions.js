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
        setPositions(response.data);
      } catch (err) {
        setError("Failed to fetch positions.");
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
  }, []);

  if (loading) {
    return <div className="loading-state">Loading your positions...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  if (positions.length === 0) {
    return (
      <div className="empty-state">
        <h3 className="title">Positions (0)</h3>
        <p>No open positions today. Start trading to see your positions here.</p>
      </div>
    );
  }

  return (
    <>
      <h3 className="title">Positions ({positions.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg.</th>
              <th>LTP</th>
              <th>P&L</th>
              <th>Chg.</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((stock, index) => {
              const curValue = stock.price * stock.qty;
              const investedVal = stock.avg * stock.qty;
              const isProfit = curValue - investedVal >= 0.0;
              const profClass = isProfit ? "profit" : "loss";
              const dayClass = stock.isLoss ? "loss" : "profit";

              return (
                <tr key={index}>
                  <td>{stock.product}</td>
                  <td>{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{stock.avg.toFixed(2)}</td>
                  <td>{stock.price.toFixed(2)}</td>
                  <td className={profClass}>
                    {(curValue - investedVal).toFixed(2)}
                  </td>
                  <td className={dayClass}>{stock.day}</td>
                  <td>
                    <button 
                      className="sell" 
                      onClick={() => generalContext.openSellWindow(stock.name)}
                      style={{ padding: '2px 8px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Positions;