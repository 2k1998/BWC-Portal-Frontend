// src/components/ProjectForm.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import './Modal.css';

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

function ProjectForm({ project, companies, users, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'new_store',
    status: 'planning',
    store_location: '',
    store_address: '',
    company_id: '',
    project_manager_id: '',
    start_date: null,
    expected_completion_date: null,
    actual_completion_date: null,
    estimated_budget: '',
    actual_cost: '',
    progress_percentage: 0,
    notes: '',
    last_update: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        project_type: project.project_type || 'new_store',
        status: project.status || 'planning',
        store_location: project.store_location || '',
        store_address: project.store_address || '',
        company_id: project.company?.id || '',
        project_manager_id: project.project_manager?.id || '',
        start_date: project.start_date ? new Date(project.start_date) : null,
        expected_completion_date: project.expected_completion_date ? new Date(project.expected_completion_date) : null,
        actual_completion_date: project.actual_completion_date ? new Date(project.actual_completion_date) : null,
        estimated_budget: project.estimated_budget || '',
        actual_cost: project.actual_cost || '',
        progress_percentage: project.progress_percentage || 0,
        notes: project.notes || '',
        last_update: project.last_update || ''
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;

    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDateChange = (date, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: date
    }));

    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.company_id) {
      newErrors.company_id = 'Company is required';
    }

    if (!formData.project_type) {
      newErrors.project_type = 'Project type is required';
    }

    if (formData.progress_percentage < 0 || formData.progress_percentage > 100) {
      newErrors.progress_percentage = 'Progress must be between 0 and 100';
    }

    if (formData.estimated_budget && formData.estimated_budget < 0) {
      newErrors.estimated_budget = 'Budget cannot be negative';
    }

    if (formData.actual_cost && formData.actual_cost < 0) {
      newErrors.actual_cost = 'Cost cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : null,
        expected_completion_date: formData.expected_completion_date ? formData.expected_completion_date.toISOString().split('T')[0] : null,
        actual_completion_date: formData.actual_completion_date ? formData.actual_completion_date.toISOString().split('T')[0] : null,
        company_id: parseInt(formData.company_id),
        project_manager_id: formData.project_manager_id ? parseInt(formData.project_manager_id) : null,
        progress_percentage: parseInt(formData.progress_percentage),
      };

      // Remove empty strings and null values for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null) {
          if (!['project_manager_id', 'start_date', 'expected_completion_date', 'actual_completion_date'].includes(key)) {
            delete submitData[key];
          }
        }
      });

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h3>
          <button 
            className="modal-close" 
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="modal-body">
            {/* Basic Information */}
            <div className="form-section">
              <h4 className="section-title">Basic Information</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Project Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    placeholder="Enter project name"
                    required
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="project_type">Project Type *</label>
                  <select
                    id="project_type"
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
                    className={`form-control ${errors.project_type ? 'error' : ''}`}
                    required
                  >
                    {Object.entries(PROJECT_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {errors.project_type && <span className="error-text">{errors.project_type}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter project description"
                  rows="3"
                />
              </div>
            </div>

            {/* Company and Management */}
            <div className="form-section">
              <h4 className="section-title">Company & Management</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company_id">Company *</label>
                  <select
                    id="company_id"
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleChange}
                    className={`form-control ${errors.company_id ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {errors.company_id && <span className="error-text">{errors.company_id}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="project_manager_id">Project Manager</label>
                  <select
                    id="project_manager_id"
                    name="project_manager_id"
                    value={formData.project_manager_id}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="">Select a project manager</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="form-section">
              <h4 className="section-title">Location Information</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="store_location">Store Location</label>
                  <input
                    type="text"
                    id="store_location"
                    name="store_location"
                    value={formData.store_location}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., Downtown Mall, Shopping Center"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="store_address">Store Address</label>
                <textarea
                  id="store_address"
                  name="store_address"
                  value={formData.store_address}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter full address"
                  rows="2"
                />
              </div>
            </div>

            {/* Status and Progress (only show when editing) */}
            {isEditing && (
              <div className="form-section">
                <h4 className="section-title">Status & Progress</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-control"
                    >
                      {Object.entries(PROJECT_STATUSES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="progress_percentage">Progress (%)</label>
                    <input
                      type="number"
                      id="progress_percentage"
                      name="progress_percentage"
                      value={formData.progress_percentage}
                      onChange={handleChange}
                      className={`form-control ${errors.progress_percentage ? 'error' : ''}`}
                      min="0"
                      max="100"
                    />
                    {errors.progress_percentage && <span className="error-text">{errors.progress_percentage}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="last_update">Latest Update</label>
                  <textarea
                    id="last_update"
                    name="last_update"
                    value={formData.last_update}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter status update or notes"
                    rows="2"
                  />
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="form-section">
              <h4 className="section-title">Timeline</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Start Date</label>
                  <DatePicker
                    selected={formData.start_date}
                    onChange={(date) => handleDateChange(date, 'start_date')}
                    className="form-control"
                    placeholderText="Select start date"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expected_completion_date">Expected Completion</label>
                  <DatePicker
                    selected={formData.expected_completion_date}
                    onChange={(date) => handleDateChange(date, 'expected_completion_date')}
                    className="form-control"
                    placeholderText="Select completion date"
                    dateFormat="yyyy-MM-dd"
                    minDate={formData.start_date}
                  />
                </div>
              </div>

              {isEditing && formData.status === 'completed' && (
                <div className="form-group">
                  <label htmlFor="actual_completion_date">Actual Completion Date</label>
                  <DatePicker
                    selected={formData.actual_completion_date}
                    onChange={(date) => handleDateChange(date, 'actual_completion_date')}
                    className="form-control"
                    placeholderText="Select actual completion date"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
              )}
            </div>

            {/* Budget */}
            <div className="form-section">
              <h4 className="section-title">Budget</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="estimated_budget">Estimated Budget (€)</label>
                  <input
                    type="number"
                    id="estimated_budget"
                    name="estimated_budget"
                    value={formData.estimated_budget}
                    onChange={handleChange}
                    className={`form-control ${errors.estimated_budget ? 'error' : ''}`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.estimated_budget && <span className="error-text">{errors.estimated_budget}</span>}
                </div>

                {isEditing && (
                  <div className="form-group">
                    <label htmlFor="actual_cost">Actual Cost (€)</label>
                    <input
                      type="number"
                      id="actual_cost"
                      name="actual_cost"
                      value={formData.actual_cost}
                      onChange={handleChange}
                      className={`form-control ${errors.actual_cost ? 'error' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {errors.actual_cost && <span className="error-text">{errors.actual_cost}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-section">
              <h4 className="section-title">Additional Notes</h4>
              
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Any additional notes or comments"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;