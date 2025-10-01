// api/taskManagementApi.js - API service for enhanced task management
import { callApi } from './apiService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bwc-portal-backend-w1qr.onrender.com';

export const taskManagementApi = {
    // ==================== TASK ASSIGNMENT ENDPOINTS ====================
    
    /**
     * Assign a task to a user
     */
    assignTask: (assignmentData, accessToken) => 
        callApi('/task-management/assign', 'POST', assignmentData, accessToken),

    /**
     * Transfer a task to another user (simplified assignment)
     */
    transferTask: (transferData, accessToken) => 
        callApi('/task-management/transfer', 'POST', transferData, accessToken),

    /**
     * Get pending assignments for current user
     */
    getPendingAssignments: (accessToken) => 
        callApi('/task-management/assignments/pending', 'GET', null, accessToken),

    /**
     * Get assignment details
     */
    getAssignmentDetails: (assignmentId, accessToken) => 
        callApi(`/task-management/assignments/${assignmentId}`, 'GET', null, accessToken),

    /**
     * Respond to a task assignment (accept/reject/discuss)
     */
    respondToAssignment: (assignmentId, responseData, accessToken) => 
        callApi(`/task-management/assignments/${assignmentId}/respond`, 'POST', responseData, accessToken),

    /**
     * Get all my assignments (assigned to me or by me)
     */
    getMyAssignments: (params = {}, accessToken) => {
        const searchParams = new URLSearchParams();
        
        if (params.status_filter) searchParams.append('status_filter', params.status_filter);
        if (params.assigned_by_me) searchParams.append('assigned_by_me', params.assigned_by_me);

        return callApi(`/task-management/my-assignments?${searchParams}`, 'GET', null, accessToken);
    },

    // ==================== MESSAGING ENDPOINTS ====================

    /**
     * Get conversation for an assignment
     */
    getConversation: (assignmentId, accessToken) => 
        callApi(`/task-management/conversations/${assignmentId}`, 'GET', null, accessToken),

    /**
     * Send a message in a conversation
     */
    sendMessage: (assignmentId, messageData, accessToken) => 
        callApi(`/task-management/conversations/${assignmentId}/messages`, 'POST', messageData, accessToken),

    /**
     * Complete a conversation
     */
    completeConversation: (assignmentId, actionData, accessToken) => 
        callApi(`/task-management/conversations/${assignmentId}/complete`, 'POST', actionData, accessToken),

    // ==================== CALL MANAGEMENT ENDPOINTS ====================

    /**
     * Schedule a call for task discussion
     */
    scheduleCall: (assignmentId, callData, accessToken) => 
        callApi(`/task-management/assignments/${assignmentId}/schedule-call`, 'POST', callData, accessToken),

    /**
     * Mark a call as completed
     */
    completeCall: (assignmentId, callData, accessToken) => 
        callApi(`/task-management/assignments/${assignmentId}/complete-call`, 'POST', callData, accessToken),

    // ==================== NOTIFICATION ENDPOINTS ====================

    /**
     * Get task notifications
     */
    getTaskNotifications: (params = {}, accessToken) => {
        const searchParams = new URLSearchParams();
        
        if (params.unread_only) searchParams.append('unread_only', params.unread_only);
        if (params.limit) searchParams.append('limit', params.limit);

        return callApi(`/task-management/notifications?${searchParams}`, 'GET', null, accessToken);
    },

    /**
     * Mark task notification as read
     */
    markNotificationRead: (notificationId, accessToken) => 
        callApi(`/task-management/notifications/${notificationId}/read`, 'PUT', null, accessToken),

    // ==================== DASHBOARD/SUMMARY ENDPOINTS ====================

    /**
     * Get assignment summary for dashboard
     */
    getAssignmentSummary: (accessToken) => 
        callApi('/task-management/summary', 'GET', null, accessToken),

    // ==================== HELPER METHODS ====================

    /**
     * Get assignment status color
     */
    getAssignmentStatusColor(status) {
        const colors = {
            'pending_acceptance': '#f59e0b',
            'accepted': '#10b981',
            'rejected': '#ef4444',
            'discussion_requested': '#3b82f6',
            'discussion_active': '#8b5cf6',
            'discussion_completed': '#6b7280'
        };
        return colors[status] || '#6b7280';
    },

    /**
     * Get assignment status display text
     */
    getAssignmentStatusText(status) {
        const texts = {
            'pending_acceptance': 'Pending Acceptance',
            'accepted': 'Accepted',
            'rejected': 'Rejected',
            'discussion_requested': 'Discussion Requested',
            'discussion_active': 'In Discussion',
            'discussion_completed': 'Discussion Completed'
        };
        return texts[status] || status;
    },

    /**
     * Format assignment date for display
     */
    formatAssignmentDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
            return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays === 1) {
            return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
};