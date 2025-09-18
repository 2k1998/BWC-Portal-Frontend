// src/components/ChatHub.jsx - Chat hub component for sidebar
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { chatApi } from '../api/apiService';
import { useRealtime } from '../hooks/useRealtime';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from '../context/NotificationContext';
import { MessageCircle, Search, Frown, X } from 'lucide-react';
import './ChatHub.css';

function ChatHub({ isCollapsed = false }) {
    const { accessToken, isAuthenticated, currentUser } = useAuth();
    const { t } = useLanguage();
    const { getTotalUnreadMessageCount, getUnreadMessageCount } = useRealtime();
    const [conversations, setConversations] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const fetchConversations = useCallback(async () => {
        if (isAuthenticated && accessToken) {
            try {
                const data = await chatApi.getConversations(accessToken);
                setConversations(data || []);
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
            }
        }
    }, [isAuthenticated, accessToken]);

    useEffect(() => {
        fetchConversations();
        // Set up polling to check for new messages every 30 seconds
        const interval = setInterval(fetchConversations, 30000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    const searchUsers = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await chatApi.searchUsers(query, accessToken, 10);
            setSearchResults(results || []);
        } catch (error) {
            console.error("Failed to search users:", error);
            showNotification('Failed to search users', 'error');
        } finally {
            setIsSearching(false);
        }
    }, [accessToken, showNotification]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchQuery) {
                searchUsers(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, searchUsers]);

    const startConversation = async (userId) => {
        try {
            await chatApi.startConversation(userId, accessToken);
            navigate(`/chat/${userId}`);
            setIsOpen(false);
            setSearchQuery('');
        } catch (error) {
            console.error("Failed to start conversation:", error);
            showNotification('Failed to start conversation', 'error');
        }
    };

    const openConversation = (conversation) => {
        const otherUserId = conversation.other_participant.id;
        navigate(`/chat/${otherUserId}`);
        setIsOpen(false);
    };

    // Calculate total unread messages (including real-time updates)
    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0) + getTotalUnreadMessageCount();

    const renderConversations = () => {
        if (conversations.length === 0) {
            return (
                <div className="no-conversations">
                    <MessageCircle size={24} />
                    <p>{t('no_conversations_yet')}</p>
                    <small>{t('search_users_to_start_chatting')}</small>
                </div>
            );
        }

        return conversations.map(conversation => (
            <div 
                key={conversation.id}
                className={`conversation-item ${conversation.unread_count > 0 ? 'unread' : ''}`}
                onClick={() => openConversation(conversation)}
            >
                <div className="conversation-avatar">
                    {(() => {
                        const url = conversation.other_participant.profile_picture_url;
                        const absolute = url?.startsWith('http');
                        const src = url ? (absolute ? url : `${import.meta.env.VITE_API_BASE_URL}${url}`) : null;
                        return src ? (
                            <img 
                                src={src}
                                alt={conversation.other_participant.full_name}
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.other_participant.full_name)}&background=b8860b&color=fff&size=120`;
                                }}
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {conversation.other_participant.full_name.charAt(0).toUpperCase()}
                            </div>
                        );
                    })()}
                    {conversation.unread_count > 0 && (
                        <span className="unread-badge">{conversation.unread_count}</span>
                    )}
                </div>
                
                <div className="conversation-content">
                    <div className="conversation-header">
                        <span className="conversation-name">
                            {conversation.other_participant.full_name}
                        </span>
                        {conversation.last_message_at && (
                            <span className="conversation-time">
                                {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                            </span>
                        )}
                    </div>
                    
                    <div className="conversation-preview">
                        {conversation.last_message_preview || 'No messages yet'}
                    </div>
                </div>
            </div>
        ));
    };

    const renderSearchResults = () => {
        if (isSearching) {
            return (
                <div className="search-loading">
                    <Search size={24} />
                    <p>Searching...</p>
                </div>
            );
        }

        if (searchQuery && searchResults.length === 0) {
            return (
                <div className="no-results">
                    <Frown size={24} />
                    <p>{t('no_users_found')}</p>
                </div>
            );
        }

        return searchResults.map(user => (
            <div 
                key={user.id}
                className="search-result-item"
                onClick={() => startConversation(user.id)}
            >
                <div className="user-avatar">
                    {(() => {
                        const url = user.profile_picture_url;
                        const absolute = url?.startsWith('http');
                        const src = url ? (absolute ? url : `${import.meta.env.VITE_API_BASE_URL}${url}`) : null;
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
                
                <div className="user-content">
                    <div className="user-name">{user.full_name}</div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-role">{user.role}</div>
                </div>
            </div>
        ));
    };

    return (
        <div className="chat-hub">
            <button 
                className={`chat-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <MessageCircle className="chat-icon" size={20} />
                {totalUnread > 0 && (
                    <span className="chat-badge">{totalUnread}</span>
                )}
            </button>

            {isOpen && createPortal(
                <div className="chat-dropdown">
                    <div className="chat-header">
                        <h3>{t('messages')}</h3>
                        <button 
                            className="close-btn"
                            onClick={() => setIsOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="chat-search">
                        <input
                            type="text"
                            placeholder="Search users to message..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="chat-content">
                        {searchQuery ? (
                            <div className="search-results">
                                <div className="section-header">{t('search_results')}</div>
                                {renderSearchResults()}
                            </div>
                        ) : (
                            <div className="conversations">
                                <div className="section-header">{t('recent_conversations')}</div>
                                {renderConversations()}
                            </div>
                        )}
                    </div>
                </div>, document.body)
            }
        </div>
    );
}

export default ChatHub;
