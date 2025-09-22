// src/pages/UsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import PermissionManager from '../components/PermissionManager';
import { Settings, User, Shield, Eye } from 'lucide-react';
import './Users.css';

function UsersPage() {
    const { accessToken, currentUser, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();
    const { language, t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTrigger, setSearchTrigger] = useState(0);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPermissionManager, setShowPermissionManager] = useState(false);

    const isAdmin = currentUser?.role === "admin";

    const tr = (key, elFallback, enFallback) => {
        const v = t(key);
        if (v && v !== key) return v;
        return language === 'el' ? elFallback : enFallback;
    };

    const roleLabel = (role) => {
        if (!role) return '';
        const map = {
            admin: t('admin') || (language === 'el' ? 'Διαχειριστής' : 'Admin'),
            user: t('user') || (language === 'el' ? 'Χρήστης' : 'User'),
            manager: t('manager') || (language === 'el' ? 'Διαχειριστής Ομάδας' : 'Manager'),
            head: t('head') || (language === 'el' ? 'Επικεφαλής' : 'Head'),
            pillar: t('pillar') || (language === 'el' ? 'Pillar' : 'Pillar'),
            member: t('member') || (language === 'el' ? 'Μέλος' : 'Member'),
        };
        return map[role] || role;
    };

    const fetchUsers = useCallback(async (search) => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedUsers = await authApi.listAllUsers(accessToken, search);
            setUsers(fetchedUsers);
        } catch (err) {
            showNotification(err.message || t('failed_to_fetch_users'), 'error');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification, t]);

    useEffect(() => {
        if (!authLoading && accessToken && isAdmin) {
            fetchUsers(searchQuery);
        } else if (!authLoading && !isAdmin) {
            showNotification(t('access_denied') || "You are not authorized to view this page.", "error");
            setLoading(false);
        }
    }, [accessToken, authLoading, isAdmin, fetchUsers, searchTrigger, searchQuery, showNotification]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setSearchTrigger(prev => prev + 1);
        }
    };

    const handleSearchButtonClick = () => {
        setSearchTrigger(prev => prev + 1);
    };

    const handleManagePermissions = (user) => {
        setSelectedUser(user);
        setShowPermissionManager(true);
    };

    const handleClosePermissionManager = () => {
        setShowPermissionManager(false);
        setSelectedUser(null);
    };

    const handleSavePermissions = async (userId, permissions) => {
        try {
            await authApi.updateUserPermissions(userId, permissions, accessToken);
            showNotification(t('permissions_updated_successfully') || 'Permissions updated successfully', 'success');
            
            // Update the user in the local state
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === userId 
                        ? { ...user, permissions } 
                        : user
                )
            );
            
            setShowPermissionManager(false);
            setSelectedUser(null);
        } catch (error) {
            showNotification(error.message || t('failed_to_update_permissions') || 'Failed to update permissions', 'error');
        }
    };

    const getPermissionSummary = (user) => {
        // Admin users automatically have all permissions
        if (user.role === 'admin') {
            return 'Admin (All)';
        }
        
        const permissions = user.permissions || {};
        const totalPages = 16; // Total number of pages
        const enabledPages = Object.values(permissions).filter(Boolean).length;
        return `${enabledPages}/${totalPages}`;
    };

    if (authLoading || loading) {
        return <div className="loading-spinner">{t('loading')}</div>;
    }

    if (!isAdmin) {
        return <div className="error-message">{t('access_denied')}</div>;
    }

    return (
        <div className="users-container">
            <div className="users-header">
                <h1>{tr('user_management', 'Διαχείριση Χρηστών', 'User Management')}</h1>
                <p className="users-subtitle">{tr('manage_user_permissions_and_access', 'Διαχείριση δικαιωμάτων και πρόσβασης χρηστών', 'Manage user permissions and access')}</p>
            </div>
            
            <div className="search-bar">
                <input
                    type="text"
                    placeholder={tr('search_by_email_or_name', 'Αναζήτηση με email ή όνομα...', 'Search by email or name')}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={handleSearchButtonClick}>
                    {tr('search', 'Αναζήτηση', 'Search')}
                </button>
            </div>

            <div className="users-grid">
                {users.map(user => (
                    <div key={user.id} className="user-card">
                        <div className="user-card-header">
                            <div className="user-avatar">
                                <User size={24} />
                            </div>
                            <div className="user-info">
                                <h3>{user.full_name || t('no_name_set')}</h3>
                                <p className="user-email">{user.email}</p>
                            </div>
                            <div className="user-role-badge">
                                <Shield size={16} />
                                {roleLabel(user.role)}
                            </div>
                        </div>
                        
                        <div className="user-card-body">
                            <div className="user-details">
                                <div className="detail-item">
                                    <span className="detail-label">{tr('user_id', 'ID Χρήστη', 'User ID')}:</span>
                                    <span className="detail-value">{user.id}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">{tr('permissions', 'Δικαιώματα', 'Permissions')}:</span>
                                    <span className="detail-value">{getPermissionSummary(user)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="user-card-actions">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleManagePermissions(user)}
                            >
                                <Settings size={16} />
                                {tr('manage_permissions', 'Διαχείριση Δικαιωμάτων', 'Manage Permissions')}
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleManagePermissions(user)}
                            >
                                <Eye size={16} />
                                {t('view_details')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {users.length === 0 && (
                <div className="no-users">
                    <User size={48} />
                    <h3>{t('no_users_found')}</h3>
                    <p>{t('try_different_search_terms')}</p>
                </div>
            )}

            <PermissionManager
                user={selectedUser}
                isOpen={showPermissionManager}
                onClose={handleClosePermissionManager}
                onSave={handleSavePermissions}
            />
        </div>
    );
}

export default UsersPage;