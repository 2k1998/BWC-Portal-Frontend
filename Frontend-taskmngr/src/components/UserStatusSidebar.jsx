// src/components/UserStatusSidebar.jsx - Right sidebar showing user online status
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../hooks/useRealtime';
import { authApi, chatApi } from '../api/apiService';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './UserStatusSidebar.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bwc-portal-backend-w1qr.onrender.com';

function UserStatusSidebar({ isCollapsed = false }) {
    const { currentUser, accessToken } = useAuth();
    const { isConnected } = useRealtime();
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

    // Update online status from real user data
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
                <h3>Contacts</h3>
                <div className="online-summary">
                    <span className="online-count">{onlineUsers.size} online</span>
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
                                {user.profile_picture_url ? (
                                    <img
                                        src={`${API_BASE_URL}${user.profile_picture_url}`}
                                        alt={user.full_name}
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user.full_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
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
                        <p>No contacts found</p>
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
