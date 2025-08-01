// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { companyApi } from '../api/apiService';
import NotificationBell from './NotificationBell';
import './Header.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

function Header() {
    const { isAuthenticated, currentUser, logout, accessToken } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();

    const userRole = currentUser?.role;
    const isAdmin = userRole === "admin";
    const canSeeContacts = ['Pillar', 'Manager', 'Head', 'admin'].includes(userRole);

    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        if (accessToken) {
            companyApi.getAll(accessToken)
                .then(data => setCompanies(data))
                .catch(err => console.error("Header failed to fetch companies:", err));
        } else {
            setCompanies([]);
        }
    }, [accessToken]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="app-header">
            <nav>
                <div className="nav-left">
                    <Link to="/dashboard" className="app-title">BWC Portal</Link>
                    {isAuthenticated && (
                        <div className="main-nav-links">
                            <NavLink to="/dashboard">{t('dashboard')}</NavLink>
                            <NavLink to="/tasks">{t('my_tasks')}</NavLink>

                            {/* --- THIS IS THE NEW DROPDOWN FOR CONTACTS --- */}
                            {canSeeContacts && (
                                <div className="dropdown">
                                    <button className="dropdown-toggle" onClick={() => navigate('/contacts')}>
                                        {t('contacts')}
                                    </button>
                                    <div className="dropdown-menu">
                                        <NavLink to="/contacts">{t('all_contacts')}</NavLink>
                                        <NavLink to="/daily-calls">{t('daily_calls')}</NavLink>
                                    </div>
                                </div>
                            )}

                            <div className="dropdown">
                                <button className="dropdown-toggle" onClick={() => navigate('/companies')}>{t('companies')}</button>
                                <div className="dropdown-menu">
                                    {companies.map(c => (
                                        <Link key={c.id} to={`/companies/${c.id}`}>{c.name}</Link>
                                    ))}
                                    {companies.length > 0 && <div className="dropdown-divider"></div>}
                                    <NavLink to="/companies">{t('view_all_companies')}</NavLink>
                                    {isAdmin && <NavLink to="/companies/new">{t('add_new_company')}</NavLink>}
                                </div>
                            </div>
                            <NavLink to="/groups">{t('groups')}</NavLink>
                            {isAdmin && (
                                <div className="dropdown">
                                    <button className="dropdown-toggle">{t('admin')}</button>
                                    <div className="dropdown-menu">
                                        <NavLink to="/users">{t('users')}</NavLink>
                                        <NavLink to="/admin-panel">{t('admin_panel')}</NavLink>
                                        <NavLink to="/events/new">{t('add_new_event')}</NavLink>
                                        <NavLink to="/reports">Reports</NavLink>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="nav-right">
                    {isAuthenticated ? (
                        <>
                            <NotificationBell />
                            <div className="dropdown">
                                <button className="dropdown-toggle profile-toggle">
                                    <span>{t('hello')}, {currentUser?.first_name || currentUser?.email || 'User'}!</span>
                                    <img
                                        src={
                                            currentUser?.profile_picture_url
                                                ? `${API_BASE_URL}${currentUser.profile_picture_url}`
                                                : `https://ui-avatars.com/api/?name=${currentUser?.first_name || 'A'}+${currentUser?.surname || 'B'}&background=b8860b&color=fff`
                                        }
                                        alt="User Avatar"
                                        className="header-avatar"
                                    />
                                </button>
                                <div className="dropdown-menu">
                                    <Link to="/profile">{t('profile')}</Link>
                                    <button onClick={handleLogout} className="logout-button-dropdown">{t('logout')}</button>
                                </div>
                            </div>
                            <div className="dropdown">
                                <button className="dropdown-toggle language-toggle">
                                    <img
                                        src={language === 'en' ? 'https://flagcdn.com/w40/us.png' : 'https://flagcdn.com/w40/gr.png'}
                                        alt={language === 'en' ? 'US Flag' : 'Greek Flag'}
                                        className="flag-icon"
                                    />
                                </button>
                                <div className="dropdown-menu">
                                    <button onClick={() => setLanguage('en')} className="language-select-button">
                                        <img src="https://flagcdn.com/w40/us.png" alt="US Flag" className="flag-icon-small" /> English
                                    </button>
                                    <button onClick={() => setLanguage('el')} className="language-select-button">
                                        <img src="https://flagcdn.com/w40/gr.png" alt="Greek Flag" className="flag-icon-small" /> Ελληνικά
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login">{t('login')}</Link>
                            <Link to="/register">{t('register')}</Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;

