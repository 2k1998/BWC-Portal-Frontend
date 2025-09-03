// src/services/paymentApi.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bwc-portal-backend-w1qr.onrender.com';

// Helper function that matches your apiService pattern
const callApi = async (endpoint, method = 'GET', data = null, token = null) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
                // If we can't parse the error as JSON, use the default message
            }
            throw new Error(errorMessage);
        }

        // Handle 204 No Content responses
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`API call failed: ${method} ${url}`, error);
        throw error;
    }
};

export const paymentApi = {
    // Get all payments with filters - matches backend exactly
    getPayments: async (token, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/payments?${queryString}` : '/payments';
        return callApi(endpoint, 'GET', null, token);
    },

    // Get single payment by ID
    getPayment: async (token, paymentId) => 
        callApi(`/payments/${paymentId}`, 'GET', null, token),

    // Create new payment
    createPayment: async (token, paymentData) => 
        callApi('/payments', 'POST', paymentData, token),

    // Update payment
    updatePayment: async (token, paymentId, paymentData) => 
        callApi(`/payments/${paymentId}`, 'PUT', paymentData, token),

    // Update payment status
    updatePaymentStatus: async (token, paymentId, statusData) => 
        callApi(`/payments/${paymentId}/status`, 'PATCH', statusData, token),

    // Delete payment - Note: Make sure your backend supports DELETE method
    deletePayment: async (token, paymentId) => 
        callApi(`/payments/${paymentId}`, 'DELETE', null, token),

    // Get dashboard summary
    getDashboardSummary: async (token) => 
        callApi('/sales/dashboard-summary', 'GET', null, token),

    // Get employee commission summaries
    getEmployeeCommissions: async (token) => 
        callApi('/sales/employee-commissions', 'GET', null, token),

    // Calculate commission for employee
    calculateCommission: async (token, data) => 
        callApi('/sales/calculate-commission', 'POST', data, token),

    // Create payment from commission summary
    createCommissionPayment: async (token, commissionSummaryId) => 
        callApi(`/payments/commission/${commissionSummaryId}`, 'POST', null, token),

    // Get commission rules
    getCommissionRules: async (token, employeeId = null) => {
        const params = employeeId ? `?employee_id=${employeeId}` : '';
        return callApi(`/sales/commission-rules${params}`, 'GET', null, token);
    },

    // Create commission rule
    createCommissionRule: async (token, ruleData) => 
        callApi('/sales/commission-rules', 'POST', ruleData, token),

    // Update commission rule
    updateCommissionRule: async (token, ruleId, ruleData) => 
        callApi(`/sales/commission-rules/${ruleId}`, 'PUT', ruleData, token),
};

export default paymentApi;