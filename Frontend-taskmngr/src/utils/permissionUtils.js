// Permission utility functions for handling permission updates
import { authApi } from '../api/apiService';

/**
 * Update user permissions and refresh context if needed
 * @param {number} userId - ID of the user to update
 * @param {Object} permissions - New permissions object
 * @param {string} accessToken - Current user's access token
 * @param {Object} currentUser - Current user object
 * @param {Function} refreshCurrentUser - Function to refresh current user context
 * @param {Function} showNotification - Function to show notifications
 * @param {Function} fetchUsers - Function to refresh users list
 * @param {Function} t - Translation function
 * @returns {Promise<boolean>} - Success status
 */
export const updateUserPermissionsWithRefresh = async (
    userId, 
    permissions, 
    accessToken, 
    currentUser, 
    refreshCurrentUser, 
    showNotification, 
    fetchUsers, 
    t
) => {
    try {
        // Update permissions on the backend
        await authApi.updateUserPermissions(userId, permissions, accessToken);
        
        // Show success notification
        showNotification(t('permissions_updated_successfully') || 'Permissions updated successfully', 'success');
        
        // If we're updating the current user's permissions, refresh their context
        if (userId === currentUser?.id) {
            await refreshCurrentUser();
            showNotification('Your permissions have been updated. You may need to refresh the page to see changes.', 'info');
        }
        
        // Refresh the users list to get the latest data
        if (fetchUsers) {
            await fetchUsers();
        }
        
        return true;
    } catch (error) {
        showNotification(error.message || t('failed_to_update_permissions') || 'Failed to update permissions', 'error');
        return false;
    }
};

/**
 * Check if a user has access to a specific page with better error handling
 * @param {Object} user - User object
 * @param {string} pageKey - Page to check access for
 * @param {Function} hasPermission - Permission checking function
 * @returns {boolean} - Whether user has access
 */
export const checkPageAccess = (user, pageKey, hasPermission) => {
    try {
        return hasPermission(user, pageKey);
    } catch (error) {
        console.error('Error checking page access:', error);
        return false;
    }
};

/**
 * Get user permission summary with fallback
 * @param {Object} user - User object
 * @param {Function} getPermissionSummary - Permission summary function
 * @returns {string} - Permission summary
 */
export const getUserPermissionSummary = (user, getPermissionSummary) => {
    try {
        return getPermissionSummary(user);
    } catch (error) {
        console.error('Error getting permission summary:', error);
        return '0/16';
    }
};
