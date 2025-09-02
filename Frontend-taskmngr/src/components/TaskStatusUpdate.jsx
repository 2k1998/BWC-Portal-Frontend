// src/components/TaskStatusUpdate.jsx
import React, { useState } from 'react';
import useAuth from '../context/useAuth';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { taskApi } from '../api/apiService';
import './TaskStatusUpdate.css';

const TASK_STATUS_OPTIONS = [
    { value: 'new', label: 'New', color: '#718096' },
    { value: 'received', label: 'Received', color: '#3182ce' },
    { value: 'on_process', label: 'On Process', color: '#ed8936' },
    { value: 'pending', label: 'Pending', color: '#d69e2e' },
    { value: 'completed', label: 'Completed', color: '#38a169' },
    { value: 'loose_end', label: 'Loose End', color: '#e53e3e' }
];

function TaskStatusUpdate({ task, onStatusUpdated, compact = false }) {
    const { accessToken, currentUser } = useAuth();
    const { showNotification } = useNotification();
    useLanguage();
    
    const [isUpdating, setIsUpdating] = useState(false);
    const [showStatusForm, setShowStatusForm] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(task.status || 'new');
    const [statusComments, setStatusComments] = useState('');

    // Check if current user can update this task status
    const canUpdateStatus = () => {
        if (currentUser?.role === 'admin') return true;
        if (task.owner_id === currentUser?.id) return true;
        // Check if user is in the task's group (you'll need to implement this check)
        return false;
    };

    const getStatusInfo = (status) => {
        return TASK_STATUS_OPTIONS.find(option => option.value === status) || TASK_STATUS_OPTIONS[0];
    };

    const handleStatusUpdate = async () => {
        if (selectedStatus === 'loose_end' && !statusComments.trim()) {
            showNotification('Comments are required when setting status to "Loose End"', 'error');
            return;
        }

        setIsUpdating(true);
        try {
            const updateData = {
                status: selectedStatus,
                status_comments: statusComments.trim() || null
            };

            await taskApi.updateTaskStatus(task.id, updateData, accessToken);
            showNotification('Task status updated successfully!', 'success');
            
            // Reset form
            setShowStatusForm(false);
            setStatusComments('');
            
            // Notify parent component
            if (onStatusUpdated) {
                onStatusUpdated();
            }
        } catch (error) {
            showNotification(error.message || 'Failed to update task status', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const statusInfo = getStatusInfo(task.status);

    if (compact) {
        // Compact view - just show the status badge
        return (
            <div className="task-status-compact">
                <span 
                    className="status-badge" 
                    style={{ backgroundColor: statusInfo.color }}
                    title={`Status: ${statusInfo.label}${task.status_comments ? ` - ${task.status_comments}` : ''}`}
                >
                    {statusInfo.label}
                </span>
            </div>
        );
    }

    return (
        <div className="task-status-update">
            <div className="current-status">
                <h4>Current Status</h4>
                <div className="status-display">
                    <span 
                        className="status-badge large" 
                        style={{ backgroundColor: statusInfo.color }}
                    >
                        {statusInfo.label}
                    </span>
                    {task.status_updated_at && (
                        <div className="status-meta">
                            <small>
                                Updated: {new Date(task.status_updated_at).toLocaleString()}
                            </small>
                        </div>
                    )}
                </div>
                
                {task.status_comments && (
                    <div className="status-comments">
                        <strong>Comments:</strong>
                        <p>{task.status_comments}</p>
                    </div>
                )}
            </div>

            {canUpdateStatus() && (
                <div className="status-update-section">
                    {!showStatusForm ? (
                        <button 
                            onClick={() => setShowStatusForm(true)}
                            className="update-status-btn"
                        >
                            Update Status
                        </button>
                    ) : (
                        <div className="status-form">
                            <h4>Update Task Status</h4>
                            
                            <div className="form-group">
                                <label htmlFor="status-select">New Status:</label>
                                <select 
                                    id="status-select"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="status-select"
                                >
                                    {TASK_STATUS_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {(selectedStatus === 'loose_end' || statusComments) && (
                                <div className="form-group">
                                    <label htmlFor="status-comments">
                                        Comments {selectedStatus === 'loose_end' && <span className="required">*</span>}:
                                    </label>
                                    <textarea
                                        id="status-comments"
                                        value={statusComments}
                                        onChange={(e) => setStatusComments(e.target.value)}
                                        placeholder={
                                            selectedStatus === 'loose_end' 
                                                ? "Please explain why this task has hit a loose end..."
                                                : "Optional comments about the status change..."
                                        }
                                        rows="4"
                                        className="status-comments-textarea"
                                        required={selectedStatus === 'loose_end'}
                                    />
                                </div>
                            )}

                            <div className="form-actions">
                                <button 
                                    onClick={handleStatusUpdate}
                                    disabled={isUpdating}
                                    className="save-status-btn"
                                >
                                    {isUpdating ? 'Updating...' : 'Update Status'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowStatusForm(false);
                                        setSelectedStatus(task.status);
                                        setStatusComments('');
                                    }}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TaskStatusUpdate;