// src/context/RealtimeContext.jsx - Context for real-time updates
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import websocketService from '../services/websocketService';
import { RealtimeContext } from './RealtimeContextDefinition';

export const RealtimeProvider = ({ children }) => {
    const { accessToken, isAuthenticated } = useAuth();
    const { showNotification } = useNotification();
    const [isConnected, setIsConnected] = useState(false);
    const [newMessages, setNewMessages] = useState([]);
    const [newNotifications, setNewNotifications] = useState([]);
    const [approvalUpdates, setApprovalUpdates] = useState([]);

    useEffect(() => {
        if (isAuthenticated && accessToken) {
            // Connect to WebSocket
            websocketService.connect(accessToken);
            setIsConnected(true);

            // Set up message listeners
            const unsubscribeMessage = websocketService.on('new_message', (data) => {
                setNewMessages(prev => [...prev, data.message]);
                
                // Show notification for new message
                showNotification(
                    `New message from ${data.message.sender.full_name}`,
                    'info'
                );
            });

            const unsubscribeApprovalRequest = websocketService.on('new_approval_request', (data) => {
                setApprovalUpdates(prev => [...prev, { type: 'new_request', data: data.approval_request }]);
                
                // Show notification for new approval request
                showNotification(
                    `New approval request: ${data.approval_request.title}`,
                    'info'
                );
            });

            const unsubscribeApprovalResponse = websocketService.on('approval_response', (data) => {
                setApprovalUpdates(prev => [...prev, { type: 'response', data: data.approval_request, response_type: data.response_type }]);
                
                // Show notification for approval response
                const responseText = data.response_type === 'approved' ? 'approved' : 
                                   data.response_type === 'rejected' ? 'rejected' : 'wants to discuss';
                showNotification(
                    `Your request "${data.approval_request.title}" was ${responseText}`,
                    data.response_type === 'approved' ? 'success' : 
                    data.response_type === 'rejected' ? 'error' : 'info'
                );
            });

            const unsubscribeNotification = websocketService.on('notification', (data) => {
                setNewNotifications(prev => [...prev, data.notification]);
                
                // Show notification
                showNotification(data.notification.message, 'info');
            });

            // Cleanup function
            return () => {
                unsubscribeMessage();
                unsubscribeApprovalRequest();
                unsubscribeApprovalResponse();
                unsubscribeNotification();
                websocketService.disconnect();
                setIsConnected(false);
            };
        } else {
            // Disconnect if not authenticated
            websocketService.disconnect();
            setIsConnected(false);
        }
    }, [isAuthenticated, accessToken, showNotification]);

    // Function to mark messages as read
    const markMessagesAsRead = (conversationId) => {
        setNewMessages(prev => 
            prev.filter(msg => msg.conversation_id !== conversationId)
        );
    };

    // Function to mark notifications as read
    const markNotificationsAsRead = () => {
        setNewNotifications([]);
    };

    // Function to mark approval updates as read
    const markApprovalUpdatesAsRead = () => {
        setApprovalUpdates([]);
    };

    // Function to get unread message count for a conversation
    const getUnreadMessageCount = (conversationId) => {
        return newMessages.filter(msg => msg.conversation_id === conversationId).length;
    };

    // Function to get total unread message count
    const getTotalUnreadMessageCount = () => {
        return newMessages.length;
    };

    // Function to get total unread notification count
    const getTotalUnreadNotificationCount = () => {
        return newNotifications.length + approvalUpdates.length;
    };

    const value = {
        isConnected,
        newMessages,
        newNotifications,
        approvalUpdates,
        markMessagesAsRead,
        markNotificationsAsRead,
        markApprovalUpdatesAsRead,
        getUnreadMessageCount,
        getTotalUnreadMessageCount,
        getTotalUnreadNotificationCount,
        websocketService
    };

    return (
        <RealtimeContext.Provider value={value}>
            {children}
        </RealtimeContext.Provider>
    );
};
