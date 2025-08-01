// src/components/NotificationBell.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/apiService';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from '../context/NotificationContext'; // <-- IMPORT THIS
import './NotificationBell.css';

function NotificationBell() {
    const { accessToken, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification(); // <-- Use your notification/toast function

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
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    // --- NEW: Add this handler ---
    const handleClearAll = async () => {
        if (notifications.length === 0) return;
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

    return (
        <div className="notification-bell-container" onMouseLeave={() => setIsOpen(false)}>
            <button className="notification-bell-button" onMouseEnter={() => setIsOpen(true)}>
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllAsRead} className="mark-all-read-button">
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-item empty">You have no notifications.</div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <p className="notification-message">{notification.message}</p>
                                    <span className="notification-time">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    {/* --- NEW: Add this footer section --- */}
                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button className="clear-all-button" onClick={handleClearAll}>
                                Clear notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
