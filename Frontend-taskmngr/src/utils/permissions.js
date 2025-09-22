// src/utils/permissions.js
// Permission checking utilities

const ROLE_DEFAULTS = {
  admin: {
    dashboard: true, tasks: true, profile: true, projects: true, companies: true,
    contacts: true, groups: true, events: true, documents: true, users: true,
    reports: true, admin_panel: true, payments: true, commissions: true,
    car_finance: true, daily_calls: true
  },
  manager: {
    dashboard: true, tasks: true, profile: true, projects: true, companies: true,
    contacts: true, groups: true, events: true, documents: true, users: false,
    reports: true, admin_panel: false, payments: false, commissions: false,
    car_finance: false, daily_calls: true
  },
  head: {
    dashboard: true, tasks: true, profile: true, projects: true, companies: true,
    contacts: true, groups: true, events: true, documents: true, users: false,
    reports: true, admin_panel: false, payments: false, commissions: false,
    car_finance: false, daily_calls: true
  },
  pillar: {
    dashboard: true, tasks: true, profile: true, projects: false, companies: true,
    contacts: true, groups: true, events: true, documents: true, users: false,
    reports: false, admin_panel: false, payments: false, commissions: false,
    car_finance: false, daily_calls: true
  },
  member: {
    dashboard: true, tasks: true, profile: true, projects: false, companies: false,
    contacts: false, groups: false, events: false, documents: false, users: false,
    reports: false, admin_panel: false, payments: false, commissions: false,
    car_finance: false, daily_calls: false
  }
};

/**
 * Check if a user has permission to access a specific page
 * @param {Object} user - User object with role and permissions
 * @param {string} pageKey - The page key to check (e.g., 'dashboard', 'projects')
 * @returns {boolean} - Whether the user has permission
 */
export const hasPermission = (user, pageKey) => {
  if (!user) return false;
  
  // If user has custom permissions, use those
  if (user.permissions && user.permissions.hasOwnProperty(pageKey)) {
    return user.permissions[pageKey];
  }
  
  // Otherwise, use role defaults
  const roleDefaults = ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.member;
  return roleDefaults[pageKey] || false;
};

/**
 * Get all permissions for a user (custom + role defaults)
 * @param {Object} user - User object with role and permissions
 * @returns {Object} - Complete permissions object
 */
export const getUserPermissions = (user) => {
  if (!user) return ROLE_DEFAULTS.member;
  
  const roleDefaults = ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.member;
  
  // Merge role defaults with custom permissions
  return {
    ...roleDefaults,
    ...(user.permissions || {})
  };
};

/**
 * Check if user has admin permissions
 * @param {Object} user - User object
 * @returns {boolean} - Whether user is admin
 */
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

/**
 * Check if user has manager or higher permissions
 * @param {Object} user - User object
 * @returns {boolean} - Whether user is manager or higher
 */
export const isManagerOrHigher = (user) => {
  return ['admin', 'manager', 'head'].includes(user?.role);
};

/**
 * Get permission summary for display
 * @param {Object} user - User object
 * @returns {string} - Permission summary (e.g., "12/16")
 */
export const getPermissionSummary = (user) => {
  const permissions = getUserPermissions(user);
  const totalPages = Object.keys(ROLE_DEFAULTS.admin).length;
  const enabledPages = Object.values(permissions).filter(Boolean).length;
  return `${enabledPages}/${totalPages}`;
};

/**
 * Get pages that user has access to
 * @param {Object} user - User object
 * @returns {Array} - Array of page keys user can access
 */
export const getAccessiblePages = (user) => {
  const permissions = getUserPermissions(user);
  return Object.keys(permissions).filter(pageKey => permissions[pageKey]);
};

/**
 * Check if user can access any admin pages
 * @param {Object} user - User object
 * @returns {boolean} - Whether user can access admin pages
 */
export const canAccessAdminPages = (user) => {
  const adminPages = ['users', 'reports', 'admin_panel', 'payments', 'commissions'];
  return adminPages.some(page => hasPermission(user, page));
};

export default {
  hasPermission,
  getUserPermissions,
  isAdmin,
  isManagerOrHigher,
  getPermissionSummary,
  getAccessiblePages,
  canAccessAdminPages,
  ROLE_DEFAULTS
};
