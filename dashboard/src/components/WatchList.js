import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";

import GeneralContext from "./GeneralContext";
import { Tooltip, Grow } from "@mui/material";
import {
  BarChartOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreHoriz,
} from "@mui/icons-material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { DoughnutChart } from "./DoughnutChart";
import { watchlistService, marketService } from "../services/api";

const WatchList = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadWatchlist = async () => {
    try {
      const res = await watchlistService.getWatchlist();
      if (res.data && res.data.success) {
        setWatchlist(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load watchlist", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await marketService.searchSymbols(searchQuery);
        setSearchResults(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddSymbol = async (symbol) => {
    try {
      await watchlistService.addSymbol(symbol);
      toast.success(`${symbol} added to watchlist`);
      setSearchQuery("");
      loadWatchlist();
    } catch (err) {
      // Toast error handled by axios interceptor
    }
  };

  const handleRemoveSymbol = async (symbol) => {
    try {
      await watchlistService.removeSymbol(symbol);
      toast.success(`${symbol} removed from watchlist`);
      loadWatchlist();
    } catch (err) {
      // Toast error handled by axios interceptor
    }
  };

  const labels = watchlist.map((item) => item.symbol);
  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: watchlist.map((stock) => stock.price || 0),
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
          "rgba(255, 159, 64, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="watchlist-container">
      <div className="search-container" style={{ position: 'relative' }}>
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg:infy, bse, nifty fut weekly, gold mcx"
          className="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
        />
        <span className="counts"> {watchlist.length} / 50</span>
        
        {searchQuery && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', zIndex: 10 }}>
            {searching ? <p style={{ padding: '8px' }}>Searching...</p> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {searchResults.map(s => (
                  <li key={s.symbol} style={{ padding: '8px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{s.name} ({s.symbol})</span>
                    <button onClick={() => handleAddSymbol(s.symbol)} style={{ background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>+ Add</button>
                  </li>
                ))}
                {searchResults.length === 0 && <li style={{ padding: '8px' }}>No matches found</li>}
              </ul>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "20px" }}>Loading Watchlist...</p>
      ) : watchlist.length === 0 ? (
        <p style={{ textAlign: "center", padding: "20px", color: "#888" }}>
          Your watchlist is empty.<br />Search for a stock to add it.
        </p>
      ) : (
        <ul className="list">
          {watchlist.map((stock, index) => {
            return <WatchListItem stock={stock} key={index} onRemove={() => handleRemoveSymbol(stock.symbol)} />;
          })}
        </ul>
      )}

      {watchlist.length > 0 && <DoughnutChart data={data} />}
    </div>
  );
};

export default WatchList;

const WatchListItem = ({ stock, onRemove }) => {
  const [showWatchlistActions, setShowWatchlistActions] = useState(false);

  const handleMouseEnter = (e) => {
    setShowWatchlistActions(true);
  };

  const handleMouseLeave = (e) => {
    setShowWatchlistActions(false);
  };

  if (stock.error) {
    return (
      <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="item">
          <p>{stock.symbol}</p>
          <div className="itemInfo">
            <span className="percent" style={{ color: 'red' }}>{stock.error}</span>
          </div>
        </div>
        {showWatchlistActions && (
          <span className="actions">
            <button className="action" onClick={onRemove} title="Remove">
              <DeleteOutlineIcon className="icon" />
            </button>
          </span>
        )}
      </li>
    );
  }

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="item">
        <p className={stock.isDown ? "down" : "up"}>{stock.symbol}</p>
        <div className="itemInfo">
          <span className="percent">{stock.changePercent}%</span>
          {stock.isDown ? (
            <KeyboardArrowDown className="down" />
          ) : (
            <KeyboardArrowUp className="down" />
          )}
          <span className="price">{stock.price}</span>
        </div>
      </div>
      {showWatchlistActions && <WatchListActions uid={stock.symbol} onRemove={onRemove} />}
    </li>
  );
};

const WatchListActions = ({ uid, onRemove }) => {
  const generalContext = useContext(GeneralContext);

  const handleBuyClick = () => {
    generalContext.openBuyWindow(uid);
  };

  return (
    <span className="actions">
      <span>
        <Tooltip
          title="Buy (B)"
          placement="top"
          arrow
          TransitionComponent={Grow}
          onClick={handleBuyClick}
        >
          <button className="buy">Buy</button>
        </Tooltip>
        <Tooltip
          title="Sell (S)"
          placement="top"
          arrow
          TransitionComponent={Grow}
          onClick={() => generalContext.openSellWindow(uid)}
        >
          <button className="sell">Sell</button>
        </Tooltip>
        <Tooltip
          title="Analytics (A)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button className="action">
            <BarChartOutlined className="icon" />
          </button>
        </Tooltip>
        <Tooltip title="Remove" placement="top" arrow TransitionComponent={Grow}>
          <button className="action" onClick={onRemove}>
            <DeleteOutlineIcon className="icon" />
          </button>
        </Tooltip>
      </span>
    </span>
  );
};