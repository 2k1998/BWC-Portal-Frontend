// src/api/apiService.js - Updated for production

// In src/api/apiService.js
const API_BASE_URL = 'https://bwc-portal-backend.onrender.com';
//const API_BASE_URL = 'http://localhost:8000'; // Uncomment for local development

// Helper function to make API calls
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

    if (data) {
        if (data instanceof FormData) {
            delete headers['Content-Type']; // Let browser set content type for FormData
            config.body = data;
        } else {
            config.body = JSON.stringify(data);
        }
    }

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (parseError) {
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
    clearAllNotifications: (token) => callApi('/notifications/clear-all', 'DELETE', null, token),
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
};
