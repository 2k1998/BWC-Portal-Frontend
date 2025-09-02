// components/TaskAssignmentNotification.jsx
import React, { useState } from 'react';
import useAuth from '../context/useAuth';
import { useNotification } from '../context/NotificationContext';
import { taskManagementApi } from '../api/taskManagementApi';
import './TaskAssignmentNotification.css';

const TaskAssignmentNotification = ({ assignment, onUpdate, onClose }) => {
    const { accessToken } = useAuth();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showDiscussForm, setShowDiscussForm] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const handleResponse = async (action) => {
        setLoading(true);
        try {
            const payload = {
                action,
                message: responseMessage || undefined,
                rejection_reason: action === 'reject' ? rejectionReason : undefined
            };

            await taskManagementApi.respondToAssignment(assignment.id, payload, accessToken);
            
            showNotification(
                action === 'accept' ? 'Task accepted successfully!' :
                action === 'reject' ? 'Task rejected successfully!' :
                'Discussion started successfully!',
                'success'
            );
            
            onUpdate?.();
            onClose?.();
        } catch (error) {
            showNotification(error.message || 'Failed to respond to assignment', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="task-assignment-notification">
            <div className="assignment-header">
                <div className="task-info">
                    <h3 className="task-title">{assignment.task.title}</h3>
                    <p className="assignment-from">
                        Assigned by: <strong>{assignment.assigned_by.full_name}</strong>
                    </p>
                    <p className="assignment-date">
                        {formatDate(assignment.assigned_at)}
                    </p>
                </div>
                <div className="task-priority">
                    {assignment.task.urgency && (
                        <span className="priority-badge urgent">Urgent</span>
                    )}
                    {assignment.task.important && (
                        <span className="priority-badge important">Important</span>
                    )}
                </div>
            </div>

            {assignment.task.description && (
                <div className="task-description">
                    <h4>Description:</h4>
                    <p>{assignment.task.description}</p>
                </div>
            )}

            {assignment.assignment_message && (
                <div className="assignment-message">
                    <h4>Message from {assignment.assigned_by.full_name}:</h4>
                    <p className="message-content">{assignment.assignment_message}</p>
                </div>
            )}

            {assignment.task.deadline && (
                <div className="task-deadline">
                    <h4>Deadline:</h4>
                    <p className="deadline-date">
                        {formatDate(assignment.task.deadline)}
                        {new Date(assignment.task.deadline) < new Date() && (
                            <span className="overdue-indicator"> (Overdue)</span>
                        )}
                    </p>
                </div>
            )}

            <div className="assignment-actions">
                {!showRejectForm && !showDiscussForm && (
                    <>
                        <button
                            onClick={() => handleResponse('accept')}
                            disabled={loading}
                            className="btn-accept"
                        >
                            {loading ? 'Accepting...' : 'Accept Task'}
                        </button>
                        
                        <button
                            onClick={() => setShowRejectForm(true)}
                            disabled={loading}
                            className="btn-reject"
                        >
                            Reject Task
                        </button>
                        
                        <button
                            onClick={() => setShowDiscussForm(true)}
                            disabled={loading}
                            className="btn-discuss"
                        >
                            Discuss Task
                        </button>
                    </>
                )}

                {showRejectForm && (
                    <div className="response-form reject-form">
                        <h4>Reject Task</h4>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please provide a reason for rejection..."
                            className="rejection-reason"
                            rows="3"
                            required
                        />
                        <div className="form-actions">
                            <button
                                onClick={() => handleResponse('reject')}
                                disabled={loading || !rejectionReason.trim()}
                                className="btn-submit-reject"
                            >
                                {loading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectForm(false);
                                    setRejectionReason('');
                                }}
                                disabled={loading}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {showDiscussForm && (
                    <div className="response-form discuss-form">
                        <h4>Start Discussion</h4>
                        <textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            placeholder="What would you like to discuss about this task?"
                            className="discussion-message"
                            rows="3"
                        />
                        <div className="discussion-options">
                            <label className="option-label">
                                <input
                                    type="radio"
                                    name="discussionType"
                                    value="message"
                                    defaultChecked
                                />
                                Continue with messages
                            </label>
                            <label className="option-label">
                                <input
                                    type="radio"
                                    name="discussionType"
                                    value="call"
                                />
                                Request a phone call
                            </label>
                        </div>
                        <div className="form-actions">
                            <button
                                onClick={() => handleResponse('discuss')}
                                disabled={loading}
                                className="btn-submit-discuss"
                            >
                                {loading ? 'Starting Discussion...' : 'Start Discussion'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDiscussForm(false);
                                    setResponseMessage('');
                                }}
                                disabled={loading}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskAssignmentNotification;