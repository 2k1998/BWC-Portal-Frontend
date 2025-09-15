// components/TaskAssignmentNotification.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { taskManagementApi } from '../api/taskManagementApi';
import './TaskAssignmentNotification.css';

const TaskAssignmentNotification = ({ assignment, onUpdate, onClose }) => {
    const { accessToken } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
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
                action === 'accept' ? t('task_accepted_success') :
                action === 'reject' ? t('task_rejected_success') :
                t('discussion_started_success'),
                'success'
            );
            
            onUpdate?.();
            onClose?.();
        } catch (error) {
            showNotification(error.message || t('failed_to_respond_assignment'), 'error');
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
                        {t('assigned_by')}: <strong>{assignment.assigned_by.full_name}</strong>
                    </p>
                    <p className="assignment-date">
                        {formatDate(assignment.assigned_at)}
                    </p>
                </div>
                <div className="task-priority">
                    {assignment.task.urgency && (
                        <span className="priority-badge urgent">{t('urgent')}</span>
                    )}
                    {assignment.task.important && (
                        <span className="priority-badge important">{t('important')}</span>
                    )}
                </div>
            </div>

            {assignment.task.description && (
                <div className="task-description">
                    <h4>{t('description')}:</h4>
                    <p>{assignment.task.description}</p>
                </div>
            )}

            {assignment.assignment_message && (
                <div className="assignment-message">
                    <h4>{t('message_from')} {assignment.assigned_by.full_name}:</h4>
                    <p className="message-content">{assignment.assignment_message}</p>
                </div>
            )}

            {assignment.task.deadline && (
                <div className="task-deadline">
                    <h4>{t('deadline')}:</h4>
                    <p className="deadline-date">
                        {formatDate(assignment.task.deadline)}
                        {new Date(assignment.task.deadline) < new Date() && (
                            <span className="overdue-indicator"> ({t('overdue')})</span>
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
                            {loading ? t('accepting') : t('accept_task')}
                        </button>
                        
                        <button
                            onClick={() => setShowRejectForm(true)}
                            disabled={loading}
                            className="btn-reject"
                        >
                            {t('reject_task')}
                        </button>
                        
                        <button
                            onClick={() => setShowDiscussForm(true)}
                            disabled={loading}
                            className="btn-discuss"
                        >
                            {t('discuss_task')}
                        </button>
                    </>
                )}

                {showRejectForm && (
                    <div className="response-form reject-form">
                        <h4>{t('reject_task')}</h4>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={t('provide_rejection_reason')}
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
                                {loading ? t('rejecting') : t('confirm_rejection')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectForm(false);
                                    setRejectionReason('');
                                }}
                                disabled={loading}
                                className="btn-cancel"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </div>
                )}

                {showDiscussForm && (
                    <div className="response-form discuss-form">
                        <h4>{t('start_discussion')}</h4>
                        <textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            placeholder={t('discuss_task_placeholder')}
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
                                {t('continue_with_messages')}
                            </label>
                            <label className="option-label">
                                <input
                                    type="radio"
                                    name="discussionType"
                                    value="call"
                                />
                                {t('request_phone_call')}
                            </label>
                        </div>
                        <div className="form-actions">
                            <button
                                onClick={() => handleResponse('discuss')}
                                disabled={loading}
                                className="btn-submit-discuss"
                            >
                                {loading ? t('starting_discussion') : t('start_discussion')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDiscussForm(false);
                                    setResponseMessage('');
                                }}
                                disabled={loading}
                                className="btn-cancel"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskAssignmentNotification;