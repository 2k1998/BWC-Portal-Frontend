import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/apiService';
import '../pages/Auth.css';

export default function LoginPage() {
  const [mode, setMode] = useState(null); // 'login' | 'signup' | null
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isOpen = Boolean(mode);

  // Force a fully transparent page background while this page is shown
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.documentElement.classList.add('auth-page');
    document.body.classList.add('auth-page');
    document.body.style.backgroundColor = 'transparent';
    return () => {
      document.documentElement.classList.remove('auth-page');
      document.body.classList.remove('auth-page');
      document.body.style.backgroundColor = prev || '';
    };
  }, []);

  const handleChoose = (nextMode) => {
    setMode(nextMode);
  };

  const handleBack = () => {
    setMode(null);
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err) {
      alert(err?.detail || err?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSignup = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await authApi.register({ name: signupName, email: signupEmail, password: signupPassword });
      await login(signupEmail, signupPassword);
      navigate('/dashboard');
    } catch (err) {
      alert(err?.detail || err?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`auth-landing${isOpen ? ' open' : ''}`}>
      <div className="auth-landing-inner">
        <img
          className="auth-logo"
          src="/brand-logo.png"
          alt="Company Logo"
        />

        {!isOpen && (
          <div className="auth-choice">
            <button
              type="button"
              className="btn btn-primary auth-choice-btn btn-md"
              onClick={() => handleChoose('login')}
            >
              Log in
            </button>
            <button
              type="button"
              className="btn btn-secondary auth-choice-btn btn-md"
              onClick={() => handleChoose('signup')}
            >
              Sign up
            </button>
          </div>
        )}

        {isOpen && (
          <button type="button" className="auth-back-btn" onClick={handleBack}>
            Back
          </button>
        )}

        <div className="auth-forms">
          {mode === 'login' && (
            <div className="auth-form-card">
              <form className="auth-form" onSubmit={handleSubmitLogin}>
                <h2>Log in</h2>
                <div className="form-group">
                  <label htmlFor="login-email">Email</label>
                  <input id="login-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                </div>
                <div className="forgot-password-link" style={{ textAlign: 'right', marginBottom: '1rem' }}>
                  <Link to="/forgot-password" style={{ color: '#b8860b', textDecoration: 'none', fontSize: '0.9rem' }}>
                    Forgot your password?
                  </Link>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Please wait…' : 'Continue'}</button>
              </form>
            </div>
          )}

          {mode === 'signup' && (
            <div className="auth-form-card">
              <form className="auth-form" onSubmit={handleSubmitSignup}>
                <h2>Sign up</h2>
                <div className="form-group">
                  <label htmlFor="signup-name">Full name</label>
                  <input id="signup-name" type="text" required value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-email">Email</label>
                  <input id="signup-email" type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-password">Password</label>
                  <input id="signup-password" type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Please wait…' : 'Create account'}</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


