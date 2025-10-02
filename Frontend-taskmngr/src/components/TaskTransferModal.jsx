// src/components/TaskTransferModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { taskApi, authApi } from '../api/apiService';
import { X, Users, Send } from 'lucide-react';
import './TaskTransferModal.css';

function TaskTransferModal({ task, isOpen, onClose, onTransferSuccess }) {
    const { accessToken, currentUser } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        if (isOpen && accessToken) {
            fetchUsers();
        }
    }, [isOpen, accessToken]);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const allUsers = await authApi.listBasicUsers(accessToken);
            // Filter out the current user and task owner
            const filteredUsers = allUsers.filter(user => 
                user.id !== currentUser?.id && 
                user.id !== task?.owner_id
            );
            setUsers(filteredUsers);
        } catch (error) {
            showNotification('Failed to load users', 'error');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!selectedUserId) {
            showNotification('Please select a user to transfer the task to', 'error');
            return;
        }

        try {
            setLoading(true);
            const transferData = {
                task_id: task.id,
                assigned_to_id: parseInt(selectedUserId),
                message: message.trim() || undefined
            };

            await taskApi.transferTask(transferData, accessToken);
            showNotification('Task transferred successfully!', 'success');
            onTransferSuccess?.();
            onClose();
        } catch (error) {
            showNotification(error.message || 'Failed to transfer task', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedUserId('');
        setMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="task-transfer-modal-overlay">
            <div className="task-transfer-modal">
                <div className="modal-header">
                    <div className="header-content">
                        <Users className="header-icon" size={20} />
                        <h3>Transfer Task</h3>
                    </div>
                    <button 
                        type="button" 
                        className="close-btn"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="task-info">
                        <h4>{task?.title}</h4>
                        {task?.description && (
                            <p className="task-description">{task.description}</p>
                        )}
                    </div>

                    <form onSubmit={handleTransfer} className="transfer-form">
                        <div className="form-group">
                            <label htmlFor="user-select">
                                Transfer to: <span className="required">*</span>
                            </label>
                            <select
                                id="user-select"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                disabled={loadingUsers || loading}
                                className="form-select"
                                required
                            >
                                <option value="">
                                    {loadingUsers ? 'Loading users...' : 'Select a user'}
                                </option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || `${user.first_name} ${user.surname}`.trim() || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">
                                Message (optional):
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Add a message explaining why you're transferring this task..."
                                className="form-textarea"
                                rows={3}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="btn btn-secondary"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || !selectedUserId}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner" />
                                        Transferring...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Transfer Task
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TaskTransferModal;
