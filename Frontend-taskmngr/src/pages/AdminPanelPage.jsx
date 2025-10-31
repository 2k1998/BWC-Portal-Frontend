// src/pages/AdminPanelPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import { fetchDepartments, createDepartment } from '../services/departments';
import './AdminPanel.css';

function AdminPanelPage() {
    const { accessToken, currentUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    // Removed separate role edit modal to avoid conflicting setters
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [newDepartment, setNewDepartment] = useState('');
    const [departmentSubmitting, setDepartmentSubmitting] = useState(false);

    const fetchUsers = useCallback(async (query) => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedUsers = await authApi.listAllUsers(accessToken, query);
            setUsers(fetchedUsers);
        } catch (err) {
            showNotification(err.message || t('failed_to_fetch_users'), 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification]);

    useEffect(() => {
        fetchUsers(searchQuery);
    }, [fetchUsers, searchQuery]);
    
    const loadDepartments = useCallback(async () => {
        try {
            const list = await fetchDepartments();
            setDepartments(list);
        } catch (err) {
            console.warn('Failed to load departments', err);
        }
    }, []);

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    const handleToggleStatus = async (user) => {
        if (user.id === currentUser?.id) {
            showNotification(t('cannot_change_status_self'), 'warning');
            return;
        }
        try {
            await authApi.updateUserStatus(user.id, { is_active: !user.is_active }, accessToken);
            showNotification(t('user_status_updated', { email: user.email }), 'success');
            fetchUsers(searchQuery);
        } catch (err) {
            showNotification(err.message || t('failed_to_update_user_status'), 'error');
        }
    };

    // Removed handleUpdateRole; role changes now happen inline via dropdown only

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
            showNotification(err.message || t('failed_to_delete_user'), 'error');
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
            showNotification(err.message || t('failed_to_update_role'), 'error');
        }
    };

    const handleCreateDepartment = async (event) => {
        event.preventDefault();
        const trimmed = newDepartment.trim();
        if (!trimmed) {
            showNotification(t('department_name_required') || 'Department name is required.', 'warning');
            return;
        }
        if (!accessToken) {
            showNotification(t('auth_required') || 'Authentication required.', 'error');
            return;
        }

        setDepartmentSubmitting(true);
        try {
            await createDepartment(trimmed, accessToken);
            showNotification(t('department_created'), 'success');
            setNewDepartment('');
            loadDepartments();
        } catch (err) {
            showNotification(err.message || t('failed_to_create_department'), 'error');
        } finally {
            setDepartmentSubmitting(false);
        }
    };

    return (
        <div className="admin-panel-container">
            <h1>{t('user_management')}</h1>
            <section className="department-management-card">
                <h2>{t('department_management') || 'Department Management'}</h2>
                <form className="department-form" onSubmit={handleCreateDepartment}>
                    <input
                        type="text"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        placeholder={t('enter_department_name') || 'Enter department name'}
                    />
                    <button type="submit" disabled={departmentSubmitting}>
                        {departmentSubmitting ? (t('saving') || 'Saving...') : (t('add_department') || 'Add Department')}
                    </button>
                </form>
                <div className="department-list-wrapper">
                    {departments.length === 0 ? (
                        <p className="department-empty">{t('no_departments_found') || 'No departments found yet.'}</p>
                    ) : (
                        <ul className="department-list">
                            {departments.map((dept) => (
                                <li key={dept.id || dept.name}>{dept.name}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
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
                                {/* Removed ID column for privacy */}
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
                                    {/* ID column removed */}
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
                                        {/* Removed separate role edit button to prevent conflicts */}
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
            {/* Role edit modal removed */}
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