// src/components/NotificationBell.jsx - Complete and Fixed Version
import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../context/useAuth';
import { notificationApi } from '../api/apiService';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from '../context/NotificationContext';
import './NotificationBell.css';

function NotificationBell() {
    const { accessToken, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const fetchNotifications = useCallback(async () => {
        if (isAuthenticated && accessToken) {
            try {
                const data = await notificationApi.getMyNotifications(accessToken);
                setNotifications(data);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        }
    }, [isAuthenticated, accessToken]);

    useEffect(() => {
        fetchNotifications();
        // Set up polling to check for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval); // Clean up on component unmount
    }, [fetchNotifications]);

    const handleNotificationClick = async (notification) => {
        if (notification.link) {
            navigate(notification.link);
        }
        if (!notification.is_read) {
            try {
                await notificationApi.markAsRead(notification.id, accessToken);
                fetchNotifications(); // Refresh list after marking as read
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }
        setIsOpen(false);
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead(accessToken);
            fetchNotifications(); // Refresh list
            showNotification('All notifications marked as read', 'success');
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            showNotification('Failed to mark all notifications as read', 'error');
        }
    };

    const handleClearAll = async () => {
        if (notifications.length === 0) return;
        
        if (!window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            return;
        }
        
        try {
            await notificationApi.clearAllNotifications(accessToken);
            setNotifications([]);
            showNotification('All notifications have been cleared.', 'success');
        } catch (error) {
            console.error("Failed to clear notifications:", error);
            showNotification('Could not clear notifications.', 'error');
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="notification-bell-container">
            <button 
                className="notification-bell-button" 
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Notifications (${unreadCount} unread)`}
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
                        <div className="notification-actions">
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    className="mark-all-read-btn"
                                    title="Mark all as read"
                                >
                                    ✓ All
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button 
                                    onClick={handleClearAll}
                                    className="clear-all-btn"
                                    title="Clear all notifications"
                                >
                                    🗑️
                                </button>
                            )}
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="close-dropdown-btn"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-content">
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="unread-indicator"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 5 && (
                        <div className="notification-footer">
                            <button 
                                onClick={() => {
                                    navigate('/notifications');
                                    setIsOpen(false);
                                }}
                                className="view-all-btn"
                            >
                                View All Notifications
                            </button>
                        </div>
                    )}
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
    );
}

export default NotificationBell;