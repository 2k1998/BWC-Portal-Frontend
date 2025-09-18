// src/components/NotificationBell.jsx - Enhanced with Task Management
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { notificationApi } from '../api/apiService';
import { taskManagementApi } from '../api/taskManagementApi';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from '../context/NotificationContext';
import TaskAssignmentNotification from './TaskAssignmentNotification';
import { 
    Bell, 
    ClipboardList, 
    CheckCircle, 
    XCircle, 
    MessageCircle, 
    Mail, 
    Phone, 
    PhoneCall,
    X
} from 'lucide-react';
import './NotificationBell.css';
import { createPortal } from 'react-dom';

function NotificationBell() {
    const { accessToken, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [taskNotifications, setTaskNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const fetchNotifications = useCallback(async () => {
        // Only fetch if user is authenticated and has a valid token
        if (!isAuthenticated || !accessToken) {
            // Clear notifications if user is not authenticated
            setNotifications([]);
            setTaskNotifications([]);
            return;
        }

        try {
            const [regularNotifs, taskNotifs] = await Promise.all([
                notificationApi.getMyNotifications(accessToken),
                taskManagementApi.getTaskNotifications({ limit: 10 }, accessToken)
            ]);
            
            setNotifications(regularNotifs || []);
            setTaskNotifications(taskNotifs || []);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            
            // If we get 401, it means the token is invalid - clear notifications
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                setNotifications([]);
                setTaskNotifications([]);
            }
        }
    }, [isAuthenticated, accessToken]);

    useEffect(() => {
        fetchNotifications();
        // Set up polling to check for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // removed unused handler (click handling is inline on items)

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
            'task_assigned': ClipboardList,
            'task_accepted': CheckCircle,
            'task_rejected': XCircle,
            'discussion_requested': MessageCircle,
            'message_received': Mail,
            'call_scheduled': Phone,
            'call_completed': PhoneCall
        };
        const IconComponent = icons[type] || Bell;
        return <IconComponent size={16} />;
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
                    <Bell className="bell-icon" size={20} />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>

                {isOpen && createPortal(
                    <div className="notification-dropdown enhanced-dropdown">
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllAsRead} className="mark-all-read-button">
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        
                        {/* Notification Tabs */}
                        <div className="notification-tabs">
                            <button 
                                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTab('all')}
                            >
                                All {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tasks')}
                            >
                                Tasks {taskUnreadCount > 0 && <span className="tab-badge">{taskUnreadCount}</span>}
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveTab('general')}
                            >
                                General {generalUnreadCount > 0 && <span className="tab-badge">{generalUnreadCount}</span>}
                            </button>
                            
                            {/* Clear all button */}
                            {(notifications.length > 0 || taskNotifications.length > 0) && (
                                <button className="clear-all-button" onClick={handleClearAll}>Clear all</button>
                            )}
                        </div>
                        
                        {/* Notification List */}
                        <div className="notification-list">
                            {displayNotifications.length === 0 ? (
                                <div className="empty-state">
                                    <span className="empty-icon">🔔</span>
                                    <p>{t('no_notifications') || 'No notifications'}</p>
                                </div>
                            ) : (
                                displayNotifications.map((notif, index) => (
                                    <div 
                                        key={notif.id || index}
                                        className={`notification-item ${notif.is_read ? '' : 'unread'} ${notif.type === 'task' ? 'task' : 'general'}`}
                                        onClick={() => {
                                            if (notif.type === 'task' && notif.assignment_id) {
                                                setSelectedAssignment(notif);
                                                setShowAssignmentModal(true);
                                            } else if (notif.link_url) {
                                                navigate(notif.link_url);
                                            }
                                        }}
                                    >
                                        <div className="notification-icon">{getNotificationIcon(notif.notification_type || notif.type)}</div>
                                        <div className="notification-content">
                                            {notif.title && <p className="notification-message">{notif.title}</p>}
                                            {notif.message && <p className="notification-submessage">{notif.message}</p>}
                                            <div className="notification-time">{formatNotificationTime(notif.created_at)}</div>
                                        </div>
                                        {!notif.is_read && <div className="unread-indicator" />}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div className="notification-footer">
                            <button className="view-all-btn" onClick={() => navigate('/notifications')}>View all</button>
                            {(notifications.length > 0 || taskNotifications.length > 0) && (
                                <button className="clear-all-button" onClick={handleClearAll}>Clear all</button>
                            )}
                        </div>
                    </div>, document.body)
                }
 
                {/* Assignment Modal */}
                {showAssignmentModal && (
                    <div className="modal-overlay">
                        <div className="modal-content large-modal">
                            <div className="modal-header">
                                <h3>Task Assignment</h3>
                                <button className="modal-close" onClick={() => setShowAssignmentModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <TaskAssignmentNotification assignment={selectedAssignment} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default NotificationBell;