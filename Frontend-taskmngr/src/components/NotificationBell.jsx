// src/components/NotificationBell.jsx - Enhanced with Task Management
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/apiService';
import { taskManagementApi } from '../api/taskManagementApi';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from '../context/NotificationContext';
import TaskAssignmentNotification from './TaskAssignmentNotification';
import './NotificationBell.css';

function NotificationBell() {
    const { accessToken, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [taskNotifications, setTaskNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const fetchNotifications = useCallback(async () => {
        if (isAuthenticated && accessToken) {
            try {
                const [regularNotifs, taskNotifs] = await Promise.all([
                    notificationApi.getMyNotifications(accessToken),
                    taskManagementApi.getTaskNotifications({ limit: 10 }, accessToken)
                ]);
                
                setNotifications(regularNotifs);
                setTaskNotifications(taskNotifs);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        }
    }, [isAuthenticated, accessToken]);

    useEffect(() => {
        fetchNotifications();
        // Set up polling to check for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleNotificationClick = async (notification, isTaskNotification = false) => {
        try {
            if (isTaskNotification) {
                // Handle task notification click
                if (!notification.is_read) {
                    await taskManagementApi.markNotificationRead(notification.id, accessToken);
                }
                
                if (notification.assignment_id) {
                    // Load assignment details and show modal
                    const assignment = await taskManagementApi.getAssignmentDetails(
                        notification.assignment_id, 
                        accessToken
                    );
                    setSelectedAssignment(assignment);
                    setShowAssignmentModal(true);
                }
            } else {
                // Handle regular notification click
                if (notification.link) {
                    navigate(notification.link);
                }
                if (!notification.is_read) {
                    await notificationApi.markAsRead(notification.id, accessToken);
                }
            }
            
            setIsOpen(false);
            fetchNotifications(); // Refresh notifications
        } catch (error) {
            console.error("Failed to handle notification click:", error);
            showNotification('Failed to open notification', 'error');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            if (activeTab === 'all' || activeTab === 'general') {
                await notificationApi.markAllAsRead(accessToken);
            }
            if (activeTab === 'all' || activeTab === 'tasks') {
                // Mark all task notifications as read
                const unreadTaskNotifs = taskNotifications.filter(n => !n.is_read);
                await Promise.all(
                    unreadTaskNotifs.map(notif => 
                        taskManagementApi.markNotificationRead(notif.id, accessToken)
                    )
                );
            }
            
            fetchNotifications();
            showNotification('All notifications marked as read', 'success');
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            showNotification('Failed to mark all notifications as read', 'error');
        }
    };

    const handleClearAll = async () => {
        if (notifications.length === 0 && taskNotifications.length === 0) return;
        
        if (!window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            return;
        }
        
        try {
            await notificationApi.clearAllNotifications(accessToken);
            setNotifications([]);
            setTaskNotifications([]);
            showNotification('All notifications have been cleared.', 'success');
        } catch (error) {
            console.error("Failed to clear notifications:", error);
            showNotification('Could not clear notifications.', 'error');
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            'task_assigned': '📋',
            'task_accepted': '✅',
            'task_rejected': '❌',
            'discussion_requested': '💬',
            'message_received': '📨',
            'call_scheduled': '📞',
            'call_completed': '☎️'
        };
        return icons[type] || '🔔';
    };

    const formatNotificationTime = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    // Combine and sort notifications
    const allNotifications = [
        ...taskNotifications.map(notif => ({ ...notif, type: 'task' })),
        ...notifications.map(notif => ({ ...notif, type: 'general' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const unreadCount = allNotifications.filter(n => !n.is_read).length;
    const taskUnreadCount = taskNotifications.filter(n => !n.is_read).length;
    const generalUnreadCount = notifications.filter(n => !n.is_read).length;

    const getDisplayNotifications = () => {
        switch (activeTab) {
            case 'tasks': return taskNotifications;
            case 'general': return notifications;
            default: return allNotifications;
        }
    };

    const displayNotifications = getDisplayNotifications();

    return (
        <>
            <div className="notification-bell-container" onMouseLeave={() => setIsOpen(false)}>
                <button className="notification-bell-button" onMouseEnter={() => setIsOpen(true)}>
                    <span className="bell-icon">🔔</span>
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>

                {isOpen && (
                    <div className="notification-dropdown enhanced-dropdown">
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllAsRead} className="mark-all-read-button">
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Enhanced Tabs */}
                        <div className="notification-tabs">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                            >
                                All ({allNotifications.length})
                                {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                            >
                                Tasks ({taskNotifications.length})
                                {taskUnreadCount > 0 && <span className="tab-badge">{taskUnreadCount}</span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                            >
                                General ({notifications.length})
                                {generalUnreadCount > 0 && <span className="tab-badge">{generalUnreadCount}</span>}
                            </button>
                        </div>

                        <div className="notification-list">
                            {displayNotifications.length === 0 ? (
                                <div className="notification-item empty">
                                    <div className="empty-state">
                                        <span className="empty-icon">🔔</span>
                                        <p>No notifications</p>
                                    </div>
                                </div>
                            ) : (
                                displayNotifications.slice(0, 8).map(notification => (
                                    <div
                                        key={`${notification.type}-${notification.id}`}
                                        className={`notification-item ${notification.is_read ? 'read' : 'unread'} ${notification.type}`}
                                        onClick={() => handleNotificationClick(notification, notification.type === 'task')}
                                    >
                                        <div className="notification-icon">
                                            {notification.type === 'task' 
                                                ? getNotificationIcon(notification.notification_type)
                                                : '🔔'
                                            }
                                        </div>
                                        <div className="notification-content">
                                            <p className="notification-message">
                                                {notification.title || notification.message}
                                            </p>
                                            {notification.type === 'task' && notification.message !== notification.title && (
                                                <p className="notification-submessage">
                                                    {notification.message}
                                                </p>
                                            )}
                                            <span className="notification-time">
                                                {formatNotificationTime(notification.created_at)}
                                            </span>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="unread-indicator"></div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Enhanced Footer */}
                        <div className="notification-footer">
                            {allNotifications.length > 8 && (
                                <button 
                                    onClick={() => {
                                        navigate('/notifications');
                                        setIsOpen(false);
                                    }}
                                    className="view-all-btn"
                                >
                                    View All ({allNotifications.length})
                                </button>
                            )}
                            
                            {allNotifications.length > 0 && (
                                <button className="clear-all-button" onClick={handleClearAll}>
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Click outside to close */}
                {isOpen && (
                    <div 
                        className="notification-overlay" 
                        onClick={() => setIsOpen(false)}
                    ></div>
                )}
            </div>

            {/* Task Assignment Modal */}
            {showAssignmentModal && selectedAssignment && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h3>Task Assignment</h3>
                            <button
                                onClick={() => {
                                    setShowAssignmentModal(false);
                                    setSelectedAssignment(null);
                                }}
                                className="modal-close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <TaskAssignmentNotification
                                assignment={selectedAssignment}
                                onUpdate={() => {
                                    setShowAssignmentModal(false);
                                    setSelectedAssignment(null);
                                    fetchNotifications();
                                }}
                                onClose={() => {
                                    setShowAssignmentModal(false);
                                    setSelectedAssignment(null);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default NotificationBell;