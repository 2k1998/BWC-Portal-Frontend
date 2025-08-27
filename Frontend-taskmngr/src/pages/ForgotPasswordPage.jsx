// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { authApi } from '../api/apiService';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authApi.requestPasswordReset({ email });
            showNotification(response.message, 'success');
            setEmail('');
        } catch (err) {
            showNotification(err.message || 'Failed to request password reset. Please try again.', 'error');
            console.error('Forgot password error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>{t('forgot_password_title')}</h2>
            <p>{t('forgot_password_intro')}</p>
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
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('sending_link') : t('send_reset_link')}
                </button>
            </form>
            <p>
                <Link to="/login" className="link-button">{t('back_to_login')}</Link>
            </p>
        </div>
    );
}

export default ForgotPasswordPage;