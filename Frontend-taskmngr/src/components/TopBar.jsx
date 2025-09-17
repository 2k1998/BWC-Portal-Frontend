// src/components/TopBar.jsx - Top navigation bar with chat and notifications
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import EnhancedNotificationBell from './EnhancedNotificationBell';
import ChatHub from './ChatHub';
import { Building2, Globe } from 'lucide-react';
import './TopBar.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bwc-portal-backend-w1qr.onrender.com';

function TopBar() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="top-bar">
            <div className="top-bar-left">
                <Link to="/dashboard" className="top-bar-logo">
                    {(() => {
                        const envLogo = import.meta.env.VITE_APP_LOGO_URL;
                        const cloudinaryDefault = 'https://res.cloudinary.com/bwcportal/image/upload/v1758100836/M-BRID.LG-CMYK_Logo-Slogan_page-0001_pgcw9a.png';
                        const fileFallback = '/logo.png';
                        const logoUrl = (envLogo && envLogo.trim().length > 0) ? envLogo : cloudinaryDefault;
                        return (
                            <img
                                src={logoUrl}
                                alt="Company Logo"
                                className="topbar-logo-img"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = fileFallback;
                                }}
                            />
                        );
                    })()}
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
                            <Globe className="language-icon" size={20} />
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
