import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  return (
    <div className="menu-container">
      <img src="logo.png" style={{ width: "50px" }} alt="Logo" />
      <div className="menus">
        <ul>
          <li>
            <Link style={{ textDecoration: "none" }} to="/" onClick={() => handleMenuClick(0)}>
              <p className={selectedMenu === 0 ? activeMenuClass : menuClass}>Dashboard</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/orders" onClick={() => handleMenuClick(1)}>
              <p className={selectedMenu === 1 ? activeMenuClass : menuClass}>Orders</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/holdings" onClick={() => handleMenuClick(2)}>
              <p className={selectedMenu === 2 ? activeMenuClass : menuClass}>Holdings</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/positions" onClick={() => handleMenuClick(3)}>
              <p className={selectedMenu === 3 ? activeMenuClass : menuClass}>Positions</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/journal" onClick={() => handleMenuClick(4)}>
              <p className={selectedMenu === 4 ? activeMenuClass : menuClass}>Journal</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/behavior-insights" onClick={() => handleMenuClick(9)}>
              <p className={selectedMenu === 9 ? activeMenuClass : menuClass}>Edge</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/playbooks" onClick={() => handleMenuClick(10)}>
              <p className={selectedMenu === 10 ? activeMenuClass : menuClass}>Playbooks</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/ai-analyst" onClick={() => handleMenuClick(5)}>
              <p className={selectedMenu === 5 ? activeMenuClass : menuClass} style={{ color: selectedMenu === 5 ? '#673ab7' : 'inherit' }}>
                ✨ AI Analyst
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/alerts" onClick={() => handleMenuClick(6)}>
              <p className={selectedMenu === 6 ? activeMenuClass : menuClass}>Alerts</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/funds" onClick={() => handleMenuClick(7)}>
              <p className={selectedMenu === 7 ? activeMenuClass : menuClass}>Funds</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/apps" onClick={() => handleMenuClick(8)}>
              <p className={selectedMenu === 8 ? activeMenuClass : menuClass}>Apps</p>
            </Link>
          </li>
        </ul>
        <hr />
        <div className="profile" onClick={handleProfileClick} style={{ cursor: 'pointer', position: 'relative' }}>
          <div className="avatar">{user ? user.name.substring(0, 2).toUpperCase() : 'ZU'}</div>
          <p className="username">{user ? user.name : 'USER'}</p>
          {isProfileDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, background: '#fff', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', zIndex: 10 }}>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold' }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;