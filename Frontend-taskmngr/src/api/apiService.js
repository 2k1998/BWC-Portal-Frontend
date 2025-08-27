// src/api/apiService.js - Complete and Fixed Version

const API_BASE_URL = 'http://127.0.0.1:8000';

// Helper function to make API calls
/* callApi is defined at the bottom of this file. */

// Authentication API
export const authApi = {
    login: (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        return fetch(`${API_BASE_URL}/token`, { 
            method: 'POST', 
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)));
    },
    register: (userData) => callApi('/register', 'POST', userData),
    getMe: (token) => callApi('/users/me', 'GET', null, token),
    updateUserMe: (userData, token) => callApi('/users/me', 'PUT', userData, token),
    uploadProfilePicture: (formData, token) => callApi('/users/me/upload-picture', 'POST', formData, token),
    listAllUsers: (token, search = '') => callApi(`/users/all?search=${encodeURIComponent(search)}`, 'GET', null, token),
    deleteUser: (userId, token) => callApi(`/users/${userId}`, 'DELETE', null, token),
    updateUserRole: (userId, roleData, token) => callApi(`/users/${userId}/role`, 'PUT', roleData, token),
    updateUserStatus: (userId, statusData, token) => callApi(`/users/${userId}/status`, 'PUT', statusData, token),
    requestPasswordReset: (data) => callApi('/auth/request-password-reset', 'POST', data),
    resetPassword: (data) => callApi('/auth/reset-password', 'POST', data),
};

// Company API
export const companyApi = {
    create: (companyData, token) => callApi('/companies/', 'POST', companyData, token),
    getAll: (token) => callApi('/companies/', 'GET', null, token),
    getById: (companyId, token) => callApi(`/companies/${companyId}`, 'GET', null, token),
    update: (companyId, companyData, token) => callApi(`/companies/${companyId}`, 'PUT', companyData, token),
    delete: (companyId, token) => callApi(`/companies/${companyId}`, 'DELETE', null, token),
    getCompanyTasks: (companyId, token) => callApi(`/companies/${companyId}/tasks`, 'GET', null, token),
};

// Task API
export const taskApi = {
    // NEW: Update task status
    updateTaskStatus: (taskId, statusData, token) =>
        callApi(`/tasks/${taskId}/status`, 'PUT', statusData, token),

    // NEW: Get task status history
    getTaskStatusHistory: (taskId, token) =>
        callApi(`/tasks/${taskId}/status-history`, 'GET', null, token),

    // Enhanced: Update the existing updateTask method to handle the new status fields
    updateTask: (taskId, taskData, token) =>
        callApi(`/tasks/${taskId}`, 'PUT', taskData, token),

    createTask: (taskData, token) => callApi('/tasks/', 'POST', taskData, token),
    getTasks: (token) => callApi('/tasks/', 'GET', null, token),
    getTaskById: (taskId, token) => callApi(`/tasks/${taskId}`, 'GET', null, token),
    deleteTask: (taskId, token) => callApi(`/tasks/${taskId}`, 'DELETE', null, token),
};

// Group API
export const groupApi = {
    getGroups: (token) => callApi('/groups/', 'GET', null, token),
    createGroup: (groupData, token) => callApi('/groups/', 'POST', groupData, token),
    getGroupById: (groupId, token) => callApi(`/groups/${groupId}`, 'GET', null, token),
    addUserToGroup: (groupId, userId, token) => callApi(`/groups/${groupId}/add-user/${userId}`, 'POST', null, token),
    removeUserFromGroup: (groupId, userId, token) => callApi(`/groups/${groupId}/remove-user/${userId}`, 'DELETE', null, token),
    getGroupMembers: (groupId, token) => callApi(`/groups/${groupId}/members`, 'GET', null, token),
    assignGroupTask: (groupId, taskData, token) => callApi(`/groups/${groupId}/assign-task`, 'POST', taskData, token),
    getGroupTasks: (groupId, token) => callApi(`/groups/${groupId}/tasks`, 'GET', null, token),
    deleteGroup: (groupId, token) => callApi(`/groups/${groupId}`, 'DELETE', null, token),
    updateTask: (taskId, taskData, token) => callApi(`/tasks/${taskId}`, 'PUT', taskData, token),
};

// Contact API
export const contactApi = {
    getAll: (token) => callApi('/contacts/', 'GET', null, token),
    create: (contactData, token) => callApi('/contacts/', 'POST', contactData, token),
    update: (id, contactData, token) => callApi(`/contacts/${id}`, 'PUT', contactData, token),
    delete: (id, token) => callApi(`/contacts/${id}`, 'DELETE', null, token),
    importFromCSV: (contactsList, token) => callApi('/contacts/import-csv', 'POST', { contacts: contactsList }, token),
    importBatch: (contactsList, token) => callApi('/contacts/import-batch', 'POST', { contacts: contactsList }, token),
    deleteBatch: (contactIds, token) => callApi('/contacts/delete-batch', 'POST', { contact_ids: contactIds }, token),
};

// Daily Calls API
export const dailyCallApi = {
    getMyDailyCalls: (token) => callApi('/daily-calls/me', 'GET', null, token),
    addToDailyList: (contactId, token) => callApi('/daily-calls/', 'POST', { contact_id: contactId }, token),
    removeFromDailyList: (dailyCallId, token) => callApi(`/daily-calls/${dailyCallId}`, 'DELETE', null, token),
    updateDailyCall: (dailyCallId, updateData, token) => callApi(`/daily-calls/${dailyCallId}`, 'PUT', updateData, token),
};

// Event API
export const eventApi = {
    createEvent: (eventData, token) => callApi('/events/', 'POST', eventData, token),
    getUpcomingEvent: (token) => callApi('/events/upcoming', 'GET', null, token),
    getAllEvents: (token) => callApi('/events/', 'GET', null, token),
    deleteEvent: (eventId, token) => callApi(`/events/${eventId}`, 'DELETE', null, token),
    updateEvent: (eventId, eventData, token) => callApi(`/events/${eventId}`, 'PUT', eventData, token),
};

// Car API
export const carApi = {
    createCar: (companyId, carData, token) => callApi(`/cars/${companyId}`, 'POST', carData, token),
    getCarsForCompany: (companyId, token) => callApi(`/cars/company/${companyId}`, 'GET', null, token),
    updateCar: (carId, carData, token) => callApi(`/cars/${carId}`, 'PUT', carData, token),
    deleteCar: (carId, token) => callApi(`/cars/${carId}`, 'DELETE', null, token),
};

// Rental API
export const rentalApi = {
    createRental: (companyId, rentalData, token) => callApi(`/rentals/${companyId}`, 'POST', rentalData, token),
    getRentalsForCompany: (companyId, token) => callApi(`/rentals/company/${companyId}`, 'GET', null, token),
    updateRentalOnReturn: (rentalId, returnData, token) => callApi(`/rentals/${rentalId}/return`, 'PUT', returnData, token),
    deleteRental: (rentalId, token) => callApi(`/rentals/${rentalId}`, 'DELETE', null, token),
};

// Calendar API
export const calendarApi = {
    getCalendarEvents: (token) => callApi('/calendar/events', 'GET', null, token),
};

// Reports API
export const reportsApi = {
    getTasksPerCompany: (token) => callApi('/reports/tasks-per-company', 'GET', null, token),
    getRentalCarStatus: (token) => callApi('/reports/rental-car-status', 'GET', null, token),
    getTasksCompletedTimeline: (token) => callApi('/reports/tasks-completed-timeline', 'GET', null, token),
};

// Notification API
export const notificationApi = {
  getMyNotifications: (token) => callApi('/notifications/me', 'GET', null, token),
  markAsRead: (notificationId, token) => callApi(`/notifications/${notificationId}/read`, 'PUT', null, token),
  markAllAsRead: (token) => callApi('/notifications/mark-all-read', 'PUT', null, token),
  clearAllNotifications: (token) => callApi('/notifications/all', 'DELETE', null, token),
};

// Add this to your existing apiService.js file
export const documentApi = {
    upload: async (formData, token) => {
        const response = await fetch(`${API_BASE_URL}/documents/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to upload document');
        }
        
        return response.json();
    },
    
    getAll: async (token, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/documents/${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        
        return response.json();
    },
    
    get: async (documentId, token) => {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch document');
        }
        
        return response.json();
    },
    
    download: async (documentId, token) => {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to download document');
        }
        
        return response.blob();
    },
    
    update: async (documentId, data, token) => {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('Failed to update document');
        }
        
        return response.json();
    },
    
    delete: async (documentId, token) => {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete document');
        }
    },
    
    getCategories: async (token) => {
        const response = await fetch(`${API_BASE_URL}/documents/categories/list`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        
        return response.json();
    },
};

// Project API
export const projectApi = {
  // Get all projects with filtering and sorting
  getAll: async (token, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/projects?${queryString}` : '/projects';
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch projects');
    }

    return await response.json();
  },

  // Get single project by ID
  getById: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch project');
    }

    return await response.json();
  },

  // Create new project
  create: async (projectData, token) => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create project');
    }

    return await response.json();
  },

  // Update project
  update: async (id, projectData, token) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update project');
    }

    return await response.json();
  },

  // Update project status
  updateStatus: async (id, statusData, token) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update project status');
    }

    return await response.json();
  },

  // Delete project
  delete: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete project');
    }

    return true;
  },

  // Get project statistics
  getStats: async (token) => {
    const response = await fetch(`${API_BASE_URL}/projects/stats/overview`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch project statistics');
    }

    return await response.json();
  }
};

// Payment API
export const paymentApi = {
    // Get all payments with filters
    getPayments: async (token, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return callApi(`/payments${queryString ? '?' + queryString : ''}`, 'GET', null, token);
    },

    // Get single payment by ID
    getPayment: async (token, paymentId) => 
        callApi(`/payments/${paymentId}`, 'GET', null, token),

    // Create new payment
    createPayment: async (token, paymentData) => 
        callApi('/payments/', 'POST', paymentData, token),

    // Update payment
    updatePayment: async (token, paymentId, paymentData) => 
        callApi(`/payments/${paymentId}`, 'PUT', paymentData, token),

    // Update payment status
    updatePaymentStatus: async (token, paymentId, statusData) => 
        callApi(`/payments/${paymentId}/status`, 'PATCH', statusData, token),

    // Delete payment
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
};

export const callApi = async (endpoint, method = 'GET', data = null, token = null) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...(data && { body: JSON.stringify(data) })
    };
    const response = await fetch(url, options);
    if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
            const err = await response.json();
            errorMsg = err.detail || err.message || errorMsg;
        } catch {
            // Intentionally left blank: error response is not JSON
        }
        throw new Error(errorMsg);
    }
    if (response.status === 204) return null;
    return response.json();
};

export default {
    authApi,
    companyApi,
    taskApi,
    groupApi,
    contactApi,
    dailyCallApi,
    eventApi,
    carApi,
    rentalApi,
    calendarApi,
    reportsApi,
    notificationApi,
    projectApi,
    paymentApi,
    documentApi,
}