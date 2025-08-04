import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/apiService';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from '../context/NotificationContext';
import './NotificationBell.css';

function NotificationBell() {
    const { accessToken, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    
    // Use ref to track if component is mounted
    const isMountedRef = useRef(true);

    useEffect(() => {
        // Set mounted flag
        isMountedRef.current = true;
        
        // Cleanup function
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const fetchNotifications = useCallback(async () => {
        // Don't fetch if not authenticated or component unmounted
        if (!isAuthenticated || !accessToken || !isMountedRef.current) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await notificationApi.getMyNotifications(accessToken);
            
            // Only update state if component is still mounted
            if (isMountedRef.current) {
                setNotifications(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            
            // Only update state if component is still mounted
            if (isMountedRef.current) {
                setError(error.message);
                setNotifications([]); // Set empty array on error
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [isAuthenticated, accessToken]);

    useEffect(() => {
        if (isAuthenticated && accessToken) {
            fetchNotifications();
            
            // Set up polling with cleanup
            const interval = setInterval(() => {
                if (isMountedRef.current) {
                    fetchNotifications();
                }
            }, 30000);
            
            return () => clearInterval(interval);
        }
    }, [fetchNotifications, isAuthenticated, accessToken]);

    const handleNotificationClick = async (notification) => {
        if (!notification || !isMountedRef.current) return;

        try {
            if (notification.link) {
                navigate(notification.link);
            }
            
            if (!notification.is_read && accessToken) {
                await notificationApi.markAsRead(notification.id, accessToken);
                if (isMountedRef.current) {
                    fetchNotifications(); // Refresh list after marking as read
                }
            }
        } catch (error) {
            console.error("Failed to handle notification click:", error);
        } finally {
            if (isMountedRef.current) {
                setIsOpen(false);
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!accessToken || !isMountedRef.current) return;

        try {
            setLoading(true);
            await notificationApi.markAllAsRead(accessToken);
            if (isMountedRef.current) {
                fetchNotifications(); // Refresh list
            }
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            if (isMountedRef.current && showNotification) {
                showNotification('Failed to mark notifications as read', 'error');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    const handleClearAll = async () => {
        if (notifications.length === 0 || !accessToken || !isMountedRef.current) return;

        try {
            setLoading(true);
            await notificationApi.clearAllNotifications(accessToken);
            
            if (isMountedRef.current) {
                setNotifications([]);
                if (showNotification) {
                    showNotification('All notifications have been cleared.', 'success');
                }
            }
        } catch (error) {
            console.error("Failed to clear notifications:", error);
            if (isMountedRef.current && showNotification) {
                showNotification('Could not clear notifications.', 'error');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    const handleMouseEnter = () => {
        if (isMountedRef.current && isAuthenticated) {
            setIsOpen(true);
        }
    };

    const handleMouseLeave = () => {
        if (isMountedRef.current) {
            setIsOpen(false);
        }
    };

    // Don't render if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div 
            className="notification-bell" 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="bell-icon">
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </div>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h4>Notifications</h4>
                        {notifications.length > 0 && !loading && (
                            <div className="notification-actions">
                                <button onClick={handleMarkAllAsRead} disabled={loading}>
                                    Mark all read
                                </button>
                                <button onClick={handleClearAll} disabled={loading}>
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading && (
                            <div className="notification-item">
                                <div>⏳ Loading...</div>
                            </div>
                        )}

                        {error && (
                            <div className="notification-item error">
                                <div>❌ Error: {error}</div>
                            </div>
                        )}

                        {!loading && !error && notifications.length === 0 && (
                            <div className="notification-item">
                                <div>📭 No notifications</div>
                            </div>
                        )}

                        {!loading && !error && notifications.length > 0 && notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-message">
                                    {notification.message}
                                </div>
                                {notification.created_at && (
                                    <div className="notification-time">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
