// src/components/PermissionRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { hasPermission } from '../utils/permissions';

const PermissionRoute = ({ children, requiredPermission, fallbackPath = '/dashboard' }) => {
  const { currentUser, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <div className="loading-spinner">{t('authenticating')}</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check if user has the required permission
  if (requiredPermission && !hasPermission(currentUser, requiredPermission)) {
    return (
      <div className="error-message">
        <h2>{t('access_denied')}</h2>
        <p>{t('insufficient_permissions') || 'You do not have permission to access this page.'}</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.history.back()}
        >
          {t('go_back')}
        </button>
      </div>
    );
  }

  return children;
};

export default PermissionRoute;
