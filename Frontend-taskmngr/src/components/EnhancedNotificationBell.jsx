// src/components/EnhancedNotificationBell.jsx - Enhanced notification bell with approvals
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi, approvalApi } from '../api/apiService';
import { taskManagementApi } from '../api/taskManagementApi';
import { useRealtime } from '../hooks/useRealtime';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from '../context/NotificationContext';
import './EnhancedNotificationBell.css';

function EnhancedNotificationBell() {
    const { accessToken, isAuthenticated } = useAuth();
    const { getTotalUnreadNotificationCount } = useRealtime();
    const [notifications, setNotifications] = useState([]);
    const [taskNotifications, setTaskNotifications] = useState([]);
    const [approvalNotifications, setApprovalNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const fetchNotifications = useCallback(async () => {
        // Only fetch if user is authenticated and has a valid token
        if (!isAuthenticated || !accessToken) {
            // Clear notifications if user is not authenticated
            setNotifications([]);
            setTaskNotifications([]);
            setApprovalNotifications([]);
            return;
        }

        try {
            const [regularNotifs, taskNotifs, approvalNotifs] = await Promise.all([
                notificationApi.getMyNotifications(accessToken),
                taskManagementApi.getTaskNotifications({ limit: 10 }, accessToken),
                approvalApi.getNotifications(false, accessToken, 10)
            ]);
            
            setNotifications(regularNotifs || []);
            setTaskNotifications(taskNotifs || []);
            setApprovalNotifications(approvalNotifs || []);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            
            // If we get 401, it means the token is invalid - clear notifications
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                setNotifications([]);
                setTaskNotifications([]);
                setApprovalNotifications([]);
            }
        }
    }, [isAuthenticated, accessToken]);

    useEffect(() => {
        fetchNotifications();
        // Set up polling to check for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleNotificationClick = async (notification, type = 'regular') => {
        try {
            // Always mark as read when clicked (if not already read)
            if (!notification.is_read) {
                if (type === 'approval') {
                    await approvalApi.markNotificationRead(notification.id, accessToken);
                } else if (type === 'task') {
                    await taskManagementApi.markNotificationRead(notification.id, accessToken);
                } else {
                    await notificationApi.markAsRead(notification.id, accessToken);
                }
                
                // Update local state immediately for better UX
                if (type === 'approval') {
                    setApprovalNotifications(prev => 
                        prev.map(n => n.id === notification.id ? {...n, is_read: true} : n)
                    );
                } else if (type === 'task') {
                    setTaskNotifications(prev => 
                        prev.map(n => n.id === notification.id ? {...n, is_read: true} : n)
                    );
                } else {
                    setNotifications(prev => 
                        prev.map(n => n.id === notification.id ? {...n, is_read: true} : n)
                    );
                }
            }
            
            // Handle navigation
            if (type === 'approval') {
                if (notification.approval_request.status === 'discussion') {
                    // Navigate to chat with the other user
                    const otherUserId = notification.approval_request.requester.id;
                    navigate(`/chat/${otherUserId}`);
                } else {
                    // Navigate to approvals page
                    navigate('/approvals');
                }
            } else if (type === 'task') {
                if (notification.action_url) {
                    navigate(notification.action_url);
                }
            } else {
                // Regular notification
                if (notification.link) {
                    navigate(notification.link);
                }
            }
            
        } catch (error) {
            console.error("Failed to handle notification:", error);
            showNotification('Failed to process notification', 'error');
        }
        
        setIsOpen(false);
    };

    const handleApprovalAction = async (approvalId, action, responseMessage = '') => {
        try {
            await approvalApi.respondToRequest(approvalId, { 
                action, 
                response_message: responseMessage 
            }, accessToken);
            
            // Find the notification for this approval and mark it as read
            const notification = approvalNotifications.find(n => n.approval_request.id === approvalId);
            if (notification && !notification.is_read) {
                try {
                    await approvalApi.markNotificationRead(notification.id, accessToken);
                    // Update local state
                    setApprovalNotifications(prev => 
                        prev.map(n => n.id === notification.id ? {...n, is_read: true} : n)
                    );
                } catch (readError) {
                    console.warn('Failed to mark approval notification as read:', readError);
                }
            }
            
            showNotification(`Request ${action}d successfully!`, 'success');
            fetchNotifications(); // Refresh notifications
            
            if (action === 'discussion') {
                // Find the requester and navigate to chat
                const approval = approvalNotifications.find(n => n.approval_request.id === approvalId);
                if (approval) {
                    navigate(`/chat/${approval.approval_request.requester.id}`);
                }
            }
        } catch (error) {
            console.error(`Failed to ${action} request:`, error);
            showNotification(`Failed to ${action} request`, 'error');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const promises = [];
            
            if (activeTab === 'all') {
                // Mark all types as read
                const unreadApprovals = approvalNotifications.filter(n => !n.is_read);
                const unreadTasks = taskNotifications.filter(n => !n.is_read);
                const unreadRegular = notifications.filter(n => !n.is_read);
                
                unreadApprovals.forEach(n => promises.push(approvalApi.markNotificationRead(n.id, accessToken)));
                unreadTasks.forEach(n => promises.push(taskManagementApi.markNotificationRead(n.id, accessToken)));
                unreadRegular.forEach(n => promises.push(notificationApi.markAsRead(n.id, accessToken)));
                
            } else if (activeTab === 'approvals') {
                const unreadApprovals = approvalNotifications.filter(n => !n.is_read);
                unreadApprovals.forEach(n => promises.push(approvalApi.markNotificationRead(n.id, accessToken)));
                
            } else if (activeTab === 'tasks') {
                const unreadTasks = taskNotifications.filter(n => !n.is_read);
                unreadTasks.forEach(n => promises.push(taskManagementApi.markNotificationRead(n.id, accessToken)));
                
            } else {
                const unreadRegular = notifications.filter(n => !n.is_read);
                unreadRegular.forEach(n => promises.push(notificationApi.markAsRead(n.id, accessToken)));
            }
            
            if (promises.length > 0) {
                await Promise.all(promises);
                showNotification('All notifications marked as read', 'success');
                fetchNotifications(); // Refresh notifications
            }
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
            showNotification('Failed to mark notifications as read', 'error');
        }
    };

    const handleClearAllApprovalNotifications = async () => {
        if (approvalNotifications.length === 0) return;
        
        if (!window.confirm('Are you sure you want to clear all approval notifications? This action cannot be undone.')) {
            return;
        }
        
        try {
            await approvalApi.clearAllNotifications(accessToken);
            showNotification('All approval notifications cleared', 'success');
            fetchNotifications(); // Refresh notifications
        } catch (error) {
            console.error('Failed to clear approval notifications:', error);
            showNotification('Failed to clear approval notifications', 'error');
        }
    };

    // Calculate total unread count (including real-time updates)
    const unreadCount = 
        notifications.filter(n => !n.is_read).length +
        taskNotifications.filter(n => !n.is_read).length +
        approvalNotifications.filter(n => !n.is_read).length +
        getTotalUnreadNotificationCount();

    const handleDismissNotification = async (notificationId, type = 'approval') => {
        try {
            if (type === 'approval') {
                await approvalApi.dismissNotification(notificationId, accessToken);
            }
            
            showNotification('Notification dismissed', 'success');
            fetchNotifications(); // Refresh notifications
        } catch (error) {
            console.error('Failed to dismiss notification:', error);
            showNotification('Failed to dismiss notification', 'error');
        }
    };

    const renderApprovalNotification = (notification) => {
        const approval = notification.approval_request;
        const isPending = approval.status === 'pending';
        
        return (
            <div 
                key={notification.id} 
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification, 'approval')}
            >
                <div className="notification-content">
                    <div className="notification-header">
                        <span className="notification-type approval">📋 Approval</span>
                        <span className="notification-time">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        <button 
                            className="dismiss-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDismissNotification(notification.id, 'approval');
                            }}
                            title="Dismiss notification"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    
                    {isPending && approval.approver_id && (
                        <div className="approval-actions">
                            <button 
                                className="approval-btn approve"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprovalAction(approval.id, 'approve');
                                }}
                            >
                                ✅ Approve
                            </button>
                            <button 
                                className="approval-btn reject"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprovalAction(approval.id, 'reject');
                                }}
                            >
                                ❌ Reject
                            </button>
                            <button 
                                className="approval-btn discuss"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprovalAction(approval.id, 'discussion');
                                }}
                            >
                                💬 Discuss
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderNotifications = () => {
        let notificationsToShow = [];

        if (activeTab === 'all') {
            notificationsToShow = [
                ...approvalNotifications.map(n => ({ ...n, type: 'approval' })),
                ...taskNotifications.map(n => ({ ...n, type: 'task' })),
                ...notifications.map(n => ({ ...n, type: 'regular' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (activeTab === 'approvals') {
            notificationsToShow = approvalNotifications.map(n => ({ ...n, type: 'approval' }));
        } else if (activeTab === 'tasks') {
            notificationsToShow = taskNotifications.map(n => ({ ...n, type: 'task' }));
        } else {
            notificationsToShow = notifications.map(n => ({ ...n, type: 'regular' }));
        }

        if (notificationsToShow.length === 0) {
            return (
                <div className="no-notifications">
                    <span>🔔</span>
                    <p>No notifications</p>
                </div>
            );
        }

        return notificationsToShow.map(notification => {
            if (notification.type === 'approval') {
                return renderApprovalNotification(notification);
            }
            
            return (
                <div 
                    key={`${notification.type}-${notification.id}`}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification, notification.type)}
                >
                    <div className="notification-content">
                        <div className="notification-header">
                            <span className={`notification-type ${notification.type}`}>
                                {notification.type === 'task' ? '📋' : '🔔'} 
                                {notification.type === 'task' ? 'Task' : 'System'}
                            </span>
                            <span className="notification-time">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <div className="notification-title">
                            {notification.title || notification.message}
                        </div>
                        {notification.title && notification.message && notification.title !== notification.message && (
                            <div className="notification-message">{notification.message}</div>
                        )}
                    </div>
                </div>
            );
        });
    };

    // Don't render notification bell if user is not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="enhanced-notification-bell">
            <button 
                className={`notification-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <div className="notification-header-actions">
                            {unreadCount > 0 && (
                                <button 
                                    className="mark-all-read-btn"
                                    onClick={handleMarkAllAsRead}
                                    title="Mark all as read"
                                >
                                    ✓ Mark All Read
                                </button>
                            )}
                            <button 
                                className="close-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="notification-tabs">
                        <button 
                            className={activeTab === 'all' ? 'active' : ''}
                            onClick={() => setActiveTab('all')}
                        >
                            All ({unreadCount})
                        </button>
                        <button 
                            className={activeTab === 'approvals' ? 'active' : ''}
                            onClick={() => setActiveTab('approvals')}
                        >
                            Approvals ({approvalNotifications.filter(n => !n.is_read).length})
                        </button>
                        <button 
                            className={activeTab === 'tasks' ? 'active' : ''}
                            onClick={() => setActiveTab('tasks')}
                        >
                            Tasks ({taskNotifications.filter(n => !n.is_read).length})
                        </button>
                        
                        {activeTab === 'approvals' && approvalNotifications.length > 0 && (
                            <button 
                                className="clear-all-btn"
                                onClick={handleClearAllApprovalNotifications}
                                title="Clear all approval notifications"
                            >
                                🗑️ Clear All
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {renderNotifications()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default EnhancedNotificationBell;
