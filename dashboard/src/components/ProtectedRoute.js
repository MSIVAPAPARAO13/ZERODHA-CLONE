import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#090d16' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #1e293b', borderTopColor: '#0284c7', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <h2 style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif', fontWeight: '400', fontSize: '0.9rem' }}>Authenticating…</h2>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
