import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import GeneralContext from "./GeneralContext";
import { Tooltip, Grow } from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { DoughnutChart } from "./DoughnutChart";
import { watchlistService, marketService } from "../services/api";

const TOP_NIFTY = [
  "RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS",
  "ICICIBANK", "BHARTIARTL", "ITC", "SBIN", "LT"
];

const WatchList = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadWatchlist = async () => {
    try {
      const res = await watchlistService.getWatchlist();
      if (res.data && res.data.success) {
        setWatchlist(res.data.data || []);
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
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await marketService.searchSymbols(searchQuery);
        setSearchResults(res.data?.data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddSymbol = async (symbol) => {
    try {
      await watchlistService.addSymbol(symbol);
      toast.success(`${symbol} added to watchlist`);
      setSearchQuery("");
      setSearchResults([]);
      loadWatchlist();
    } catch (err) {
      // Toast handled by api interceptor
    }
  };

  const handleRemoveSymbol = async (symbol) => {
    try {
      await watchlistService.removeSymbol(symbol);
      toast.success(`${symbol} removed`);
      loadWatchlist();
    } catch (err) {
      // Toast handled by api interceptor
    }
  };

  const handleQuickSeed = async () => {
    setSeeding(true);
    try {
      for (const sym of TOP_NIFTY) {
        try {
          await watchlistService.addSymbol(sym);
        } catch (e) {
          // ignore duplicate
        }
      }
      toast.success("Added top NIFTY 50 stocks to watchlist");
      await loadWatchlist();
    } catch (err) {
      toast.error("Failed to seed watchlist");
    } finally {
      setSeeding(false);
    }
  };

  const labels = watchlist.map((item) => item.symbol);
  const data = {
    labels,
    datasets: [
      {
        label: "Price (₹)",
        data: watchlist.map((stock) => stock.price || 0),
        backgroundColor: [
          "rgba(56, 189, 248, 0.6)",
          "rgba(16, 185, 129, 0.6)",
          "rgba(244, 63, 94, 0.6)",
          "rgba(245, 158, 11, 0.6)",
          "rgba(139, 92, 246, 0.6)",
          "rgba(59, 130, 246, 0.6)",
        ],
        borderColor: [
          "rgba(56, 189, 248, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(244, 63, 94, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(59, 130, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <aside className="watchlist-container" aria-label="Market Watchlist">
      {/* Search Header */}
      <div className="watchlist-search-box">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            name="watchlist-search"
            id="watchlist-search"
            placeholder="Search stock, index, f&o..."
            className="watchlist-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            aria-label="Search watchlist symbols"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="watchlist-count-badge font-mono">
          {watchlist.length}<span className="text-muted">/50</span>
        </div>

        {/* Autocomplete Dropdown */}
        {searchQuery.trim() && (
          <div className="watchlist-search-dropdown">
            {searching ? (
              <div className="search-status-row">
                <span className="spinner-mini"></span> Searching securities...
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="search-results-list">
                {searchResults.map((s) => (
                  <li
                    key={s.symbol}
                    className="search-result-item"
                    onClick={() => handleAddSymbol(s.symbol)}
                  >
                    <div className="search-result-left">
                      <span className="search-result-symbol font-mono">{s.symbol}</span>
                      <span className="search-result-name">{s.name || s.symbol}</span>
                    </div>
                    <button
                      className="btn-add-symbol"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSymbol(s.symbol);
                      }}
                      title="Add to watchlist"
                    >
                      + Add
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="search-empty-state">
                <span>No matching symbols found</span>
                <button
                  className="btn-seed-custom"
                  onClick={() => handleAddSymbol(searchQuery.toUpperCase().trim())}
                >
                  + Add "{searchQuery.toUpperCase().trim()}"
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Watchlist Body */}
      <div className="watchlist-scroll-area">
        {loading ? (
          <div className="watchlist-loading-state">
            <div className="spinner-mini"></div>
            <p>Loading market feed...</p>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="watchlist-empty-card">
            <div className="empty-icon">📈</div>
            <h4>Watchlist is empty</h4>
            <p>Search for symbols above or load top benchmark stocks with one click.</p>
            <button
              className="btn-quick-seed"
              onClick={handleQuickSeed}
              disabled={seeding}
            >
              {seeding ? "Adding..." : "⚡ Add Top NIFTY 50"}
            </button>
          </div>
        ) : (
          <ul className="watchlist-items-list">
            {watchlist.map((stock, index) => (
              <WatchListItem
                stock={stock}
                key={stock.symbol || index}
                onRemove={() => handleRemoveSymbol(stock.symbol)}
              />
            ))}
          </ul>
        )}

        {watchlist.length > 0 && (
          <div className="watchlist-chart-wrapper">
            <div className="chart-header">
              <span className="chart-title">ALLOCATION SPREAD</span>
            </div>
            <DoughnutChart data={data} />
          </div>
        )}
      </div>

      {/* Footer / Summary Bar */}
      <div className="watchlist-footer-strip">
        <span className="footer-label font-mono flex-row items-center gap-1.5 text-xs">
          <span className="pulse-dot"></span>
          NSE • BSE REAL-TIME FEED
        </span>
        <span className="font-mono text-xs text-muted">{watchlist.length} Securities</span>
      </div>
    </aside>
  );
};

export default WatchList;

const WatchListItem = ({ stock, onRemove }) => {
  const [hovered, setHovered] = useState(false);
  const isDown = stock.isDown ?? (Number(stock.changePercent) < 0);
  const priceFormatted = typeof stock.price === 'number'
    ? stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (stock.price || "0.00");

  const changeFormatted = typeof stock.changePercent === 'number'
    ? (stock.changePercent >= 0 ? `+${stock.changePercent.toFixed(2)}%` : `${stock.changePercent.toFixed(2)}%`)
    : (stock.changePercent ? `${stock.changePercent}%` : "0.00%");

  return (
    <li
      className={`watchlist-item-row ${hovered ? "hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="watchlist-item-main">
        <div className="stock-identity">
          <span className="stock-symbol font-mono">{stock.symbol}</span>
          <span className="stock-exchange">NSE</span>
        </div>

        <div className="stock-metrics">
          <div className="stock-price font-mono">₹{priceFormatted}</div>
          <div className={`stock-change font-mono ${isDown ? "text-rose" : "text-emerald"}`}>
            {isDown ? <KeyboardArrowDown className="arrow-icon" /> : <KeyboardArrowUp className="arrow-icon" />}
            <span>{changeFormatted}</span>
          </div>
        </div>
      </div>

      {/* Hover Action Controls */}
      <div className={`watchlist-item-actions ${hovered ? "visible" : ""}`}>
        <WatchListActions uid={stock.symbol} onRemove={onRemove} />
      </div>
    </li>
  );
};

const WatchListActions = ({ uid, onRemove }) => {
  const generalContext = useContext(GeneralContext);
  const navigate = useNavigate();

  const handleBuyClick = (e) => {
    e.stopPropagation();
    generalContext.openBuyWindow(uid);
  };

  const handleSellClick = (e) => {
    e.stopPropagation();
    generalContext.openSellWindow(uid);
  };

  const handleInvestigate = (e) => {
    e.stopPropagation();
    navigate(`/research?symbol=${uid}&intent=SYMBOL_DEEP_DIVE&question=${encodeURIComponent(`What is the latest technical posture and catalyst evidence for ${uid}?`)}`);
  };

  return (
    <div className="actions-cluster">
      <Tooltip title="Buy (B)" placement="top" arrow TransitionComponent={Grow}>
        <button className="btn-action-buy" onClick={handleBuyClick} aria-label={`Buy ${uid}`}>
          B
        </button>
      </Tooltip>
      <Tooltip title="Sell (S)" placement="top" arrow TransitionComponent={Grow}>
        <button className="btn-action-sell" onClick={handleSellClick} aria-label={`Sell ${uid}`}>
          S
        </button>
      </Tooltip>
      <Tooltip title="Investigate in AI Copilot" placement="top" arrow TransitionComponent={Grow}>
        <button className="btn-action-investigate" onClick={handleInvestigate} aria-label={`Investigate ${uid}`}>
          🔬
        </button>
      </Tooltip>
      <Tooltip title="Remove from Watchlist" placement="top" arrow TransitionComponent={Grow}>
        <button className="btn-action-remove" onClick={onRemove} aria-label={`Remove ${uid}`}>
          <DeleteOutlineIcon style={{ fontSize: '15px' }} />
        </button>
      </Tooltip>
    </div>
  );
};