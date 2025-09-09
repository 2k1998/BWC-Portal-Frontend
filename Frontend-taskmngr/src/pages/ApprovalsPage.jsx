// src/pages/ApprovalsPage.jsx - Approval requests management page
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { approvalApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './ApprovalsPage.css';

function ApprovalsPage() {
    const { currentUser, accessToken } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseAction, setResponseAction] = useState('');

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            
            if (activeTab === 'sent') {
                params.as_requester = true;
            } else if (activeTab === 'received') {
                params.as_approver = true;
            } else {
                params.as_requester = true;
                params.as_approver = true;
            }

            const data = await approvalApi.getRequests(params, accessToken);
            setRequests(data || []);
        } catch (error) {
            console.error('Failed to fetch approval requests:', error);
            showNotification('Failed to load approval requests', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeTab, accessToken, showNotification]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleResponse = async (request, action) => {
        if (action === 'discussion') {
            // Navigate directly to chat for discussion
            navigate(`/chat/${request.requester.id}`);
            return;
        }

        setSelectedRequest(request);
        setResponseAction(action);
        setShowResponseModal(true);
    };

    const submitResponse = async () => {
        if (!selectedRequest) return;

        try {
            await approvalApi.respondToRequest(
                selectedRequest.id,
                {
                    action: responseAction,
                    response_message: responseMessage
                },
                accessToken
            );

            showNotification(`Request ${responseAction}d successfully!`, 'success');
            setShowResponseModal(false);
            setResponseMessage('');
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            console.error(`Failed to ${responseAction} request:`, error);
            showNotification(`Failed to ${responseAction} request`, 'error');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': '#ffc107',
            'approved': '#28a745',
            'rejected': '#dc3545',
            'discussion': '#17a2b8',
            'cancelled': '#6c757d'
        };
        return colors[status] || '#6c757d';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'pending': '⏳',
            'approved': '✅',
            'rejected': '❌',
            'discussion': '💬',
            'cancelled': '🚫'
        };
        return icons[status] || '❓';
    };

    const renderRequest = (request) => {
        const isRequester = request.requester.id === currentUser.id;
        const isPending = request.status === 'pending';
        const canRespond = !isRequester && isPending;

        return (
            <div key={request.id} className="approval-request-card">
                <div className="request-header">
                    <div className="request-info">
                        <div className="request-title">{request.title}</div>
                        <div className="request-meta">
                            <span className="request-type">{request.request_type}</span>
                            <span 
                                className="request-status"
                                style={{ 
                                    backgroundColor: getStatusColor(request.status),
                                    color: 'white'
                                }}
                            >
                                {getStatusIcon(request.status)} {request.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <div className="request-time">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </div>
                </div>

                <div className="request-participants">
                    <div className="participant">
                        <span className="participant-label">From:</span>
                        <span className="participant-name">{request.requester.full_name}</span>
                    </div>
                    <div className="participant">
                        <span className="participant-label">To:</span>
                        <span className="participant-name">{request.approver.full_name}</span>
                    </div>
                </div>

                <div className="request-description">
                    {request.description}
                </div>

                {request.response_message && (
                    <div className="response-message">
                        <strong>Response:</strong> {request.response_message}
                    </div>
                )}

                {canRespond && (
                    <div className="request-actions">
                        <button 
                            className="action-btn approve"
                            onClick={() => handleResponse(request, 'approve')}
                        >
                            ✅ Approve
                        </button>
                        <button 
                            className="action-btn reject"
                            onClick={() => handleResponse(request, 'reject')}
                        >
                            ❌ Reject
                        </button>
                        <button 
                            className="action-btn discuss"
                            onClick={() => handleResponse(request, 'discussion')}
                        >
                            💬 Discuss
                        </button>
                    </div>
                )}

                {request.status === 'discussion' && (
                    <div className="discussion-note">
                        <button 
                            className="chat-btn"
                            onClick={() => navigate(`/chat/${isRequester ? request.approver.id : request.requester.id}`)}
                        >
                            💬 Continue Discussion
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const filteredRequests = requests.filter(request => {
        if (activeTab === 'sent') return request.requester.id === currentUser.id;
        if (activeTab === 'received') return request.approver.id === currentUser.id;
        return true;
    });

    if (loading) {
        return (
            <div className="approvals-page">
                <div className="page-header">
                    <h1>Approval Requests</h1>
                </div>
                <div className="loading-container">
                    <div className="loading-spinner">📋</div>
                    <p>Loading approval requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="approvals-page">
            <div className="page-header">
                <h1>Approval Requests</h1>
                <div className="header-stats">
                    <div className="stat">
                        <span className="stat-value">
                            {requests.filter(r => r.status === 'pending').length}
                        </span>
                        <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">
                            {requests.filter(r => r.status === 'approved').length}
                        </span>
                        <span className="stat-label">Approved</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">
                            {requests.filter(r => r.status === 'discussion').length}
                        </span>
                        <span className="stat-label">In Discussion</span>
                    </div>
                </div>
            </div>

            <div className="approval-tabs">
                <button 
                    className={activeTab === 'all' ? 'active' : ''}
                    onClick={() => setActiveTab('all')}
                >
                    All Requests ({requests.length})
                </button>
                <button 
                    className={activeTab === 'received' ? 'active' : ''}
                    onClick={() => setActiveTab('received')}
                >
                    Received ({requests.filter(r => r.approver.id === currentUser.id).length})
                </button>
                <button 
                    className={activeTab === 'sent' ? 'active' : ''}
                    onClick={() => setActiveTab('sent')}
                >
                    Sent ({requests.filter(r => r.requester.id === currentUser.id).length})
                </button>
            </div>

            <div className="requests-container">
                {filteredRequests.length === 0 ? (
                    <div className="no-requests">
                        <span>📋</span>
                        <h3>No approval requests</h3>
                        <p>
                            {activeTab === 'sent' 
                                ? "You haven't sent any approval requests yet."
                                : activeTab === 'received'
                                ? "You don't have any pending approval requests."
                                : "No approval requests found."
                            }
                        </p>
                    </div>
                ) : (
                    filteredRequests.map(renderRequest)
                )}
            </div>

            {/* Response Modal */}
            {showResponseModal && (
                <div className="modal-overlay">
                    <div className="response-modal">
                        <div className="modal-header">
                            <h3>
                                {responseAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                            </h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowResponseModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            <div className="request-summary">
                                <strong>{selectedRequest?.title}</strong>
                                <p>{selectedRequest?.description}</p>
                            </div>
                            
                            <div className="form-group">
                                <label>Response Message (Optional)</label>
                                <textarea
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    placeholder={`Add a message explaining your ${responseAction}al...`}
                                    rows="4"
                                />
                            </div>
                            
                            <div className="modal-actions">
                                <button 
                                    className="cancel-btn"
                                    onClick={() => setShowResponseModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className={`submit-btn ${responseAction}`}
                                    onClick={submitResponse}
                                >
                                    {responseAction === 'approve' ? '✅ Approve' : '❌ Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ApprovalsPage;
