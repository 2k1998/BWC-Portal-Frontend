// src/components/TaskModal.jsx
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { taskApi } from '../api/apiService';
import TaskStatusUpdate from './TaskStatusUpdate';
import './TaskModal.css';

function TaskModal({ task, isOpen, onClose, onTaskUpdated }) {
    const { t } = useLanguage();
    const { accessToken, currentUser } = useAuth();

    const canEdit = !!currentUser && task?.created_by_id === currentUser.id;

    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({
        title: task?.title || '',
        description: task?.description || '',
        start_date: task?.start_date || '',
        deadline: task?.deadline || '',
        deadline_all_day: !!task?.deadline_all_day,
        urgency: !!task?.urgency,
        important: !!task?.important,
    });

    if (!isOpen || !task) return null;

    const handleStatusUpdated = () => {
        // Refresh the task data
        if (onTaskUpdated) {
            onTaskUpdated();
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleString();
    };

    const getPriorityBadge = () => {
        if (task.deadline_all_day) {
            return <span className="badge all-day-badge">{t('all_day_deadline')}</span>;
        } else if (task.urgency && task.important) {
            return <span className="badge urgent-and-important">{t('urgent_and_important')}</span>;
        } else if (task.urgency) {
            return <span className="badge urgent-only">{t('urgent_only')}</span>;
        } else if (task.important) {
            return <span className="badge important-only">{t('important_only')}</span>;
        } else {
            return <span className="badge normal">{t('normal')}</span>;
        }
    };

    const handleEditChange = (field, value) => {
        setEditValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveEdits = async () => {
        try {
            const payload = {
                title: editValues.title,
                description: editValues.description,
                start_date: editValues.start_date,
                deadline: editValues.deadline,
                deadline_all_day: editValues.deadline_all_day,
                urgency: editValues.urgency,
                important: editValues.important,
            };
            await taskApi.updateTask(task.id, payload, accessToken);
            setIsEditing(false);
            if (onTaskUpdated) onTaskUpdated();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="task-modal-overlay">
            <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEditing ? t('edit_task') || 'Edit Task' : task.title}</h2>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {canEdit && (
                            <button
                                onClick={() => setIsEditing((v) => !v)}
                                className="close-button"
                                style={{ position: 'static' }}
                                title={isEditing ? (t('cancel') || 'Cancel') : (t('edit') || 'Edit')}
                            >
                                {isEditing ? (t('cancel') || 'Cancel') : (t('edit') || 'Edit')}
                            </button>
                        )}
                        <button onClick={onClose} className="close-button">&times;</button>
                    </div>
                </div>
                
                <div className="modal-body">
                    {isEditing ? (
                        <div className="task-edit-form">
                            <div className="info-grid">
                                <div className="info-item">
                                    <label><strong>{t('title') || 'Title'}</strong></label>
                                    <input
                                        type="text"
                                        value={editValues.title}
                                        onChange={(e) => handleEditChange('title', e.target.value)}
                                    />
                                </div>
                                <div className="info-item">
                                    <label><strong>{t('description') || 'Description'}</strong></label>
                                    <textarea
                                        value={editValues.description}
                                        onChange={(e) => handleEditChange('description', e.target.value)}
                                    />
                                </div>
                                <div className="info-item">
                                    <label><strong>{t('start_date') || 'Start Date'}</strong></label>
                                    <input
                                        type="datetime-local"
                                        value={editValues.start_date ? new Date(editValues.start_date).toISOString().slice(0,16) : ''}
                                        onChange={(e) => handleEditChange('start_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                    />
                                </div>
                                <div className="info-item">
                                    <label><strong>{t('deadline') || 'Deadline'}</strong></label>
                                    <input
                                        type="datetime-local"
                                        value={editValues.deadline ? new Date(editValues.deadline).toISOString().slice(0,16) : ''}
                                        onChange={(e) => handleEditChange('deadline', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                        disabled={editValues.deadline_all_day}
                                    />
                                </div>
                                <div className="info-item">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={editValues.deadline_all_day}
                                            onChange={(e) => handleEditChange('deadline_all_day', e.target.checked)}
                                        />{' '}
                                        {t('all_day_deadline')}
                                    </label>
                                </div>
                                <div className="info-item">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={editValues.urgency}
                                            onChange={(e) => handleEditChange('urgency', e.target.checked)}
                                        />{' '}
                                        {t('urgent')}
                                    </label>
                                </div>
                                <div className="info-item">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={editValues.important}
                                            onChange={(e) => handleEditChange('important', e.target.checked)}
                                        />{' '}
                                        {t('important')}
                                    </label>
                                </div>
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                <button className="modal-confirm-button" onClick={handleSaveEdits}>{t('save') || 'Save'}</button>
                                <button className="modal-cancel-button" onClick={() => setIsEditing(false)}>{t('cancel') || 'Cancel'}</button>
                            </div>
                        </div>
                    ) : (
                    <>
                    {/* Task Basic Info */}
                    <div className="task-info-section">
                        <h3>{t('task_details')}</h3>
                        
                        <div className="info-grid">
                            <div className="info-item">
                                <strong>Description:</strong>
                                <p>{task.description || 'No description provided'}</p>
                            </div>
                            
                            <div className="info-item">
                                <strong>Start Date:</strong>
                                <p>{formatDateTime(task.start_date)}</p>
                            </div>
                            
                            <div className="info-item">
                                <strong>Deadline:</strong>
                                <p>{formatDateTime(task.deadline)}</p>
                            </div>
                            
                            <div className="info-item">
                                <strong>Priority:</strong>
                                <div>{getPriorityBadge()}</div>
                            </div>
                            
                            {task.owner && (
                                <div className="info-item">
                                    <strong>Assigned To:</strong>
                                    <p>{task.owner.full_name || `${task.owner.first_name} ${task.owner.surname}`.trim() || task.owner.email}</p>
                                </div>
                            )}
                            
                            {task.created_by && (
                                <div className="info-item">
                                    <strong>Created By:</strong>
                                    <p>{task.created_by.full_name || `${task.created_by.first_name} ${task.created_by.surname}`.trim() || task.created_by.email}</p>
                                </div>
                            )}
                            
                            {task.company && (
                                <div className="info-item">
                                    <strong>Company:</strong>
                                    <p>{task.company.name}</p>
                                </div>
                            )}
                            
                            {task.group && (
                                <div className="info-item">
                                    <strong>Group:</strong>
                                    <p>{task.group.name}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Task Status Section */}
                    <div className="task-status-section">
                        <h3>{t('task_status')}</h3>
                        <TaskStatusUpdate 
                            task={task} 
                            onStatusUpdated={handleStatusUpdated}
                        />
                    </div>
                    
                    {/* Task Timestamps */}
                    <div className="task-timestamps">
                        <div className="timestamp-item">
                            <strong>Created:</strong> {formatDateTime(task.created_at)}
                        </div>
                        <div className="timestamp-item">
                            <strong>Last Updated:</strong> {formatDateTime(task.updated_at)}
                        </div>
                    </div>
                    </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TaskModal;