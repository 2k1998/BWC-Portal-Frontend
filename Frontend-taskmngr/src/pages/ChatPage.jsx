// src/pages/ChatPage.jsx - Individual chat conversation page
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatApi, approvalApi, documentApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import './ChatPage.css';

function ChatPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { currentUser, accessToken } = useAuth();
    const { showNotification } = useNotification();
    
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showApprovalForm, setShowApprovalForm] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [totalSelectedBytes, setTotalSelectedBytes] = useState(0);
    const [approvalForm, setApprovalForm] = useState({
        title: '',
        description: '',
        request_type: 'general',
        metadata: {}
    });
    
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-resize message textarea so it never shows scrollbars
    useEffect(() => {
        const el = messageInputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }, [newMessage]);

    const loadConversation = useCallback(async () => {
        try {
            setLoading(true);
            const data = await chatApi.startConversation(parseInt(userId), accessToken);
            setConversation(data);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to load conversation:', error);
            showNotification('Failed to load conversation', 'error');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    }, [userId, accessToken, showNotification, navigate]);

    useEffect(() => {
        loadConversation();
    }, [loadConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Poll for new messages every 5 seconds
    useEffect(() => {
        if (!conversation) return;
        
        const interval = setInterval(async () => {
            try {
                const updated = await chatApi.getConversation(conversation.id, accessToken);
                if (updated.messages.length > messages.length) {
                    setMessages(updated.messages);
                }
            } catch (error) {
                console.error('Failed to poll messages:', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [conversation, messages.length, accessToken]);

    const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // 15MB

    const handleFilesSelected = (fileList) => {
        const files = Array.from(fileList || []);
        const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
        if (totalBytes > MAX_TOTAL_BYTES) {
            showNotification('Selected files exceed 15MB total. Please choose smaller files.', 'error');
            return;
        }
        setSelectedFiles(files);
        setTotalSelectedBytes(totalBytes);
    };

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || sending || !conversation) return;

        setSending(true);
        try {
            let composedContent = newMessage.trim();
            // Upload selected files first (if any) and append their links to the message
            if (selectedFiles.length > 0) {
                if (totalSelectedBytes > MAX_TOTAL_BYTES) {
                    showNotification('Selected files exceed 15MB total. Please choose smaller files.', 'error');
                    setSending(false);
                    return;
                }
                const uploadedLinks = [];
                for (const file of selectedFiles) {
                    const uploadData = new FormData();
                    uploadData.append('file', file);
                    uploadData.append('title', file.name);
                    uploadData.append('description', 'Chat attachment');
                    uploadData.append('category', 'chat');
                    uploadData.append('is_public', true);
                    const doc = await documentApi.upload(uploadData, accessToken);
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
                    const url = `${baseUrl}${doc.download_url || ''}`;
                    uploadedLinks.push(`${file.name}: ${url}`);
                }
                const linksBlock = uploadedLinks.join('\n');
                composedContent = composedContent ? `${composedContent}\n${linksBlock}` : linksBlock;
            }

            const messageData = {
                content: composedContent,
                message_type: selectedFiles.length > 0 ? 'file' : 'text'
            };

            const sentMessage = await chatApi.sendMessage(conversation.id, messageData, accessToken);
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');
            setSelectedFiles([]);
            setTotalSelectedBytes(0);
            messageInputRef.current?.focus();
        } catch (error) {
            console.error('Failed to send message:', error);
            showNotification('Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    const sendApprovalRequest = async (e) => {
        e.preventDefault();
        if (!approvalForm.title.trim() || !approvalForm.description.trim()) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            await approvalApi.createRequest({
                approver_id: parseInt(userId),
                title: approvalForm.title,
                description: approvalForm.description,
                request_type: approvalForm.request_type,
                metadata: approvalForm.metadata
            }, accessToken);

            showNotification('Approval request sent!', 'success');
            setShowApprovalForm(false);
            setApprovalForm({
                title: '',
                description: '',
                request_type: 'general',
                metadata: {}
            });

            // Refresh conversation to show the approval request message
            setTimeout(loadConversation, 1000);
        } catch (error) {
            console.error('Failed to send approval request:', error);
            showNotification('Failed to send approval request', 'error');
        }
    };

    const renderMessage = (message) => {
        const isOwnMessage = message.sender_id === currentUser.id;
        const isApprovalRequest = message.message_type === 'approval_request';
        const isSystemMessage = message.is_system_message;

        return (
            <div 
                key={message.id} 
                className={`message ${isOwnMessage ? 'own' : 'other'} ${isSystemMessage ? 'system' : ''} ${isApprovalRequest ? 'approval' : ''}`}
            >
                <div className="message-content">
                    <div className="message-text">
                        {message.content.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                                {line}
                                {index < message.content.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="message-meta">
                        <span className="message-sender">
                            {isOwnMessage ? 'You' : message.sender.full_name}
                        </span>
                        <span className="message-time">
                            {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="chat-page">
                <div className="chat-loading">
                    <div className="loading-spinner">💬</div>
                    <p>Loading conversation...</p>
                </div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="chat-page">
                <div className="chat-error">
                    <h2>Conversation not found</h2>
                    <button onClick={() => navigate('/dashboard')}>Go back</button>
                </div>
            </div>
        );
    }

    const otherParticipant = conversation.participant1_id === currentUser.id 
        ? conversation.participant2 
        : conversation.participant1;

    return (
        <div className="chat-page">
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    ← Back
                </button>
                <div className="chat-participant-info">
                    <div className="participant-avatar">
                        {(() => {
                            const url = otherParticipant.profile_picture_url;
                            const absolute = url?.startsWith('http');
                            const src = url ? (absolute ? url : `${import.meta.env.VITE_API_BASE_URL}${url}`) : null;
                            return src ? (
                                <img 
                                    src={src}
                                    alt={otherParticipant.full_name}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.full_name)}&background=b8860b&color=fff&size=120`;
                                    }}
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {otherParticipant.full_name.charAt(0).toUpperCase()}
                                </div>
                            );
                        })()}
                    </div>
                    <div className="participant-details">
                        <h2>{otherParticipant.full_name}</h2>
                        <span className="participant-role">{otherParticipant.role}</span>
                    </div>
                </div>
                <div className="chat-actions">
                    <button 
                        className="attach-btn"
                        onClick={openFilePicker}
                        title="Attach files"
                        disabled={sending}
                    >
                        {/* Paperclip icon */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.438 11.1L12.6 19.938C10.2 22.338 6.3 22.338 3.9 19.938C1.5 17.538 1.5 13.638 3.9 11.238L12.738 2.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9.9 14.1L17.4 6.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <button 
                        className="approval-btn"
                        onClick={() => setShowApprovalForm(true)}
                        title="Request Approval"
                    >
                        📋 Request Approval
                    </button>
                </div>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <span>💬</span>
                        <p>No messages yet</p>
                        <small>Start the conversation by sending a message below</small>
                    </div>
                ) : (
                    messages.map(renderMessage)
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={sendMessage}>
                <div className="input-container">
                    <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        multiple
                        onChange={(e) => handleFilesSelected(e.target.files)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                    />
                    {selectedFiles.length > 0 && (
                        <div className="selected-files">
                            {selectedFiles.map((f, idx) => (
                                <span key={idx} className="file-chip">{f.name}</span>
                            ))}
                            <span className="files-total">{(totalSelectedBytes / (1024*1024)).toFixed(2)} MB</span>
                            <button type="button" className="clear-files" onClick={() => { setSelectedFiles([]); setTotalSelectedBytes(0); }} disabled={sending}>✕</button>
                        </div>
                    )}
                    <textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${otherParticipant.full_name}...`}
                        rows="1"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage(e);
                            }
                        }}
                        disabled={sending}
                    />
                    <button 
                        type="submit" 
                        disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                        className="send-btn"
                    >
                        {sending ? '⏳' : (
                            // Messenger-like send icon (paper plane)
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>

            {/* Approval Request Modal */}
            {showApprovalForm && (
                <div className="modal-overlay">
                    <div className="approval-modal">
                        <div className="modal-header">
                            <h3>Request Approval from {otherParticipant.full_name}</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowApprovalForm(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={sendApprovalRequest} className="approval-form">
                            <div className="form-group">
                                <label>Request Type</label>
                                <select
                                    value={approvalForm.request_type}
                                    onChange={(e) => setApprovalForm(prev => ({
                                        ...prev,
                                        request_type: e.target.value
                                    }))}
                                >
                                    <option value="general">General</option>
                                    <option value="expense">Expense</option>
                                    <option value="task">Task</option>
                                    <option value="project">Project</option>
                                    <option value="leave">Leave</option>
                                    <option value="purchase">Purchase</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={approvalForm.title}
                                    onChange={(e) => setApprovalForm(prev => ({
                                        ...prev,
                                        title: e.target.value
                                    }))}
                                    placeholder="What do you need approval for?"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={approvalForm.description}
                                    onChange={(e) => setApprovalForm(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))}
                                    placeholder="Provide details about your request..."
                                    rows="4"
                                    required
                                />
                            </div>
                            
                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    onClick={() => setShowApprovalForm(false)}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Send Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatPage;
