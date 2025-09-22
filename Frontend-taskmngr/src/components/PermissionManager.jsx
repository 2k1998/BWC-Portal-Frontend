// src/components/PermissionManager.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Save, RotateCcw, Eye, EyeOff, Pencil } from 'lucide-react';
import './PermissionManager.css';

const PERMISSION_CATEGORIES = {
  core: {
    name: 'core_pages',
    pages: [
      { key: 'dashboard', label: 'dashboard' },
      { key: 'tasks', label: 'tasks' },
      { key: 'profile', label: 'profile' }
    ]
  },
  management: {
    name: 'management_pages',
    pages: [
      { key: 'projects', label: 'projects' },
      { key: 'companies', label: 'companies' },
      { key: 'contacts', label: 'contacts' },
      { key: 'groups', label: 'groups' },
      { key: 'events', label: 'events' },
      { key: 'documents', label: 'documents' }
    ]
  },
  admin: {
    name: 'admin_pages',
    pages: [
      { key: 'users', label: 'users' },
      { key: 'reports', label: 'reports' },
      { key: 'admin_panel', label: 'admin_panel' },
      { key: 'payments', label: 'payments' },
      { key: 'commissions', label: 'commissions' },
      { key: 'car_finance', label: 'car_finance' },
      { key: 'daily_calls', label: 'daily_calls' }
    ]
  }
};

// Permission access levels
const ACCESS_LEVELS = {
  NONE: 'none',
  VIEW: 'view',
  EDIT: 'edit'
};

const ROLE_DEFAULTS = {
  admin: {
    dashboard: 'edit', tasks: 'edit', profile: 'edit', projects: 'edit', companies: 'edit',
    contacts: 'edit', groups: 'edit', events: 'edit', documents: 'edit', users: 'edit',
    reports: 'edit', admin_panel: 'edit', payments: 'edit', commissions: 'edit',
    car_finance: 'edit', daily_calls: 'edit'
  },
  manager: {
    dashboard: 'edit', tasks: 'edit', profile: 'edit', projects: 'edit', companies: 'edit',
    contacts: 'edit', groups: 'edit', events: 'edit', documents: 'edit', users: 'view',
    reports: 'edit', admin_panel: 'none', payments: 'view', commissions: 'view',
    car_finance: 'view', daily_calls: 'edit'
  },
  head: {
    dashboard: 'edit', tasks: 'edit', profile: 'edit', projects: 'edit', companies: 'edit',
    contacts: 'edit', groups: 'edit', events: 'edit', documents: 'edit', users: 'view',
    reports: 'edit', admin_panel: 'none', payments: 'view', commissions: 'view',
    car_finance: 'view', daily_calls: 'edit'
  },
  pillar: {
    dashboard: 'edit', tasks: 'edit', profile: 'edit', projects: 'view', companies: 'edit',
    contacts: 'edit', groups: 'edit', events: 'edit', documents: 'edit', users: 'view',
    reports: 'none', admin_panel: 'none', payments: 'view', commissions: 'view',
    car_finance: 'view', daily_calls: 'edit'
  },
  member: {
    dashboard: 'edit', tasks: 'edit', profile: 'edit', projects: 'view', companies: 'view',
    contacts: 'view', groups: 'view', events: 'view', documents: 'view', users: 'none',
    reports: 'none', admin_panel: 'none', payments: 'none', commissions: 'none',
    car_finance: 'none', daily_calls: 'none'
  }
};

function PermissionManager({ user, isOpen, onClose, onSave }) {
  const { language, t } = useLanguage();
  const [permissions, setPermissions] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const tr = (key, elFallback, enFallback) => {
    const v = t(key);
    if (v && v !== key) return v;
    return language === 'el' ? elFallback : enFallback;
  };

  useEffect(() => {
    if (user) {
      // If user is admin, grant all permissions automatically
      if (user.role === 'admin') {
        const allPermissions = {
          dashboard: 'edit', tasks: 'edit', profile: 'edit', projects: 'edit', companies: 'edit',
          contacts: 'edit', groups: 'edit', events: 'edit', documents: 'edit', users: 'edit',
          reports: 'edit', admin_panel: 'edit', payments: 'edit', commissions: 'edit',
          car_finance: 'edit', daily_calls: 'edit'
        };
        setPermissions(allPermissions);
        setHasChanges(false);
      } else {
        // Initialize permissions with user's current permissions or role defaults
        const userPermissions = user.permissions || ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.member;
        setPermissions(userPermissions);
        setHasChanges(false);
      }
    }
  }, [user]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Add classes and lock body
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      document.body.style.top = `-${scrollY}px`;
      
      // Store scroll position for restoration
      window.modalScrollY = scrollY;
      
      // Prevent scroll events on the background
      const preventScroll = (e) => {
        // Only prevent if the target is not the modal
        if (!e.target.closest('.permission-manager-modal')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };
      
      // Add event listeners
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('keydown', (e) => {
        // Prevent arrow keys, space, page up/down, home/end
        if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
          if (!e.target.closest('.permission-manager-modal')) {
            e.preventDefault();
          }
        }
      });
      
      // Store cleanup function
      window.scrollLockCleanup = () => {
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
        document.body.style.top = '';
        window.scrollTo(0, window.modalScrollY || 0);
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        delete window.modalScrollY;
        delete window.scrollLockCleanup;
      };
    } else {
      // Cleanup when closing
      if (window.scrollLockCleanup) {
        window.scrollLockCleanup();
      }
    }

    // Cleanup on unmount
    return () => {
      if (window.scrollLockCleanup) {
        window.scrollLockCleanup();
      }
    };
  }, [isOpen]);

  const handleAccessLevelChange = (pageKey, accessLevel) => {
    setPermissions(prev => ({
      ...prev,
      [pageKey]: accessLevel
    }));
    setHasChanges(true);
  };

  // Deprecated in favor of handleCategorySetAccess

  const handleCategorySetAccess = (category, accessLevel) => {
    const categoryPages = PERMISSION_CATEGORIES[category].pages.map(page => page.key);
    setPermissions(prev => {
      const newPermissions = { ...prev };
      categoryPages.forEach(pageKey => {
        newPermissions[pageKey] = accessLevel;
      });
      return newPermissions;
    });
    setHasChanges(true);
  };

  const handleResetToRoleDefaults = () => {
    const roleDefaults = ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.member;
    setPermissions(roleDefaults);
    setHasChanges(true);
  };


  const handleSave = () => {
    onSave(user.id, permissions);
    setHasChanges(false);
  };

  // Deprecated in favor of getCategoryLevel

  const getCategoryLevel = (category) => {
    const categoryPages = PERMISSION_CATEGORIES[category].pages.map(page => page.key);
    const values = categoryPages.map(k => permissions[k] || 'none');
    const allEdit = values.every(v => v === 'edit');
    const allView = values.every(v => v === 'view');
    const allNone = values.every(v => v === 'none');
    if (allEdit) return 'edit';
    if (allView) return 'view';
    if (allNone) return 'none';
    return 'mixed';
  };

  if (!isOpen || !user) return null;

  return (
    <div className="permission-manager-overlay" style={{ display: 'flex' }}>
      <div className="permission-manager-modal" style={{ display: 'block' }}>
        <div className="permission-manager-header">
          <h2>{tr('manage_permissions', 'Διαχείριση Δικαιωμάτων', 'Manage Permissions')} - {user?.first_name || ''} {user?.surname || ''}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="permission-manager-content">
          <div className="permission-actions">
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleResetToRoleDefaults}
            >
              <RotateCcw size={16} />
              {tr('reset_to_role_defaults', 'Επαναφορά στις προεπιλογές ρόλου', 'Reset to Role Defaults')}
            </button>
            
          </div>

          {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => {
            return (
              <div key={categoryKey} className="permission-category">
                <div className="category-header">
                  <h3>
                    {categoryKey === 'core' && tr('core_pages', 'Βασικές Σελίδες', 'Core Pages')}
                    {categoryKey === 'management' && tr('management_pages', 'Σελίδες Διαχείρισης', 'Management Pages')}
                    {categoryKey === 'admin' && tr('admin_pages', 'Σελίδες Διαχειριστή', 'Admin Pages')}
                  </h3>
                  {user.role !== 'admin' && (
                    <div className="category-actions">
                      <div className="access-level-buttons" role="group" aria-label={tr('category_access_level', 'Επίπεδο Πρόσβασης Κατηγορίας', 'Category Access Level')}>
                        <button
                          className={`access-btn access-view ${getCategoryLevel(categoryKey) === 'view' ? 'active' : ''}`}
                          onClick={() => handleCategorySetAccess(categoryKey, 'view')}
                          title={tr('view_all', 'Προβολή όλων', 'View All')}
                          aria-pressed={getCategoryLevel(categoryKey) === 'view'}
                        >
                          <Eye size={14} />
                          <span>{tr('view_all', 'Προβολή όλων', 'View All')}</span>
                        </button>
                        <button
                          className={`access-btn access-edit ${getCategoryLevel(categoryKey) === 'edit' ? 'active' : ''}`}
                          onClick={() => handleCategorySetAccess(categoryKey, 'edit')}
                          title={tr('edit_all', 'Επεξεργασία όλων', 'Edit All')}
                          aria-pressed={getCategoryLevel(categoryKey) === 'edit'}
                        >
                          <Pencil size={14} />
                          <span>{tr('edit_all', 'Επεξεργασία όλων', 'Edit All')}</span>
                        </button>
                        <button
                          className={`access-btn access-none ${getCategoryLevel(categoryKey) === 'none' ? 'active' : ''}`}
                          onClick={() => handleCategorySetAccess(categoryKey, 'none')}
                          title={tr('disable_all', 'Απενεργοποίηση όλων', 'Disable All')}
                          aria-pressed={getCategoryLevel(categoryKey) === 'none'}
                        >
                          <EyeOff size={14} />
                          <span>{tr('disable_all', 'Απενεργοποίηση όλων', 'Disable All')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="permission-list">
                  {category.pages.map(page => (
                    <div key={page.key} className="permission-item">
                      <label className="permission-label">
                        {t(page.label)}
                      </label>
                      <div className="permission-controls">
                        {user.role === 'admin' ? (
                          <span className="admin-badge">
                            {t('admin')}
                          </span>
                        ) : (
                          <div className="access-level-buttons" role="group" aria-label={t('access_level')}>
                            <button
                              className={`access-btn access-none ${permissions[page.key] === 'none' ? 'active' : ''}`}
                              onClick={() => handleAccessLevelChange(page.key, 'none')}
                              title={t('none')}
                              aria-pressed={permissions[page.key] === 'none'}
                            >
                              <EyeOff size={14} />
                              <span>{t('none')}</span>
                            </button>
                            <button
                              className={`access-btn access-view ${permissions[page.key] === 'view' ? 'active' : ''}`}
                              onClick={() => handleAccessLevelChange(page.key, 'view')}
                              title={t('view_only')}
                              aria-pressed={permissions[page.key] === 'view'}
                            >
                              <Eye size={14} />
                              <span>{t('view_only')}</span>
                            </button>
                            <button
                              className={`access-btn access-edit ${permissions[page.key] === 'edit' ? 'active' : ''}`}
                              onClick={() => handleAccessLevelChange(page.key, 'edit')}
                              title={t('edit')}
                              aria-pressed={permissions[page.key] === 'edit'}
                            >
                              <Pencil size={14} />
                              <span>{t('edit')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="permission-manager-footer">
          <button 
            className="btn btn-outline"
            onClick={onClose}
          >
            {tr('cancel', 'Ακύρωση', 'Cancel')}
          </button>
          <button 
            className={`btn btn-primary ${!hasChanges ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save size={16} />
            {tr('save_permissions', 'Αποθήκευση Δικαιωμάτων', 'Save Permissions')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PermissionManager;
