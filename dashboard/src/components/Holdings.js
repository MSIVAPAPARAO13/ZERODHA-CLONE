import React, { useState, useEffect, useContext } from "react";
import { portfolioService } from "../services/api";
import { VerticalGraph } from "./VerticalGraph";
import GeneralContext from "./GeneralContext";

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const generalContext = useContext(GeneralContext);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const response = await portfolioService.getHoldings();
        setAllHoldings(response.data);
      } catch (err) {
        setError("Failed to fetch holdings.");
      } finally {
        setLoading(false);
      }
    };
    fetchHoldings();
  }, []);

  if (loading) {
    return <div className="loading-state">Loading your holdings...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  if (allHoldings.length === 0) {
    return (
      <div className="empty-state">
        <h3 className="title">Holdings (0)</h3>
        <p>No holdings yet. Place a simulated trade to start building your portfolio.</p>
      </div>
    );
  }

  const labels = allHoldings.map((subArray) => subArray["name"]);

  const data = {
    labels,
    datasets: [
      {
        label: "Stock Price",
        data: allHoldings.map((stock) => stock.price),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  let totalInvestment = 0;
  let currentTotalValue = 0;

  return (
    <>
      <h3 className="title">Holdings ({allHoldings.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg. cost</th>
              <th>LTP</th>
              <th>Cur. val</th>
              <th>P&L</th>
              <th>Net chg.</th>
              <th>Day chg.</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {allHoldings.map((stock, index) => {
              const curValue = stock.price * stock.qty;
              const investedVal = stock.avg * stock.qty;
              totalInvestment += investedVal;
              currentTotalValue += curValue;

              const isProfit = curValue - investedVal >= 0.0;
              const profClass = isProfit ? "profit" : "loss";
              const dayClass = stock.isLoss ? "loss" : "profit";

              return (
                <tr key={index}>
                  <td>{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{stock.avg.toFixed(2)}</td>
                  <td>{stock.price.toFixed(2)}</td>
                  <td>{curValue.toFixed(2)}</td>
                  <td className={profClass}>
                    {(curValue - investedVal).toFixed(2)}
                  </td>
                  <td className={profClass}>{stock.net}</td>
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

      <div className="row">
        <div className="col">
          <h5>
            ₹{totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h5>
          <p>Total investment</p>
        </div>
        <div className="col">
          <h5>
            ₹{currentTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h5>
          <p>Current value</p>
        </div>
        <div className="col">
          <h5 className={currentTotalValue - totalInvestment >= 0 ? "profit" : "loss"}>
            ₹{(currentTotalValue - totalInvestment).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
            ({totalInvestment > 0 ? (((currentTotalValue - totalInvestment) / totalInvestment) * 100).toFixed(2) : 0}%)
          </h5>
          <p>P&L</p>
        </div>
      </div>
      <VerticalGraph data={data} />
    </>
  );
};

export default Holdings;