// src/components/SidebarNavigation.jsx
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
    BarChart3, 
    ClipboardList, 
    Briefcase, 
    Building2, 
    Users, 
    Phone, 
    Handshake, 
    Calendar, 
    FileText, 
    UserCog, 
    TrendingUp, 
    Settings, 
    DollarSign, 
    Banknote, 
    Car, 
    User, 
    LogOut 
} from 'lucide-react';
// Removed chat hub and notification bell imports - will be placed elsewhere
import './SidebarNavigation.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bwc-portal-backend-w1qr.onrender.com';

function SidebarNavigation() {
    const { currentUser, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const userRole = currentUser?.role;
    const isAdmin = userRole === "admin";
    const canSeeContacts = ['Pillar', 'Manager', 'Head', 'admin'].includes(userRole);
    const canManageProjects = ['admin', 'Manager', 'Head'].includes(userRole);
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

    const handleCollapseToggle = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <button
                    className="collapse-toggle desktop-only"
                    onClick={handleCollapseToggle}
                    onKeyDown={(e) => handleKeyDown(e, handleCollapseToggle)}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!isCollapsed}
                >
                    <div className="burger-menu" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">
                    {(() => {
                        const url = currentUser?.profile_picture_url;
                        const absolute = url?.startsWith('http');
                        const src = url ? (absolute ? url : `${API_BASE_URL}${url}`) : null;
                        return src ? (
                            <img
                                src={src}
                                alt="Profile"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${currentUser?.first_name ?? ''} ${currentUser?.surname ?? ''}`.trim() || 'User')}&background=b8860b&color=fff&size=120`;
                                }}
                            />
                        ) : (
                            <span></span>
                        );
                    })()}
                </div>
                {!isCollapsed && (
                    <div className="user-info">
                        {/* Modified: display user's first and last name if available */}
                        <div className="user-name">
                            {`${currentUser?.first_name ?? ''} ${currentUser?.surname ?? ''}`.trim() || currentUser?.name || 'User'}
                        </div>
                        <div className="user-role">{currentUser?.role || 'Member'}</div>
                    </div>
                )}
            </div>

            {/* Chat Hub and Notification Bell removed - will be placed elsewhere */}

            <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
                <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    aria-label="Go to Dashboard"
                >
                    <div className="menu-item-content">
                        <BarChart3 className="menu-icon" aria-hidden="true" size={20} />
                        {!isCollapsed && <span className="menu-label">{t('dashboard')}</span>}
                    </div>
                </NavLink>

                <NavLink to="/tasks" className={({ isActive }) => `menu-item  ${isActive ? 'active' : ''}`}>
                    <div className="menu-item-content">
                        <ClipboardList className="menu-icon" size={20} />
                        {!isCollapsed && <span className="menu-label">{t('tasks')}</span>}
                    </div>
                </NavLink>

                {canManageProjects && (
                    <NavLink to="/projects" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                        <div className="menu-item-content">
                            <Briefcase className="menu-icon" size={20} />
                            {!isCollapsed && <span className="menu-label">{t('projects')}</span>}
                        </div>
                    </NavLink>
                )}

                <NavLink to="/companies" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                    <div className="menu-item-content">
                        <Building2 className="menu-icon" size={20} />
                        {!isCollapsed && <span className="menu-label">{t('companies')}</span>}
                    </div>
                </NavLink>

                {canSeeContacts && (
                    <React.Fragment>
                        <NavLink to="/contacts" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                            <div className="menu-item-content">
                                <Users className="menu-icon" size={20} />
                                {!isCollapsed && <span className="menu-label">{t('contacts')}</span>}
                            </div>
                        </NavLink>

                        <NavLink to="/daily-calls" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                            <div className="menu-item-content">
                                <Phone className="menu-icon" size={20} />
                                {!isCollapsed && <span className="menu-label">{t('daily_calls')}</span>}
                            </div>
                        </NavLink>
                    </React.Fragment>
                )}

                <NavLink to="/groups" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                    <div className="menu-item-content">
                        <Handshake className="menu-icon" size={20} />
                        {!isCollapsed && <span className="menu-label">{t('groups')}</span>}
                    </div>
                </NavLink>

                <NavLink to="/events" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                    <div className="menu-item-content">
                        <Calendar className="menu-icon" size={20} />
                        {!isCollapsed && <span className="menu-label">{t('events')}</span>}
                    </div>
                </NavLink>

                <NavLink to="/documents" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                    <div className="menu-item-content">
                        <FileText className="menu-icon" size={20} />
                        {!isCollapsed && <span className="menu-label">{t('documents')}</span>}
                    </div>
                </NavLink>

                {isAdmin && (
                    <React.Fragment>
                        <NavLink to="/users" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                            <div className="menu-item-content">
                                <UserCog className="menu-icon" size={20} />
                                {!isCollapsed && <span className="menu-label">{t('users')}</span>}
                            </div>
                        </NavLink>

                        <NavLink to="/reports" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                            <div className="menu-item-content">
                                <TrendingUp className="menu-icon" size={20} />
                                {!isCollapsed && <span className="menu-label">{t('reports')}</span>}
                            </div>
                        </NavLink>

                        <NavLink to="/admin-panel" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                            <div className="menu-item-content">
                                <Settings className="menu-icon" size={20} />
                                {!isCollapsed && <span className="menu-label">{t('admin_panel')}</span>}
                            </div>
                        </NavLink>

                        <NavLink to="/payments" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                            <div className="menu-item-content">
                                <DollarSign className="menu-icon" size={20} />
                                {!isCollapsed && <span className="menu-label">{t('payments')}</span>}
                            </div>
                        </NavLink>

                        <NavLink to="/commissions" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                            <div className="menu-item-content">
                                <Banknote className="menu-icon" size={20} />
                                {!isCollapsed && <span className="menu-label">{t('commissions')}</span>}
                            </div>
                        </NavLink>

                        <NavLink to="/car-finances" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                            <div className="menu-item-content">
                                <Car className="menu-icon" size={20} />
                                {!isCollapsed && <span className="menu-label">{t('car_finance')}</span>}
                            </div>
                        </NavLink>
                    </React.Fragment>
                )}
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/profile" className="footer-btn">
                    <User className="footer-icon" size={20} />
                    {!isCollapsed && <span>{t('profile')}</span>}
                </NavLink>

                <button 
                    className="footer-btn logout-btn" 
                    onClick={handleLogout}
                    onKeyDown={(e) => handleKeyDown(e, handleLogout)}
                    aria-label="Logout from application"
                >
                    <LogOut className="footer-icon" aria-hidden="true" size={20} />
                    {!isCollapsed && <span>{t('logout')}</span>}
                </button>
            </div>
        </aside>
    );
}

export default SidebarNavigation;