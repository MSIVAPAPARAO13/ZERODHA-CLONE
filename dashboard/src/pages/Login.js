import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLoggingIn, setIsDemoLoggingIn] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authService.login({ email, password });
      login(res.data.data.user, res.data.data.token);
      toast.success(`Welcome back, ${res.data.data.user.name}!`);
      navigate('/');
    } catch (err) {
      // toast is handled by api interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoggingIn(true);
    try {
      const res = await authService.login({
        email: 'demo@tradeflow.com',
        password: 'password123'
      });
      login(res.data.data.user, res.data.data.token);
      toast.success('Logged in with Demo Trader account (Pre-seeded with ₹1,50,000 Portfolio)');
      navigate('/');
    } catch (err) {
      toast.error('Demo login failed. You can sign up with a new account.');
    } finally {
      setIsDemoLoggingIn(false);
    }
  };

  return (
    <main className="login-screen-wrapper">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-chip">
            <span className="logo-spark">⚡</span>
            <span className="brand-name">TradeFlow</span>
          </div>
          <h1 className="login-title">Institutional Terminal</h1>
          <p className="login-subtitle">Paper Trading Simulation & Quantitative Analytics</p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="demo-login-box">
          <div className="demo-login-info">
            <span className="demo-badge">1-CLICK DEMO</span>
            <p className="demo-desc">Instant access with pre-seeded ₹1,50,000 portfolio & live NIFTY watchlist</p>
          </div>
          <button
            type="button"
            className="btn-demo-quick"
            onClick={handleDemoLogin}
            disabled={isDemoLoggingIn || isSubmitting}
            id="demo-login-button"
          >
            {isDemoLoggingIn ? "Signing in..." : "⚡ Launch Demo Terminal"}
          </button>
        </div>

        <div className="divider-row">
          <span className="divider-line"></span>
          <span className="divider-text">OR SIGN IN WITH EMAIL</span>
          <span className="divider-line"></span>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Work or Personal Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="trader@tradeflow.com"
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="label-with-link">
              <label htmlFor="login-password" className="form-label">Password</label>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="form-input"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isDemoLoggingIn}
            className="btn-submit-primary"
            id="login-submit-button"
          >
            {isSubmitting ? "Signing In..." : "Sign In to Terminal"}
          </button>
        </form>

        {/* Register Footer */}
        <div className="login-card-footer">
          <span>Need an account? </span>
          <Link to="/register" className="link-highlight">Create a new account</Link>
        </div>
      </div>
    </main>
  );
};

export default Login;
