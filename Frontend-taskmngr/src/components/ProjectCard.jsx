// src/components/ProjectCard.jsx
import React, { useState } from 'react';
import { format } from 'date-fns';

const PROJECT_TYPES = {
  new_store: 'New Store',
  renovation: 'Renovation',
  maintenance: 'Maintenance',
  expansion: 'Expansion',
  other: 'Other'
};

const PROJECT_STATUSES = {
  planning: 'Planning',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled'
};

const STATUS_COLORS = {
  planning: '#3b82f6',      // Blue
  in_progress: '#f59e0b',   // Orange
  completed: '#10b981',     // Green
  on_hold: '#6b7280',       // Gray
  cancelled: '#ef4444'      // Red
};

function ProjectCard({ project, canManage, onEdit, onDelete, onStatusUpdate }) {
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
              {PROJECT_STATUSES[project.status]}
            </span>
            <span className="type-badge">
              {PROJECT_TYPES[project.project_type]}
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
              ✏️
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => onDelete(project.id, project.name)}
              title="Delete Project"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Progress</span>
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
            <label>Company</label>
            <span>{project.company_name}</span>
          </div>

          {project.store_location && (
            <div className="info-item">
              <label>Location</label>
              <span>{project.store_location}</span>
            </div>
          )}

          {project.project_manager_name && (
            <div className="info-item">
              <label>Manager</label>
              <span>{project.project_manager_name}</span>
            </div>
          )}

          <div className="info-item">
            <label>Expected Completion</label>
            <span className={isOverdue ? 'overdue-date' : ''}>
              {formatDate(project.expected_completion_date)}
              {isOverdue && <span className="overdue-indicator">⚠️</span>}
            </span>
          </div>

          <div className="info-item">
            <label>Created</label>
            <span>{formatDate(project.created_at)}</span>
          </div>
        </div>

        {project.last_update && (
          <div className="last-update">
            <label>Latest Update:</label>
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
              Update Status
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
                    {Object.entries(PROJECT_STATUSES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
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
                    placeholder="Progress %"
                  />
                </div>
              </div>

              <div className="form-group">
                <textarea
                  value={statusData.last_update}
                  onChange={(e) => setStatusData(prev => ({ ...prev, last_update: e.target.value }))}
                  className="form-control"
                  placeholder="Status update notes..."
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-sm">
                  Update
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowStatusUpdate(false)}
                >
                  Cancel
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