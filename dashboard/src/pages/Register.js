import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '6px',
  border: '1px solid #1e293b', boxSizing: 'border-box',
  backgroundColor: '#162032', color: '#f8fafc', fontSize: '0.9rem', outline: 'none',
};
const labelStyle = { display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 };

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authService.register({ name, email, password });
      login(res.data.data.user, res.data.data.token);
      toast.success('Welcome to TradeFlow!');
      navigate('/');
    } catch (err) {
      // toast handled by api interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', backgroundColor: '#090d16', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        padding: '2rem', backgroundColor: '#0f172a', borderRadius: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)', width: '380px',
        border: '1px solid #1e293b'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ color: '#f8fafc', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Create Account</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px' }}>TradeFlow Paper Trading Terminal</p>
        </div>
        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full Name', value: name, setter: setName, type: 'text', placeholder: 'John Doe' },
            { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'you@email.com' },
            { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
            { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, type: 'password', placeholder: '••••••••' },
          ].map(({ label, value, setter, type, placeholder }) => (
            <div key={label} style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>{label}</label>
              <input
                type={type}
                value={value}
                onChange={e => setter(e.target.value)}
                required
                placeholder={placeholder}
                style={inputStyle}
              />
            </div>
          ))}
          <button
            type="submit"
            id="register-btn"
            disabled={isSubmitting}
            style={{
              width: '100%', padding: '10px', backgroundColor: '#0284c7', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '0.9rem', opacity: isSubmitting ? 0.7 : 1, marginTop: '4px'
            }}
          >
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
