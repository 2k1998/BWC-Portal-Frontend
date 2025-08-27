// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { authApi } from '../api/apiService';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [birthday, setBirthday] = useState('');
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Basic validation for birthday format if present
        let parsedBirthday = null;
        if (birthday) {
            try {
                const dateObj = new Date(birthday + 'T00:00:00');
                if (isNaN(dateObj.getTime())) {
                    throw new Error(t('invalid_date_format'));
                }
                parsedBirthday = birthday;
            } catch (bdayError) {
                showNotification(bdayError.message, 'error');
                setLoading(false);
                return;
            }
        }

        try {
            await authApi.register({
                email,
                password,
                full_name: fullName || null,
                birthday: parsedBirthday,
            });
            showNotification(t('registration_success'), 'success');
            setEmail('');
            setPassword('');
            setFullName('');
            setBirthday('');
            // Redirect to login after a short delay
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            showNotification(err.message || t('registration_failed'), 'error');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>{t('sign_up')}</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="reg-email">{t('email')}</label>
                    <input
                        type="email"
                        id="reg-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        placeholder={t('email')}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="reg-password">{t('password')}</label>
                    <input
                        type="password"
                        id="reg-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder={t('password')}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="full-name">{t('username')}</label>
                    <input
                        type="text"
                        id="full-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        placeholder={t('username')}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="birthday">{t('birthday')}</label>
                    <input
                        type="date"
                        id="birthday"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('registering') : t('sign_up')}
                </button>
            </form>
            <p>
                {t('already_have_account')} <Link to="/login" className="link-button">{t('sign_in')}</Link>
            </p>
        </div>
    );
}

export default RegisterPage;