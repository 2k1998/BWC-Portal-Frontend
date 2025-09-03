// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
            showNotification(t('login_success') || 'Login successful!', 'success');
        } catch (err) {
            showNotification(err.message || t('login_failed') || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>{t('sign_in')}</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="email">{t('email')}</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        placeholder={t('email')}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">{t('password')}</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder={t('password')}
                    />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('logging_in') : t('sign_in')}
                </button>
            </form>
            <p className="forgot-password-link">
                <Link to="/forgot-password" className="link-button">{t('forgot_password')}</Link>
            </p>
            <p>
                {t('dont_have_account')} <Link to="/register" className="link-button">{t('sign_up')}</Link>
            </p>
        </div>
    );
}

export default LoginPage;