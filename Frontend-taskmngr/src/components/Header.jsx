// src/components/Header.jsx - Updated with task management integration
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import useAuth from '../context/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { companyApi } from '../api/apiService';
import NotificationBell from './NotificationBell';
import { taskManagementApi } from '../api/taskManagementApi';
import TaskAssignmentDashboard from './TaskAssignmentDashboard';
import './Header.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

function Header() {
    const { isAuthenticated, currentUser, logout, accessToken } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();

    const userRole = currentUser?.role;
    const isAdmin = userRole === "admin";
    const canSeeContacts = ['Pillar', 'Manager', 'Head', 'admin'].includes(userRole);
    const canManageProjects = ['admin', 'Manager', 'Head'].includes(userRole);

    const [showTaskDashboard, setShowTaskDashboard] = useState(false);
    const [taskSummary, setTaskSummary] = useState(null);
    const [, setCompanies] = useState([]);

    // Fetch companies (existing logic)
    useEffect(() => {
        if (accessToken) {
            companyApi.getAll(accessToken)
                .then(data => setCompanies(data))
                .catch(err => console.error("Header failed to fetch companies:", err));
        } else {
            setCompanies([]);
        }
    }, [accessToken]);

    // Fetch task management summary
    const fetchTaskSummary = useCallback(async () => {
        if (!accessToken) return;
        
        try {
            const summary = await taskManagementApi.getAssignmentSummary(accessToken);
            setTaskSummary(summary);
        } catch (error) {
            // Silent fail for task summary
            console.warn('Failed to fetch task summary:', error);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchTaskSummary();
            
            // Set up polling for task updates every 30 seconds
            const interval = setInterval(fetchTaskSummary, 30000);
            return () => clearInterval(interval);
        }
    }, [accessToken, fetchTaskSummary]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleTaskDashboardToggle = () => {
        setShowTaskDashboard(!showTaskDashboard);
    };

    // Calculate total urgent items
    const urgentTaskCount = taskSummary ? 
        taskSummary.pending_assignments + taskSummary.active_discussions + taskSummary.pending_calls : 0;

    return (
        <>
            <header className="app-header">
                <nav>
                    <div className="nav-left">
                        <Link to="/dashboard" className="app-title">BWC Portal</Link>
                        {isAuthenticated && (
                            <div className="main-nav-links">
                                <NavLink to="/dashboard">{t('dashboard') || 'Dashboard'}</NavLink>
                                <NavLink to="/tasks">{t('tasks') || 'Tasks'}</NavLink>
                                
                                {/* Projects link with conditional access */}
                                {canManageProjects && (
                                    <NavLink to="/projects">{t('projects') || 'Projects'}</NavLink>
                                )}
                                
                                <NavLink to="/companies">{t('companies') || 'Companies'}</NavLink>
                                
                                {canSeeContacts && (
                                    <>
                                        <NavLink to="/contacts">{t('contacts') || 'Contacts'}</NavLink>
                                        <NavLink to="/daily-calls">{t('daily_calls') || 'Daily Calls'}</NavLink>
                                    </>
                                )}
                                
                                {/* Admin-only links */}
                                {isAdmin && (
                                    <>
                                        <NavLink to="/users">{t('users') || 'Users'}</NavLink>
                                        <NavLink to="/events">{t('events') || 'Events'}</NavLink>
                                        <NavLink to="/reports">{t('reports') || 'Reports'}</NavLink>
                                        <NavLink to="/admin-panel">{t('admin_panel') || 'Admin'}</NavLink>
                                        
                                        {/* Dropdown for additional admin features */}
                                        <div className="dropdown admin-dropdown">
                                            <button className="dropdown-toggle">
                                                More ▼
                                            </button>
                                            <div className="dropdown-menu">
                                                <NavLink to="/payments">💰 Payments</NavLink>
                                                <NavLink to="/commissions">📈 Commissions</NavLink>
                                                <NavLink to="/car-finances">🚗 Car Finance</NavLink>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="nav-right">
                        {isAuthenticated ? (
                            <>
                                {/* Task Management Quick Access */}
                                <div className="task-management-section">
                                    <button 
                                        onClick={handleTaskDashboardToggle}
                                        className="task-summary-btn"
                                        title="Task Management Dashboard"
                                    >
                                        <span className="task-icon">📋</span>
                                        <span className="task-label">Tasks</span>
                                        {urgentTaskCount > 0 && (
                                            <span className="task-urgent-badge">{urgentTaskCount}</span>
                                        )}
                                    </button>
                                    
                                    {/* Quick summary tooltip on hover */}
                                    {taskSummary && urgentTaskCount > 0 && (
                                        <div className="task-summary-tooltip">
                                            {taskSummary.pending_assignments > 0 && (
                                                <div className="summary-line">
                                                    ⏳ {taskSummary.pending_assignments} pending acceptance
                                                </div>
                                            )}
                                            {taskSummary.active_discussions > 0 && (
                                                <div className="summary-line">
                                                    💬 {taskSummary.active_discussions} active discussions
                                                </div>
                                            )}
                                            {taskSummary.pending_calls > 0 && (
                                                <div className="summary-line">
                                                    📞 {taskSummary.pending_calls} pending calls
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Existing Notification Bell */}
                                <NotificationBell />
                                
                                {/* User Profile Dropdown */}
                                <div className="dropdown">
                                    <button className="dropdown-toggle profile-toggle">
                                        <span>{t('hello')}, {currentUser?.first_name || currentUser?.email || 'User'}!</span>
                                        <img
                                            src={
                                                currentUser?.profile_picture_url
                                                    ? `${API_BASE_URL}${currentUser.profile_picture_url}`
                                                    : 'https://via.placeholder.com/40x40?text=User'
                                            }
                                            alt="Profile"
                                            className="header-avatar"
                                        />
                                    </button>
                                    <div className="dropdown-menu">
                                        <NavLink to="/profile">{t('profile')}</NavLink>
                                        <div className="dropdown-divider"></div>
                                        <button onClick={handleLogout} className="logout-button-dropdown">
                                            {t('logout')}
                                        </button>
                                    </div>
                                </div>

                                {/* Language selector */}
                                <div className="dropdown">
                                    <button className="dropdown-toggle language-toggle">
                                        <img
                                            src={language === 'en' 
                                                ? 'https://flagcdn.com/w40/us.png' 
                                                : 'https://flagcdn.com/w40/gr.png'}
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

                {/* Task Summary Bar - Show when there are urgent items */}
                {isAuthenticated && taskSummary && urgentTaskCount > 0 && (
                    <div className="task-summary-bar">
                        <div className="summary-container">
                            <div className="summary-items">
                                {taskSummary.pending_assignments > 0 && (
                                    <div className="summary-item pending-item">
                                        <span className="summary-icon">⏳</span>
                                        <span className="summary-text">
                                            {taskSummary.pending_assignments} task{taskSummary.pending_assignments !== 1 ? 's' : ''} need your response
                                        </span>
                                    </div>
                                )}
                                
                                {taskSummary.active_discussions > 0 && (
                                    <div className="summary-item discussion-item">
                                        <span className="summary-icon">💬</span>
                                        <span className="summary-text">
                                            {taskSummary.active_discussions} active discussion{taskSummary.active_discussions !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}
                                
                                {taskSummary.pending_calls > 0 && (
                                    <div className="summary-item call-item">
                                        <span className="summary-icon">📞</span>
                                        <span className="summary-text">
                                            {taskSummary.pending_calls} scheduled call{taskSummary.pending_calls !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={handleTaskDashboardToggle}
                                className="view-dashboard-btn"
                            >
                                Open Dashboard →
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Task Management Dashboard Modal */}
            {showTaskDashboard && (
                <div className="modal-overlay dashboard-modal-overlay">
                    <div className="modal-content dashboard-modal-content">
                        <div className="modal-header">
                            <h3>Task Management Dashboard</h3>
                            <button
                                onClick={() => setShowTaskDashboard(false)}
                                className="modal-close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body dashboard-modal-body">
                            <TaskAssignmentDashboard />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Header; 