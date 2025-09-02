// src/pages/UsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../context/useAuth';
import { authApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './Users.css';

function UsersPage() {
    const { accessToken, currentUser, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTrigger, setSearchTrigger] = useState(0);

    const isAdmin = currentUser?.role === "admin";

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

    if (authLoading || loading) {
        return <div className="loading-spinner">{t('loading')}</div>;
    }

    if (!isAdmin) {
        return <div className="error-message">{t('access_denied')}</div>;
    }

    return (
        <div className="users-container">
            <h1>{t('user_management')}</h1>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder={t('search_by_email_or_name') || 'Search by email or name'}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={handleSearchButtonClick}>
                    {t('search')}
                </button>
            </div>
            <div className="user-list">
                {users.map(user => (
                    <div key={user.id} className="user-item">
                        <span><strong>ID:</strong> {user.id}</span>
                        <span><strong>{t('email')}:</strong> {user.email}</span>
                        <span><strong>{t('name')}:</strong> {user.full_name || t('no_name_set')}</span>
                        <span><strong>{t('role')}:</strong> {user.role}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default UsersPage;