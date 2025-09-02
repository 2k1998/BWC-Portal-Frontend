// components/TaskAssignmentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../context/useAuth';
import { useNotification } from '../context/NotificationContext';
import { taskManagementApi } from '../api/taskManagementApi';
import TaskAssignmentNotification from './TaskAssignmentNotification';
import TaskConversation from './TaskConversation';
import './TaskAssignmentDashboard.css';

const TaskAssignmentDashboard = () => {
    const { accessToken } = useAuth();
    const { showNotification } = useNotification();
    
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Data states
    const [pendingAssignments, setPendingAssignments] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);
    const [assignedByMe, setAssignedByMe] = useState([]);
    const [summary, setSummary] = useState(null);
    const [taskNotifications, setTaskNotifications] = useState([]);
    
    // UI states
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showConversation, setShowConversation] = useState(false);
    const [conversationAssignmentId, setConversationAssignmentId] = useState(null);

    const fetchAllData = useCallback(async () => {
        if (!accessToken) return;
        
        setLoading(true);
        try {
            const [
                pendingData,
                myAssignmentsData,
                assignedByMeData,
                summaryData,
                notificationsData
            ] = await Promise.all([
                taskManagementApi.getPendingAssignments(accessToken),
                taskManagementApi.getMyAssignments({}, accessToken),
                taskManagementApi.getMyAssignments({ assigned_by_me: true }, accessToken),
                taskManagementApi.getAssignmentSummary(accessToken),
                taskManagementApi.getTaskNotifications({ unread_only: true, limit: 10 }, accessToken)
            ]);
            
            setPendingAssignments(pendingData);
            setMyAssignments(myAssignmentsData);
            setAssignedByMe(assignedByMeData);
            setSummary(summaryData);
            setTaskNotifications(notificationsData);
        } catch (error) {
            const message = error && error.message ? error.message : 'Unknown error';
            showNotification(`Failed to load task assignment data: ${message}`, 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [accessToken, showNotification]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const refreshData = () => {
        setRefreshing(true);
        fetchAllData();
    };

    const handleViewAssignment = (assignment) => {
        setSelectedAssignment(assignment);
    };

    const handleStartConversation = (assignmentId) => {
        setConversationAssignmentId(assignmentId);
        setShowConversation(true);
    };

    const handleAssignmentUpdate = () => {
        setSelectedAssignment(null);
        refreshData();
    };

    const handleConversationComplete = () => {
        setShowConversation(false);
        setConversationAssignmentId(null);
        refreshData();
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'pending_acceptance': 'status-pending',
            'accepted': 'status-accepted',
            'rejected': 'status-rejected',
            'discussion_requested': 'status-discussion',
            'discussion_active': 'status-discussion-active',
            'discussion_completed': 'status-completed'
        };
        return statusClasses[status] || 'status-default';
    };

    const formatDate = (dateString) => {
        return taskManagementApi.formatAssignmentDate(dateString);
    };

    if (loading) {
        return (
            <div className="task-assignment-loading">
                <div className="loading-spinner">Loading task assignments...</div>
            </div>
        );
    }

    return (
        <div className="task-assignment-dashboard">
            {/* Header with Summary Cards */}
            <div className="dashboard-header">
                <div className="header-content">
                    <h2>Task Management</h2>
                    <button 
                        onClick={refreshData} 
                        disabled={refreshing}
                        className="btn-refresh"
                    >
                        {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
                    </button>
                </div>
                
                {summary && (
                    <div className="summary-cards">
                        <div className="summary-card pending">
                            <div className="card-icon">⏳</div>
                            <div className="card-content">
                                <div className="card-number">{summary.pending_assignments}</div>
                                <div className="card-label">Pending Acceptance</div>
                            </div>
                        </div>
                        
                        <div className="summary-card discussions">
                            <div className="card-icon">💬</div>
                            <div className="card-content">
                                <div className="card-number">{summary.active_discussions}</div>
                                <div className="card-label">Active Discussions</div>
                            </div>
                        </div>
                        
                        <div className="summary-card calls">
                            <div className="card-icon">📞</div>
                            <div className="card-content">
                                <div className="card-number">{summary.pending_calls}</div>
                                <div className="card-label">Pending Calls</div>
                            </div>
                        </div>
                        
                        <div className="summary-card assigned">
                            <div className="card-icon">📋</div>
                            <div className="card-content">
                                <div className="card-number">{summary.total_assigned_to_me}</div>
                                <div className="card-label">Assigned to Me</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                >
                    Pending Acceptance ({pendingAssignments.length})
                </button>
                <button
                    onClick={() => setActiveTab('my-assignments')}
                    className={`tab-btn ${activeTab === 'my-assignments' ? 'active' : ''}`}
                >
                    My Assignments ({myAssignments.length})
                </button>
                <button
                    onClick={() => setActiveTab('assigned-by-me')}
                    className={`tab-btn ${activeTab === 'assigned-by-me' ? 'active' : ''}`}
                >
                    Assigned by Me ({assignedByMe.length})
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                >
                    Notifications ({taskNotifications.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'pending' && (
                    <div className="pending-assignments">
                        {pendingAssignments.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">✅</div>
                                <h3>No Pending Assignments</h3>
                                <p>You're all caught up! No tasks waiting for your response.</p>
                            </div>
                        ) : (
                            <div className="assignments-grid">
                                {pendingAssignments.map((assignment) => (
                                    <div key={assignment.id} className="assignment-card pending-card">
                                        <div className="assignment-header">
                                            <h4 className="task-title">{assignment.task.title}</h4>
                                            <span className={`status-badge ${getStatusBadgeClass(assignment.assignment_status)}`}>
                                                {taskManagementApi.getAssignmentStatusText(assignment.assignment_status)}
                                            </span>
                                        </div>
                                        
                                        <div className="assignment-details">
                                            <p className="assigned-by">
                                                From: <strong>{assignment.assigned_by.full_name}</strong>
                                            </p>
                                            <p className="assigned-date">
                                                {formatDate(assignment.assigned_at)}
                                            </p>
                                            
                                            {assignment.assignment_message && (
                                                <div className="assignment-message">
                                                    <p>"{assignment.assignment_message}"</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="assignment-actions">
                                            <button
                                                onClick={() => handleViewAssignment(assignment)}
                                                className="btn-view-assignment"
                                            >
                                                View & Respond
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'my-assignments' && (
                    <div className="my-assignments">
                        {myAssignments.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <h3>No Assignments</h3>
                                <p>You haven't been assigned any tasks yet.</p>
                            </div>
                        ) : (
                            <div className="assignments-list">
                                {myAssignments.map((assignment) => (
                                    <div key={assignment.id} className="assignment-row">
                                        <div className="assignment-info">
                                            <div className="task-title-row">
                                                <h4>{assignment.task.title}</h4>
                                                <span className={`status-badge ${getStatusBadgeClass(assignment.assignment_status)}`}>
                                                    {taskManagementApi.getAssignmentStatusText(assignment.assignment_status)}
                                                </span>
                                            </div>
                                            <div className="assignment-meta">
                                                <span>From: {assignment.assigned_by.full_name}</span>
                                                <span>•</span>
                                                <span>{formatDate(assignment.assigned_at)}</span>
                                                {assignment.response_at && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Responded: {formatDate(assignment.response_at)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="assignment-actions">
                                            {(assignment.assignment_status === 'discussion_active' || 
                                              assignment.assignment_status === 'discussion_requested') && (
                                                <button
                                                    onClick={() => handleStartConversation(assignment.id)}
                                                    className="btn-conversation"
                                                >
                                                    💬 Open Chat
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleViewAssignment(assignment)}
                                                className="btn-view-details"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'assigned-by-me' && (
                    <div className="assigned-by-me">
                        {assignedByMe.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">👥</div>
                                <h3>No Assignments Made</h3>
                                <p>You haven't assigned any tasks to others yet.</p>
                            </div>
                        ) : (
                            <div className="assignments-list">
                                {assignedByMe.map((assignment) => (
                                    <div key={assignment.id} className="assignment-row">
                                        <div className="assignment-info">
                                            <div className="task-title-row">
                                                <h4>{assignment.task.title}</h4>
                                                <span className={`status-badge ${getStatusBadgeClass(assignment.assignment_status)}`}>
                                                    {taskManagementApi.getAssignmentStatusText(assignment.assignment_status)}
                                                </span>
                                            </div>
                                            <div className="assignment-meta">
                                                <span>To: {assignment.assigned_to.full_name}</span>
                                                <span>•</span>
                                                <span>Assigned: {formatDate(assignment.assigned_at)}</span>
                                                {assignment.response_at && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Response: {formatDate(assignment.response_at)}</span>
                                                    </>
                                                )}
                                            </div>
                                            
                                            {assignment.rejection_reason && (
                                                <div className="rejection-reason">
                                                    <strong>Rejection reason:</strong> {assignment.rejection_reason}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="assignment-actions">
                                            {(assignment.assignment_status === 'discussion_active' || 
                                              assignment.assignment_status === 'discussion_requested') && (
                                                <button
                                                    onClick={() => handleStartConversation(assignment.id)}
                                                    className="btn-conversation"
                                                >
                                                    💬 Open Chat
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleViewAssignment(assignment)}
                                                className="btn-view-details"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="task-notifications">
                        {taskNotifications.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🔔</div>
                                <h3>No New Notifications</h3>
                                <p>All caught up! No new task notifications.</p>
                            </div>
                        ) : (
                            <div className="notifications-list">
                                {taskNotifications.map((notification) => (
                                    <div key={notification.id} className="notification-item">
                                        <div className="notification-content">
                                            <h5>{notification.title}</h5>
                                            <p>{notification.message}</p>
                                            <span className="notification-time">
                                                {formatDate(notification.created_at)}
                                            </span>
                                        </div>
                                        {notification.assignment_id && (
                                            <button
                                                onClick={() => {
                                                    // Load and view the assignment
                                                    taskManagementApi.getAssignmentDetails(notification.assignment_id, accessToken)
                                                        .then(assignment => handleViewAssignment(assignment))
                                                        .catch(() => showNotification('Failed to load assignment', 'error'));
                                                }}
                                                className="btn-view-notification"
                                            >
                                                View
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Assignment Detail Modal */}
            {selectedAssignment && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h3>Task Assignment Details</h3>
                            <button
                                onClick={() => setSelectedAssignment(null)}
                                className="modal-close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <TaskAssignmentNotification
                                assignment={selectedAssignment}
                                onUpdate={handleAssignmentUpdate}
                                onClose={() => setSelectedAssignment(null)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Conversation Modal */}
            {showConversation && conversationAssignmentId && (
                <div className="modal-overlay">
                    <div className="modal-content conversation-modal">
                        <TaskConversation
                            assignmentId={conversationAssignmentId}
                            onClose={() => setShowConversation(false)}
                            onComplete={handleConversationComplete}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskAssignmentDashboard;