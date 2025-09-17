// src/components/UserStatusSidebar.jsx - Right sidebar showing user online status
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRealtime } from '../hooks/useRealtime';
import { authApi, chatApi } from '../api/apiService';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './UserStatusSidebar.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bwc-portal-backend-w1qr.onrender.com';

function UserStatusSidebar({ isCollapsed = false }) {
    const { currentUser, accessToken } = useAuth();
    const { t } = useLanguage();
    const { isConnected, websocketService } = useRealtime();
    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [userLastSeen, setUserLastSeen] = useState({});
    const navigate = useNavigate();

    const fetchUsers = useCallback(async () => {
        try {
            const allUsers = await authApi.listBasicUsers(accessToken);
            // Filter out current user
            const otherUsers = allUsers.filter(user => user.id !== currentUser.id);
            setUsers(otherUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }, [accessToken, currentUser]);

    useEffect(() => {
        fetchUsers();
        // Refresh users list every 30 seconds
        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, [fetchUsers]);

    // Update online status from REST data initially
    useEffect(() => {
        const online = new Set();
        const lastSeen = {};
        
        users.forEach(user => {
            if (user.is_online) {
                online.add(user.id);
            } else if (user.last_seen) {
                lastSeen[user.id] = new Date(user.last_seen);
            }
        });
        
        setOnlineUsers(online);
        setUserLastSeen(lastSeen);
    }, [users]);

    // Subscribe to presence updates via websocket for live updates
    useEffect(() => {
        if (!websocketService) return;
        const offUpdate = websocketService.on('presence_update', (data) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                if (data.is_online) {
                    next.add(data.user_id);
                } else {
                    next.delete(data.user_id);
                }
                return next;
            });
            if (data.last_seen) {
                setUserLastSeen((prev) => ({ ...prev, [data.user_id]: new Date(data.last_seen) }));
            }
        });
        const offSnapshot = websocketService.on('presence_snapshot', (data) => {
            const online = new Set();
            const lastSeen = {};
            (data.online || []).forEach((u) => {
                online.add(u.user_id);
                if (u.last_seen) lastSeen[u.user_id] = new Date(u.last_seen);
            });
            setOnlineUsers(online);
            setUserLastSeen((prev) => ({ ...prev, ...lastSeen }));
        });
        return () => {
            offUpdate();
            offSnapshot();
        };
    }, [websocketService]);

    const startChat = async (userId) => {
        try {
            await chatApi.startConversation(userId, accessToken);
            navigate(`/chat/${userId}`);
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    const getStatusText = (user) => {
        if (onlineUsers.has(user.id)) {
            return 'Online';
        } else if (userLastSeen[user.id]) {
            return `Active ${formatDistanceToNow(userLastSeen[user.id], { addSuffix: true })}`;
        }
        return 'Offline';
    };

    const getStatusColor = (user) => {
        if (onlineUsers.has(user.id)) {
            return '#44b883'; // Green for online
        }
        return '#95a5a6'; // Gray for offline
    };

    // Sort users: online first, then by last seen
    const sortedUsers = [...users].sort((a, b) => {
        const aOnline = onlineUsers.has(a.id);
        const bOnline = onlineUsers.has(b.id);
        
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        
        if (!aOnline && !bOnline) {
            const aLastSeen = userLastSeen[a.id] || new Date(0);
            const bLastSeen = userLastSeen[b.id] || new Date(0);
            return bLastSeen - aLastSeen;
        }
        
        return a.full_name.localeCompare(b.full_name);
    });

    if (isCollapsed) {
        return (
            <div className="user-status-sidebar collapsed">
                <div className="sidebar-header">
                    <div className="online-indicator">
                        <span className="online-dot"></span>
                        <span className="online-count">{onlineUsers.size}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="user-status-sidebar">
            <div className="sidebar-header">
                <h3>{t('contacts')}</h3>
                <div className="online-summary">
                    <span className="online-count">{onlineUsers.size} {t('online')}</span>
                </div>
            </div>

            <div className="users-list">
                {sortedUsers.map(user => (
                    <div 
                        key={user.id}
                        className={`user-item ${onlineUsers.has(user.id) ? 'online' : 'offline'}`}
                        onClick={() => startChat(user.id)}
                    >
                        <div className="user-avatar-container">
                            <div className="user-avatar">
                                {(() => {
                                    const absolute = user.profile_picture_url?.startsWith('http');
                                    const src = absolute ? user.profile_picture_url : (user.profile_picture_url ? `${API_BASE_URL}${user.profile_picture_url}` : null);
                                    return src ? (
                                        <img
                                            src={src}
                                            alt={user.full_name}
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=b8860b&color=fff&size=120`;
                                            }}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </div>
                                    );
                                })()}
                            </div>
                            <div 
                                className="status-indicator"
                                style={{ backgroundColor: getStatusColor(user) }}
                            ></div>
                        </div>
                        
                        <div className="user-info">
                            <div className="user-name">{user.full_name}</div>
                            <div className="user-status">
                                {getStatusText(user)}
                            </div>
                        </div>
                    </div>
                ))}
                
                {users.length === 0 && (
                    <div className="no-users">
                        <span>👥</span>
                        <p>{t('no_contacts_found')}</p>
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <div className="connection-status">
                    <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className="connection-dot"></span>
                        <span className="connection-text">
                            {isConnected ? 'Connected' : 'Reconnecting...'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserStatusSidebar;
