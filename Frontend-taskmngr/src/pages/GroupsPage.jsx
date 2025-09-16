// src/pages/GroupsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupApi, authApi } from '../api/apiService';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './Groups.css';

function GroupsPage() {
    const { accessToken, currentUser, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const [groups, setGroups] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newGroupName, setNewGroupName] = useState('');

    const isAdmin = currentUser?.role === "admin";

    const fetchGroups = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedGroups = await groupApi.getGroups(accessToken);
            console.log('Fetched groups:', fetchedGroups); // Debug log
            setGroups(fetchedGroups);
        } catch (err) {
            showNotification(err.message || t('failed_to_fetch_groups'), 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification, t]);

    const fetchAllUsers = useCallback(async () => {
        if (!accessToken || !isAdmin) return;
        try {
            const users = await authApi.listAllUsers(accessToken);
            setAllUsers(users);
        } catch (err) {
            showNotification(err.message || t('failed_to_fetch_users'), 'error');
        }
    }, [accessToken, isAdmin, showNotification, t]);

    useEffect(() => {
        if (!authLoading && accessToken) {
            fetchGroups();
            if (isAdmin) {
                fetchAllUsers();
            }
        }
    }, [accessToken, authLoading, isAdmin, fetchGroups, fetchAllUsers]);

    const handleUserSelect = (userId) => {
        setSelectedUserIds((prevSelected) => {
            if (prevSelected.includes(userId)) {
                return prevSelected.filter((id) => id !== userId);
            } else {
                return [...prevSelected, userId];
            }
        });
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) {
            showNotification(t('group_name_required'), 'error');
            return;
        }
        try {
            const createdGroup = await groupApi.createGroup({ name: newGroupName }, accessToken);
            showNotification(t('group_created_success', { name: createdGroup.name }), 'success');
            if (selectedUserIds.length > 0) {
                for (const userId of selectedUserIds) {
                    try {
                        await groupApi.addUserToGroup(createdGroup.id, userId, accessToken);
                    } catch {
                        showNotification(t('failed_to_add_user_to_group', { userId, group: createdGroup.name }),'warning');
                    }
                }
            }
            fetchGroups();
            setNewGroupName('');
            setSelectedUserIds([]);
        } catch (err) {
            showNotification(err.message || t('failed_to_create_group'), 'error');
        }
    };

    const handleDeleteGroup = async (groupId, groupName) => {
        if (!window.confirm(t('confirm_delete_group', { name: groupName }))) {
            return;
        }
        try {
            await groupApi.deleteGroup(groupId, accessToken);
            setGroups(groups.filter(group => group.id !== groupId));
            showNotification(t('group_deleted_success', { name: groupName }),'success');
        } catch (err) {
            showNotification(err.message || t('failed_to_delete_group'), 'error');
        }
    };

    if (authLoading || loading) {
        return <div className="loading-spinner">{t('loading')}</div>;
    }

    return (
        <div className="groups-container">
            <h1>{t('manage_groups')}</h1>
            <div className="group-main-content">
                {isAdmin && (
                    <form onSubmit={handleCreateGroup} className="create-group-form">
                        <h3>{t('create_new_group')}</h3>
                        <div className="form-group">
                            <label htmlFor="groupName">{t('group_name')}:</label>
                            <input type="text" id="groupName" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>{t('users')}:</label>
                            <div className="user-selection-section">
                                {allUsers.length === 0 ? ( <p>{t('no_users_found')}</p> ) : (
                                    <div className="user-checkbox-list">
                                        {allUsers.map(user => (
                                            <div key={user.id} className="user-checkbox-item">
                                                <input type="checkbox" id={`user-${user.id}`} value={user.id} checked={selectedUserIds.includes(user.id)} onChange={() => handleUserSelect(user.id)} disabled={user.id === currentUser?.id} />
                                                <label htmlFor={`user-${user.id}`}>{user.full_name || t('no_name_set')} {user.id === currentUser?.id && `(${t('you_auto_added')})`}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="submit">{t('create_group')}</button>
                    </form>
                )}
                <div className="group-list">
                    <h2>{t('existing_groups')}</h2>
                    {groups.length === 0 ? (
                        <p>{t('no_groups_found')}</p>
                    ) : (
                        groups.map(group => (
                            <div key={group.id} className="group-item">
                                <Link to={`/groups/${group.id}`} className="group-name-link">{group.name}</Link>
                                {/* Display team head if available */}
                                {(() => {
                                    const computedHead = group.head || (group.members || []).find(m => m.role === 'Head');
                                    return computedHead ? (
                                        <div className="group-head-display">
                                            {t('head')}: {computedHead.first_name || ''} {computedHead.surname || ''}
                                            <span className="role-badge">{computedHead.role}</span>
                                        </div>
                                    ) : null;
                                })()}
                                <div className="group-actions">
                                    {isAdmin && (<button onClick={() => handleDeleteGroup(group.id, group.name)} className="action-button delete-button">{t('delete')}</button>)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default GroupsPage;