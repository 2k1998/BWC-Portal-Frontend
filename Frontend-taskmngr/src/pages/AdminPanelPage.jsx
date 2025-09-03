// src/pages/AdminPanelPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import './AdminPanel.css';

function AdminPanelPage() {
    const { accessToken, currentUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');

    const fetchUsers = useCallback(async (query) => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedUsers = await authApi.listAllUsers(accessToken, query);
            setUsers(fetchedUsers);
        } catch (err) {
            showNotification(err.message || 'Failed to fetch users.', 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification]);

    useEffect(() => {
        fetchUsers(searchQuery);
    }, [fetchUsers, searchQuery]);
    
    const handleToggleStatus = async (user) => {
        if (user.id === currentUser?.id) {
            showNotification("You cannot change your own status.", "warning");
            return;
        }
        try {
            await authApi.updateUserStatus(user.id, { is_active: !user.is_active }, accessToken);
            showNotification(`User status updated for ${user.email}`, 'success');
            fetchUsers(searchQuery);
        } catch (err) {
            showNotification(err.message || 'Failed to update user status.', 'error');
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedUser || !newRole) return;
        if (selectedUser.id === currentUser?.id) {
            showNotification(t('cannot_change_own_role'), "warning");
            setIsRoleModalOpen(false);
            return;
        }
        try {
            await authApi.updateUserRole(selectedUser.id, { role: newRole }, accessToken);
            showNotification(t('role_updated'), 'success');
            fetchUsers(searchQuery);
        } catch (err) {
            showNotification(err.message || 'Failed to update role.', 'error');
        }
        setIsRoleModalOpen(false);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        if (selectedUser.id === currentUser?.id) {
            showNotification(t('cannot_delete_own_account'), "warning");
            setIsDeleteModalOpen(false);
            return;
        }
        try {
            await authApi.deleteUser(selectedUser.id, accessToken);
            showNotification(t('user_deleted'), 'success');
            fetchUsers(searchQuery);
        } catch (err) {
            showNotification(err.message || 'Failed to delete user.', 'error');
        }
        setIsDeleteModalOpen(false);
    };

    const handleRoleChange = async (userId, role) => {
        if (userId === currentUser?.id) {
            showNotification(t('cannot_change_own_role'), "warning");
            return;
        }
        try {
            await authApi.updateUserRole(userId, { role }, accessToken);
            showNotification(t('role_updated'), 'success');
            fetchUsers(searchQuery);
        } catch (err) {
            showNotification(err.message || 'Failed to update role.', 'error');
        }
    };

    return (
        <div className="admin-panel-container">
            <h1>{t('user_management')}</h1>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder={t('search_users_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {loading ? <p>{t('loading')}</p> : (
                <div className="user-management-table-wrapper">
                    <table className="user-management-table">
                        <thead>
                            <tr>
                                <th>{t('id')}</th>
                                <th>{t('email')}</th>
                                <th>{t('first_name')}</th>
                                <th>{t('surname')}</th>
                                <th>{t('role')}</th>
                                <th>{t('status')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className={user.is_active ? '' : 'inactive-user'}>
                                    <td>{user.id}</td>
                                    <td>{user.email}</td>
                                    <td>{user.first_name || 'N/A'}</td>
                                    <td>{user.surname || 'N/A'}</td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="role-select"
                                        >
                                            <option value="Agent">Agent</option>
                                            <option value="Pillar">Pillar</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Head">Head</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>{user.is_active ? t('active') : t('inactive')}</td>
                                    <td>
                                        <button onClick={() => { setSelectedUser(user); setNewRole(user.role); setIsRoleModalOpen(true); }} className="action-button edit-role-button">{t('edit_role')}</button>
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            className={`action-button toggle-status-button ${user.is_active ? 'deactivate' : 'activate'}`}
                                        >
                                            {user.is_active ? t('deactivate') : t('activate')}
                                        </button>
                                        <button onClick={() => { setSelectedUser(user); setIsDeleteModalOpen(true); }} className="action-button delete-button">{t('delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={t('edit_role_for', { email: selectedUser?.email })}
                showConfirmButton={false}
                message={
                    selectedUser && (
                        <div className="modal-form-content">
                            <label>{t('new_role')}:</label>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                <option value="user">{t('user')}</option>
                                <option value="admin">{t('admin')}</option>
                            </select>
                        </div>
                    )
                }
                footer={
                    <div>
                        <button onClick={handleUpdateRole} className="modal-confirm-button">{t('update_role')}</button>
                        <button onClick={() => setIsRoleModalOpen(false)} className="modal-cancel-button">{t('cancel')}</button>
                    </div>
                }
            />
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title={t('confirm_deletion')}
                message={t('confirm_delete_user', { email: selectedUser?.email })}
                onConfirm={handleDeleteUser}
                confirmText={t('delete_permanently')}
                cancelText={t('cancel')}
            />
        </div>
    );
}

export default AdminPanelPage;