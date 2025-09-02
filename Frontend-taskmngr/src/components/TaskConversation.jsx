// components/TaskConversation.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useAuth from '../context/useAuth';
import { useNotification } from '../context/NotificationContext';
import { taskManagementApi } from '../api/taskManagementApi';
import './TaskConversation.css';

const TaskConversation = ({ assignmentId, onClose, onComplete }) => {
    const { currentUser, accessToken } = useAuth();
    const { showNotification } = useNotification();
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showCallScheduler, setShowCallScheduler] = useState(false);
    const [callDateTime, setCallDateTime] = useState('');
    const [callNotes, setCallNotes] = useState('');
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [finalMessage, setFinalMessage] = useState('');
    
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversation = useCallback(async () => {
        try {
            const data = await taskManagementApi.getConversation(assignmentId, accessToken);
            setConversation(data);
        } catch (error) {
            console.error('Failed to load conversation:', error);
            showNotification('Failed to load conversation', 'error');
        } finally {
            setLoading(false);
        }
    }, [assignmentId, accessToken, showNotification]);

    useEffect(() => {
        fetchConversation();
    }, [fetchConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [conversation?.messages]);

    

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const messageData = {
                content: newMessage.trim(),
                message_type: 'text'
            };

            const sentMessage = await taskManagementApi.sendMessage(assignmentId, messageData, accessToken);
            
            setConversation(prev => ({
                ...prev,
                messages: [...prev.messages, sentMessage]
            }));
            
            setNewMessage('');
            messageInputRef.current?.focus();
        } catch (error) {
            console.error('Failed to send message:', error);
            showNotification('Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    const scheduleCall = async () => {
        if (!callDateTime) return;

        try {
            await taskManagementApi.scheduleCall(assignmentId, {
                scheduled_time: callDateTime,
                notes: callNotes
            }, accessToken);
            
            showNotification('Call scheduled successfully!', 'success');
            setShowCallScheduler(false);
            setCallDateTime('');
            setCallNotes('');
            fetchConversation(); // Refresh to show system message
        } catch (error) {
            console.error('Failed to schedule call:', error);
            showNotification('Failed to schedule call', 'error');
        }
    };

    const completeConversation = async () => {
        try {
            await taskManagementApi.completeConversation(assignmentId, {
                action: 'complete',
                final_message: finalMessage || undefined
            }, accessToken);
            
            showNotification('Conversation completed!', 'success');
            setShowCompleteDialog(false);
            onComplete?.();
            fetchConversation();
        } catch (error) {
            console.error('Failed to complete conversation:', error);
            showNotification('Failed to complete conversation', 'error');
        }
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays === 1) {
            return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    const getMessageTypeIcon = (type) => {
        switch (type) {
            case 'call_scheduled': return '📞';
            case 'call_completed': return '✅';
            case 'system': return 'ℹ️';
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="conversation-loading">
                <div className="loading-spinner">Loading conversation...</div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="conversation-error">
                <p>Failed to load conversation</p>
                <button onClick={onClose} className="btn-close">Close</button>
            </div>
        );
    }

    return (
        <div className="task-conversation">
            <div className="conversation-header">
                <div className="conversation-info">
                    <h3>Task Discussion</h3>
                    <p className="conversation-status">
                        Status: <span className={`status-${conversation.status}`}>
                            {conversation.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </p>
                </div>
                <div className="conversation-actions">
                    {conversation.status === 'active' && (
                        <>
                            <button
                                onClick={() => setShowCallScheduler(true)}
                                className="btn-schedule-call"
                                title="Schedule a call"
                            >
                                📞 Call
                            </button>
                            <button
                                onClick={() => setShowCompleteDialog(true)}
                                className="btn-complete-conversation"
                                title="Complete conversation"
                            >
                                ✅ Complete
                            </button>
                        </>
                    )}
                    <button onClick={onClose} className="btn-close-conversation">✕</button>
                </div>
            </div>

            <div className="messages-container">
                {conversation.messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    conversation.messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${
                                message.sender.id === currentUser.id ? 'own-message' : 'other-message'
                            } ${message.is_system_message ? 'system-message' : ''}`}
                        >
                            <div className="message-content">
                                {message.is_system_message && (
                                    <span className="message-icon">
                                        {getMessageTypeIcon(message.message_type)}
                                    </span>
                                )}
                                <p>{message.content}</p>
                            </div>
                            <div className="message-meta">
                                <span className="message-sender">
                                    {message.sender.full_name}
                                </span>
                                <span className="message-time">
                                    {formatMessageTime(message.sent_at)}
                                </span>
                                {message.read_at && message.sender.id === currentUser.id && (
                                    <span className="message-read">✓</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {conversation.status === 'active' && (
                <form onSubmit={sendMessage} className="message-input-form">
                    <div className="input-container">
                        <textarea
                            ref={messageInputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="message-input"
                            rows="2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(e);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="btn-send-message"
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </form>
            )}

            {conversation.status === 'completed' && (
                <div className="conversation-completed">
                    <p>This conversation has been completed.</p>
                    {conversation.completed_by && (
                        <p className="completed-by">
                            Completed by: {conversation.completed_by.full_name} on{' '}
                            {new Date(conversation.completed_at).toLocaleString()}
                        </p>
                    )}
                </div>
            )}

            {/* Call Scheduler Modal */}
            {showCallScheduler && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Schedule Call</h3>
                            <button
                                onClick={() => setShowCallScheduler(false)}
                                className="modal-close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Date & Time:</label>
                                <input
                                    type="datetime-local"
                                    value={callDateTime}
                                    onChange={(e) => setCallDateTime(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Notes (optional):</label>
                                <textarea
                                    value={callNotes}
                                    onChange={(e) => setCallNotes(e.target.value)}
                                    placeholder="Any additional notes for the call..."
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                onClick={scheduleCall}
                                disabled={!callDateTime}
                                className="btn-confirm"
                            >
                                Schedule Call
                            </button>
                            <button
                                onClick={() => setShowCallScheduler(false)}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Conversation Modal */}
            {showCompleteDialog && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Complete Conversation</h3>
                            <button
                                onClick={() => setShowCompleteDialog(false)}
                                className="modal-close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to complete this conversation? This will end the discussion.</p>
                            <div className="form-group">
                                <label>Final message (optional):</label>
                                <textarea
                                    value={finalMessage}
                                    onChange={(e) => setFinalMessage(e.target.value)}
                                    placeholder="Any final thoughts or summary..."
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                onClick={completeConversation}
                                className="btn-confirm"
                            >
                                Complete Conversation
                            </button>
                            <button
                                onClick={() => setShowCompleteDialog(false)}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskConversation;