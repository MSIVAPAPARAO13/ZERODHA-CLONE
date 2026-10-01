import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const NAV_GROUPS = [
  {
    label: "TradeFlow",
    items: [
      { id: 0, label: "Overview", icon: "▦", path: "/" },
      { id: 16, label: "Daily Insights", icon: "💡", path: "/insights", accent: "#0284c7" },
    ],
  },
  {
    label: "Market",
    items: [
      { id: 14, label: "Scanner", icon: "🔍", path: "/scanner", accent: "#047857" },
      { id: 17, label: "Market Events", icon: "⚡", path: "/events", accent: "#ea580c" },
      { id: 11, label: "Cascade", icon: "🌊", path: "/cascade", accent: "#0284c7" },
    ],
  },
  {
    label: "Research",
    items: [
      { id: 15, label: "Research Copilot", icon: "🔬", path: "/research", accent: "#7c3aed" },
      { id: 13, label: "Strategy Lab", icon: "🧪", path: "/strategy-lab", accent: "#0e7490" },
      { id: 5,  label: "AI Analyst", icon: "✨", path: "/ai-analyst", accent: "#8b5cf6" },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { id: 2, label: "Holdings", icon: "📦", path: "/holdings" },
      { id: 3, label: "Positions", icon: "📈", path: "/positions" },
      { id: 1, label: "Orders", icon: "📋", path: "/orders" },
      { id: 12, label: "Scenario Planner", icon: "🎯", path: "/stress-studio", accent: "#b91c1c" },
      { id: 7, label: "Funds", icon: "💰", path: "/funds" },
    ],
  },
  {
    label: "Learning",
    items: [
      { id: 4,  label: "Journal", icon: "📝", path: "/journal" },
      { id: 10, label: "Playbooks", icon: "📖", path: "/playbooks" },
      { id: 9,  label: "Edge & Learning", icon: "⚙️", path: "/behavior-insights" },
      { id: 6,  label: "Alerts", icon: "🔔", path: "/alerts" },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.name || user?.email || "TF").substring(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="logo.png" alt="TradeFlow" className="sidebar-logo-img" />
        <span className="sidebar-brand">TradeFlow</span>
      </div>

      {/* Nav Groups */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <p className="sidebar-group-label">{group.label}</p>
            {group.items.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`sidebar-item${active ? " sidebar-item--active" : ""}`}
                  style={active && item.accent ? { color: item.accent, background: `${item.accent}14` } : item.accent && !active ? { color: item.accent } : {}}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                  {active && <span className="sidebar-item-pip" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className="sidebar-profile" onClick={() => setProfileOpen(!profileOpen)}>
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-profile-info">
          <p className="sidebar-profile-name">{user?.name || user?.email?.split('@')[0] || "User"}</p>
          <p className="sidebar-profile-sub">Paper Trading</p>
        </div>
        <span className="sidebar-profile-chevron">{profileOpen ? "▴" : "▾"}</span>
        {profileOpen && (
          <div className="sidebar-profile-dropdown">
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;