import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, Shield, User, Lock, Mail } from 'lucide-react';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState(
    new URLSearchParams(location.search).get('expired') === 'true'
      ? 'Your session has expired. Please log in again.'
      : ''
  );
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password || (!isLogin && !username)) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (isLogin) {
      const res = await login(email, password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = await register(username, email, password, role);
      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at bottom, #2e1065 0%, var(--bg-primary) 80%)', padding: '20px' }}>
      
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '40px 30px' }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', gap: '8px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 800 }}>
            AI-Powered Interview Preparation <span className="gradient-text-accent">Platform</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>AI-Powered Interview Simulation Portal</p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: 'var(--border-radius-sm)', marginBottom: '30px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: 'calc(var(--border-radius-sm) - 2px)',
              background: isLogin ? 'var(--bg-tertiary)' : 'transparent',
              color: isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: 600, transition: 'var(--transition-fast)'
            }}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: 'calc(var(--border-radius-sm) - 2px)',
              background: !isLogin ? 'var(--bg-tertiary)' : 'transparent',
              color: !isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: 600, transition: 'var(--transition-fast)'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Messaging */}
        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '14px', marginBottom: '20px', fontWeight: 500 }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '14px', marginBottom: '20px', fontWeight: 500 }}>
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: isLogin ? '30px' : '20px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: '30px' }}>
              <label className="form-label" htmlFor="role">Account Role</label>
              <div style={{ position: 'relative' }}>
                <Shield size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <select
                  id="role"
                  className="form-input"
                  style={{ paddingLeft: '44px', cursor: 'pointer', appearance: 'none', background: 'var(--bg-secondary) url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 14px center/16px' }}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">User (Candidate Prep Mode)</option>
                  <option value="admin">Admin (System Analytics Mode)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

      </div>

    </div>
  );
};
export default AuthPage;
