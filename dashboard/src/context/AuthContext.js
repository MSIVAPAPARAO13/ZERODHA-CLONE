import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tradeflow_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // In a real app, we might want to /api/v1/auth/me here to verify token and fetch user
      // For MVP-2, we just trust the local storage token and user payload
      const storedUser = localStorage.getItem('tradeflow_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, [token]);

  const login = (userData, jwtToken) => {
    localStorage.setItem('tradeflow_token', jwtToken);
    localStorage.setItem('tradeflow_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('tradeflow_token');
    localStorage.removeItem('tradeflow_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
