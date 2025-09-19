// src/components/ProjectCard.jsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';

const PROJECT_TYPES = {
  new_store: 'project_type_new_store',
  renovation: 'project_type_renovation',
  maintenance: 'project_type_maintenance',
  expansion: 'project_type_expansion',
  other: 'project_type_other'
};

const PROJECT_STATUSES = {
  planning: 'status_planning',
  in_progress: 'status_in_progress',
  completed: 'status_completed',
  on_hold: 'status_on_hold',
  cancelled: 'status_cancelled'
};

const STATUS_COLORS = {
  planning: '#3b82f6',      // Blue
  in_progress: '#f59e0b',   // Orange
  completed: '#10b981',     // Green
  on_hold: '#6b7280',       // Gray
  cancelled: '#ef4444'      // Red
};

function ProjectCard({ project, canManage, onEdit, onDelete, onStatusUpdate }) {
  const { t } = useLanguage();
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [statusData, setStatusData] = useState({
    status: project.status,
    progress_percentage: project.progress_percentage,
    last_update: ''
  });

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    onStatusUpdate(project.id, statusData);
    setShowStatusUpdate(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusColor = (status) => STATUS_COLORS[status] || '#6b7280';

  const isOverdue = project.expected_completion_date && 
    new Date(project.expected_completion_date) < new Date() && 
    project.status !== 'completed';

  return (
    <div className={`project-card ${project.status} ${isOverdue ? 'overdue' : ''}`}>
      {/* Header */}
      <div className="project-card-header">
        <div className="project-title-section">
          <h3 className="project-title">{project.name}</h3>
          <div className="project-badges">
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(project.status) }}
            >
              {t(PROJECT_STATUSES[project.status])}
            </span>
            <span className="type-badge">
              {t(PROJECT_TYPES[project.project_type])}
            </span>
          </div>
        </div>
        
        {canManage && (
          <div className="project-actions">
            <button
              className="action-btn edit-btn"
              onClick={() => onEdit(project)}
              title="Edit Project"
            >
              <Edit size={16} />
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => onDelete(project.id, project.name)}
              title="Delete Project"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">{t('progress')}</span>
          <span className="progress-value">{project.progress_percentage}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${project.progress_percentage}%`,
              backgroundColor: getStatusColor(project.status)
            }}
          />
        </div>
      </div>

      {/* Project Details */}
      <div className="project-details">
        {project.description && (
          <p className="project-description">{project.description}</p>
        )}

        <div className="project-info-grid">
          <div className="info-item">
            <label>{t('company')}</label>
            <span>{project.company_name}</span>
          </div>

          {project.store_location && (
            <div className="info-item">
              <label>{t('location')}</label>
              <span>{project.store_location}</span>
            </div>
          )}

          {project.project_manager_name && (
            <div className="info-item">
              <label>{t('project_manager')}</label>
              <span>{project.project_manager_name}</span>
            </div>
          )}

          <div className="info-item">
            <label>{t('expected_completion')}</label>
            <span className={isOverdue ? 'overdue-date' : ''}>
              {formatDate(project.expected_completion_date)}
              {isOverdue && <AlertTriangle className="overdue-indicator" size={16} />}
            </span>
          </div>

          <div className="info-item">
            <label>{t('created')}</label>
            <span>{formatDate(project.created_at)}</span>
          </div>
        </div>

        {project.last_update && (
          <div className="last-update">
            <label>{t('latest_update')}</label>
            <p>{project.last_update}</p>
          </div>
        )}
      </div>

      {/* Status Update Section */}
      {canManage && (
        <div className="status-update-section">
          {!showStatusUpdate ? (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowStatusUpdate(true)}
            >
              {t('update_status')}
            </button>
          ) : (
            <form onSubmit={handleStatusSubmit} className="status-update-form">
              <div className="form-row">
                <div className="form-group">
                  <select
                    value={statusData.status}
                    onChange={(e) => setStatusData(prev => ({ ...prev, status: e.target.value }))}
                    className="form-control"
                  >
                    {Object.entries(PROJECT_STATUSES).map(([key, labelKey]) => (
                      <option key={key} value={key}>{t(labelKey)}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={statusData.progress_percentage}
                    onChange={(e) => setStatusData(prev => ({ ...prev, progress_percentage: parseInt(e.target.value) || 0 }))}
                    className="form-control"
                    placeholder={t('progress_percentage')}
                  />
                </div>
              </div>

              <div className="form-group">
                <textarea
                  value={statusData.last_update}
                  onChange={(e) => setStatusData(prev => ({ ...prev, last_update: e.target.value }))}
                  className="form-control"
                  placeholder={t('status_update_placeholder')}
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-sm">
                  {t('update')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowStatusUpdate(false)}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectCard;