// src/components/TaskModal.jsx
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import TaskStatusUpdate from './TaskStatusUpdate';
import './TaskModal.css';

function TaskModal({ task, isOpen, onClose, onTaskUpdated }) {
    const { t } = useLanguage();

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
            return <span className="badge all-day-badge">All Day Deadline</span>;
        } else if (task.urgency && task.important) {
            return <span className="badge urgent-and-important">Urgent & Important</span>;
        } else if (task.urgency) {
            return <span className="badge urgent-only">Urgent</span>;
        } else if (task.important) {
            return <span className="badge important-only">Important</span>;
        } else {
            return <span className="badge normal">Normal</span>;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{task.title}</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                
                <div className="modal-body">
                    {/* Task Basic Info */}
                    <div className="task-info-section">
                        <h3>Task Details</h3>
                        
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
                        <h3>Task Status</h3>
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
                </div>
            </div>
        </div>
    );
}

export default TaskModal;