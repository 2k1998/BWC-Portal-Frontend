// src/components/TopBar.jsx - Top navigation bar with chat and notifications
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import EnhancedNotificationBell from './EnhancedNotificationBell';
import ChatHub from './ChatHub';
import './TopBar.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bwc-portal-backend-w1qr.onrender.com';

function TopBar() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="top-bar">
            <div className="top-bar-left">
                <Link to="/dashboard" className="top-bar-logo">
                    <span className="logo-icon">🏢</span>
                    <span className="logo-text">BWC Portal</span>
                </Link>
            </div>

            <div className="top-bar-center">
                {/* Optional: Add search bar or navigation items here */}
            </div>

            <div className="top-bar-right">
                <div className="top-bar-actions">
                    {/* Chat Hub */}
                    <div className="top-bar-item">
                        <ChatHub />
                    </div>

                    {/* Notification Bell */}
                    <div className="top-bar-item">
                        <EnhancedNotificationBell />
                    </div>

                    {/* Language Toggle */}
                    <div className="top-bar-item">
                        <button 
                            className="language-toggle"
                            onClick={() => setLanguage(language === 'en' ? 'el' : 'en')}
                            title="Switch Language"
                        >
                            <span className="language-icon">🌐</span>
                            <span className="language-text">
                                {language === 'en' ? 'EN' : 'ΕΛ'}
                            </span>
                        </button>
                    </div>

                    {/* Profile section completely removed */}
                </div>
            </div>
        </div>
    );
}

export default TopBar;
