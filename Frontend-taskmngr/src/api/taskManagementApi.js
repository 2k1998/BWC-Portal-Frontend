// api/taskManagementApi.js - API service for enhanced task management
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bwc-portal-backend-w1qr.onrender.com';

export const taskManagementApi = {
    // ==================== TASK ASSIGNMENT ENDPOINTS ====================
    
    /**
     * Assign a task to a user
     */
    async assignTask(assignmentData, accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(assignmentData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to assign task');
        }

        return response.json();
    },

    /**
     * Get pending assignments for current user
     */
    async getPendingAssignments(accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/assignments/pending`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch pending assignments');
        }

        return response.json();
    },

    /**
     * Get assignment details
     */
    async getAssignmentDetails(assignmentId, accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/assignments/${assignmentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch assignment details');
        }

        return response.json();
    },

    /**
     * Respond to a task assignment (accept/reject/discuss)
     */
    async respondToAssignment(assignmentId, responseData, accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/assignments/${assignmentId}/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(responseData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to respond to assignment');
        }

        return response.json();
    },

    /**
     * Get all my assignments (assigned to me or by me)
     */
    async getMyAssignments(params = {}, accessToken) {
        const searchParams = new URLSearchParams();
        
        if (params.status_filter) searchParams.append('status_filter', params.status_filter);
        if (params.assigned_by_me) searchParams.append('assigned_by_me', params.assigned_by_me);

        const response = await fetch(`${API_BASE_URL}/task-management/my-assignments?${searchParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch assignments');
        }

        return response.json();
    },

    // ==================== MESSAGING ENDPOINTS ====================

    /**
     * Get conversation for an assignment
     */
    async getConversation(assignmentId, accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/conversations/${assignmentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch conversation');
        }

        return response.json();
    },

    /**
     * Send a message in a conversation
     */
    async sendMessage(assignmentId, messageData, accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/conversations/${assignmentId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(messageData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to send message');
        }

        return response.json();
    },

    /**
     * Complete a conversation
     */
    async completeConversation(assignmentId, actionData, accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/conversations/${assignmentId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(actionData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to complete conversation');
        }

        return response.json();
    },

    // ==================== CALL MANAGEMENT ENDPOINTS ====================

    /**
     * Schedule a call for task discussion
     */
    async scheduleCall(assignmentId, callData, accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/assignments/${assignmentId}/schedule-call`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(callData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to schedule call');
        }

        return response.json();
    },

    /**
     * Mark a call as completed
     */
    async completeCall(assignmentId, callData, accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/assignments/${assignmentId}/complete-call`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(callData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to complete call');
        }

        return response.json();
    },

    // ==================== NOTIFICATION ENDPOINTS ====================

    /**
     * Get task notifications
     */
    async getTaskNotifications(params = {}, accessToken) {
        const searchParams = new URLSearchParams();
        
        if (params.unread_only) searchParams.append('unread_only', params.unread_only);
        if (params.limit) searchParams.append('limit', params.limit);

        const response = await fetch(`${API_BASE_URL}/task-management/notifications?${searchParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch notifications');
        }

        return response.json();
    },

    /**
     * Mark task notification as read
     */
    async markNotificationRead(notificationId, accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to mark notification as read');
        }

        return response.json();
    },

    // ==================== DASHBOARD/SUMMARY ENDPOINTS ====================

    /**
     * Get assignment summary for dashboard
     */
    async getAssignmentSummary(accessToken) {
        const response = await fetch(`${API_BASE_URL}/task-management/summary`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch assignment summary');
        }

        return response.json();
    },

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